import { createClient } from 'npm:@supabase/supabase-js@2.55.0';
import OpenAI from 'npm:openai@4.28.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface UserTruth {
  id: string;
  x_username: string;
  first_question: string;
  first_answer: string;
  second_question: string;
  second_answer: string;
  generated_truth: string;
  created_at: string;
}

interface TruthSummary {
  themes: string[];
  emotional_tone: string;
  key_patterns: string[];
  dominant_concerns: string[];
  insights: string[];
  overall_sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
}

async function callGPT5Nano(truths: UserTruth[]): Promise<TruthSummary> {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Prepare the truths data for analysis
    const truthsText = truths.map(truth => {
      return `Username: ${truth.x_username}
Q1: ${truth.first_question}
A1: ${truth.first_answer}
Q2: ${truth.second_question}
A2: ${truth.second_answer}
Truth: ${truth.generated_truth}
---`;
    }).join('\n');

    const prompt = `Analyze the following ${truths.length} user truth submissions for patterns, themes, and emotional insights. 

${truthsText}

Please analyze these truths and return a structured JSON response with the following format:
{
  "themes": ["array of 3-5 main themes found"],
  "emotional_tone": "overall emotional tone description",
  "key_patterns": ["array of 3-5 key behavioral or thought patterns"],
  "dominant_concerns": ["array of main concerns or fears expressed"],
  "insights": ["array of 3-5 key insights about human nature from this data"],
  "overall_sentiment": "positive|negative|neutral|mixed"
}

Focus on deep psychological patterns, recurring themes, and meaningful insights that could inform wisdom creation. Be concise but insightful.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using gpt-4o-mini as it's available and efficient
      messages: [
        {
          role: 'system',
          content: 'You are a wise psychologist and data analyst who excels at finding meaningful patterns in human responses. Analyze the provided truth submissions and extract deep insights about human nature, fears, hopes, and behavioral patterns.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from GPT-4o-mini');
    }

    // Parse the JSON response
    const summary = JSON.parse(content) as TruthSummary;
    return summary;
  } catch (error) {
    console.error('GPT-4o-mini API error:', error);
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
    console.log('🔄 Truth Summarizer starting...');

    // Initialize Supabase client with service role key for full access
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Get the last processed timestamp from the most recent summary
    console.log('📅 Fetching last processed timestamp...');
    const { data: lastSummary, error: summaryError } = await supabase
      .from('truth_summaries')
      .select('last_processed_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let lastProcessedAt: string;
    if (summaryError && summaryError.code === 'PGRST116') {
      // No summaries exist yet, use a very early timestamp
      lastProcessedAt = '1970-01-01T00:00:00.000Z';
      console.log('📝 No previous summaries found, starting from beginning');
    } else if (summaryError) {
      throw new Error(`Error fetching last summary: ${summaryError.message}`);
    } else {
      lastProcessedAt = lastSummary.last_processed_at;
      console.log(`📝 Last processed: ${lastProcessedAt}`);
    }

    // Step 2: Fetch ONLY truths created AFTER the last processed timestamp
    console.log('🔍 Fetching new truths...');
    const { data: newTruths, error: truthsError } = await supabase
      .from('user_truths')
      .select('*')
      .gt('created_at', lastProcessedAt)
      .order('created_at', { ascending: true });

    if (truthsError) {
      throw new Error(`Error fetching new truths: ${truthsError.message}`);
    }

    // Step 3: If no new truths, exit early
    if (!newTruths || newTruths.length === 0) {
      console.log('✅ No new truths to process, exiting early');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No new truths to process',
          processed_count: 0,
          last_processed_at: lastProcessedAt
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      );
    }

    console.log(`📊 Found ${newTruths.length} new truths to process`);

    // Step 4: Send new truths to GPT-4o-mini for analysis
    console.log('🤖 Analyzing truths with GPT-4o-mini...');
    const summaryJson = await callGPT5Nano(newTruths);

    // Step 5: Store the summary with metadata
    const periodStart = newTruths[0].created_at;
    const periodEnd = newTruths[newTruths.length - 1].created_at;
    const newLastProcessedAt = periodEnd;

    console.log('💾 Storing summary in database...');
    const { data: insertedSummary, error: insertError } = await supabase
      .from('truth_summaries')
      .insert([{
        period_start: periodStart,
        period_end: periodEnd,
        last_processed_at: newLastProcessedAt,
        summary_json: summaryJson,
        truth_count: newTruths.length
      }])
      .select()
      .single();

    if (insertError) {
      throw new Error(`Error inserting summary: ${insertError.message}`);
    }

    console.log(`✅ Successfully processed ${newTruths.length} truths and created summary ${insertedSummary.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed ${newTruths.length} new truths`,
        processed_count: newTruths.length,
        summary_id: insertedSummary.id,
        period_start: periodStart,
        period_end: periodEnd,
        last_processed_at: newLastProcessedAt,
        summary_preview: {
          themes: summaryJson.themes,
          overall_sentiment: summaryJson.overall_sentiment
        }
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
    console.error('❌ Error in truth-summarizer:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to process and summarize truths'
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