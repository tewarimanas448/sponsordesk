'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  Plus,
  Download,
  Upload,
  Filter,
  Trash2,
  Edit2,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { STAGE_CONFIG, PipelineStage, Prospect } from '@/types';
import { formatINR, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function ProspectsPage() {
  const { prospects, tiers, addProspect, updateProspect, deleteProspect, bulkImportProspects } =
    useWorkspace();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state for creating
  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    contact_name: '',
    contact_designation: '',
    email: '',
    phone: '',
    website_url: '',
    stage: 'lead' as PipelineStage,
    tier_id: '',
    expected_value: '',
    fit_rationale: '',
  });

  // CSV Import state
  const [csvRawText, setCsvRawText] = useState('');
  const [csvParsedPreview, setCsvParsedPreview] = useState<Partial<Prospect>[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);

  // Unique industries
  const industries = useMemo(() => {
    const set = new Set<string>();
    prospects.forEach((p) => {
      if (p.industry) set.add(p.industry);
    });
    return Array.from(set);
  }, [prospects]);

  // Filtered list
  const filtered = useMemo(() => {
    return prospects.filter((p) => {
      if (p.archived_at) return false;
      if (stageFilter !== 'all' && p.stage !== stageFilter) return false;
      if (industryFilter !== 'all' && p.industry !== industryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const m1 = p.company_name.toLowerCase().includes(q);
        const m2 = p.contact_name?.toLowerCase().includes(q);
        const m3 = p.email?.toLowerCase().includes(q);
        const m4 = p.industry?.toLowerCase().includes(q);
        if (!m1 && !m2 && !m3 && !m4) return false;
      }
      return true;
    });
  }, [prospects, stageFilter, industryFilter, search]);

  const handleCreateProspect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name.trim()) {
      toast.error('Company name is required', 'Validation Error');
      return;
    }

    addProspect({
      company_name: formData.company_name.trim(),
      industry: formData.industry.trim() || 'General',
      contact_name: formData.contact_name.trim(),
      contact_designation: formData.contact_designation.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      website_url: formData.website_url.trim(),
      stage: formData.stage,
      tier_id: formData.tier_id || undefined,
      expected_value: Number(formData.expected_value) || 0,
      fit_rationale: formData.fit_rationale.trim(),
      lead_source: 'Manual Directory',
    });

    toast.success(`Added ${formData.company_name} to database`);
    setIsAddOpen(false);
    setFormData({
      company_name: '',
      industry: '',
      contact_name: '',
      contact_designation: '',
      email: '',
      phone: '',
      website_url: '',
      stage: 'lead',
      tier_id: '',
      expected_value: '',
      fit_rationale: '',
    });
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Company Name',
      'Industry',
      'Stage',
      'Contact Person',
      'Designation',
      'Email',
      'Phone',
      'Expected Value (INR)',
      'Agreed Value (INR)',
      'Fit Rationale',
    ];

    const rows = filtered.map((p) => [
      `"${p.company_name.replace(/"/g, '""')}"`,
      `"${(p.industry || '').replace(/"/g, '""')}"`,
      `"${p.stage}"`,
      `"${(p.contact_name || '').replace(/"/g, '""')}"`,
      `"${(p.contact_designation || '').replace(/"/g, '""')}"`,
      `"${(p.email || '').replace(/"/g, '""')}"`,
      `"${(p.phone || '').replace(/"/g, '""')}"`,
      p.expected_value || 0,
      p.agreed_value || 0,
      `"${(p.fit_rationale || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sponsordesk_prospects_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filtered.length} prospects to CSV`, 'Export Successful');
  };

  // Sample CSV Template Download
  const handleDownloadTemplate = () => {
    const sample = `Company Name,Industry,Stage,Contact Person,Designation,Email,Phone,Expected Value,Fit Rationale
RedBull India,Beverages,contacted,Arjun Sen,Regional Brand Lead,arjun@redbull-sample.com,+91 98111 22233,500000,Campus sampling and extreme sports event partner
Boat Lifestyle,Consumer Audio,lead,Pooja Mehta,Campus Marketing,pooja@boat-sample.com,+91 98222 33344,350000,Official audio partner for Battle of Bands`;

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + sample);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sponsordesk_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV text
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCsvRawText(text);

      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        setCsvErrors(['CSV file contains no data rows']);
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
      const parsed: Partial<Prospect>[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        if (cols.length === 0 || !cols[0]) continue;

        const row: Partial<Prospect> = {
          company_name: cols[0],
          industry: cols[1] || 'General',
          stage: (cols[2] as PipelineStage) || 'lead',
          contact_name: cols[3],
          contact_designation: cols[4],
          email: cols[5],
          phone: cols[6],
          expected_value: Number(cols[7]) || 0,
          fit_rationale: cols[8],
        };

        if (!row.company_name) {
          errors.push(`Row ${i}: Missing Company Name`);
        } else {
          parsed.push(row);
        }
      }

      setCsvParsedPreview(parsed);
      setCsvErrors(errors);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (csvParsedPreview.length === 0) {
      toast.error('No valid prospects found in CSV');
      return;
    }

    const res = bulkImportProspects(csvParsedPreview);
    toast.success(`Successfully imported ${res.added} sponsors!`, 'CSV Import Complete');
    setIsImportOpen(false);
    setCsvParsedPreview([]);
    setCsvErrors([]);
    setCsvRawText('');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            <span>Sponsor Database</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage contacts, deal amounts, fit rationales, and export/import CSV records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
            <Upload className="w-4 h-4 mr-1.5" />
            <span>Import CSV</span>
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-1.5" />
            <span>Export CSV</span>
          </Button>

          <Button size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Sponsor</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by company name, contact, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="text-xs text-slate-700 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Stages</option>
          {Object.entries(STAGE_CONFIG).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </select>

        <select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className="text-xs text-slate-700 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Industries</option>
          {industries.map((ind) => (
            <option key={ind} value={ind}>
              {ind}
            </option>
          ))}
        </select>

        <span className="text-xs text-slate-400 ml-auto">
          Showing <strong>{filtered.length}</strong> of {prospects.length} sponsors
        </span>
      </div>

      {/* Prospects Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Industry</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Package / Tier</th>
                <th className="px-4 py-3">Value (INR)</th>
                <th className="px-4 py-3">Contact Person</th>
                <th className="px-4 py-3">Last Contact</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No sponsor prospects match your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const stageInfo = STAGE_CONFIG[p.stage];
                  const tier = tiers.find((t) => t.id === p.tier_id);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/prospects/${p.id}`}
                          className="font-bold text-slate-900 hover:text-indigo-600 flex items-center gap-1.5"
                        >
                          <span>{p.company_name}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        {p.fit_rationale && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {p.fit_rationale}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{p.industry || '—'}</td>
                      <td className="px-4 py-3.5">
                        <Badge variant={p.stage === 'won' ? 'emerald' : p.stage === 'lost' ? 'rose' : 'indigo'}>
                          {stageInfo.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        {tier ? (
                          <span className="font-semibold text-slate-700">{tier.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Custom</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {p.stage === 'won' && p.agreed_value
                          ? formatINR(p.agreed_value)
                          : formatINR(p.expected_value)}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-slate-800">{p.contact_name || '—'}</p>
                        <p className="text-[11px] text-slate-500">{p.email || p.phone || ''}</p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">{formatDate(p.last_contacted_at)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/pitch-studio?prospectId=${p.id}`}>
                            <button
                              className="p-1.5 rounded-md text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Generate AI pitch"
                            >
                              <Sparkles className="w-4 h-4" />
                            </button>
                          </Link>
                          <Link href={`/prospects/${p.id}`}>
                            <button
                              className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
                              title="View profile & activity"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                          <button
                            onClick={() => setDeleteConfirmId(p.id)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete prospect"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirm Deletion"
        description="Are you sure you want to delete this sponsor prospect? This will remove all associated follow-ups and history."
        maxWidth="sm"
      >
        <div className="flex items-center justify-end gap-3 pt-3">
          <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (deleteConfirmId) {
                deleteProspect(deleteConfirmId);
                toast.success('Sponsor deleted successfully');
                setDeleteConfirmId(null);
              }
            }}
          >
            Delete Sponsor
          </Button>
        </div>
      </Modal>

      {/* Add Prospect Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Sponsor Prospect"
        description="Add a new brand to your database."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateProspect} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Company Name *"
              required
              placeholder="e.g. Acer India"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            />
            <Input
              label="Industry / Category"
              placeholder="e.g. Hardware & Laptops"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contact Person Name"
              placeholder="e.g. Rahul Sharma"
              value={formData.contact_name}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
            />
            <Input
              label="Contact Designation"
              placeholder="e.g. Marketing Director"
              value={formData.contact_designation}
              onChange={(e) => setFormData({ ...formData, contact_designation: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              placeholder="rahul@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Phone"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Pipeline Stage"
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value as PipelineStage })}
              options={Object.entries(STAGE_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))}
            />
            <Select
              label="Target Tier"
              value={formData.tier_id}
              onChange={(e) => {
                const targetTier = tiers.find((t) => t.id === e.target.value);
                setFormData({
                  ...formData,
                  tier_id: e.target.value,
                  expected_value: targetTier ? String(targetTier.price) : formData.expected_value,
                });
              }}
            >
              <option value="">Select Tier</option>
              {tiers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
            <Input
              label="Expected Value (₹)"
              type="number"
              placeholder="500000"
              value={formData.expected_value}
              onChange={(e) => setFormData({ ...formData, expected_value: e.target.value })}
            />
          </div>

          <Textarea
            label="Strategic Fit Rationale"
            placeholder="Why this company should sponsor your college festival..."
            rows={2}
            value={formData.fit_rationale}
            onChange={(e) => setFormData({ ...formData, fit_rationale: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Prospect
            </Button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Prospects from CSV"
        description="Upload a CSV file containing company leads to bulk add them to SponsorDesk."
        maxWidth="xl"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-800">Need a CSV template?</p>
              <p className="text-[11px] text-slate-500">
                Download a pre-formatted template with standard headers.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              <span>Download Template</span>
            </Button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          {/* Validation Feedback */}
          {csvErrors.length > 0 && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Validation Warnings:
              </p>
              {csvErrors.map((err, idx) => (
                <p key={idx} className="text-[11px]">
                  • {err}
                </p>
              ))}
            </div>
          )}

          {/* Preview Table */}
          {csvParsedPreview.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-800">
                Preview ({csvParsedPreview.length} prospects parsed successfully):
              </p>
              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2">Company</th>
                      <th className="p-2">Industry</th>
                      <th className="p-2">Contact</th>
                      <th className="p-2">Expected Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {csvParsedPreview.slice(0, 8).map((p, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-semibold text-slate-900">{p.company_name}</td>
                        <td className="p-2 text-slate-600">{p.industry}</td>
                        <td className="p-2 text-slate-600">{p.contact_name || '—'}</td>
                        <td className="p-2 text-slate-900">{formatINR(p.expected_value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsImportOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={csvParsedPreview.length === 0}
              onClick={handleConfirmImport}
            >
              Import {csvParsedPreview.length} Sponsors
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
