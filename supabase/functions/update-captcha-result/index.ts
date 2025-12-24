import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { learningId, wasCorrect, captchaType, solution, siteDomain } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (learningId) {
      // Update existing record
      const { error } = await supabase
        .from('captcha_learning')
        .update({ was_correct: wasCorrect })
        .eq('id', learningId);

      if (error) {
        console.error('Failed to update learning result:', error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Learning result updated: ${learningId} = ${wasCorrect}`);
    } else if (captchaType && solution) {
      // Record a new result directly
      const { error } = await supabase
        .from('captcha_learning')
        .insert({
          captcha_type: captchaType,
          solution: solution,
          was_correct: wasCorrect,
          site_domain: siteDomain || null,
          confidence: wasCorrect ? 0.95 : 0.3
        });

      if (error) {
        console.error('Failed to record learning:', error);
      }
    }

    // Return learning statistics
    const { data: stats } = await supabase
      .from('captcha_learning')
      .select('captcha_type, was_correct');

    const totalAttempts = stats?.length || 0;
    const successfulAttempts = stats?.filter(s => s.was_correct).length || 0;
    const successRate = totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0;

    return new Response(
      JSON.stringify({ 
        success: true,
        stats: {
          totalAttempts,
          successfulAttempts,
          successRate: Math.round(successRate * 10) / 10
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating CAPTCHA result:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
