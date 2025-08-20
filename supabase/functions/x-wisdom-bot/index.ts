import { createClient } from 'npm:@supabase/supabase-js@2.55.0';
import { TwitterApi } from 'npm:twitter-api-v2@1.15.0';

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
  id: string;
  period_start: string;
  period_end: string;
  summary_json: {
    themes: string[];
    emotional_tone: string;
    key_patterns: string[];
    dominant_concerns: string[];
    insights: string[];
    overall_sentiment: string;
  };
  truth_count: number;
  created_at: string;
}

interface WeightedSummary extends TruthSummary {
  weight: number;
}

async function callGrokAPI(prompt: string): Promise<string> {
  try {
    const grokApiKey = Deno.env.get('GROK_FINAL');
    
    if (!grokApiKey) {
      throw new Error('GROK_FINAL environment variable is not set');
    }

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${grokApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a wise philosopher who creates profound, shareable insights from human experiences. Generate wisdom that resonates deeply with people and inspires reflection. Keep tweets under 280 characters.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'grok-4-0709',
        stream: false,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grok API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Grok API error:', error);
    throw error;
  }
}

async function postTweet(wisdom: string): Promise<void> {
  try {
    const apiKey = Deno.env.get('X_API_KEY');
    const apiSecret = Deno.env.get('X_API_SECRET');
    const accessToken = Deno.env.get('our_access_x');
    const accessSecret = Deno.env.get('our_secret');

    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
      throw new Error('Missing X API credentials in environment variables');
    }

    const client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken: accessToken,
      accessSecret: accessSecret,
    });

    // Post the tweet
    await client.v2.tweet(wisdom);
    console.log('✅ Tweet posted successfully:', wisdom);
  } catch (error) {
    console.error('❌ Error posting tweet:', error);
    throw error;
  }
}

function calculateWeights(summaries: TruthSummary[]): WeightedSummary[] {
  if (summaries.length === 0) return [];

  // Calculate average truth count across all summaries
  const totalTruths = summaries.reduce((sum, summary) => sum + summary.truth_count, 0);
  const averageVolume = totalTruths / summaries.length;

  console.log(`📊 Average volume: ${averageVolume}, Total summaries: ${summaries.length}`);

  // Apply weight formula: weight = sqrt(average_volume / current_volume)
  const weightedSummaries = summaries.map(summary => {
    const weight = Math.sqrt(averageVolume / summary.truth_count);
    console.log(`📈 Summary with ${summary.truth_count} truths gets weight: ${weight.toFixed(3)}`);
    
    return {
      ...summary,
      weight
    };
  });

  return weightedSummaries;
}

async function generateWisdomFromSummaries(
  weightedSummaries: WeightedSummary[],
  freshTruths: UserTruth[]
): Promise<string> {
  console.log('🧠 Generating wisdom from summaries and fresh truths...');

  // Build context from weighted summaries
  const summaryContext = weightedSummaries.map(summary => {
    const { summary_json, truth_count, weight } = summary;
    return `[Weight: ${weight.toFixed(2)} | Volume: ${truth_count} truths]
Themes: ${summary_json.themes.join(', ')}
Emotional Tone: ${summary_json.emotional_tone}
Key Patterns: ${summary_json.key_patterns.join(', ')}
Insights: ${summary_json.insights.join(', ')}
Sentiment: ${summary_json.overall_sentiment}
---`;
  }).join('\n');

  // Build context from fresh truths
  const freshContext = freshTruths.length > 0 ? `
FRESH INSIGHTS (Latest 3 truths):
${freshTruths.map(truth => `@${truth.x_username}: "${truth.generated_truth}"`).join('\n')}
---` : '';

  const prompt = `Based on these aggregated insights from our community and fresh contributions:

COMMUNITY PATTERNS (Weighted by volume and recency):
${summaryContext}
${freshContext}

Generate a single piece of profound wisdom (under 280 characters) that would resonate on social media. The wisdom should be:
- Universally relatable and thought-provoking
- Inspired by the patterns and themes above
- Perfect for sharing and reflection
- Timeless and meaningful

Consider the weighted insights more heavily - summaries with higher weights represent more balanced periods that shouldn't be overshadowed by viral moments.

Return only the wisdom statement, no quotes or additional text.`;

  return await callGrokAPI(prompt);
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
    console.log('🤖 X Wisdom Bot starting with smart pipeline...');

    // Initialize Supabase client with service role key for full access
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Fetch last 5 summaries from truth_summaries
    console.log('📚 Fetching recent truth summaries...');
    const { data: summaries, error: summariesError } = await supabase
      .from('truth_summaries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (summariesError) {
      throw new Error(`Database error fetching summaries: ${summariesError.message}`);
    }

    // Step 2: Fetch 3 newest raw truths for freshness
    console.log('🔄 Fetching fresh truths...');
    const { data: freshTruths, error: freshTruthsError } = await supabase
      .from('user_truths')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    if (freshTruthsError) {
      throw new Error(`Database error fetching fresh truths: ${freshTruthsError.message}`);
    }

    // Check if we have data to work with
    if ((!summaries || summaries.length === 0) && (!freshTruths || freshTruths.length === 0)) {
      throw new Error('No summaries or truths found in database');
    }

    let wisdom: string;

    if (summaries && summaries.length > 0) {
      // Step 3: Calculate weights for summaries
      console.log(`📊 Processing ${summaries.length} summaries for wisdom generation`);
      const weightedSummaries = calculateWeights(summaries);

      // Step 4: Generate wisdom using weighted summaries + fresh truths
      wisdom = await generateWisdomFromSummaries(weightedSummaries, freshTruths || []);
    } else {
      // Fallback: Use only fresh truths if no summaries exist yet
      console.log('⚠️  No summaries available, falling back to fresh truths only');
      const freshContext = freshTruths!.map(truth => 
        `@${truth.x_username}: "${truth.generated_truth}"`
      ).join('\n');

      const fallbackPrompt = `Based on these recent truth submissions:
${freshContext}

Generate a profound piece of wisdom (under 280 characters) that captures the essence of these insights and would resonate on social media. Return only the wisdom statement.`;

      wisdom = await callGrokAPI(fallbackPrompt);
    }

    // Step 5: Post the wisdom to X
    console.log('📤 Posting wisdom to X/Twitter...');
    await postTweet(wisdom);

    const responseData = {
      success: true, 
      wisdom,
      context: {
        summaries_used: summaries?.length || 0,
        fresh_truths_used: freshTruths?.length || 0,
        total_context_truths: summaries?.reduce((sum, s) => sum + s.truth_count, 0) || 0
      },
      message: 'Wisdom generated and tweeted successfully using smart pipeline'
    };

    console.log('✅ Wisdom bot completed successfully:', responseData);

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
    console.error('❌ Error in x-wisdom-bot:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: 'Failed to generate and post wisdom using smart pipeline'
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