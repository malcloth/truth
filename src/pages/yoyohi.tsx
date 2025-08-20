import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Database, 
  Users, 
  Activity, 
  LogOut, 
  Play, 
  RefreshCw,
  BarChart3,
  Settings,
  MessageSquare,
  Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DashboardStats {
  totalTruths: number;
  todayTruths: number;
  weeklyTruths: number;
  recentTruths: any[];
}

function YoyoHi() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [botStatus, setBotStatus] = useState('idle');
  const [lastBotRun, setLastBotRun] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Get total truths count
      const { count: totalCount } = await supabase
        .from('user_truths')
        .select('*', { count: 'exact', head: true });

      // Get today's truths count
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from('user_truths')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      // Get this week's truths count
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: weeklyCount } = await supabase
        .from('user_truths')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo);

      // Get recent truths
      const { data: recentTruths } = await supabase
        .from('user_truths')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalTruths: totalCount || 0,
        todayTruths: todayCount || 0,
        weeklyTruths: weeklyCount || 0,
        recentTruths: recentTruths || []
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/buddy');
  };

  const triggerBot = async () => {
    setBotStatus('running');
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/x-wisdom-bot`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        setBotStatus('success');
        setLastBotRun(new Date().toLocaleString());
        // Refresh stats after bot runs
        setTimeout(() => {
          loadDashboardData();
          setBotStatus('idle');
        }, 2000);
      } else {
        setBotStatus('error');
        setTimeout(() => setBotStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Error triggering bot:', error);
      setBotStatus('error');
      setTimeout(() => setBotStatus('idle'), 3000);
    }
  };

  // Redirect if not authenticated
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/buddy" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-light text-white">Truth Admin</h1>
              <p className="text-white/60 text-sm">Welcome back, {user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-2xl transition-colors border border-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-black/40 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Truths</p>
                <p className="text-3xl font-light text-white">{stats?.totalTruths || 0}</p>
              </div>
              <Database className="w-8 h-8 text-white/40" />
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Today</p>
                <p className="text-3xl font-light text-white">{stats?.todayTruths || 0}</p>
              </div>
              <Activity className="w-8 h-8 text-white/40" />
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">This Week</p>
                <p className="text-3xl font-light text-white">{stats?.weeklyTruths || 0}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-white/40" />
            </div>
          </div>
        </div>

        {/* Bot Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-black/40 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
            <div className="flex items-center mb-6">
              <Bot className="w-6 h-6 text-white mr-3" />
              <h2 className="text-xl font-light text-white">X Wisdom Bot</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  botStatus === 'idle' ? 'bg-gray-500/20 text-gray-300' :
                  botStatus === 'running' ? 'bg-blue-500/20 text-blue-300' :
                  botStatus === 'success' ? 'bg-green-500/20 text-green-300' :
                  'bg-red-500/20 text-red-300'
                }`}>
                  {botStatus === 'idle' ? 'Idle' :
                   botStatus === 'running' ? 'Running...' :
                   botStatus === 'success' ? 'Success' : 'Error'}
                </span>
              </div>

              {lastBotRun && (
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Last Run:</span>
                  <span className="text-white/60 text-sm">{lastBotRun}</span>
                </div>
              )}

              <button
                onClick={triggerBot}
                disabled={botStatus === 'running'}
                className="w-full bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-2xl font-medium transition-colors border border-white/10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {botStatus === 'running' ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Generating Wisdom...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Run Bot Now
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-black/40 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
            <div className="flex items-center mb-6">
              <Settings className="w-6 h-6 text-white mr-3" />
              <h2 className="text-xl font-light text-white">Quick Actions</h2>
            </div>
            
            <div className="space-y-3">
              <button className="w-full bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-2xl font-medium transition-colors border border-white/10 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </button>
              
              <button className="w-full bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-2xl font-medium transition-colors border border-white/10 flex items-center justify-center">
                <Users className="w-4 h-4 mr-2" />
                View All Truths
              </button>
              
              <button className="w-full bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-2xl font-medium transition-colors border border-white/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Recent Truths */}
        <div className="bg-black/40 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
          <div className="flex items-center mb-6">
            <MessageSquare className="w-6 h-6 text-white mr-3" />
            <h2 className="text-xl font-light text-white">Recent Truths</h2>
          </div>
          
          <div className="space-y-4">
            {stats?.recentTruths.map((truth, index) => (
              <div key={truth.id} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm">@</span>
                    </div>
                    <span className="text-white font-medium">{truth.x_username}</span>
                  </div>
                  <div className="flex items-center text-white/40 text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(truth.created_at).toLocaleDateString()}
                  </div>
                </div>
                <p className="text-white/80 text-lg mb-2">"{truth.generated_truth}"</p>
                <div className="text-white/50 text-sm">
                  <p>Q1: {truth.first_question}</p>
                  <p>A1: {truth.first_answer}</p>
                  <p>Q2: {truth.second_question}</p>
                  <p>A2: {truth.second_answer}</p>
                </div>
              </div>
            ))}
            
            {(!stats?.recentTruths || stats.recentTruths.length === 0) && (
              <div className="text-center py-8 text-white/40">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No truths found yet</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default YoyoHi;