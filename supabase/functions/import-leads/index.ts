import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CSVRow {
  company_name?: string;
  company?: string;
  website?: string;
  phone?: string;
  street?: string;
  zip?: string;
  city?: string;
  country?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  position?: string;
  source?: string;
  external_id?: string;
  linkedin_url?: string;
  mobile?: string;
}

interface ImportResult {
  imported_count: number;
  updated_count: number;
  skipped_count: number;
  errors: Array<{ row: number; message: string }>;
}

interface DuplicateMatch {
  csvRowIndex: number;
  csvData: Record<string, string>;
  existingContact: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    company: string | null;
    linkedin_url: string | null;
  };
  matchReason: 'email' | 'linkedin' | 'name_company';
}

interface DuplicateCheckResult {
  duplicates: DuplicateMatch[];
  newLeadsCount: number;
  parsedRows: Array<{ index: number; data: CSVRow }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`Import leads request from user: ${user.id}`);

    // Get user's account_id from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.account_id) {
      console.error('Profile error:', profileError);
      throw new Error('User account not found');
    }

    const accountId = profile.account_id;
    console.log(`User account_id: ${accountId}`);

    // Parse the CSV data, leadType, optional campaignId, and mode from request body
    const { csvData, leadType, campaignId, mode, duplicateActions } = await req.json();
    if (!csvData) {
      throw new Error('Missing CSV data');
    }
    
    const isOutbound = leadType === 'outbound';
    const isPreviewMode = mode === 'check_duplicates';
    console.log(`Import type: ${leadType}, campaign_id: ${campaignId || 'none'}, mode: ${mode || 'import'}`);

    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must contain header row and at least one data row');
    }

    // Parse header
    const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
    
    // Parse all rows first
    const parsedRows: Array<{ index: number; data: CSVRow; valid: boolean }> = [];
    const parseErrors: Array<{ row: number; message: string }> = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v: string) => v.trim());
      const row: CSVRow = {};
      
      headers.forEach((header: string, idx: number) => {
        if (values[idx]) {
          row[header as keyof CSVRow] = values[idx];
        }
      });

      const companyName = row.company_name || row.company;
      
      // Validate row
      let valid = true;
      if (isOutbound) {
        const missingFields: string[] = [];
        if (!row.first_name) missingFields.push('first_name');
        if (!row.last_name) missingFields.push('last_name');
        if (!row.linkedin_url) missingFields.push('linkedin_url');
        if (!row.email) missingFields.push('email');
        if (!row.phone && !row.mobile) missingFields.push('phone/mobile');
        
        if (missingFields.length > 0) {
          parseErrors.push({ 
            row: i + 1, 
            message: `Pflichtfelder fehlen: ${missingFields.join(', ')}` 
          });
          valid = false;
        }
      } else {
        if (!companyName && !row.email) {
          parseErrors.push({ 
            row: i + 1, 
            message: 'Missing required field: company_name or email' 
          });
          valid = false;
        }
      }
      
      parsedRows.push({ index: i - 1, data: row, valid });
    }

    // DUPLICATE CHECK MODE
    if (isPreviewMode) {
      console.log('Running duplicate check mode...');
      const duplicates: DuplicateMatch[] = [];
      let newLeadsCount = 0;
      
      for (const { index, data: row, valid } of parsedRows) {
        if (!valid) continue;
        
        let foundDuplicate = false;
        
        // Check by email
        if (row.email) {
          const { data: existingByEmail } = await supabase
            .from('contacts')
            .select('id, first_name, last_name, email, company, linkedin_url')
            .eq('account_id', accountId)
            .eq('email', row.email)
            .maybeSingle();
          
          if (existingByEmail) {
            duplicates.push({
              csvRowIndex: index,
              csvData: row as Record<string, string>,
              existingContact: existingByEmail,
              matchReason: 'email',
            });
            foundDuplicate = true;
          }
        }
        
        // Check by LinkedIn URL
        if (!foundDuplicate && row.linkedin_url) {
          const { data: existingByLinkedin } = await supabase
            .from('contacts')
            .select('id, first_name, last_name, email, company, linkedin_url')
            .eq('account_id', accountId)
            .eq('linkedin_url', row.linkedin_url)
            .maybeSingle();
          
          if (existingByLinkedin) {
            duplicates.push({
              csvRowIndex: index,
              csvData: row as Record<string, string>,
              existingContact: existingByLinkedin,
              matchReason: 'linkedin',
            });
            foundDuplicate = true;
          }
        }
        
        // Check by name + company
        if (!foundDuplicate && row.first_name && row.last_name && (row.company_name || row.company)) {
          const companyName = row.company_name || row.company;
          const { data: existingByName } = await supabase
            .from('contacts')
            .select('id, first_name, last_name, email, company, linkedin_url')
            .eq('account_id', accountId)
            .ilike('first_name', row.first_name)
            .ilike('last_name', row.last_name)
            .ilike('company', companyName || '')
            .maybeSingle();
          
          if (existingByName) {
            duplicates.push({
              csvRowIndex: index,
              csvData: row as Record<string, string>,
              existingContact: existingByName,
              matchReason: 'name_company',
            });
            foundDuplicate = true;
          }
        }
        
        if (!foundDuplicate) {
          newLeadsCount++;
        }
      }
      
      const checkResult: DuplicateCheckResult = {
        duplicates,
        newLeadsCount,
        parsedRows: parsedRows.filter(r => r.valid).map(r => ({ index: r.index, data: r.data })),
      };
      
      console.log(`Duplicate check complete: ${duplicates.length} duplicates, ${newLeadsCount} new`);
      
      return new Response(
        JSON.stringify({ mode: 'check_duplicates', ...checkResult, parseErrors }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // IMPORT MODE
    // Build a map of duplicate actions by row index
    const actionMap: Record<number, 'update' | 'skip' | 'create'> = {};
    if (duplicateActions && Array.isArray(duplicateActions)) {
      for (const action of duplicateActions) {
        actionMap[action.csvRowIndex] = action.action;
      }
    }
    
    const result: ImportResult = {
      imported_count: 0,
      updated_count: 0,
      skipped_count: parseErrors.length,
      errors: [...parseErrors],
    };

    // Process each valid row
    for (const { index, data: row, valid } of parsedRows) {
      if (!valid) continue;
      
      const rowNumber = index + 2; // CSV row number (1-indexed, +1 for header)
      try {
        const companyName = row.company_name || row.company;
        
        // Check if this row has a duplicate action specified
        const duplicateAction = actionMap[index];
        if (duplicateAction === 'skip') {
          result.skipped_count++;
          continue;
        }

        // Find or create company
        let companyId: string | null = null;
        if (companyName) {
          // Try to find existing company by website or name+zip
          let existingCompany = null;
          
          if (row.website) {
            const { data } = await supabase
              .from('companies')
              .select('id')
              .eq('website', row.website)
              .eq('owner_user_id', user.id)
              .maybeSingle();
            existingCompany = data;
          }
          
          if (!existingCompany && row.zip) {
            const { data } = await supabase
              .from('companies')
              .select('id')
              .eq('name', companyName)
              .eq('zip', row.zip)
              .eq('owner_user_id', user.id)
              .maybeSingle();
            existingCompany = data;
          }

          if (existingCompany) {
            companyId = existingCompany.id;
            
            // Update company data
            await supabase
              .from('companies')
              .update({
                website: row.website || null,
                phone: row.phone || null,
                street: row.street || null,
                zip: row.zip || null,
                city: row.city || null,
                country: row.country || null,
              })
              .eq('id', companyId);
          } else {
            // Create new company
            const { data: newCompany, error: companyError } = await supabase
              .from('companies')
              .insert({
                owner_user_id: user.id,
                account_id: accountId,
                name: companyName,
                website: row.website || null,
                phone: row.phone || null,
                street: row.street || null,
                zip: row.zip || null,
                city: row.city || null,
                country: row.country || null,
              })
              .select()
              .single();
            if (companyError) throw companyError;
            companyId = newCompany.id;
          }
        }

        // Find or create contact
        let contactId: string | null = null;
        
        // For outbound leads, we create contacts directly without requiring email
        if (isOutbound) {
          // Check if contact exists (unless forced to create new)
          let existingContact = null;
          
          if (duplicateAction !== 'create') {
            if (row.linkedin_url) {
              const { data } = await supabase
                .from('contacts')
                .select('id')
                .eq('linkedin_url', row.linkedin_url)
                .eq('account_id', accountId)
                .maybeSingle();
              existingContact = data;
            }
            
            if (!existingContact && row.email) {
              const { data } = await supabase
                .from('contacts')
                .select('id')
                .eq('email', row.email)
                .eq('account_id', accountId)
                .maybeSingle();
              existingContact = data;
            }
          }

          if (existingContact && duplicateAction !== 'create') {
            // Update existing contact - also update campaign_id
            await supabase
              .from('contacts')
              .update({
                first_name: row.first_name || '',
                last_name: row.last_name || '',
                company: companyName || null,
                company_id: companyId,
                phone: row.phone || null,
                mobile: row.mobile || null,
                position: row.position || null,
                source: row.source || null,
                linkedin_url: row.linkedin_url || null,
                email: row.email || null,
                campaign_id: campaignId || null,
              })
              .eq('id', existingContact.id);
            
            contactId = existingContact.id;
            result.updated_count++;
          } else {
            // Create new outbound contact
            const { data: newContact, error: contactError } = await supabase
              .from('contacts')
              .insert({
                owner_user_id: user.id,
                account_id: accountId,
                first_name: row.first_name || '',
                last_name: row.last_name || '',
                company: companyName || null,
                company_id: companyId,
                email: row.email || null,
                phone: row.phone || null,
                mobile: row.mobile || null,
                position: row.position || null,
                source: row.source || null,
                linkedin_url: row.linkedin_url || null,
                lead_type: 'outbound',
                workflow_status: 'bereit_fuer_vernetzung',
                campaign_id: campaignId || null,
              })
              .select()
              .single();
            
            if (contactError) throw contactError;
            contactId = newContact.id;
            result.imported_count++;
          }
        } else if (row.email) {
          // Original logic for inbound leads with email
          let existingContact = null;
          
          if (duplicateAction !== 'create') {
            const { data } = await supabase
              .from('contacts')
              .select('id')
              .eq('email', row.email)
              .eq('account_id', accountId)
              .maybeSingle();
            existingContact = data;
          }

          if (existingContact && duplicateAction !== 'create') {
            // Update existing contact - also update campaign_id
            await supabase
              .from('contacts')
              .update({
                first_name: row.first_name || '',
                last_name: row.last_name || '',
                company: companyName || null,
                company_id: companyId,
                phone: row.phone || null,
                position: row.position || null,
                source: row.source || null,
                external_id: row.external_id || null,
                linkedin_url: row.linkedin_url || null,
                campaign_id: campaignId || null,
              })
              .eq('id', existingContact.id);
            
            contactId = existingContact.id;
            result.updated_count++;
          } else {
            // Create new contact with campaign_id
            const { data: newContact, error: contactError } = await supabase
              .from('contacts')
              .insert({
                owner_user_id: user.id,
                account_id: accountId,
                first_name: row.first_name || '',
                last_name: row.last_name || '',
                company: companyName || null,
                company_id: companyId,
                email: row.email,
                phone: row.phone || null,
                position: row.position || null,
                source: row.source || null,
                external_id: row.external_id || null,
                linkedin_url: row.linkedin_url || null,
                lead_type: 'inbound',
                campaign_id: campaignId || null,
              })
              .select()
              .single();
            
            if (contactError) throw contactError;
            contactId = newContact.id;
            result.imported_count++;

            // Create a deal for the new contact in the cold pipeline as "Lead"
            await supabase
              .from('deals')
              .insert({
                contact_id: contactId,
                setter_id: user.id,
                account_id: accountId,
                title: `${row.first_name || ''} ${row.last_name || ''} - ${companyName || 'Lead'}`.trim(),
                stage: 'Lead',
                pipeline: 'cold',
                amount_eur: 0,
                probability_pct: 0,
              });
          }
        } else if (companyId) {
          // Create contact without email (if we have company) - with campaign_id
          const { data: newContact, error: contactError } = await supabase
            .from('contacts')
            .insert({
              owner_user_id: user.id,
              account_id: accountId,
              first_name: row.first_name || '',
              last_name: row.last_name || '',
              company: companyName || null,
              company_id: companyId,
              phone: row.phone || null,
              position: row.position || null,
              source: row.source || null,
              external_id: row.external_id || null,
              linkedin_url: row.linkedin_url || null,
              lead_type: 'inbound',
              campaign_id: campaignId || null,
            })
            .select()
            .single();
          
          if (contactError) throw contactError;
          contactId = newContact.id;
          result.imported_count++;

          // Create a deal for the new contact in the cold pipeline as "Lead"
          await supabase
            .from('deals')
            .insert({
              contact_id: contactId,
              setter_id: user.id,
              account_id: accountId,
              title: `${row.first_name || ''} ${row.last_name || ''} - ${companyName || 'Lead'}`.trim(),
              stage: 'Lead',
              pipeline: 'cold',
              amount_eur: 0,
              probability_pct: 0,
            });
        }

      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push({ 
          row: rowNumber, 
          message: errorMessage
        });
        result.skipped_count++;
      }
    }

    console.log('Import completed:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Import leads error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
