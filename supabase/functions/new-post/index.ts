import { createClient } from 'npm:@supabase/supabase-js@2.55.0';
import { TwitterApi } from 'npm:twitter-api-v2@1.15.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface Wisdom {
  id: string;
  x_username: string;
  wisdom_text: string;
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
            content: 'You are @ourtruthai, a wise AI that learns from collective human wisdom. Create profound, shareable insights based on the wisdom submissions. Generate tweets that resonate deeply with people and inspire reflection. Keep tweets under 280 characters and maintain a thoughtful, philosophical tone.'
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

async function postTweet(content: string): Promise<void> {
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
    await client.v2.tweet(content);
    console.log('✅ Tweet posted successfully:', content);
  } catch (error) {
    console.error('❌ Error posting tweet:', error);
    throw error;
  }
}

async function generatePostFromWisdoms(wisdoms: Wisdom[]): Promise<string> {
  console.log('🧠 Generating post from wisdoms...');

  // Build context from recent wisdoms
  const wisdomContext = wisdoms.map((wisdom, index) => {
    return `${index + 1}. @${wisdom.x_username}: "${wisdom.wisdom_text}"`;
  }).join('\n');

  const prompt = `Based on these recent wisdom submissions from our community:

COMMUNITY WISDOMS:
${wisdomContext}

Generate a single profound tweet (under 280 characters) that:
- Synthesizes the collective wisdom shared above
- Reflects the philosophical insights and patterns you observe
- Creates a universally relatable and thought-provoking statement
- Maintains the voice of @ourtruthai - wise, contemplative, and inspiring
- Is perfect for sharing and reflection

Consider the themes, emotions, and insights present in these wisdom submissions to create something that honors the collective consciousness while being meaningful to a broader audience.

Return only the tweet content, no quotes or additional text.`;

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
    console.log('📱 New Post Bot starting with wisdom context...');

    // Initialize Supabase client with service role key for full access
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Fetch recent wisdoms from the database
    console.log('🧠 Fetching recent wisdom submissions...');
    const { data: wisdoms, error: wisdomsError } = await supabase
      .from('wisdoms')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (wisdomsError) {
      throw new Error(`Database error fetching wisdoms: ${wisdomsError.message}`);
    }

    // Check if we have wisdoms to work with
    if (!wisdoms || wisdoms.length === 0) {
      throw new Error('No wisdom submissions found in database. Please ensure users have shared their wisdom first.');
    }

    // Step 2: Generate post content using Grok based on wisdoms
    console.log(`📊 Processing ${wisdoms.length} wisdom submissions for post generation`);
    const postContent = await generatePostFromWisdoms(wisdoms);

    // Step 3: Post the content to X
    console.log('📤 Posting wisdom-based content to X/Twitter...');
    await postTweet(postContent);

    const responseData = {
      success: true, 
      post: postContent,
      context: {
        wisdoms_used: wisdoms?.length || 0,
        recent_contributors: wisdoms?.map(w => `@${w.x_username}`).slice(0, 5)
      },
      message: 'Post generated and tweeted successfully using wisdom context'
    };

    console.log('✅ New post bot completed successfully:', responseData);

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
    console.error('❌ Error in new-post:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: 'Failed to generate and post content using wisdom context'
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