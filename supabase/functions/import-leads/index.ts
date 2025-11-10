import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CSVRow {
  company_name?: string;
  website?: string;
  phone?: string;
  street?: string;
  zip?: string;
  city?: string;
  country?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile?: string;
  position?: string;
  source?: string;
  external_id?: string;
}

interface ImportResult {
  imported_count: number;
  updated_count: number;
  skipped_count: number;
  errors: Array<{ row: number; message: string }>;
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

    // Parse the CSV data from request body
    const { csvData } = await req.json();
    if (!csvData) {
      throw new Error('Missing CSV data');
    }

    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must contain header row and at least one data row');
    }

    // Parse header
    const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
    
    const result: ImportResult = {
      imported_count: 0,
      updated_count: 0,
      skipped_count: 0,
      errors: [],
    };

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const rowNumber = i + 1;
      try {
        const values = lines[i].split(',').map((v: string) => v.trim());
        const row: CSVRow = {};
        
        headers.forEach((header: string, idx: number) => {
          if (values[idx]) {
            row[header as keyof CSVRow] = values[idx];
          }
        });

        // Validate: at least company_name or email must be present
        if (!row.company_name && !row.email) {
          result.errors.push({ 
            row: rowNumber, 
            message: 'Missing required field: company_name or email' 
          });
          result.skipped_count++;
          continue;
        }

        // Find or create company
        let companyId: string | null = null;
        if (row.company_name) {
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
              .eq('name', row.company_name)
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
                name: row.company_name,
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
        if (row.email) {
          // Check if contact exists by email
          const { data: existingContact } = await supabase
            .from('contacts')
            .select('id')
            .eq('email', row.email)
            .eq('owner_user_id', user.id)
            .maybeSingle();

          if (existingContact) {
            // Update existing contact
            await supabase
              .from('contacts')
              .update({
                first_name: row.first_name || '',
                last_name: row.last_name || '',
                company: row.company_name || null,
                company_id: companyId,
                phone: row.phone || null,
                mobile: row.mobile || null,
                position: row.position || null,
                source: row.source || null,
                external_id: row.external_id || null,
              })
              .eq('id', existingContact.id);
            
            result.updated_count++;
          } else {
            // Create new contact
            await supabase
              .from('contacts')
              .insert({
                owner_user_id: user.id,
                first_name: row.first_name || '',
                last_name: row.last_name || '',
                company: row.company_name || null,
                company_id: companyId,
                email: row.email,
                phone: row.phone || null,
                mobile: row.mobile || null,
                position: row.position || null,
                source: row.source || null,
                external_id: row.external_id || null,
              });
            
            result.imported_count++;
          }
        } else if (companyId) {
          // Create contact without email (if we have company)
          await supabase
            .from('contacts')
            .insert({
              owner_user_id: user.id,
              first_name: row.first_name || '',
              last_name: row.last_name || '',
              company: row.company_name || null,
              company_id: companyId,
              phone: row.phone || null,
              mobile: row.mobile || null,
              position: row.position || null,
              source: row.source || null,
              external_id: row.external_id || null,
            });
          
          result.imported_count++;
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
