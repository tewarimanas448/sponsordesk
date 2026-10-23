'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Kanban,
  Building2,
  Sparkles,
  CalendarCheck2,
  Award,
  BarChart3,
  Settings,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/context/WorkspaceContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pipeline', label: 'Pipeline Board', icon: Kanban },
  { href: '/prospects', label: 'Sponsor Database', icon: Building2 },
  { href: '/pitch-studio', label: 'AI Pitch Studio', icon: Sparkles, highlight: true },
  { href: '/follow-ups', label: 'Follow-ups', icon: CalendarCheck2, badgeKey: 'overdueFollowUps' },
  { href: '/tiers', label: 'Tiers & Proposal', icon: Award },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { workspace, metrics, isDemoMode, resetToDemo } = useWorkspace();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 border-r border-slate-800',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Logo & Event Badge */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/30">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                SponsorDesk
              </span>
              <span className="block text-[10px] uppercase font-semibold text-indigo-400 tracking-wider">
                College Fest CRM
              </span>
            </div>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Current Active Workspace Pill */}
        <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-800/80">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Fest</p>
          <p className="text-sm font-semibold text-slate-100 truncate mt-0.5">{workspace.event_name}</p>
          <p className="text-xs text-slate-400 truncate">{workspace.institution_name}</p>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            const overdueCount = item.badgeKey === 'overdueFollowUps' ? metrics.overdueFollowUps : 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200',
                      item.highlight && !isActive && 'text-indigo-400'
                    )}
                  />
                  <span>{item.label}</span>
                </div>

                {item.highlight && !isActive && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    AI
                  </span>
                )}

                {overdueCount > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {overdueCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Demo status & Reset helper */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80">
          <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {isDemoMode ? 'Demo Sandbox' : 'Live Mode'}
              </span>
              <button
                onClick={resetToDemo}
                className="text-[11px] text-slate-400 hover:text-indigo-300 underline font-medium transition-colors"
                title="Reset sample data back to Vivacity 2026 default"
              >
                Reset Demo
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Sample data for LNMIIT Vivacity festival is active.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
