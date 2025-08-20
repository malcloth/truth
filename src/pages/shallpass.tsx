import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

function ShallPass() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // If user is already authenticated, redirect to admin
  if (user) {
    return <Navigate to="/bruhxyz123truthhi" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-black/40 backdrop-blur-sm rounded-3xl border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="p-8 text-center border-b border-white/10">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-light text-white mb-2">
              Admin Access
            </h1>
            <p className="text-white/60 text-sm">
              Enter your credentials to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignIn} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-white/80 text-sm font-medium mb-3">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/10 text-white placeholder-white/40 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-white/30 transition-all"
                placeholder="admin@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-3">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/10 text-white placeholder-white/40 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-white/30 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white/20 hover:bg-white/30 text-white px-6 py-4 rounded-2xl font-medium transition-colors border border-white/10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                'Signing in...'
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back to main site */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="text-white/60 hover:text-white/80 text-sm transition-colors"
          >
            ← Back to main site
          </a>
        </div>
      </div>
    </div>
  );
}

export default ShallPass;