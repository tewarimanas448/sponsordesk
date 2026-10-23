'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { useWorkspace } from '@/context/WorkspaceContext';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { resetToDemo } = useWorkspace();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      // Supabase is not configured yet; seamlessly enter demo mode with informative toast
      toast.info(
        'Supabase credentials not configured in .env. Entering Demo Mode with pre-seeded Vivacity data.',
        'Demo Mode Active'
      );
      resetToDemo();
      router.push('/dashboard');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message, 'Authentication Failed');
      } else {
        toast.success('Welcome back to SponsorDesk!', 'Logged In');
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Login failed', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoBypass = () => {
    resetToDemo();
    toast.success('Loaded LNMIIT Vivacity 2026 fest demo workspace!', 'Demo Access Granted');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <span className="font-bold text-2xl text-white tracking-tight">SponsorDesk</span>
        </Link>
        <h2 className="mt-4 text-xl font-bold text-slate-100">Sign in to your festival CRM</h2>
        <p className="mt-1 text-sm text-slate-400">
          Or{' '}
          <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium">
            create a new committee workspace
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800/80 border border-slate-700/80 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 backdrop-blur-xs">
          {/* Quick Demo Mode CTA for reviewers */}
          <div className="mb-6 p-4 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-300 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Reviewing or Testing SponsorDesk?</span>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              Explore the fully-seeded Vivacity 2026 fest workspace with 14 sponsor leads, pipeline, and AI pitches.
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleDemoBypass}
              className="w-full bg-indigo-500 hover:bg-indigo-600"
            >
              <span>Explore Live Demo Fest</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800 px-2 text-slate-400 font-medium">Or log in with credentials</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                College or Committee Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="organizer@fest.lnmiit.ac.in"
                className="w-full px-3 py-2 text-sm text-white bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm text-white bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2">
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
