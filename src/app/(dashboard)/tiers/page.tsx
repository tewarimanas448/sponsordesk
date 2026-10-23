'use client';

import React, { useState } from 'react';
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Printer,
  Download,
  CheckCircle2,
  FileText,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { SponsorshipTier } from '@/types';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function TiersPage() {
  const { workspace, tiers, addTier, updateTier, deleteTier } = useWorkspace();
  const { toast } = useToast();

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<SponsorshipTier | null>(null);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);

  // Add / Edit form
  const [tierName, setTierName] = useState('');
  const [tierPrice, setTierPrice] = useState('');
  const [tierDesc, setTierDesc] = useState('');
  const [tierBenefits, setTierBenefits] = useState('');

  // Proposal Generator customization
  const [proposalCompany, setProposalCompany] = useState('');
  const [proposalIntro, setProposalIntro] = useState('');
  const [selectedTierIdsForProposal, setSelectedTierIdsForProposal] = useState<string[]>(() =>
    tiers.map((t) => t.id)
  );

  const handleOpenAdd = () => {
    setEditingTier(null);
    setTierName('');
    setTierPrice('');
    setTierDesc('');
    setTierBenefits('');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (tier: SponsorshipTier) => {
    setEditingTier(tier);
    setTierName(tier.name);
    setTierPrice(String(tier.price));
    setTierDesc(tier.description);
    setTierBenefits(tier.benefits.join('\n'));
    setIsAddOpen(true);
  };

  const handleSaveTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierName.trim() || !tierPrice) {
      toast.error('Tier name and Price are required', 'Validation Error');
      return;
    }

    const benefitsArray = tierBenefits
      .split('\n')
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    if (editingTier) {
      updateTier(editingTier.id, {
        name: tierName.trim(),
        price: Number(tierPrice),
        description: tierDesc.trim(),
        benefits: benefitsArray,
      });
      toast.success(`Updated tier: ${tierName}`);
    } else {
      addTier({
        name: tierName.trim(),
        price: Number(tierPrice),
        description: tierDesc.trim(),
        benefits: benefitsArray,
        is_active: true,
        sort_order: tiers.length + 1,
      });
      toast.success(`Created tier: ${tierName}`);
    }

    setIsAddOpen(false);
  };

  const handleDuplicate = (tier: SponsorshipTier) => {
    addTier({
      name: `${tier.name} (Copy)`,
      price: tier.price,
      description: tier.description,
      benefits: [...tier.benefits],
      is_active: true,
      sort_order: tiers.length + 1,
    });
    toast.success(`Duplicated tier: ${tier.name}`);
  };

  const handlePrintProposal = () => {
    window.print();
  };

  const proposalTiers = tiers.filter((t) => selectedTierIdsForProposal.includes(t.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-600" />
            <span>Sponsorship Packages & Proposal Builder</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure package tiers, customize marketing deliverables, and generate 1-Page A4 proposals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsProposalModalOpen(true)}
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <FileText className="w-4 h-4 mr-1.5 text-indigo-600" />
            <span>1-Page Proposal Preview</span>
          </Button>

          <Button size="sm" onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-1.5" />
            <span>New Package Tier</span>
          </Button>
        </div>
      </div>

      {/* Tiers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 no-print">
        {tiers.map((tier) => (
          <Card
            key={tier.id}
            className="flex flex-col justify-between hover:border-indigo-300 transition-all hover:shadow-md"
          >
            <div>
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    Tier #{tier.sort_order || 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(tier)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                      title="Duplicate package"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(tier)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                      title="Edit package"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {tiers.length > 1 && (
                      <button
                        onClick={() => {
                          deleteTier(tier.id);
                          toast.info(`Deleted ${tier.name}`);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete package"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <CardTitle className="text-base mt-1">{tier.name}</CardTitle>
                <p className="text-xl font-black text-slate-900 mt-1">
                  {formatINR(tier.price)}
                </p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{tier.description}</p>
              </CardHeader>

              <CardContent className="p-4 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Deliverables ({tier.benefits.length}):
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {tier.benefits.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-relaxed">{b}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50/50 rounded-b-xl text-center">
              <button
                onClick={() => handleOpenEdit(tier)}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Configure Deliverables →
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Add / Edit Tier Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={editingTier ? `Edit ${editingTier.name}` : 'Create Sponsorship Package'}
        description="Define package deliverables and investment amount in INR."
        maxWidth="md"
      >
        <form onSubmit={handleSaveTier} className="space-y-3.5">
          <Input
            label="Tier Name *"
            placeholder="e.g. Associate Sponsor, Gaming Partner"
            required
            value={tierName}
            onChange={(e) => setTierName(e.target.value)}
          />

          <Input
            label="Package Price (INR) *"
            type="number"
            required
            placeholder="500000"
            value={tierPrice}
            onChange={(e) => setTierPrice(e.target.value)}
          />

          <Textarea
            label="Brief Description"
            placeholder="Short 1-line summary of this sponsorship level..."
            rows={2}
            value={tierDesc}
            onChange={(e) => setTierDesc(e.target.value)}
          />

          <Textarea
            label="Deliverables & Benefits (1 per line) *"
            placeholder="Main stage naming rights&#10;15x15 ft outdoor stall&#10;5 social media reels&#10;Logo on fest merchandise"
            rows={5}
            required
            value={tierBenefits}
            onChange={(e) => setTierBenefits(e.target.value)}
            helperText="Enter each benefit on a new line."
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Package
            </Button>
          </div>
        </form>
      </Modal>

      {/* 1-Page Proposal Preview & Print Modal */}
      <Modal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        title="1-Page Sponsorship Proposal Generator"
        description="Print or save as PDF formatted cleanly for corporate marketing directors."
        maxWidth="4xl"
      >
        <div className="space-y-5">
          {/* Customization Controls */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 no-print">
            <Input
              label="Proposing to Company (Optional)"
              placeholder="e.g. RedBull India, Acer, Google"
              value={proposalCompany}
              onChange={(e) => setProposalCompany(e.target.value)}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Select Tiers to Include in Proposal
              </label>
              <div className="flex flex-wrap gap-2">
                {tiers.map((t) => {
                  const isSelected = selectedTierIdsForProposal.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          if (selectedTierIdsForProposal.length > 1) {
                            setSelectedTierIdsForProposal(
                              selectedTierIdsForProposal.filter((id) => id !== t.id)
                            );
                          }
                        } else {
                          setSelectedTierIdsForProposal([...selectedTierIdsForProposal, t.id]);
                        }
                      }}
                      className={`text-xs px-2.5 py-1 rounded-md border font-semibold transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-300'
                      }`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between no-print">
            <span className="text-xs text-slate-500">
              A4 Print Preview (Scales cleanly to a single printed sheet)
            </span>
            <Button onClick={handlePrintProposal} className="bg-indigo-600">
              <Printer className="w-4 h-4 mr-1.5" />
              <span>Print / Download PDF</span>
            </Button>
          </div>

          {/* PRINT-READY A4 DOCUMENT CONTAINER */}
          <div className="border border-slate-300 rounded-xl p-8 bg-white text-slate-900 shadow-lg font-sans max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
            {/* Header / Brand */}
            <div className="flex items-start justify-between pb-4 border-b-2 border-indigo-600">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                    <Zap className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                      {workspace.event_name}
                    </h1>
                    <p className="text-xs font-semibold text-indigo-700">
                      {workspace.institution_name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-right text-xs">
                <span className="font-bold text-slate-900 block uppercase tracking-wider text-[11px]">
                  Official Sponsorship Proposal
                </span>
                {proposalCompany && (
                  <p className="text-indigo-600 font-semibold mt-0.5">Prepared for: {proposalCompany}</p>
                )}
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Dates: {workspace.event_start_date || 'Feb 2026'} – {workspace.event_end_date || 'Feb 2026'}
                </p>
              </div>
            </div>

            {/* Event & Audience Overview */}
            <div className="grid grid-cols-3 gap-4 my-4 p-3 bg-slate-50 rounded-lg text-xs">
              <div className="col-span-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  About The Festival
                </h4>
                <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                  {workspace.event_description ||
                    'Vivacity is Northwest India premier annual cultural fest uniting over 25,000 university students for music concerts, competitive arts, and flagship technology leagues.'}
                </p>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Audience Reach
                </h4>
                <p className="text-lg font-black text-indigo-700 mt-0.5">
                  {workspace.expected_attendance.toLocaleString('en-IN')}+
                </p>
                <p className="text-[10px] text-slate-500">
                  Engineering, tech & management students aged 17–24
                </p>
              </div>
            </div>

            {/* Selected Packages Side-by-Side */}
            <div className="my-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Available Sponsorship Packages
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {proposalTiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="p-3 rounded-lg border border-slate-200 bg-white flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">{tier.name}</span>
                      </div>
                      <p className="text-sm font-black text-indigo-700 mt-1">
                        {formatINR(tier.price)}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                        {tier.description}
                      </p>

                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Key Deliverables:
                        </span>
                        <ul className="space-y-1 text-[10px] text-slate-700">
                          {tier.benefits.slice(0, 4).map((b, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-indigo-600 font-bold">•</span>
                              <span className="line-clamp-2">{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer & Contact CTA */}
            <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
              <div>
                <p className="font-bold text-slate-900">Festival Sponsorship Committee</p>
                <p>Email: {workspace.contact_email} • Web: {workspace.website_url || 'vivacity.lnmiit.ac.in'}</p>
              </div>
              <div className="text-right">
                <span className="font-semibold text-indigo-700">
                  Next Step: Confirm tier reservation & campus layout walk-through
                </span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
