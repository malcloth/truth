import { createClient } from 'npm:@supabase/supabase-js@2.55.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface DashboardStats {
  totalTruths: number;
  todayTruths: number;
  weeklyTruths: number;
  recentTruths: any[];
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
    console.log('📊 Dashboard Stats API starting...');

    // Initialize Supabase client with service role key for full access
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get total truths count
    console.log('🔢 Fetching total truths count...');
    const { count: totalCount, error: totalError } = await supabase
      .from('user_truths')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('Error fetching total count:', totalError);
      throw totalError;
    }

    // Get today's truths count
    console.log('📅 Fetching today\'s truths count...');
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const { count: todayCount, error: todayError } = await supabase
      .from('user_truths')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString())
      .lt('created_at', todayEnd.toISOString());

    if (todayError) {
      console.error('Error fetching today count:', todayError);
      throw todayError;
    }

    // Get this week's truths count
    console.log('📆 Fetching weekly truths count...');
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: weeklyCount, error: weeklyError } = await supabase
      .from('user_truths')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo);

    if (weeklyError) {
      console.error('Error fetching weekly count:', weeklyError);
      throw weeklyError;
    }

    // Get recent truths
    console.log('📝 Fetching recent truths...');
    const { data: recentTruths, error: recentError } = await supabase
      .from('user_truths')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('Error fetching recent truths:', recentError);
      throw recentError;
    }

    const stats: DashboardStats = {
      totalTruths: totalCount || 0,
      todayTruths: todayCount || 0,
      weeklyTruths: weeklyCount || 0,
      recentTruths: recentTruths || []
    };

    console.log('✅ Dashboard stats fetched successfully:', {
      total: stats.totalTruths,
      today: stats.todayTruths,
      weekly: stats.weeklyTruths,
      recent: stats.recentTruths.length
    });

    return new Response(
      JSON.stringify({ success: true, data: stats }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in get-dashboard-stats:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: 'Failed to fetch dashboard statistics'
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