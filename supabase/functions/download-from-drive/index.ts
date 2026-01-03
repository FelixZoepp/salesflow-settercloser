import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function downloadAndUpload(fileId: string, fileName: string, campaignId?: string) {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  console.log(`[Background] Starting download for file: ${fileId}`);

  try {
    // Try multiple download methods
    const downloadMethods = [
      `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`,
      `https://drive.google.com/uc?export=download&confirm=t&id=${fileId}`,
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    ];

    let fileContent: ArrayBuffer | null = null;
    
    for (const url of downloadMethods) {
      console.log(`[Background] Trying: ${url}`);
      
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        const contentType = response.headers.get('content-type') || '';
        console.log(`[Background] Response content-type: ${contentType}`);

        if (!contentType.includes('text/html')) {
          fileContent = await response.arrayBuffer();
          
          if (fileContent.byteLength > 10000) {
            console.log(`[Background] Successfully downloaded ${fileContent.byteLength} bytes`);
            break;
          }
        }
      } catch (err) {
        console.log(`[Background] Method failed: ${err}`);
      }
    }

    if (!fileContent || fileContent.byteLength < 10000) {
      console.error('[Background] All download methods failed');
      return;
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Generate filename
    const finalFileName = fileName || `pitch-video-${Date.now()}.mp4`;
    const storagePath = `voice-source/${finalFileName}`;

    console.log(`[Background] Uploading to storage: ${storagePath} (${fileContent.byteLength} bytes)`);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('personalized-videos')
      .upload(storagePath, fileContent, {
        contentType: 'video/mp4',
        upsert: true,
      });

    if (uploadError) {
      console.error('[Background] Upload error:', uploadError);
      return;
    }

    console.log('[Background] Upload successful:', uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('personalized-videos')
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;
    console.log(`[Background] Public URL: ${publicUrl}`);

    // If campaignId provided, update the campaign
    if (campaignId) {
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ voice_source_audio_url: publicUrl })
        .eq('id', campaignId);
      
      if (updateError) {
        console.error('[Background] Failed to update campaign:', updateError);
      } else {
        console.log('[Background] Campaign updated with voice source URL');
      }
    }

    console.log('[Background] Download and upload completed successfully!');
    
  } catch (error) {
    console.error('[Background] Error:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileId, fileName, campaignId } = await req.json();

    if (!fileId) {
      throw new Error('fileId is required');
    }

    console.log(`Received request to download file: ${fileId}`);

    // Start background task and return immediately
    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    EdgeRuntime.waitUntil(downloadAndUpload(fileId, fileName, campaignId));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Download started in background. Check the logs for progress.',
        fileId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
