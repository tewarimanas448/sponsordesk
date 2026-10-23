'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Percent,
  DollarSign,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { formatINR } from '@/lib/utils';
import { calculateFunnelMetrics } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function AnalyticsPage() {
  const { workspace, prospects, followUps, tiers, metrics } = useWorkspace();
  const funnelData = calculateFunnelMetrics(prospects);

  // Stage breakdown
  const stageCounts = [
    { name: 'Lead', count: prospects.filter((p) => p.stage === 'lead').length, color: 'bg-slate-400' },
    { name: 'Contacted', count: prospects.filter((p) => p.stage === 'contacted').length, color: 'bg-blue-500' },
    { name: 'Replied', count: prospects.filter((p) => p.stage === 'replied').length, color: 'bg-purple-500' },
    { name: 'Meeting', count: prospects.filter((p) => p.stage === 'meeting').length, color: 'bg-amber-500' },
    { name: 'Negotiation', count: prospects.filter((p) => p.stage === 'negotiation').length, color: 'bg-indigo-500' },
    { name: 'Won', count: prospects.filter((p) => p.stage === 'won').length, color: 'bg-emerald-500' },
    { name: 'Lost', count: prospects.filter((p) => p.stage === 'lost').length, color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
          <span>Sponsorship Performance Analytics</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Real-time metrics, honest conversion rates, and pipeline health calculated from database records.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-emerald-200/60 bg-linear-to-br from-emerald-50/30 to-white">
          <CardContent className="p-4 sm:p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Total Closed Value
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {formatINR(metrics.closedValue)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.dealsWonCount} closed deals won
            </p>
          </CardContent>
        </Card>

        <Card className="border-indigo-200/60 bg-linear-to-br from-indigo-50/30 to-white">
          <CardContent className="p-4 sm:p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
              Pipeline Potential
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {formatINR(metrics.potentialValue)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.totalActiveProspects} open prospects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Conversion Win Rate
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {metrics.winRate}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Won / (Won + Lost deals)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Outreach Reply Rate
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {metrics.replyRate}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.repliesCount} replies from {metrics.contactedCount} contacted
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Dropoff Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Stage Conversion Funnel</CardTitle>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Conversion from prior stage</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {funnelData.map((step, idx) => {
              const max = Math.max(...funnelData.map((s) => s.count), 1);
              const barWidth = Math.round((step.count / max) * 100);

              return (
                <div key={step.stage} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      {idx + 1}. {step.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{step.count} sponsors</span>
                      {idx > 0 && (
                        <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                          {step.conversionFromPrevious}% conv.
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(barWidth, 3)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Pipeline Distribution Bar Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Pipeline Stage Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {stageCounts.map((s) => {
              const total = Math.max(prospects.length, 1);
              const pct = Math.round((s.count / total) * 100);

              return (
                <div key={s.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{s.name}</span>
                    <span className="text-slate-500">
                      {s.count} sponsors ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${s.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Operational Efficiency Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Follow-Up & Operational Discipline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-xs text-slate-500 uppercase font-semibold">
                Tasks Completion Rate
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {metrics.followUpCompletionRate}%
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {metrics.completedFollowUps} of {metrics.totalFollowUps} reminders completed
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-xs text-slate-500 uppercase font-semibold">
                Average Closed Deal
              </span>
              <p className="text-2xl font-black text-emerald-700 mt-1">
                {formatINR(metrics.averageWonDealValue)}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Across {metrics.dealsWonCount} closed sponsor contracts
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-xs text-slate-500 uppercase font-semibold">
                Overdue Task Ratio
              </span>
              <p className={`text-2xl font-black mt-1 ${metrics.overdueFollowUps > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {metrics.overdueFollowUps}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {metrics.overdueFollowUps > 0 ? 'Require immediate team outreach' : 'Zero overdue reminders!'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
