'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Kanban,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  MoreVertical,
  Calendar,
  Sparkles,
  Phone,
  Mail,
  RotateCcw,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { PipelineStage, Prospect, STAGE_CONFIG } from '@/types';
import { formatINR, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';

const ALL_STAGES: PipelineStage[] = [
  'lead',
  'contacted',
  'replied',
  'meeting',
  'negotiation',
  'won',
  'lost',
];

export default function PipelinePage() {
  const { prospects, tiers, updateProspectStage, addProspect } = useWorkspace();
  const { toast } = useToast();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'value_desc' | 'value_asc' | 'recent' | 'name'>('recent');

  // Drag and drop state
  const [draggedProspectId, setDraggedProspectId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  // New Prospect quick modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newStageTarget, setNewStageTarget] = useState<PipelineStage>('lead');
  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    contact_name: '',
    email: '',
    phone: '',
    tier_id: '',
    expected_value: '',
    fit_rationale: '',
  });

  // Extract unique industries for filter
  const industries = useMemo(() => {
    const set = new Set<string>();
    prospects.forEach((p) => {
      if (p.industry) set.add(p.industry);
    });
    return Array.from(set);
  }, [prospects]);

  // Filtered and sorted prospects
  const filteredProspects = useMemo(() => {
    return prospects.filter((p) => {
      if (p.archived_at) return false;

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCompany = p.company_name.toLowerCase().includes(q);
        const matchesContact = p.contact_name?.toLowerCase().includes(q) || false;
        const matchesIndustry = p.industry?.toLowerCase().includes(q) || false;
        if (!matchesCompany && !matchesContact && !matchesIndustry) return false;
      }

      // Industry filter
      if (selectedIndustry !== 'all' && p.industry !== selectedIndustry) {
        return false;
      }

      // Tier filter
      if (selectedTier !== 'all' && p.tier_id !== selectedTier) {
        return false;
      }

      return true;
    });
  }, [prospects, searchQuery, selectedIndustry, selectedTier]);

  // Group by stage and sort
  const columns = useMemo(() => {
    const map: Record<PipelineStage, Prospect[]> = {
      lead: [],
      contacted: [],
      replied: [],
      meeting: [],
      negotiation: [],
      won: [],
      lost: [],
    };

    filteredProspects.forEach((p) => {
      if (map[p.stage]) {
        map[p.stage].push(p);
      }
    });

    // Sort each column
    ALL_STAGES.forEach((stage) => {
      map[stage].sort((a, b) => {
        if (sortBy === 'value_desc') return (b.expected_value || 0) - (a.expected_value || 0);
        if (sortBy === 'value_asc') return (a.expected_value || 0) - (b.expected_value || 0);
        if (sortBy === 'name') return a.company_name.localeCompare(b.company_name);
        // Default recent
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
    });

    return map;
  }, [filteredProspects, sortBy]);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedProspectId(id);
  };

  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault();
    setDragOverStage(null);
    const prospectId = e.dataTransfer.getData('text/plain') || draggedProspectId;

    if (!prospectId) return;
    const targetProspect = prospects.find((p) => p.id === prospectId);

    if (targetProspect && targetProspect.stage !== targetStage) {
      updateProspectStage(prospectId, targetStage);
      toast.success(
        `Moved ${targetProspect.company_name} to ${STAGE_CONFIG[targetStage].label}`,
        'Stage Updated'
      );
    }
    setDraggedProspectId(null);
  };

  const handleOpenAdd = (stage: PipelineStage = 'lead') => {
    setNewStageTarget(stage);
    setIsAddOpen(true);
  };

  const handleSaveNewProspect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name.trim()) {
      toast.error('Company name is required', 'Validation Error');
      return;
    }

    addProspect({
      company_name: formData.company_name.trim(),
      industry: formData.industry.trim() || 'General',
      contact_name: formData.contact_name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      tier_id: formData.tier_id || undefined,
      expected_value: Number(formData.expected_value) || 0,
      fit_rationale: formData.fit_rationale.trim(),
      stage: newStageTarget,
      lead_source: 'Pipeline Direct',
    });

    toast.success(`Added ${formData.company_name} to ${STAGE_CONFIG[newStageTarget].label}`);
    setIsAddOpen(false);
    setFormData({
      company_name: '',
      industry: '',
      contact_name: '',
      email: '',
      phone: '',
      tier_id: '',
      expected_value: '',
      fit_rationale: '',
    });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedIndustry('all');
    setSelectedTier('all');
    setSortBy('recent');
  };

  const isFiltered = searchQuery !== '' || selectedIndustry !== 'all' || selectedTier !== 'all';

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Kanban className="w-6 h-6 text-indigo-600" />
            <span>Sponsorship Pipeline</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Drag cards across stages or use the stage selector. All changes persist immediately.
          </p>
        </div>

        <Button onClick={() => handleOpenAdd('lead')} size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add Prospect</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search company, contact, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        {/* Industry Filter */}
        <select
          value={selectedIndustry}
          onChange={(e) => setSelectedIndustry(e.target.value)}
          className="text-xs text-slate-700 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Industries</option>
          {industries.map((ind) => (
            <option key={ind} value={ind}>
              {ind}
            </option>
          ))}
        </select>

        {/* Tier Filter */}
        <select
          value={selectedTier}
          onChange={(e) => setSelectedTier(e.target.value)}
          className="text-xs text-slate-700 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Packages / Tiers</option>
          {tiers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        {/* Sort selector */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="text-xs text-slate-700 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="recent">Sort: Recently Updated</option>
          <option value="value_desc">Sort: Highest Deal Value</option>
          <option value="value_asc">Sort: Lowest Deal Value</option>
          <option value="name">Sort: Company Name (A-Z)</option>
        </select>

        {/* Reset filter */}
        {isFiltered && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs text-slate-500">
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Horizontal Scrollable Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 select-none min-h-[650px] items-start">
        {ALL_STAGES.map((stage) => {
          const config = STAGE_CONFIG[stage];
          const stageProspects = columns[stage];
          const totalStageValue = stageProspects.reduce(
            (sum, p) => sum + (stage === 'won' ? (p.agreed_value ?? p.expected_value) : p.expected_value || 0),
            0
          );
          const isDragOver = dragOverStage === stage;

          return (
            <div
              key={stage}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage)}
              className={`w-72 shrink-0 rounded-2xl flex flex-col max-h-[80vh] transition-colors border ${
                isDragOver
                  ? 'bg-indigo-50/70 border-indigo-400 border-dashed ring-2 ring-indigo-400'
                  : 'bg-slate-100/70 border-slate-200/80'
              }`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between bg-white/70 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      stage === 'won'
                        ? 'bg-emerald-500'
                        : stage === 'lost'
                        ? 'bg-rose-500'
                        : stage === 'negotiation'
                        ? 'bg-indigo-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {config.label}
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500 px-1.5 py-0.2 rounded-full bg-slate-200">
                    {stageProspects.length}
                  </span>
                </div>

                <button
                  onClick={() => handleOpenAdd(stage)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                  title={`Add lead directly to ${config.label}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Column Value Sub-bar */}
              <div className="px-3.5 py-1.5 bg-slate-50/80 border-b border-slate-200/60 text-[11px] text-slate-500 flex justify-between">
                <span>Value:</span>
                <span className="font-semibold text-slate-800">{formatINR(totalStageValue, true)}</span>
              </div>

              {/* Cards List */}
              <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1">
                {stageProspects.length === 0 ? (
                  <div className="text-center py-8 px-2 border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-xs text-slate-400">No sponsors in this stage</p>
                    <button
                      onClick={() => handleOpenAdd(stage)}
                      className="text-[11px] font-semibold text-indigo-600 hover:underline mt-1 block mx-auto"
                    >
                      + Add Lead
                    </button>
                  </div>
                ) : (
                  stageProspects.map((p) => {
                    const assignedTier = tiers.find((t) => t.id === p.tier_id);
                    const isOverdue =
                      p.next_follow_up_at && new Date(p.next_follow_up_at).getTime() < Date.now();

                    return (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, p.id)}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-grab active:cursor-grabbing group space-y-2"
                      >
                        {/* Company & Category */}
                        <div className="flex items-start justify-between gap-1">
                          <Link
                            href={`/prospects/${p.id}`}
                            className="font-bold text-xs text-slate-900 hover:text-indigo-600 line-clamp-1 transition-colors flex items-center gap-1"
                          >
                            <span>{p.company_name}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                          </Link>
                          {assignedTier && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                              {assignedTier.name}
                            </span>
                          )}
                        </div>

                        {/* Industry */}
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {p.industry || 'Category not set'}
                        </p>

                        {/* Deal Value */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                          <span className="font-bold text-slate-900">
                            {stage === 'won' && p.agreed_value
                              ? formatINR(p.agreed_value)
                              : formatINR(p.expected_value)}
                          </span>

                          {p.contact_name && (
                            <span className="text-[11px] text-slate-500 truncate max-w-[120px]">
                              {p.contact_name}
                            </span>
                          )}
                        </div>

                        {/* Quick Stage Mover Selector (for accessibility and mobile users) */}
                        <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                          <select
                            value={p.stage}
                            onChange={(e) => {
                              updateProspectStage(p.id, e.target.value as PipelineStage);
                              toast.success(
                                `Moved ${p.company_name} to ${STAGE_CONFIG[e.target.value as PipelineStage].label}`
                              );
                            }}
                            className="text-[10px] bg-slate-50 text-slate-600 border border-slate-200 rounded px-1.5 py-0.5 hover:border-slate-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {ALL_STAGES.map((s) => (
                              <option key={s} value={s}>
                                Move to: {STAGE_CONFIG[s].label}
                              </option>
                            ))}
                          </select>

                          <Link
                            href={`/pitch-studio?prospectId=${p.id}`}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5"
                            title="Generate AI pitch for this sponsor"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Pitch</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Add Prospect Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={`Add Lead to ${STAGE_CONFIG[newStageTarget].label}`}
        description="Enter the sponsor details below."
        maxWidth="md"
      >
        <form onSubmit={handleSaveNewProspect} className="space-y-3.5">
          <Input
            label="Company Name *"
            placeholder="e.g. Swiggy, Acer, RedBull"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            required
          />
          <Input
            label="Industry / Category"
            placeholder="e.g. Fintech, Apparel, Cloud"
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contact Person"
              placeholder="e.g. Rohit Sharma"
              value={formData.contact_name}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              placeholder="rohit@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Tier Package"
              value={formData.tier_id}
              onChange={(e) => {
                const selected = tiers.find((t) => t.id === e.target.value);
                setFormData({
                  ...formData,
                  tier_id: e.target.value,
                  expected_value: selected ? String(selected.price) : formData.expected_value,
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
              label="Expected Value (₹)"
              type="number"
              placeholder="350000"
              value={formData.expected_value}
              onChange={(e) => setFormData({ ...formData, expected_value: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save to Pipeline
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
