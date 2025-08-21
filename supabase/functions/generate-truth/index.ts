import { createClient } from 'npm:@supabase/supabase-js@2.55.0';
import OpenAI from 'npm:openai@4.28.0';

interface UserTruth {
  x_username: string;
  first_question: string;
  first_answer: string;
  second_question: string;
  second_answer: string;
  generated_truth: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface GenerationRequest {
  type: 'first_question' | 'second_question' | 'generate_truth';
  xUsername?: string;
  firstQuestion?: string;
  secondQuestion?: string;
  firstAnswer?: string;
  secondAnswer?: string;
}

// SVG Template - Replace this with your actual SVG content
const SVG_TEMPLATE = `
<svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#84cc16;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#eab308;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="800" height="600" fill="url(#bgGradient)"/>
  
  <!-- Content Container -->
  <rect x="60" y="80" width="680" height="440" rx="30" fill="rgba(0,0,0,0.8)" stroke="rgba(255,255,255,0.1)"/>
  
  <!-- Truth Text -->
  <text x="400" y="280" text-anchor="middle" fill="white" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="300">
    <tspan x="400" dy="0">"{{TRUTH_TEXT}}"</tspan>
  </text>
  
  <!-- Username -->
  <text x="400" y="380" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="500">
    @{{USERNAME}}
  </text>
  
  <!-- Footer -->
  <text x="400" y="480" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="system-ui, -apple-system, sans-serif" font-size="16">
    find your truth - ourtruth.xyz
  </text>
</svg>
`;

async function callOpenAIAPI(prompt: string): Promise<string> {
  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const response = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a wise, introspective guide who asks profound questions that help people discover their inner truths. Keep responses concise and thought-provoking.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'gpt-5-nano-2025-08-07'
    });

    return response.choices[0].message.content?.trim() || '';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

async function generateFirstQuestion(): Promise<string> {
  const prompt = 'Generate one profound, introspective question that helps someone discover a deep truth about themselves. The question should be thought-provoking and personal. Return only the question, no additional text.';
  return await callOpenAIAPI(prompt);
}

async function generateSecondQuestion(firstAnswer: string): Promise<string> {
  const prompt = `Based on this person's answer: "${firstAnswer}", generate a follow-up question that digs deeper into their psyche and helps reveal another layer of their inner truth. The question should be related but explore a different aspect of their personality or beliefs. Return only the question, no additional text.`;
  return await callOpenAIAPI(prompt);
}

async function generateTruth(firstAnswer: string, secondAnswer: string): Promise<string> {
  const prompt = `Based on these two answers:
1. "${firstAnswer}"
2. "${secondAnswer}"

Generate a profound, 6-8 word truth about this person that captures their essence or reveals something meaningful about their character. The truth should be insightful, positive, and feel like a revelation. Return only the truth statement, no quotes or additional text.`;
  return await callOpenAIAPI(prompt);
}

async function storeTruthInDatabase(userTruthData: UserTruth) {
  console.log('🔍 storeTruthInDatabase called - starting database insertion...');
  
  try {
    // Initialize Supabase client with service role key for bypassing RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    console.log('📤 Data to be inserted:', userTruthData);
    
    const { data, error } = await supabase
      .from('user_truths')
      .insert([userTruthData]);

    if (error) {
      console.error('❌ Error storing truth in database:', error);
      throw error;
    } else {
      console.log('✅ Truth stored successfully in database');
      console.log('✅ Inserted data response:', data);
    }
  } catch (error) {
    console.error('💥 Unexpected error in storeTruthInDatabase:', error);
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('🤖 Generate Truth API starting...');

    const requestData: GenerationRequest = await req.json();
    let result: string;

    switch (requestData.type) {
      case 'first_question':
        console.log('📝 Generating first question...');
        result = await generateFirstQuestion();
        break;

      case 'second_question':
        if (!requestData.firstAnswer) {
          throw new Error('First answer is required for second question generation');
        }
        console.log('📝 Generating second question...');
        result = await generateSecondQuestion(requestData.firstAnswer);
        break;

      case 'generate_truth':
        if (!requestData.firstAnswer || !requestData.secondAnswer) {
          throw new Error('Both answers are required for truth generation');
        }
        if (!requestData.xUsername || !requestData.firstQuestion || !requestData.secondQuestion) {
          throw new Error('Username and questions are required for truth generation');
        }
        console.log('✨ Generating truth...');
        result = await generateTruth(requestData.firstAnswer, requestData.secondAnswer);
        
        // Store the complete truth data in database
        console.log('💾 Storing truth data in database...');
        const userTruthData: UserTruth = {
          x_username: requestData.xUsername,
          first_question: requestData.firstQuestion,
          first_answer: requestData.firstAnswer,
          second_question: requestData.secondQuestion,
          second_answer: requestData.secondAnswer,
          generated_truth: result,
        };
        
        await storeTruthInDatabase(userTruthData);
        console.log('💾 Database storage completed successfully');
        
        // Return the truth
        console.log('📤 Returning response with truth...');
        return new Response(
          JSON.stringify({ 
            success: true, 
            result: result,
            type: requestData.type
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
            status: 200,
          }
        );
        break;

      default:
        throw new Error('Invalid generation type');
    }

    console.log('✅ Successfully generated:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        result: result,
        type: requestData.type
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in generate-truth:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: 'Failed to generate content'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});