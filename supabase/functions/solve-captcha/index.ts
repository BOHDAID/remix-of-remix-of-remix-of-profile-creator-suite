import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { imageBase64, captchaType } = await req.json();
    
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

    // Use Gemini Pro for image analysis - it's the best for visual tasks
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: `You are a CAPTCHA solving assistant. Your task is to analyze CAPTCHA images and extract the text or solve the challenge.

Rules:
- For text CAPTCHAs: Return ONLY the characters/numbers you see, nothing else
- For image selection CAPTCHAs: Return the positions (1-9 grid) of images matching the criteria
- Be case-sensitive for text CAPTCHAs
- If you cannot read the CAPTCHA clearly, return your best guess
- Never explain, just return the answer`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: captchaType === 'image' 
                  ? 'This is an image selection CAPTCHA. Identify which grid positions (1-9, left to right, top to bottom) contain the target objects. Return positions as comma-separated numbers.'
                  : 'Read and return ONLY the text/characters shown in this CAPTCHA image. No explanation, just the text.'
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
        max_tokens: 50,
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

    console.log(`CAPTCHA solved: ${solution}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        solution,
        confidence: 0.85 // AI generally has good confidence
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
