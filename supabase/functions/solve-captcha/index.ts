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
      // For reCAPTCHA image selection challenges - comprehensive analysis
      systemPrompt = `You are an expert at solving reCAPTCHA image challenges. You will analyze a screenshot of a reCAPTCHA challenge.

CRITICAL INSTRUCTIONS:
1. FIRST: Read the instruction text at the TOP of the image. It will say something like "Select all images with [TARGET]" or "Select all squares with [TARGET]"
2. THEN: Look at the image grid below the instructions (usually 3x3 = 9 cells, sometimes 4x4 = 16 cells)
3. IDENTIFY: Which cells contain the target object mentioned in the instructions

GRID NUMBERING (left-to-right, top-to-bottom):
For 3x3:
[1][2][3]
[4][5][6]
[7][8][9]

For 4x4:
[1][2][3][4]
[5][6][7][8]
[9][10][11][12]
[13][14][15][16]

COMMON TARGETS:
- Traffic lights (tall poles with red/yellow/green lights)
- Crosswalks (white striped pedestrian crossings on roads)
- Bicycles/bikes
- Buses (large public transport vehicles)
- Cars/vehicles
- Motorcycles
- Fire hydrants (red or yellow street hydrants)
- Stairs/staircases
- Bridges
- Boats
- Palm trees
- Mountains
- Chimneys
- Parking meters
- Taxis (yellow cars)
- Tractors

RESPONSE FORMAT:
- Return ONLY comma-separated numbers (e.g., "1,4,7" or "2,5,6,8")
- If NO cells contain the target, return "none"
- Do NOT include any explanation or text
- Include cells where even PART of the target is visible
- When uncertain, include the cell${learnedHint}`;

      userPrompt = prompt && prompt.length > 50 
        ? prompt  // Use comprehensive prompt from extension
        : `Analyze this reCAPTCHA challenge screenshot. Read the instruction at the top to find what object to select, then return the grid cell numbers that contain that object.`;

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

For reCAPTCHA: First read the instruction text, then return comma-separated grid position numbers
For text: Return only the text
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
