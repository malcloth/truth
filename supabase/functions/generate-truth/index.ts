import { createClient } from 'npm:@supabase/supabase-js@2.55.0';
import OpenAI from 'npm:openai@4.28.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface GenerationRequest {
  type: 'first_question' | 'second_question' | 'generate_truth';
  firstAnswer?: string;
  secondAnswer?: string;
}

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
        console.log('✨ Generating truth...');
        result = await generateTruth(requestData.firstAnswer, requestData.secondAnswer);
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