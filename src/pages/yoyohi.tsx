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
  Clock,
  ArrowLeft
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
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [botStatus, setBotStatus] = useState('idle');
  const [lastBotRun, setLastBotRun] = useState<string | null>(null);
  const [showAllTruths, setShowAllTruths] = useState(false);
  const [allTruths, setAllTruths] = useState<any[]>([]);
  const [isLoadingAllTruths, setIsLoadingAllTruths] = useState(false);

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
    setIsLoadingStats(true);
    try {
      console.log('📊 Fetching dashboard data from Edge Function...');
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-dashboard-stats`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }

      console.log('✅ Dashboard data received:', result.data);
      
      setStats({
        totalTruths: result.data.totalTruths,
        todayTruths: result.data.todayTruths,
        weeklyTruths: result.data.weeklyTruths,
        recentTruths: result.data.recentTruths
      });
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      alert(`Error loading dashboard data: ${error.message}`);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadAllTruths = async () => {
    setIsLoadingAllTruths(true);
    try {
      console.log('📚 Fetching all truths from Edge Function...');
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-all-truths`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch all truths');
      }

      console.log(`✅ All truths received: ${result.count} truths`);
      setAllTruths(result.data);
      setShowAllTruths(true);
    } catch (error) {
      console.error('❌ Error loading all truths:', error);
      alert(`Error loading all truths: ${error.message}`);
    } finally {
      setIsLoadingAllTruths(false);
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

  if (showAllTruths) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
        <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <button
                  onClick={() => setShowAllTruths(false)}
                  className="flex items-center bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-2xl transition-colors border border-white/10 mr-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </button>
                <div>
                  <h1 className="text-2xl font-light text-white">All Truths ({allTruths.length})</h1>
                  <p className="text-white/60 text-sm">Complete list of user submissions</p>
                </div>
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

        {/* All Truths List */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoadingAllTruths ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-white/60 mx-auto mb-4" />
              <p className="text-white/60">Loading all truths...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allTruths.map((truth, index) => (
                <div key={truth.id} className="bg-black/40 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mr-4">
                        <span className="text-white text-sm font-medium">@</span>
                      </div>
                      <div>
                        <span className="text-white font-medium text-lg">{truth.x_username}</span>
                        <div className="flex items-center text-white/40 text-sm mt-1">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(truth.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-white/40 text-sm">
                      #{allTruths.length - index}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-white/80 text-xl font-light mb-3">"{truth.generated_truth}"</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <p className="text-white/60 mb-2">Q1: {truth.first_question}</p>
                      <p className="text-white/90">A1: {truth.first_answer}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <p className="text-white/60 mb-2">Q2: {truth.second_question}</p>
                      <p className="text-white/90">A2: {truth.second_answer}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {allTruths.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-white/20" />
                  <p className="text-white/40 text-lg">No truths found</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    );
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
                <p className="text-3xl font-light text-white">
                  {isLoadingStats ? '...' : (stats?.totalTruths || 0)}
                </p>
              </div>
              <Database className="w-8 h-8 text-white/40" />
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Today</p>
                <p className="text-3xl font-light text-white">
                  {isLoadingStats ? '...' : (stats?.todayTruths || 0)}
                </p>
              </div>
              <Activity className="w-8 h-8 text-white/40" />
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">This Week</p>
                <p className="text-3xl font-light text-white">
                  {isLoadingStats ? '...' : (stats?.weeklyTruths || 0)}
                </p>
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
              <button
                onClick={() => {
                  console.log('🔄 Manual refresh triggered');
                  loadDashboardData();
                }}
                disabled={isLoadingStats}
                className="w-full bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-2xl font-medium transition-colors border border-white/10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingStats ? 'animate-spin' : ''}`} />
                {isLoadingStats ? 'Refreshing...' : 'Refresh Data'}
              </button>
              
              <button
                onClick={loadAllTruths}
                disabled={isLoadingAllTruths}
                className="w-full bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-2xl font-medium transition-colors border border-white/10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Users className="w-4 h-4 mr-2" />
                {isLoadingAllTruths ? 'Loading...' : 'View All Truths'}
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