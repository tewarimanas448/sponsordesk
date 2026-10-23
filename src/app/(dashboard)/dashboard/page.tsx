'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  Send,
  MessageSquare,
  Calendar,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  Award,
  ChevronRight,
  Kanban,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { formatINR, formatDate, formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { calculateFunnelMetrics } from '@/lib/store';

export default function DashboardPage() {
  const { workspace, prospects, followUps, pitches, activityLogs, metrics, completeFollowUp } =
    useWorkspace();

  const funnelData = calculateFunnelMetrics(prospects);

  // Filter urgent follow-ups
  const urgentFollowUps = followUps
    .filter((f) => f.status === 'overdue' || f.status === 'due_today')
    .slice(0, 5);

  const recentPitches = pitches.slice(0, 3);
  const recentActivities = activityLogs.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              Festival Sponsorship Desk
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              {workspace.expected_attendance.toLocaleString('en-IN')} Expected Attendees
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            {workspace.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time pipeline overview, follow-up statuses, and sponsorship metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/pipeline">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Kanban className="w-4 h-4 text-slate-600" />
              <span>Pipeline Board</span>
            </Button>
          </Link>
          <Link href="/pitch-studio">
            <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700">
              <Sparkles className="w-4 h-4" />
              <span>Generate AI Pitch</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Closed Won Value */}
        <Card className="border-emerald-200/80 bg-linear-to-br from-emerald-50/40 to-white">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-emerald-800 tracking-wider">
                Closed Revenue
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
              {formatINR(metrics.closedValue)}
            </p>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
              <span>{metrics.dealsWonCount} deals closed won</span>
              <span className="font-semibold text-emerald-700">Win Rate: {metrics.winRate}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Potential Pipeline Value */}
        <Card className="border-indigo-200/80 bg-linear-to-br from-indigo-50/40 to-white">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-indigo-800 tracking-wider">
                Open Pipeline Value
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
              {formatINR(metrics.potentialValue)}
            </p>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
              <span>{metrics.totalActiveProspects} active prospects</span>
              <span className="font-semibold text-indigo-700">Avg Won: {formatINR(metrics.averageWonDealValue, true)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Funnel Engagement (Contacted & Replies) */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-600 tracking-wider">
                Sponsors Contacted
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
                <Send className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
              {metrics.contactedCount}{' '}
              <span className="text-xs font-normal text-slate-500">of {prospects.length}</span>
            </p>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
              <span>{metrics.repliesCount} replies received</span>
              <span className="font-semibold text-purple-700">Reply Rate: {metrics.replyRate}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Follow-up Health */}
        <Card className={metrics.overdueFollowUps > 0 ? 'border-rose-200/80 bg-rose-50/20' : ''}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-600 tracking-wider">
                Follow-ups Status
              </span>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  metrics.overdueFollowUps > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                }`}
              >
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
              {metrics.followUpsDueToday}{' '}
              <span className="text-xs font-medium text-slate-500">due today</span>
            </p>
            <div className="flex items-center justify-between mt-2 text-xs">
              {metrics.overdueFollowUps > 0 ? (
                <span className="font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {metrics.overdueFollowUps} overdue tasks
                </span>
              ) : (
                <span className="text-emerald-600 font-medium">All tasks up to date</span>
              )}
              <span className="text-slate-500">Done: {metrics.followUpCompletionRate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Funnel conversion on Left, Urgencies & Followups on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel Conversion Progress (2 columns on lg) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Sponsorship Pipeline Funnel</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Conversion rates calculated from persisted prospect records
                </p>
              </div>
              <Link href="/pipeline" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                <span>View Full Pipeline</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-4">
                {funnelData.map((step, idx) => {
                  const maxCount = Math.max(...funnelData.map((s) => s.count), 1);
                  const percentage = Math.round((step.count / maxCount) * 100);

                  return (
                    <div key={step.stage} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">
                          {idx + 1}. {step.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{step.count} prospects</span>
                          {idx > 0 && (
                            <span className="text-slate-400 text-[11px]">
                              ({step.conversionFromPrevious}% conv.)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Stage Quick Breakdown Links */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-6 pt-4 border-t border-slate-100 text-center">
                <div className="p-2 rounded-lg bg-slate-50">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Leads</span>
                  <span className="text-sm font-bold text-slate-800">
                    {prospects.filter((p) => p.stage === 'lead').length}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-blue-50">
                  <span className="block text-[10px] font-bold text-blue-600 uppercase">Contacted</span>
                  <span className="text-sm font-bold text-blue-900">
                    {prospects.filter((p) => p.stage === 'contacted').length}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-purple-50">
                  <span className="block text-[10px] font-bold text-purple-600 uppercase">Replied</span>
                  <span className="text-sm font-bold text-purple-900">
                    {prospects.filter((p) => p.stage === 'replied').length}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-amber-50">
                  <span className="block text-[10px] font-bold text-amber-600 uppercase">Meeting</span>
                  <span className="text-sm font-bold text-amber-900">
                    {prospects.filter((p) => p.stage === 'meeting').length}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-indigo-50">
                  <span className="block text-[10px] font-bold text-indigo-600 uppercase">Negotiate</span>
                  <span className="text-sm font-bold text-indigo-900">
                    {prospects.filter((p) => p.stage === 'negotiation').length}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50">
                  <span className="block text-[10px] font-bold text-emerald-600 uppercase">Won</span>
                  <span className="text-sm font-bold text-emerald-900">
                    {prospects.filter((p) => p.stage === 'won').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>Recent Outreach & Pipeline Activity</CardTitle>
              <span className="text-xs text-slate-400">Live audit log</span>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No activity recorded yet.</p>
              ) : (
                <div className="space-y-3.5">
                  {recentActivities.map((act) => (
                    <div key={act.id} className="flex items-start gap-3 text-xs">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-slate-800 font-medium">{act.description}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-slate-400">
                          <span>{act.actor_name || 'Fest Team'}</span>
                          <span>•</span>
                          <span>{formatDateTime(act.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Follow-ups due & Generated Pitches */}
        <div className="space-y-6">
          {/* Urgent Follow-ups */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Action Items & Follow-ups</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Due today and overdue reminders</p>
              </div>
              <Link href="/follow-ups" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                View All
              </Link>
            </CardHeader>
            <CardContent>
              {urgentFollowUps.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">No overdue follow-ups!</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">All scheduled tasks are up to date.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {urgentFollowUps.map((fu) => {
                    const relatedProspect = prospects.find((p) => p.id === fu.prospect_id);
                    return (
                      <div
                        key={fu.id}
                        className={`p-3 rounded-lg border text-xs flex flex-col gap-2 ${
                          fu.status === 'overdue'
                            ? 'bg-rose-50/40 border-rose-200'
                            : 'bg-amber-50/40 border-amber-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-900 block">{fu.title}</span>
                            <span className="text-slate-500 font-medium">
                              {relatedProspect?.company_name || 'Sponsor'}
                            </span>
                          </div>
                          <Badge variant={fu.status === 'overdue' ? 'rose' : 'amber'}>
                            {fu.status === 'overdue' ? 'Overdue' : 'Due Today'}
                          </Badge>
                        </div>

                        {fu.description && (
                          <p className="text-[11px] text-slate-600 line-clamp-1">{fu.description}</p>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                          <span className="text-slate-400">Due: {formatDate(fu.due_at)}</span>
                          <button
                            onClick={() => completeFollowUp(fu.id)}
                            className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Done</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recently Generated Pitches */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Recent AI Pitches</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Saved pitches ready to copy</p>
              </div>
              <Link href="/pitch-studio" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                New Pitch
              </Link>
            </CardHeader>
            <CardContent>
              {recentPitches.length === 0 ? (
                <div className="text-center py-6">
                  <Sparkles className="w-8 h-8 text-indigo-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600">No pitches created yet.</p>
                  <Link href="/pitch-studio" className="text-xs text-indigo-600 font-semibold hover:underline mt-1 block">
                    Generate first pitch →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentPitches.map((pitch) => {
                    const related = prospects.find((p) => p.id === pitch.prospect_id);
                    return (
                      <div key={pitch.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{related?.company_name || 'Prospect'}</span>
                          <Badge variant="indigo">{pitch.channel.toUpperCase()}</Badge>
                        </div>
                        {pitch.subject && (
                          <p className="font-medium text-slate-700 line-clamp-1">{pitch.subject}</p>
                        )}
                        <p className="text-slate-500 line-clamp-2 text-[11px] font-sans">
                          {pitch.body}
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 text-[10px] text-slate-400">
                          <span>{formatDate(pitch.created_at)}</span>
                          <Link href="/pitch-studio" className="font-semibold text-indigo-600 hover:underline">
                            Open in Studio →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="bg-slate-900 text-white border-slate-800">
            <CardContent className="p-5 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Need a Sponsorship Proposal?</span>
              </h4>
              <p className="text-xs text-slate-300">
                Generate a branded, print-ready 1-Page A4 sponsorship proposal with package pricing and benefits for companies.
              </p>
              <Link href="/tiers" className="block">
                <Button variant="primary" size="sm" className="w-full bg-indigo-500 hover:bg-indigo-600">
                  Generate 1-Page Proposal (PDF)
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
