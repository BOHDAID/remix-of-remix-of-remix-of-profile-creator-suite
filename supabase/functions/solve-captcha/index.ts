import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================
// CAPTCHA RECOGNITION KNOWLEDGE BASE
// ============================================================

interface TargetKnowledge {
  aliases: string[];
  description: string;
  colors: string[];
  shapes: string[];
  context: string[];
}

const CAPTCHA_KNOWLEDGE: {
  recaptcha_targets: Record<string, TargetKnowledge>;
  hcaptcha_patterns: string[];
  grid_analysis: Record<string, { total: number; rows: number; cols: number }>;
} = {
  // reCAPTCHA targets with detailed descriptions
  recaptcha_targets: {
    'traffic light': {
      aliases: ['traffic lights', 'traffic signal', 'signal', 'stop light'],
      description: 'Vertical or horizontal poles with red/yellow/green lights, usually at intersections',
      colors: ['red', 'yellow', 'green', 'black', 'grey'],
      shapes: ['rectangular boxes on poles', 'circular lights'],
      context: ['roads', 'intersections', 'streets']
    },
    'crosswalk': {
      aliases: ['crosswalks', 'crossing', 'pedestrian crossing', 'zebra crossing'],
      description: 'White painted stripes on roads for pedestrians to cross',
      colors: ['white', 'yellow'],
      shapes: ['horizontal stripes', 'parallel lines'],
      context: ['roads', 'intersections', 'near traffic lights']
    },
    'bicycle': {
      aliases: ['bicycles', 'bike', 'bikes', 'cycle'],
      description: 'Two-wheeled human-powered vehicle with handlebars and pedals',
      colors: ['various'],
      shapes: ['two wheels', 'frame', 'handlebars', 'seat'],
      context: ['streets', 'sidewalks', 'parks', 'bike lanes']
    },
    'bus': {
      aliases: ['buses', 'public bus', 'transit bus', 'coach'],
      description: 'Large public transport vehicle, usually rectangular with many windows',
      colors: ['yellow', 'blue', 'green', 'red', 'white'],
      shapes: ['large rectangular vehicle', 'many windows'],
      context: ['roads', 'bus stops', 'streets']
    },
    'car': {
      aliases: ['cars', 'vehicle', 'vehicles', 'automobile', 'sedan', 'suv'],
      description: 'Four-wheeled motor vehicle for personal transport',
      colors: ['various'],
      shapes: ['4 wheels', 'windows', 'doors'],
      context: ['roads', 'parking lots', 'streets', 'driveways']
    },
    'motorcycle': {
      aliases: ['motorcycles', 'motorbike', 'scooter'],
      description: 'Two-wheeled motorized vehicle, larger than bicycle',
      colors: ['various'],
      shapes: ['two wheels', 'engine', 'handlebars'],
      context: ['roads', 'streets', 'parking']
    },
    'fire hydrant': {
      aliases: ['fire hydrants', 'hydrant', 'hydrants'],
      description: 'Short pillar-shaped object on sidewalks for fire department water access',
      colors: ['red', 'yellow', 'silver'],
      shapes: ['short pillar', 'cylindrical with caps'],
      context: ['sidewalks', 'near buildings', 'street corners']
    },
    'stairs': {
      aliases: ['staircase', 'steps', 'stairway'],
      description: 'Series of steps for going up or down between levels',
      colors: ['grey', 'brown', 'white', 'concrete'],
      shapes: ['horizontal steps', 'ascending/descending pattern'],
      context: ['buildings', 'outdoor', 'indoor']
    },
    'bridge': {
      aliases: ['bridges', 'overpass'],
      description: 'Structure that spans over water, road, or valley',
      colors: ['grey', 'brown', 'metallic'],
      shapes: ['long span', 'supports underneath'],
      context: ['rivers', 'roads', 'valleys']
    },
    'boat': {
      aliases: ['boats', 'ship', 'vessel'],
      description: 'Watercraft for traveling on water',
      colors: ['white', 'blue', 'various'],
      shapes: ['hull', 'often with cabin or sails'],
      context: ['water', 'marina', 'ocean', 'lake']
    },
    'palm tree': {
      aliases: ['palm trees', 'palm'],
      description: 'Tall tree with large fan-shaped leaves at top, no branches',
      colors: ['green leaves', 'brown trunk'],
      shapes: ['tall trunk', 'fan leaves at top'],
      context: ['tropical areas', 'beaches', 'streets']
    },
    'mountain': {
      aliases: ['mountains', 'hill'],
      description: 'Large natural elevation of land',
      colors: ['brown', 'grey', 'green', 'white (snow)'],
      shapes: ['triangular peak', 'sloping sides'],
      context: ['background', 'landscape']
    },
    'chimney': {
      aliases: ['chimneys', 'smokestack'],
      description: 'Vertical structure on roof for smoke/ventilation',
      colors: ['brick red', 'grey', 'black'],
      shapes: ['rectangular pillar on rooftop'],
      context: ['rooftops', 'houses', 'buildings']
    },
    'parking meter': {
      aliases: ['parking meters', 'meter'],
      description: 'Device on streets for paying parking fees',
      colors: ['grey', 'silver', 'black'],
      shapes: ['pole with box on top'],
      context: ['sidewalks', 'near parked cars', 'streets']
    },
    'taxi': {
      aliases: ['taxis', 'cab', 'taxi cab'],
      description: 'Car for hire, often yellow with taxi sign',
      colors: ['yellow', 'black', 'white'],
      shapes: ['car with taxi sign on roof'],
      context: ['streets', 'roads']
    },
    'tractor': {
      aliases: ['tractors', 'farm tractor'],
      description: 'Large farm vehicle with big wheels',
      colors: ['green', 'red', 'blue', 'yellow'],
      shapes: ['large rear wheels', 'cabin', 'front loader'],
      context: ['farms', 'fields', 'rural areas']
    }
  },

  // hCaptcha specific patterns
  hcaptcha_patterns: [
    'airplane', 'elephant', 'seaplane', 'motorbus', 'vertical river',
    'bedroom', 'living room', 'kitchen', 'bathroom', 'pool',
    'sculpture', 'painting', 'mural', 'statue'
  ],

  // Grid analysis helpers
  grid_analysis: {
    '3x3': { total: 9, rows: 3, cols: 3 },
    '4x4': { total: 16, rows: 4, cols: 4 },
    '2x4': { total: 8, rows: 2, cols: 4 }
  }
};

// ============================================================
// MULTI-STAGE ANALYSIS SYSTEM
// ============================================================

async function analyzeWithMultiStage(
  imageBase64: string,
  captchaType: string,
  prompt: string,
  apiKey: string,
  learnedPatterns: string
): Promise<{ solution: string; confidence: number; analysis: string }> {
  
  // Stage 1: Understand the challenge
  const stage1Prompt = buildStage1Prompt(captchaType, prompt);
  const stage1Result = await callAI(imageBase64, stage1Prompt, apiKey);
  
  console.log('Stage 1 (Understanding):', stage1Result.substring(0, 200));
  
  // Parse stage 1 to get target object
  const targetInfo = parseTargetFromAnalysis(stage1Result);
  
  // Stage 2: Detailed grid analysis
  const stage2Prompt = buildStage2Prompt(captchaType, targetInfo, learnedPatterns);
  const stage2Result = await callAI(imageBase64, stage2Prompt, apiKey);
  
  console.log('Stage 2 (Grid Analysis):', stage2Result.substring(0, 200));
  
  // Parse final solution
  const solution = extractSolution(stage2Result, captchaType);
  const confidence = calculateConfidence(stage1Result, stage2Result, solution);
  
  return {
    solution,
    confidence,
    analysis: `Target: ${targetInfo.target}, Found cells: ${solution}`
  };
}

function buildStage1Prompt(captchaType: string, prompt: string): string {
  if (captchaType === 'recaptcha-image' || captchaType === 'image-selection') {
    return `You are analyzing a reCAPTCHA image challenge. Your task is to understand what the challenge is asking for.

STEP 1: Look at the TOP of the image for instruction text. It typically says:
- "Select all images with [TARGET]"
- "Select all squares with [TARGET]"
- "Click verify once there are none left"

STEP 2: Identify the TARGET object mentioned in the instructions.

Common targets include:
${Object.keys(CAPTCHA_KNOWLEDGE.recaptcha_targets).map(t => `- ${t}: ${CAPTCHA_KNOWLEDGE.recaptcha_targets[t].description}`).join('\n')}

STEP 3: Describe the grid layout:
- Is it 3x3 (9 cells) or 4x4 (16 cells)?
- What is in each cell?

Respond in this format:
TARGET: [the object to find]
GRID_SIZE: [3x3 or 4x4]
CELL_CONTENTS: [brief description of what's in each cell, numbered 1-9 or 1-16]`;
  }
  
  if (captchaType === 'text') {
    return `You are reading a text CAPTCHA image. 

Look carefully at the distorted text and identify each character.
Consider:
- Similar looking characters (0/O, 1/l/I, 5/S, 8/B)
- Case sensitivity
- Special characters

Respond with ONLY the text you see, nothing else.`;
  }
  
  return `Analyze this CAPTCHA image. Determine its type and what it's asking for.`;
}

function buildStage2Prompt(captchaType: string, targetInfo: { target: string; gridSize: string }, learnedPatterns: string): string {
  if (captchaType === 'recaptcha-image' || captchaType === 'image-selection') {
    const targetKnowledge = CAPTCHA_KNOWLEDGE.recaptcha_targets[targetInfo.target.toLowerCase()] || 
                           Object.values(CAPTCHA_KNOWLEDGE.recaptcha_targets).find(t => 
                             t.aliases.some(a => targetInfo.target.toLowerCase().includes(a))
                           );
    
    let targetHint = '';
    if (targetKnowledge) {
      targetHint = `
SPECIFIC KNOWLEDGE about "${targetInfo.target}":
- Description: ${targetKnowledge.description}
- Colors to look for: ${targetKnowledge.colors.join(', ')}
- Shapes to identify: ${targetKnowledge.shapes.join(', ')}
- Usually found in: ${targetKnowledge.context.join(', ')}`;
    }
    
    return `FINAL ANALYSIS - Find "${targetInfo.target}" in the grid.

${targetHint}

${learnedPatterns ? `LEARNED PATTERNS from previous successes:\n${learnedPatterns}` : ''}

GRID NUMBERING (${targetInfo.gridSize}):
${targetInfo.gridSize === '4x4' ? 
`[1][2][3][4]
[5][6][7][8]
[9][10][11][12]
[13][14][15][16]` :
`[1][2][3]
[4][5][6]
[7][8][9]`}

CRITICAL RULES:
1. Include cells where ANY PART of "${targetInfo.target}" is visible, even if partially cut off
2. Look carefully at each cell - zoom in mentally
3. Include cells with partial objects (edge of a car, part of a sign, etc.)
4. When uncertain, INCLUDE the cell (it's better to over-select than under-select)

YOUR RESPONSE MUST BE ONLY NUMBERS separated by commas.
Example: 1,4,7 or 2,5,6,8,9

If NO cells contain the target, respond with: none`;
  }
  
  return '';
}

function parseTargetFromAnalysis(analysis: string): { target: string; gridSize: string } {
  const targetMatch = analysis.match(/TARGET:\s*([^\n]+)/i);
  const gridMatch = analysis.match(/GRID_SIZE:\s*(\d+x\d+)/i);
  
  return {
    target: targetMatch ? targetMatch[1].trim() : 'unknown object',
    gridSize: gridMatch ? gridMatch[1] : '3x3'
  };
}

function extractSolution(result: string, captchaType: string): string {
  if (captchaType === 'text') {
    return result.trim();
  }
  
  // Extract numbers from the response
  const numbers = result.match(/\d+/g);
  if (!numbers) {
    if (result.toLowerCase().includes('none')) {
      return 'none';
    }
    return '';
  }
  
  // Filter valid grid positions
  const validPositions = numbers
    .map(n => parseInt(n))
    .filter(n => n >= 1 && n <= 16);
  
  return [...new Set(validPositions)].sort((a, b) => a - b).join(',');
}

function calculateConfidence(stage1: string, stage2: string, solution: string): number {
  let confidence = 0.5;
  
  // Increase confidence if we found a clear target
  if (stage1.includes('TARGET:') && !stage1.includes('unknown')) {
    confidence += 0.2;
  }
  
  // Increase confidence if solution has reasonable number of cells
  if (solution && solution !== 'none') {
    const cellCount = solution.split(',').length;
    if (cellCount >= 1 && cellCount <= 6) {
      confidence += 0.2;
    }
  }
  
  // Increase confidence if stage2 was decisive
  if (stage2.match(/^\d+(,\d+)*$/)) {
    confidence += 0.1;
  }
  
  return Math.min(confidence, 0.95);
}

async function callAI(imageBase64: string, prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
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
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

// ============================================================
// MAIN HANDLER
// ============================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, captchaType, prompt, siteDomain, recordLearning, useMultiStage } = await req.json();
    
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

    console.log(`\n========== CAPTCHA SOLVE REQUEST ==========`);
    console.log(`Type: ${captchaType || 'unknown'}`);
    console.log(`Prompt: ${prompt || 'none'}`);
    console.log(`Site: ${siteDomain || 'unknown'}`);
    console.log(`Multi-stage: ${useMultiStage !== false}`);

    // Create Supabase client for learning storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch learned patterns from database
    let learnedPatterns = '';
    if (prompt || captchaType) {
      const { data: learningData } = await supabase
        .from('captcha_learning')
        .select('solution, prompt, captcha_type, confidence')
        .eq('was_correct', true)
        .gte('confidence', 0.7)
        .order('confidence', { ascending: false })
        .limit(10);
      
      if (learningData && learningData.length > 0) {
        const patterns = learningData.map(d => 
          `- ${d.captcha_type}: "${d.prompt}" → ${d.solution} (${(d.confidence * 100).toFixed(0)}% confident)`
        ).join('\n');
        learnedPatterns = patterns;
        console.log('Loaded learned patterns:', learningData.length);
      }
    }

    let solution: string;
    let confidence: number;
    let analysis: string = '';

    // Use multi-stage analysis for image CAPTCHAs
    if (useMultiStage !== false && (captchaType === 'recaptcha-image' || captchaType === 'image-selection' || captchaType === 'recaptcha-v2')) {
      const result = await analyzeWithMultiStage(
        imageBase64,
        captchaType,
        prompt || '',
        LOVABLE_API_KEY,
        learnedPatterns
      );
      solution = result.solution;
      confidence = result.confidence;
      analysis = result.analysis;
    } else {
      // Simple single-stage for text CAPTCHAs
      const simplePrompt = captchaType === 'text' 
        ? 'Read and return ONLY the text/characters shown in this CAPTCHA image. Nothing else.'
        : prompt || 'Solve this CAPTCHA. Return only the answer.';
      
      solution = await callAI(imageBase64, simplePrompt, LOVABLE_API_KEY);
      confidence = 0.7;
    }

    console.log(`Solution: ${solution}`);
    console.log(`Confidence: ${(confidence * 100).toFixed(0)}%`);
    if (analysis) console.log(`Analysis: ${analysis}`);

    // Record the attempt in learning database
    if (recordLearning !== false && solution) {
      const imageHash = imageBase64.slice(0, 100).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
      
      const { error: insertError } = await supabase
        .from('captcha_learning')
        .insert({
          captcha_type: captchaType || 'unknown',
          image_hash: imageHash,
          prompt: prompt || null,
          solution: solution,
          was_correct: false, // Will be updated when verified
          confidence: confidence,
          site_domain: siteDomain || null,
          attempt_count: 1
        });

      if (insertError) {
        console.error('Failed to record learning:', insertError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        solution,
        captchaType,
        confidence,
        analysis
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
