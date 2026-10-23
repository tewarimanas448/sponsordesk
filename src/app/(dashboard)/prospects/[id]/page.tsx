'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Calendar,
  Phone,
  Mail,
  Globe,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowLeft,
  CalendarPlus,
  Send,
  MessageSquare,
  Award,
  ChevronRight,
  Copy,
  Plus,
  ExternalLink,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { STAGE_CONFIG, PipelineStage } from '@/types';
import { formatINR, formatDate, formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function ProspectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { toast } = useToast();

  const {
    prospects,
    tiers,
    followUps,
    pitches,
    activityLogs,
    updateProspect,
    updateProspectStage,
    addFollowUp,
    completeFollowUp,
    deleteProspect,
  } = useWorkspace();

  const prospect = prospects.find((p) => p.id === id);

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isLogInteractionOpen, setIsLogInteractionOpen] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    company_name: prospect?.company_name || '',
    industry: prospect?.industry || '',
    website_url: prospect?.website_url || '',
    contact_name: prospect?.contact_name || '',
    contact_designation: prospect?.contact_designation || '',
    email: prospect?.email || '',
    phone: prospect?.phone || '',
    notes: prospect?.notes || '',
    fit_rationale: prospect?.fit_rationale || '',
    tier_id: prospect?.tier_id || '',
    expected_value: prospect?.expected_value ? String(prospect.expected_value) : '',
    agreed_value: prospect?.agreed_value ? String(prospect.agreed_value) : '',
  });

  // Follow-up form state
  const [followUpTitle, setFollowUpTitle] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpPriority, setFollowUpPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [followUpDesc, setFollowUpDesc] = useState('');

  // Log interaction note
  const [interactionNote, setInteractionNote] = useState('');

  if (!prospect) {
    return (
      <div className="text-center py-20 space-y-4">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Sponsor Prospect Not Found</h2>
        <p className="text-sm text-slate-500">
          This prospect may have been deleted or the link is invalid.
        </p>
        <Link href="/prospects">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Sponsor Directory
          </Button>
        </Link>
      </div>
    );
  }

  const assignedTier = tiers.find((t) => t.id === prospect.tier_id);
  const relatedFollowUps = followUps.filter((f) => f.prospect_id === prospect.id);
  const relatedPitches = pitches.filter((p) => p.prospect_id === prospect.id);
  const relatedLogs = activityLogs.filter((a) => a.prospect_id === prospect.id);

  const handleUpdateDetails = (e: React.FormEvent) => {
    e.preventDefault();
    updateProspect(prospect.id, {
      company_name: editForm.company_name.trim(),
      industry: editForm.industry.trim(),
      website_url: editForm.website_url.trim(),
      contact_name: editForm.contact_name.trim(),
      contact_designation: editForm.contact_designation.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone.trim(),
      notes: editForm.notes.trim(),
      fit_rationale: editForm.fit_rationale.trim(),
      tier_id: editForm.tier_id || undefined,
      expected_value: Number(editForm.expected_value) || 0,
      agreed_value: editForm.agreed_value ? Number(editForm.agreed_value) : undefined,
    });
    toast.success('Updated sponsor details', 'Saved');
    setIsEditOpen(false);
  };

  const handleCreateFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpTitle.trim() || !followUpDate) {
      toast.error('Title and Due Date are required', 'Validation Error');
      return;
    }

    addFollowUp({
      prospect_id: prospect.id,
      title: followUpTitle.trim(),
      description: followUpDesc.trim(),
      due_at: new Date(followUpDate).toISOString(),
      priority: followUpPriority,
      status: 'upcoming',
    });

    toast.success('Scheduled follow-up reminder', 'Task Created');
    setIsFollowUpModalOpen(false);
    setFollowUpTitle('');
    setFollowUpDate('');
    setFollowUpDesc('');
  };

  const handleCopyPitch = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Pitch text copied to clipboard!', 'Copied');
  };

  const handleLogInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactionNote.trim()) return;

    updateProspectStage(prospect.id, prospect.stage, interactionNote.trim());
    toast.success('Logged interaction note to timeline');
    setInteractionNote('');
    setIsLogInteractionOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Back link & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/pipeline">
            <button
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Back to Pipeline"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {prospect.company_name}
              </h2>
              <Badge variant={prospect.stage === 'won' ? 'emerald' : prospect.stage === 'lost' ? 'rose' : 'indigo'}>
                {STAGE_CONFIG[prospect.stage].label}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{prospect.industry || 'Category not set'}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/pitch-studio?prospectId=${prospect.id}`}>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              <Sparkles className="w-4 h-4 mr-1.5" />
              <span>Draft Pitch</span>
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => setIsFollowUpModalOpen(true)}>
            <CalendarPlus className="w-4 h-4 mr-1.5 text-slate-600" />
            <span>Schedule Follow-up</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
            Edit Details
          </Button>
        </div>
      </div>

      {/* Quick Stage Progression Bar */}
      <Card className="bg-slate-50/70 border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Current Stage:
              </span>
              <select
                value={prospect.stage}
                onChange={(e) => {
                  updateProspectStage(prospect.id, e.target.value as PipelineStage);
                  toast.success(`Stage updated to ${STAGE_CONFIG[e.target.value as PipelineStage].label}`);
                }}
                className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Object.entries(STAGE_CONFIG).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.step}. {val.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              {prospect.stage !== 'won' && (
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => {
                    updateProspectStage(prospect.id, 'won', 'Deal finalized and won');
                    toast.success('Congratulations! Deal marked as Closed Won 🎉');
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  <span>Mark Deal Won</span>
                </Button>
              )}

              {prospect.stage !== 'lost' && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    updateProspectStage(prospect.id, 'lost', 'Marked closed lost');
                    toast.info('Deal marked as Closed Lost');
                  }}
                >
                  Mark Lost
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsLogInteractionOpen(true)}
              >
                Log Interaction
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Company Profile, Fit, & Pitches */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Deal Numbers & Strategic Fit */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Sponsorship Fit & Package</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Target Tier
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {assignedTier ? assignedTier.name : 'Custom Package'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Expected Investment
                  </span>
                  <p className="text-sm font-bold text-indigo-700 mt-1">
                    {formatINR(prospect.expected_value)}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Agreed Final Value
                  </span>
                  <p className="text-sm font-bold text-emerald-700 mt-1">
                    {prospect.agreed_value ? formatINR(prospect.agreed_value) : 'In Discussion'}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Why this company is a strategic fit:
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                  {prospect.fit_rationale || 'No fit rationale documented yet.'}
                </p>
              </div>

              {prospect.notes && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Internal Organizer Notes:
                  </h4>
                  <p className="text-xs text-slate-600 whitespace-pre-line p-3 rounded-lg bg-amber-50/30 border border-amber-100">
                    {prospect.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pitches Created for this Prospect */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Generated AI Pitches ({relatedPitches.length})</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Customized pitches tailored to this brand</p>
              </div>
              <Link href={`/pitch-studio?prospectId=${prospect.id}`}>
                <Button size="sm" variant="outline">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                  <span>Draft New Pitch</span>
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {relatedPitches.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="w-8 h-8 text-indigo-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600">No pitches drafted for {prospect.company_name} yet.</p>
                  <Link href={`/pitch-studio?prospectId=${prospect.id}`}>
                    <Button size="sm" className="mt-3 bg-indigo-600">
                      Generate Tailored Pitch
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {relatedPitches.map((pitch) => (
                    <div key={pitch.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="indigo">{pitch.channel.toUpperCase()}</Badge>
                          <Badge variant="slate">Tone: {pitch.tone}</Badge>
                          <span className="text-[11px] text-slate-400">{formatDate(pitch.created_at)}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyPitch(pitch.body)}
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          <span>Copy</span>
                        </Button>
                      </div>

                      {pitch.subject && (
                        <p className="text-xs font-bold text-slate-900">
                          Subject: {pitch.subject}
                        </p>
                      )}

                      <div className="text-xs text-slate-700 whitespace-pre-line bg-white p-3 rounded-lg border border-slate-200 font-sans leading-relaxed">
                        {pitch.body}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Activity Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              {relatedLogs.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No activity logged for this sponsor.</p>
              ) : (
                <div className="space-y-3.5">
                  {relatedLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 text-xs">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-slate-800 font-medium">{log.description}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                          <span>{log.actor_name || 'Fest Team'}</span>
                          <span>•</span>
                          <span>{formatDateTime(log.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Contact Card & Follow-ups */}
        <div className="space-y-6">
          {/* Contact Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                  Contact Person
                </span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {prospect.contact_name || 'Not specified'}
                </p>
                {prospect.contact_designation && (
                  <p className="text-slate-500">{prospect.contact_designation}</p>
                )}
              </div>

              {prospect.email && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href={`mailto:${prospect.email}`} className="text-indigo-600 hover:underline">
                    {prospect.email}
                  </a>
                </div>
              )}

              {prospect.phone && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href={`tel:${prospect.phone}`} className="hover:underline">
                    {prospect.phone}
                  </a>
                </div>
              )}

              {prospect.website_url && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  <a
                    href={prospect.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <span>Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                <span>Created: {formatDate(prospect.created_at)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Follow-ups for this Prospect */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>Follow-up Reminders</CardTitle>
              <button
                onClick={() => setIsFollowUpModalOpen(true)}
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </CardHeader>
            <CardContent>
              {relatedFollowUps.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <Clock className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                  <p>No reminders scheduled.</p>
                  <button
                    onClick={() => setIsFollowUpModalOpen(true)}
                    className="text-indigo-600 font-semibold text-[11px] hover:underline mt-1 block mx-auto"
                  >
                    + Schedule first follow-up
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {relatedFollowUps.map((fu) => (
                    <div
                      key={fu.id}
                      className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                        fu.status === 'completed'
                          ? 'bg-slate-50 border-slate-200 opacity-60'
                          : fu.status === 'overdue'
                          ? 'bg-rose-50 border-rose-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className={`font-semibold ${fu.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {fu.title}
                        </span>
                        <Badge variant={fu.status === 'completed' ? 'slate' : fu.status === 'overdue' ? 'rose' : 'amber'}>
                          {fu.status}
                        </Badge>
                      </div>

                      {fu.description && <p className="text-[11px] text-slate-500">{fu.description}</p>}

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-400">Due: {formatDate(fu.due_at)}</span>
                        {fu.status !== 'completed' && (
                          <button
                            onClick={() => completeFollowUp(fu.id)}
                            className="text-emerald-700 font-semibold hover:underline"
                          >
                            Mark Done
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Details Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit ${prospect.company_name}`}
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateDetails} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Company Name *"
              required
              value={editForm.company_name}
              onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
            />
            <Input
              label="Industry / Category"
              value={editForm.industry}
              onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contact Person"
              value={editForm.contact_name}
              onChange={(e) => setEditForm({ ...editForm, contact_name: e.target.value })}
            />
            <Input
              label="Designation"
              value={editForm.contact_designation}
              onChange={(e) => setEditForm({ ...editForm, contact_designation: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Target Tier"
              value={editForm.tier_id}
              onChange={(e) => setEditForm({ ...editForm, tier_id: e.target.value })}
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
              value={editForm.expected_value}
              onChange={(e) => setEditForm({ ...editForm, expected_value: e.target.value })}
            />
            <Input
              label="Agreed Final Value (₹)"
              type="number"
              value={editForm.agreed_value}
              onChange={(e) => setEditForm({ ...editForm, agreed_value: e.target.value })}
            />
          </div>

          <Textarea
            label="Strategic Fit Rationale"
            rows={2}
            value={editForm.fit_rationale}
            onChange={(e) => setEditForm({ ...editForm, fit_rationale: e.target.value })}
          />

          <Textarea
            label="Internal Notes"
            rows={2}
            value={editForm.notes}
            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Schedule Follow-up Modal */}
      <Modal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        title="Schedule Follow-up Reminder"
        description={`Set a reminder for outreach to ${prospect.company_name}`}
        maxWidth="md"
      >
        <form onSubmit={handleCreateFollowUp} className="space-y-3.5">
          <Input
            label="Follow-up Title *"
            required
            placeholder="e.g. Call to discuss stall dimensions"
            value={followUpTitle}
            onChange={(e) => setFollowUpTitle(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Due Date *"
              type="date"
              required
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
            />
            <Select
              label="Priority"
              value={followUpPriority}
              onChange={(e) => setFollowUpPriority(e.target.value as any)}
              options={[
                { value: 'high', label: 'High Priority' },
                { value: 'medium', label: 'Medium Priority' },
                { value: 'low', label: 'Low Priority' },
              ]}
            />
          </div>

          <Textarea
            label="Notes / Checklist"
            placeholder="Details or deliverables to follow up on..."
            rows={2}
            value={followUpDesc}
            onChange={(e) => setFollowUpDesc(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsFollowUpModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Schedule Follow-up
            </Button>
          </div>
        </form>
      </Modal>

      {/* Log Interaction Modal */}
      <Modal
        isOpen={isLogInteractionOpen}
        onClose={() => setIsLogInteractionOpen(false)}
        title="Log Sponsor Interaction"
        description="Record a call, WhatsApp chat, or email outcome for the team timeline."
        maxWidth="md"
      >
        <form onSubmit={handleLogInteraction} className="space-y-3.5">
          <Textarea
            label="Interaction Note *"
            placeholder="e.g. Spoke with Vikram over phone. Agreed to sponsor ₹7L if granted sole beverage stall exclusivity."
            rows={3}
            required
            value={interactionNote}
            onChange={(e) => setInteractionNote(e.target.value)}
          />
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsLogInteractionOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Note
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
