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
            content: 'You are a wise philosopher who creates profound, shareable insights from human experiences. Generate wisdom that resonates with people and inspires reflection.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'grok-beta',
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
    console.log('Tweet posted successfully:', wisdom);
  } catch (error) {
    console.error('Error posting tweet:', error);
    throw error;
  }
}

async function generateWisdom(truths: UserTruth[]): Promise<string> {
  // Sample a few truths for context
  const sampleSize = Math.min(5, truths.length);
  const sampledTruths = truths.sort(() => Math.random() - 0.5).slice(0, sampleSize);

  const contextText = sampledTruths.map(truth => {
    return `Question: ${truth.first_question}\nAnswer: ${truth.first_answer}\nQuestion: ${truth.second_question}\nAnswer: ${truth.second_answer}\nTruth: ${truth.generated_truth}`;
  }).join('\n\n');

  const prompt = `Based on these human truths and reflections from our community:

${contextText}

Generate a single piece of profound wisdom (under 280 characters) that would resonate on social media. The wisdom should be:
- Universally relatable
- Thought-provoking
- Inspirational or insightful
- Perfect for sharing and reflection

Do not mention specific answers or make it obvious this came from a survey. Create standalone wisdom that feels timeless and meaningful.

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
    // Initialize Supabase client with service role key for full access
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch recent user truths for context
    const { data: truths, error } = await supabase
      .from('user_truths')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!truths || truths.length === 0) {
      throw new Error('No user truths found in database');
    }

    console.log(`Found ${truths.length} truths for wisdom generation`);

    // Generate wisdom based on the truths
    const wisdom = await generateWisdom(truths);
    
    // Post the wisdom to X
    await postTweet(wisdom);

    return new Response(
      JSON.stringify({ 
        success: true, 
        wisdom,
        context_count: truths.length,
        message: 'Wisdom generated and tweeted successfully'
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
    console.error('Error in x-wisdom-bot:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: 'Failed to generate and post wisdom'
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