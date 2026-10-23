import React from 'react';
import Link from 'next/link';
import {
  Zap,
  Kanban,
  Sparkles,
  CalendarCheck2,
  Award,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Target,
  FileText,
  Clock,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">SponsorDesk</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Fest CRM
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Explore Live Demo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))]" />
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Built for College Fest & Club Sponsorship Teams</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
            Your sponsorship pipeline,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-300">
              finally under control.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            Stop losing corporate leads in scattered WhatsApp threads and chaotic Google Sheets.
            SponsorDesk gives student organizers one unified CRM to track sponsor pipelines, generate
            tailored AI pitches, and never miss a follow-up.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 text-white text-base font-semibold hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5"
            >
              <span>Start Managing Sponsors</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pipeline"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-base font-semibold hover:bg-slate-700 hover:text-white transition-all"
            >
              <span>Inspect Kanban Pipeline</span>
            </Link>
          </div>

          {/* Product UI Preview Card */}
          <div className="mt-16 rounded-2xl border border-slate-700/80 bg-slate-800/80 p-3 shadow-2xl backdrop-blur-xs">
            <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden text-left p-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">Vivacity 2026 — LNMIIT Jaipur Sponsorship Pipeline</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-400 font-semibold">₹10.5 Lakh Won</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-indigo-400 font-semibold">₹35.7 Lakh Active Pipeline</span>
                </div>
              </div>

              {/* Mini Pipeline Preview Columns */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300 uppercase">Leads (3)</span>
                    <span className="text-[10px] text-slate-400">₹5.7L</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2.5 rounded bg-slate-900/90 border border-slate-700/60">
                      <p className="text-xs font-bold text-white">FreshBite Snacks</p>
                      <p className="text-[11px] text-slate-400">FMCG • ₹1.5L</p>
                    </div>
                    <div className="p-2.5 rounded bg-slate-900/90 border border-slate-700/60">
                      <p className="text-xs font-bold text-white">CodeForge AI</p>
                      <p className="text-[11px] text-slate-400">DevTools • ₹3.0L</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-300 uppercase">Contacted (2)</span>
                    <span className="text-[10px] text-slate-400">₹5.0L</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2.5 rounded bg-slate-900/90 border border-slate-700/60">
                      <p className="text-xs font-bold text-white">NextGen EdTech</p>
                      <p className="text-[11px] text-slate-400">Pitch sent via Email</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-300 uppercase">Negotiation (2)</span>
                    <span className="text-[10px] text-slate-400">₹18.5L</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2.5 rounded bg-slate-900/90 border border-slate-700/60 border-l-2 border-l-indigo-500">
                      <p className="text-xs font-bold text-white">ByteCloud Systems</p>
                      <p className="text-[11px] text-indigo-300">Title Sponsor • ₹15.0L</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-300 uppercase">Closed Won (2)</span>
                    <span className="text-[10px] text-emerald-400 font-bold">₹10.5L</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/40">
                      <p className="text-xs font-bold text-emerald-200">ZenithPay India</p>
                      <p className="text-[11px] text-emerald-400">₹7.0L Agreed • Contract Signed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Core Workflow Section */}
      <section className="py-20 border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              The 3-Step Sponsorship Flywheel
            </h2>
            <p className="text-slate-400 mt-2">
              Designed specifically for fast-paced student committees with zero training curve.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg mb-4 border border-indigo-500/20">
                1
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Organize & Track</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Centralize every corporate prospect in a 7-stage Kanban pipeline. Know instantly who
                contacted which brand, expected budget, and current status.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg mb-4 border border-indigo-500/20">
                2
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Personalize with AI</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Generate high-converting, tailored pitches using Gemini AI. Customizes proposals based
                on your fest attendance, tier deliverables, and company fit.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg mb-4 border border-indigo-500/20">
                3
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Execute Follow-ups</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                80% of sponsorships close on the 3rd follow-up. Keep reminders visible, track overdue
                tasks, and never let high-ticket leads grow cold.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Everything Your Sponsorship Committee Needs
            </h2>
            <p className="text-slate-400 mt-2">
              From discovering a prospect to delivering the final signed MoU.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-slate-800/40 border border-slate-800">
              <Kanban className="w-8 h-8 text-indigo-400 mb-4" />
              <h4 className="text-base font-semibold text-white mb-1.5">Interactive Kanban Pipeline</h4>
              <p className="text-sm text-slate-400">
                Drag-and-drop sponsor cards between Lead, Contacted, Meeting, Negotiation, and Closed stages.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/40 border border-slate-800">
              <Sparkles className="w-8 h-8 text-indigo-400 mb-4" />
              <h4 className="text-base font-semibold text-white mb-1.5">Gemini AI Pitch Studio</h4>
              <p className="text-sm text-slate-400">
                Generate tailored Email pitches, WhatsApp messages, and LinkedIn InMails with tone controls.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/40 border border-slate-800">
              <CalendarCheck2 className="w-8 h-8 text-indigo-400 mb-4" />
              <h4 className="text-base font-semibold text-white mb-1.5">Follow-up Command Center</h4>
              <p className="text-sm text-slate-400">
                Track Due Today and Overdue reminders. Filter by priority and link every task directly to its sponsor.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/40 border border-slate-800">
              <Award className="w-8 h-8 text-indigo-400 mb-4" />
              <h4 className="text-base font-semibold text-white mb-1.5">Sponsorship Tier Builder</h4>
              <p className="text-sm text-slate-400">
                Define Title, Gold, Silver, and Associate tiers with deliverables and INR price tags.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/40 border border-slate-800">
              <FileText className="w-8 h-8 text-indigo-400 mb-4" />
              <h4 className="text-base font-semibold text-white mb-1.5">1-Page Proposal PDF Generator</h4>
              <p className="text-sm text-slate-400">
                Export print-ready one-page sponsorship proposals formatted for corporate marketing heads.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/40 border border-slate-800">
              <BarChart3 className="w-8 h-8 text-indigo-400 mb-4" />
              <h4 className="text-base font-semibold text-white mb-1.5">Honest Conversion Funnels</h4>
              <p className="text-sm text-slate-400">
                Calculated strictly from live database records. Win rates, reply rates, and average deal values.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-950 text-slate-400 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <span className="font-semibold text-white text-sm">SponsorDesk</span>
            <span className="text-xs text-slate-500">— Every sponsor. Every follow-up. Under control.</span>
          </div>

          <p className="text-xs text-slate-500">
            Initial target market: College Fest & Club Sponsorship Teams at LNMIIT Jaipur.
          </p>

          <div className="flex items-center gap-4 text-xs">
            <Link href="/dashboard" className="text-slate-300 hover:text-white transition-colors">
              Open Demo
            </Link>
            <Link href="/login" className="text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
