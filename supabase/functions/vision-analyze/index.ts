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
    const { imageBase64, task } = await req.json();
    
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

    console.log(`Vision AI: Processing ${task || 'describe'} task...`);

    // Build the prompt based on task
    let systemPrompt = '';
    let userPrompt = '';
    
    switch (task) {
      case 'detect_captcha':
        systemPrompt = 'You are a CAPTCHA detection specialist. Analyze the screenshot and determine if there is a CAPTCHA challenge present.';
        userPrompt = 'Is there a CAPTCHA in this image? If yes, describe its type (text, image selection, reCAPTCHA, hCaptcha, etc.) and location. Return JSON: {"hasCaptcha": boolean, "type": string, "location": string}';
        break;
      case 'detect_error':
        systemPrompt = 'You are a web page error detector. Analyze screenshots for error messages, warnings, or issues.';
        userPrompt = 'Check this screenshot for any error messages, warnings, or issues. Return JSON: {"hasError": boolean, "errorType": string, "message": string}';
        break;
      case 'describe':
      default:
        systemPrompt = 'You are a visual analysis assistant. Describe web pages and screenshots in detail.';
        userPrompt = 'Describe what you see in this image. Focus on: page structure, main content, any forms, buttons, or interactive elements. Keep the response concise (2-3 sentences).';
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 500,
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
    const analysis = data.choices?.[0]?.message?.content?.trim() || '';

    console.log(`Vision AI result: ${analysis.substring(0, 100)}...`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        task
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Vision AI error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
