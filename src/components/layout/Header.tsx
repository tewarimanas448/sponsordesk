'use client';

import React, { useState } from 'react';
import { Menu, Plus, Sparkles, Building2, User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useWorkspace } from '@/context/WorkspaceContext';
import { formatINR } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { PipelineStage } from '@/types';
import Link from 'next/link';

interface HeaderProps {
  onOpenMobileNav: () => void;
}

export function Header({ onOpenMobileNav }: HeaderProps) {
  const { workspace, metrics, addProspect, tiers, isDemoMode, currentUser, signOut } = useWorkspace();
  const { toast } = useToast();
  const [isAddProspectOpen, setIsAddProspectOpen] = useState(false);

  // Add prospect form state
  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    contact_name: '',
    contact_designation: '',
    email: '',
    phone: '',
    website_url: '',
    fit_rationale: '',
    stage: 'lead' as PipelineStage,
    tier_id: '',
    expected_value: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name.trim()) {
      toast.error('Company name is required', 'Validation Error');
      return;
    }

    setIsSubmitting(true);
    try {
      await addProspect({
        company_name: formData.company_name.trim(),
        industry: formData.industry.trim() || 'General',
        contact_name: formData.contact_name.trim(),
        contact_designation: formData.contact_designation.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        website_url: formData.website_url.trim(),
        fit_rationale: formData.fit_rationale.trim(),
        stage: formData.stage,
        tier_id: formData.tier_id || undefined,
        expected_value: Number(formData.expected_value) || 0,
        lead_source: 'Manual Entry',
      });

      if (isDemoMode) {
        toast.info(
          `Saved ${formData.company_name} to Demo Sandbox — not synced to Supabase. Sign in to persist to database.`,
          'Demo Sandbox (Local Only)'
        );
      } else {
        toast.success(`Saved ${formData.company_name} to Supabase database!`, 'Database Record Created');
      }
      setIsAddProspectOpen(false);
      setFormData({
        company_name: '',
        industry: '',
        contact_name: '',
        contact_designation: '',
        email: '',
        phone: '',
        website_url: '',
        fit_rationale: '',
        stage: 'lead',
        tier_id: '',
        expected_value: '',
      });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save prospect to database', 'Database Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Left: Mobile hamburger & breadcrumb / fest title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileNav}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{workspace.event_name}</span>
            </h1>
            <p className="hidden sm:block text-xs text-slate-500">{workspace.institution_name}</p>
          </div>
        </div>

        {/* Right: Quick Metrics & CTAs */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-4 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500">Pipeline: </span>
              <span className="font-semibold text-slate-800">{formatINR(metrics.potentialValue, true)}</span>
            </div>
            <div className="w-px h-3.5 bg-slate-200" />
            <div>
              <span className="text-slate-500">Closed: </span>
              <span className="font-semibold text-emerald-700">{formatINR(metrics.closedValue, true)}</span>
            </div>
          </div>

          <Link href="/pitch-studio">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Pitch Studio</span>
            </Button>
          </Link>

          <Button size="sm" onClick={() => setIsAddProspectOpen(true)}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Sponsor</span>
            <span className="sm:hidden">Add</span>
          </Button>

          {/* User Profile avatar & mode badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            {!isDemoMode && currentUser ? (
              <div className="flex items-center gap-2">
                <div
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800"
                  title="Connected to live Supabase database"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Supabase Mode</span>
                  <span className="hidden xl:inline text-emerald-600 font-normal">
                    ({currentUser.email})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                  title="Sign out of Supabase and switch to Demo Sandbox"
                >
                  Sign Out
                </button>
                <div
                  className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-xs font-bold text-emerald-800"
                  title={currentUser.email || 'Authenticated User'}
                >
                  {(currentUser.email || 'U')[0].toUpperCase()}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-medium text-amber-800"
                  title="Offline Demo Sandbox with local storage"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Demo Sandbox</span>
                </div>
                <Link
                  href="/login"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                >
                  Sign In
                </Link>
                <div
                  className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500"
                  title="Demo Sandbox User (Offline)"
                >
                  DS
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Add Prospect Modal */}
      <Modal
        isOpen={isAddProspectOpen}
        onClose={() => setIsAddProspectOpen(false)}
        title="Add Sponsor Prospect"
        description="Add a new brand to your festival sponsorship pipeline."
        maxWidth="lg"
      >
        <form onSubmit={handleAddProspect} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Company Name *"
              placeholder="e.g. RedBull, Zerodha, Boat"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              required
            />
            <Input
              label="Industry / Category"
              placeholder="e.g. Fintech, Beverage, Edtech"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Person Name"
              placeholder="e.g. Vikram Sethi"
              value={formData.contact_name}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
            />
            <Input
              label="Designation / Role"
              placeholder="e.g. Head of Campus Marketing"
              value={formData.contact_designation}
              onChange={(e) => setFormData({ ...formData, contact_designation: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="partner@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Phone Number"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Pipeline Stage"
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value as PipelineStage })}
              options={[
                { value: 'lead', label: '1. Lead' },
                { value: 'contacted', label: '2. Contacted' },
                { value: 'replied', label: '3. Replied' },
                { value: 'meeting', label: '4. Meeting Scheduled' },
                { value: 'negotiation', label: '5. Negotiation' },
                { value: 'won', label: '6. Closed Won' },
                { value: 'lost', label: '7. Closed Lost' },
              ]}
            />

            <Select
              label="Target Tier"
              value={formData.tier_id}
              onChange={(e) => {
                const selectedTier = tiers.find((t) => t.id === e.target.value);
                setFormData({
                  ...formData,
                  tier_id: e.target.value,
                  expected_value: selectedTier ? String(selectedTier.price) : formData.expected_value,
                });
              }}
            >
              <option value="">Select Tier (Optional)</option>
              {tiers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({formatINR(t.price, true)})
                </option>
              ))}
            </Select>

            <Input
              label="Expected Deal Value (₹)"
              type="number"
              placeholder="500000"
              value={formData.expected_value}
              onChange={(e) => setFormData({ ...formData, expected_value: e.target.value })}
            />
          </div>

          <Textarea
            label="Why this brand is a good fit"
            placeholder="e.g. Sponsoring EDM night, sampling 5,000 cans, student ambassador drive..."
            rows={2}
            value={formData.fit_rationale}
            onChange={(e) => setFormData({ ...formData, fit_rationale: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddProspectOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
              Save Prospect
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
