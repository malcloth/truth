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

async function analyzetruthsWithGPT5Nano(truths: UserTruth[]): Promise<TruthSummary> {
  console.log(`🤖 Analyzing ${truths.length} truths with gpt-5-nano-2025-08-07...`);
  
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Prepare the truths data for analysis
    const truthsText = truths.map((truth, index) => {
      return `Entry ${index + 1}:
Username: @${truth.x_username}
Question 1: ${truth.first_question}
Answer 1: ${truth.first_answer}
Question 2: ${truth.second_question}
Answer 2: ${truth.second_answer}
Generated Truth: "${truth.generated_truth}"
Timestamp: ${truth.created_at}
---`;
    }).join('\n');

    const analysisPrompt = `You are analyzing ${truths.length} user truth submissions to extract meaningful psychological and behavioral patterns.

DATA TO ANALYZE:
${truthsText}

ANALYSIS REQUIREMENTS:
Please analyze these truth submissions and identify:
1. Major recurring themes across users
2. Overall emotional tone of the submissions
3. Key behavioral or thought patterns
4. Primary concerns, fears, or anxieties expressed
5. Deep insights about human nature revealed
6. The overall sentiment across all submissions

OUTPUT FORMAT:
Return your analysis as a JSON object with this exact structure (no markdown formatting, just pure JSON):

{
  "themes": ["theme1", "theme2", "theme3", "theme4", "theme5"],
  "emotional_tone": "detailed description of the overall emotional atmosphere",
  "key_patterns": ["pattern1", "pattern2", "pattern3", "pattern4"],
  "dominant_concerns": ["concern1", "concern2", "concern3", "concern4"],
  "insights": ["insight1", "insight2", "insight3", "insight4", "insight5"],
  "overall_sentiment": "positive|negative|neutral|mixed"
}

IMPORTANT: Return ONLY the JSON object, no other text, no markdown code blocks, no explanations.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-5-nano-2025-08-07',
      messages: [
        {
          role: 'system',
          content: 'You are a brilliant psychologist and data analyst specializing in human behavior patterns. You excel at identifying deep psychological themes and extracting meaningful insights from personal responses. Always respond with clean JSON only, never use markdown formatting.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.2,
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from gpt-5-nano-2025-08-07');
    }

    console.log('🔍 Raw response from gpt-5-nano-2025-08-07:', content);

    // Clean the content to handle any potential markdown formatting
    let cleanContent = content.trim();
    
    // Remove markdown code block delimiters if present
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '');
    }
    
    if (cleanContent.endsWith('```')) {
      cleanContent = cleanContent.replace(/\s*```$/, '');
    }
    
    // Additional cleanup for any backticks
    cleanContent = cleanContent.replace(/^`+|`+$/g, '').trim();
    
    console.log('🧹 Cleaned content for parsing:', cleanContent);

    // Parse the JSON response
    const summary = JSON.parse(cleanContent) as TruthSummary;
    
    console.log('✅ Successfully parsed analysis results');
    return summary;
    
  } catch (error) {
    console.error('❌ gpt-5-nano-2025-08-07 analysis error:', error);
    
    // If JSON parsing fails, log the content for debugging
    if (error instanceof SyntaxError) {
      console.error('🔍 JSON Parse Error Details:', {
        error: error.message,
        attemptedToParse: error.message.includes('not valid JSON') ? 'See raw response above' : 'Unknown'
      });
    }
    
    throw new Error(`Analysis failed with gpt-5-nano-2025-08-07: ${error.message}`);
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
    console.log('📅 Current timestamp:', new Date().toISOString());

    // Initialize Supabase client with service role key for full access
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Get the timestamp of the last processed truth
    console.log('📊 Checking for previous summary records...');
    const { data: lastSummary, error: summaryError } = await supabase
      .from('truth_summaries')
      .select('last_processed_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let lastProcessedTimestamp: string;
    
    if (summaryError && summaryError.code === 'PGRST116') {
      // No summaries exist yet - start from the beginning
      lastProcessedTimestamp = '1970-01-01T00:00:00.000Z';
      console.log('🆕 No previous summaries found - processing all truths');
    } else if (summaryError) {
      throw new Error(`Failed to fetch last summary: ${summaryError.message}`);
    } else {
      lastProcessedTimestamp = lastSummary.last_processed_at;
      console.log(`📅 Last processed timestamp: ${lastProcessedTimestamp}`);
    }

    // Step 2: Fetch all truths created after the last processed timestamp
    console.log('🔍 Fetching new truths for processing...');
    const { data: newTruths, error: truthsError } = await supabase
      .from('user_truths')
      .select('*')
      .gt('created_at', lastProcessedTimestamp)
      .order('created_at', { ascending: true });

    if (truthsError) {
      throw new Error(`Failed to fetch new truths: ${truthsError.message}`);
    }

    // Step 3: Check if there are new truths to process
    if (!newTruths || newTruths.length === 0) {
      console.log('✨ No new truths to process - all caught up!');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No new truths to process',
          processed_count: 0,
          last_processed_at: lastProcessedTimestamp,
          next_check: new Date(Date.now() + 60 * 60 * 1000).toISOString()
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

    console.log(`📈 Found ${newTruths.length} new truths to analyze`);
    console.log(`📅 Period: ${newTruths[0].created_at} to ${newTruths[newTruths.length - 1].created_at}`);

    // Step 4: Analyze the new truths using gpt-5-nano-2025-08-07
    const analysisResults = await analyzetruthsWithGPT5Nano(newTruths);

    // Step 5: Prepare summary record for database
    const periodStart = newTruths[0].created_at;
    const periodEnd = newTruths[newTruths.length - 1].created_at;
    const newLastProcessedTimestamp = periodEnd;

    console.log('💾 Storing analysis results in truth_summaries table...');
    
    const { data: insertedSummary, error: insertError } = await supabase
      .from('truth_summaries')
      .insert([{
        period_start: periodStart,
        period_end: periodEnd,
        last_processed_at: newLastProcessedTimestamp,
        summary_json: analysisResults,
        truth_count: newTruths.length
      }])
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to store analysis results: ${insertError.message}`);
    }

    console.log(`✅ Successfully processed batch: ${insertedSummary.id}`);
    
    // Step 6: Return success response with detailed information
    const responseData = {
      success: true,
      message: `Successfully analyzed and summarized ${newTruths.length} new truths`,
      summary_id: insertedSummary.id,
      processed_count: newTruths.length,
      period: {
        start: periodStart,
        end: periodEnd
      },
      last_processed_at: newLastProcessedTimestamp,
      analysis_preview: {
        themes_count: analysisResults.themes.length,
        overall_sentiment: analysisResults.overall_sentiment,
        emotional_tone: analysisResults.emotional_tone.substring(0, 100) + '...'
      },
      next_scheduled_run: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    };

    console.log('🎉 Truth summarizer completed successfully:', {
      summary_id: responseData.summary_id,
      processed: responseData.processed_count,
      sentiment: responseData.analysis_preview.overall_sentiment
    });

    return new Response(
      JSON.stringify(responseData),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Truth Summarizer failed:', error);
    
    const errorResponse = {
      success: false,
      error: error.message,
      message: 'Truth summarizer encountered an error',
      timestamp: new Date().toISOString(),
      function: 'truth-summarizer'
    };

    return new Response(
      JSON.stringify(errorResponse),
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