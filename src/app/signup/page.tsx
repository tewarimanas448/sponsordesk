'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { useWorkspace } from '@/context/WorkspaceContext';

import { getOrCreateUserWorkspace } from '@/lib/supabase/prospects';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { resetToDemo, updateWorkspaceDetails } = useWorkspace();

  const [step, setStep] = useState<'auth' | 'workspace'>('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  // Workspace details
  const [festName, setFestName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [expectedAttendance, setExpectedAttendance] = useState('15000');
  const [festDescription, setFestDescription] = useState('');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      // Transition to workspace details setup in demo mode
      setStep('workspace');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) {
        toast.error(error.message, 'Signup Error');
        setLoading(false);
        return;
      }

      if (data.user && !data.session) {
        toast.info(
          'Account created! If your email requires confirmation, please verify it before signing in.',
          'Account Registered'
        );
      }

      setStep('workspace');
    } catch (err: any) {
      toast.error(err?.message || 'Registration failed', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkspaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!festName.trim() || !collegeName.trim()) {
      toast.error('Fest name and College name are required', 'Validation Error');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await getOrCreateUserWorkspace(supabase, user, {
            event_name: festName.trim(),
            name: `${festName.trim()} Sponsorship Hub`,
            institution_name: collegeName.trim(),
            expected_attendance: Number(expectedAttendance) || 10000,
            event_description: festDescription.trim() || 'Annual college flagship festival',
            contact_email: email || 'sponsorship@fest.edu',
          });
        }
      }

      updateWorkspaceDetails({
        event_name: festName.trim(),
        name: `${festName.trim()} Sponsorship Hub`,
        institution_name: collegeName.trim(),
        expected_attendance: Number(expectedAttendance) || 10000,
        event_description: festDescription.trim() || 'Annual college flagship festival',
        contact_email: email || 'sponsorship@fest.edu',
      });

      toast.success('Workspace created successfully! Welcome to SponsorDesk.', 'Workspace Initialized');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to initialize workspace in Supabase', 'Database Error');
    } finally {
      setLoading(false);
    }
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
        <h2 className="mt-4 text-xl font-bold text-slate-100">
          {step === 'auth' ? 'Create a festival sponsorship workspace' : 'Tell us about your festival'}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          {step === 'auth' ? (
            <>
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                Log in
              </Link>
            </>
          ) : (
            'This information personalizes your AI pitches and proposals.'
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800/80 border border-slate-700/80 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 backdrop-blur-xs">
          {step === 'auth' ? (
            <>
              <div className="mb-6 p-4 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-300 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Looking to evaluate immediately?</span>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    resetToDemo();
                    router.push('/dashboard');
                  }}
                  className="w-full bg-indigo-500 hover:bg-indigo-600"
                >
                  <span>Skip to Live Demo (Vivacity 2026)</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Manas Tewari"
                    className="w-full px-3 py-2 text-sm text-white bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Student or Committee Email
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
                  Continue to Fest Setup
                </Button>
              </form>
            </>
          ) : (
            <form onSubmit={handleWorkspaceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Festival / Event Name *
                </label>
                <input
                  type="text"
                  required
                  value={festName}
                  onChange={(e) => setFestName(e.target.value)}
                  placeholder="e.g. Vivacity 2026, Plinth, Mood Indigo"
                  className="w-full px-3 py-2 text-sm text-white bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  College / Institution Name *
                </label>
                <input
                  type="text"
                  required
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  placeholder="e.g. LNMIIT Jaipur, IIT Bombay, BITS Pilani"
                  className="w-full px-3 py-2 text-sm text-white bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Expected Footfall / Attendance
                </label>
                <input
                  type="number"
                  value={expectedAttendance}
                  onChange={(e) => setExpectedAttendance(e.target.value)}
                  placeholder="25000"
                  className="w-full px-3 py-2 text-sm text-white bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Brief Event Description
                </label>
                <textarea
                  rows={2}
                  value={festDescription}
                  onChange={(e) => setFestDescription(e.target.value)}
                  placeholder="Northwest India's premier annual cultural festival hosting dance, music pronites..."
                  className="w-full px-3 py-2 text-sm text-white bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <Button type="submit" className="w-full mt-2" loading={loading} disabled={loading}>
                Launch Workspace
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
