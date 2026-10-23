'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarCheck2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  Calendar,
  Building2,
  Trash2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { FollowUp, FollowUpStatus, PriorityLevel } from '@/types';
import { formatDate, getComputedFollowUpStatus } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function FollowUpsPage() {
  const {
    followUps,
    prospects,
    addFollowUp,
    completeFollowUp,
    rescheduleFollowUp,
    deleteFollowUp,
    metrics,
  } = useWorkspace();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'all' | 'due_today' | 'overdue' | 'upcoming' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<FollowUp | null>(null);
  const [newDueDate, setNewDueDate] = useState('');

  // Add form state
  const [formData, setFormData] = useState({
    prospect_id: prospects.length > 0 ? prospects[0].id : '',
    title: '',
    description: '',
    due_at: '',
    priority: 'medium' as PriorityLevel,
  });

  // Filtered follow-ups
  const filteredFollowUps = useMemo(() => {
    return followUps.filter((f) => {
      const computed = getComputedFollowUpStatus(f.due_at, f.status, f.completed_at);

      if (activeTab === 'due_today' && computed !== 'due_today') return false;
      if (activeTab === 'overdue' && computed !== 'overdue') return false;
      if (activeTab === 'upcoming' && computed !== 'upcoming') return false;
      if (activeTab === 'completed' && computed !== 'completed') return false;

      if (priorityFilter !== 'all' && f.priority !== priorityFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const p = prospects.find((prosp) => prosp.id === f.prospect_id);
        const matchTitle = f.title.toLowerCase().includes(q);
        const matchCompany = p?.company_name.toLowerCase().includes(q) || false;
        if (!matchTitle && !matchCompany) return false;
      }

      return true;
    });
  }, [followUps, activeTab, priorityFilter, search, prospects]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.due_at || !formData.prospect_id) {
      toast.error('Please fill in all required fields', 'Validation Error');
      return;
    }

    addFollowUp({
      prospect_id: formData.prospect_id,
      title: formData.title.trim(),
      description: formData.description.trim(),
      due_at: new Date(formData.due_at).toISOString(),
      priority: formData.priority,
      status: 'upcoming',
    });

    toast.success('Follow-up scheduled successfully');
    setIsAddOpen(false);
    setFormData({
      prospect_id: prospects.length > 0 ? prospects[0].id : '',
      title: '',
      description: '',
      due_at: '',
      priority: 'medium',
    });
  };

  const handleReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget || !newDueDate) return;

    rescheduleFollowUp(rescheduleTarget.id, new Date(newDueDate).toISOString());
    toast.success(`Rescheduled "${rescheduleTarget.title}" to ${newDueDate}`);
    setRescheduleTarget(null);
    setNewDueDate('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <CalendarCheck2 className="w-6 h-6 text-indigo-600" />
              <span>Follow-up Management</span>
            </h2>
            {metrics.overdueFollowUps > 0 && (
              <Badge variant="rose">{metrics.overdueFollowUps} Overdue</Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Never let a warm sponsor lead go cold. 80% of deals close on the 3rd or 4th touchpoint.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Schedule Follow-up</span>
        </Button>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-1">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'all', label: 'All Tasks', count: followUps.length },
            { id: 'due_today', label: 'Due Today', count: metrics.followUpsDueToday, badge: 'amber' },
            { id: 'overdue', label: 'Overdue', count: metrics.overdueFollowUps, badge: 'rose' },
            {
              id: 'upcoming',
              label: 'Upcoming',
              count: followUps.filter(
                (f) => getComputedFollowUpStatus(f.due_at, f.status, f.completed_at) === 'upcoming'
              ).length,
            },
            { id: 'completed', label: 'Completed', count: metrics.completedFollowUps },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-slate-200'
                    : tab.badge === 'rose' && tab.count > 0
                    ? 'bg-rose-100 text-rose-700 font-bold'
                    : tab.badge === 'amber' && tab.count > 0
                    ? 'bg-amber-100 text-amber-800 font-bold'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter & Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-2 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36 sm:w-44"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs text-slate-700 bg-white border border-slate-300 rounded-lg px-2 py-1"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Follow-up Cards List */}
      <div className="space-y-3">
        {filteredFollowUps.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No follow-ups match this filter.</p>
              <p className="text-xs text-slate-400">Everything is caught up!</p>
            </CardContent>
          </Card>
        ) : (
          filteredFollowUps.map((fu) => {
            const computed = getComputedFollowUpStatus(fu.due_at, fu.status, fu.completed_at);
            const prospect = prospects.find((p) => p.id === fu.prospect_id);

            return (
              <Card
                key={fu.id}
                className={`transition-all hover:border-slate-300 ${
                  computed === 'overdue'
                    ? 'border-l-4 border-l-rose-500 bg-rose-50/20'
                    : computed === 'due_today'
                    ? 'border-l-4 border-l-amber-500 bg-amber-50/20'
                    : computed === 'completed'
                    ? 'opacity-60 bg-slate-50'
                    : 'border-l-4 border-l-indigo-400'
                }`}
              >
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Task Info & Prospect Link */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-bold ${
                          computed === 'completed'
                            ? 'line-through text-slate-500'
                            : 'text-slate-900'
                        }`}
                      >
                        {fu.title}
                      </span>

                      <Badge
                        variant={
                          computed === 'overdue'
                            ? 'rose'
                            : computed === 'due_today'
                            ? 'amber'
                            : computed === 'completed'
                            ? 'slate'
                            : 'indigo'
                        }
                      >
                        {computed === 'overdue'
                          ? 'Overdue'
                          : computed === 'due_today'
                          ? 'Due Today'
                          : computed === 'completed'
                          ? 'Completed'
                          : 'Upcoming'}
                      </Badge>

                      <Badge
                        variant={
                          fu.priority === 'high'
                            ? 'rose'
                            : fu.priority === 'medium'
                            ? 'amber'
                            : 'slate'
                        }
                      >
                        {fu.priority.toUpperCase()}
                      </Badge>
                    </div>

                    {fu.description && (
                      <p className="text-xs text-slate-600 line-clamp-1">{fu.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
                      {prospect && (
                        <Link
                          href={`/prospects/${prospect.id}`}
                          className="font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{prospect.company_name}</span>
                        </Link>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Due: {formatDate(fu.due_at)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {computed !== 'completed' && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => {
                            completeFollowUp(fu.id);
                            toast.success(`Completed "${fu.title}"!`);
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          <span>Mark Done</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRescheduleTarget(fu);
                            setNewDueDate(fu.due_at.split('T')[0]);
                          }}
                        >
                          Reschedule
                        </Button>
                      </>
                    )}

                    <button
                      onClick={() => {
                        deleteFollowUp(fu.id);
                        toast.info('Deleted follow-up');
                      }}
                      className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                      title="Delete reminder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Schedule Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Schedule Follow-up Reminder"
        description="Set a task reminder linked to a sponsor."
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-3.5">
          <Select
            label="Associated Sponsor Prospect *"
            value={formData.prospect_id}
            onChange={(e) => setFormData({ ...formData, prospect_id: e.target.value })}
            required
          >
            {prospects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.company_name} ({p.stage})
              </option>
            ))}
          </Select>

          <Input
            label="Follow-up Title *"
            required
            placeholder="e.g. Call to finalize pronite sponsorship MoU"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Due Date *"
              type="date"
              required
              value={formData.due_at}
              onChange={(e) => setFormData({ ...formData, due_at: e.target.value })}
            />
            <Select
              label="Priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              options={[
                { value: 'high', label: 'High Priority' },
                { value: 'medium', label: 'Medium Priority' },
                { value: 'low', label: 'Low Priority' },
              ]}
            />
          </div>

          <Textarea
            label="Notes / Deliverables Checklist"
            placeholder="Check stall specifications, send audience demographics report..."
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Schedule Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        title="Reschedule Follow-up"
        description={`Pick a new due date for "${rescheduleTarget?.title}"`}
        maxWidth="sm"
      >
        <form onSubmit={handleReschedule} className="space-y-3.5">
          <Input
            label="New Due Date *"
            type="date"
            required
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setRescheduleTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save New Date
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
