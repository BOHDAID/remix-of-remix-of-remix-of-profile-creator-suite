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
    const { imageBase64, captchaType, prompt, siteDomain, recordLearning } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Processing ${captchaType || 'unknown'} CAPTCHA...`);
    console.log(`Prompt hint: ${prompt || 'none'}`);

    // Create Supabase client for learning storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for similar successful solutions in learning database
    let learnedHint = '';
    if (prompt) {
      const { data: learningData } = await supabase
        .from('captcha_learning')
        .select('solution, prompt')
        .eq('was_correct', true)
        .ilike('prompt', `%${prompt}%`)
        .limit(5);
      
      if (learningData && learningData.length > 0) {
        const successfulSolutions = learningData.map(d => d.solution).join(', ');
        learnedHint = `\nBased on previous successful solutions for similar prompts, common answers were: ${successfulSolutions}`;
        console.log('Found learned patterns:', successfulSolutions);
      }
    }

    // Build the system prompt based on CAPTCHA type
    let systemPrompt = '';
    let userPrompt = '';

    if (captchaType === 'recaptcha-image' || captchaType === 'image-selection') {
      // For reCAPTCHA image selection challenges
      systemPrompt = `You are an expert at analyzing images for CAPTCHA challenges. You will be shown a grid of images (usually 3x3 or 4x4) and need to identify which cells contain the target object.

CRITICAL RULES:
- Return ONLY comma-separated numbers representing grid positions (1-9 for 3x3, 1-16 for 4x4)
- Grid numbering: 1=top-left, then left-to-right, top-to-bottom
- For a 3x3 grid:
  [1][2][3]
  [4][5][6]
  [7][8][9]
- If no cells match, return "none"
- Do NOT include any explanation, just the numbers
- Be thorough - look at each cell carefully
- Include ALL cells that contain ANY part of the target object${learnedHint}`;

      userPrompt = prompt 
        ? `Look at this image grid. Which cells contain: ${prompt}? Return only the position numbers.`
        : 'Analyze this CAPTCHA grid. Identify which cells contain the target object shown in the challenge. Return position numbers only.';

    } else if (captchaType === 'text') {
      systemPrompt = `You are a CAPTCHA text reader. Your task is to read distorted text from CAPTCHA images.

RULES:
- Return ONLY the text you see, nothing else
- Be case-sensitive
- Include spaces if they are part of the text
- If the CAPTCHA has multiple words, separate them with spaces
- Never explain, just return the characters${learnedHint}`;

      userPrompt = 'Read and return ONLY the text/characters shown in this CAPTCHA image.';

    } else {
      // Generic image analysis
      systemPrompt = `You are analyzing a CAPTCHA image. Determine what type it is and solve it.

For text: Return only the text
For image selection: Return comma-separated grid position numbers (1-9 or 1-16)
For math: Return the numeric answer${learnedHint}`;

      userPrompt = prompt || 'Solve this CAPTCHA. Return only the answer.';
    }

    // Use Gemini Flash for faster response - it's excellent at visual tasks
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const solution = data.choices?.[0]?.message?.content?.trim() || '';

    console.log(`CAPTCHA solution: ${solution}`);

    // Record the attempt in learning database
    if (recordLearning !== false) {
      const imageHash = imageBase64.slice(0, 100).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
      
      const { data: insertedData, error: insertError } = await supabase
        .from('captcha_learning')
        .insert({
          captcha_type: captchaType || 'unknown',
          image_hash: imageHash,
          prompt: prompt || null,
          solution: solution,
          was_correct: false, // Will be updated when we verify
          confidence: 0.85,
          site_domain: siteDomain || null,
          attempt_count: 1
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Failed to record learning:', insertError);
      } else {
        console.log('Learning recorded with ID:', insertedData?.id);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        solution,
        captchaType,
        confidence: 0.9
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error solving CAPTCHA:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
