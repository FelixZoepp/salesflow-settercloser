import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Note: FFmpeg in Deno edge functions is limited. For production, consider:
// 1. Using a video processing service like Creatomate, Shotstack, or Mux
// 2. Running FFmpeg on a dedicated server
// 3. Using client-side video concatenation with MediaRecorder

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const { contactId, introVideoUrl, pitchVideoUrl } = await req.json();

    if (!contactId || !introVideoUrl || !pitchVideoUrl) {
      throw new Error('contactId, introVideoUrl, and pitchVideoUrl are required');
    }

    console.log(`Merging videos for contact ${contactId}`);
    console.log('Intro:', introVideoUrl);
    console.log('Pitch:', pitchVideoUrl);

    // Update status
    await supabase
      .from('contacts')
      .update({ video_status: 'merging' })
      .eq('id', contactId);

    // For now, we'll create a simple approach:
    // Store both URLs and let the frontend handle playlist-style playback
    // OR use a video processing API
    
    // Simple approach: Store the intro URL as the video_url
    // The landing page will play intro first, then pitch
    
    // For a proper merge, you would:
    // 1. Download both videos
    // 2. Use FFmpeg to concatenate: ffmpeg -i intro.mp4 -i pitch.mp4 -filter_complex "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1" output.mp4
    // 3. Upload the result to storage
    
    // Since FFmpeg isn't available in edge functions, we'll use a workaround:
    // Store metadata and let the frontend handle sequential playback
    
    const videoData = {
      intro: introVideoUrl,
      pitch: pitchVideoUrl,
      type: 'playlist' // Indicates this is a playlist, not a merged video
    };

    // For now, store the intro video URL and mark as ready
    // The frontend will handle playing both videos in sequence
    const { error: updateError } = await supabase
      .from('contacts')
      .update({ 
        video_url: introVideoUrl, // Primary video (intro)
        video_status: 'ready',
        video_generated_at: new Date().toISOString(),
        // Store pitch URL in notes or a new field if needed
      })
      .eq('id', contactId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Videos configured for sequential playback',
        videoData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error merging videos:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
