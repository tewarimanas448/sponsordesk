'use client';

import React, { useState } from 'react';
import { Settings, Users, Save, RotateCcw, Building2, Calendar, ShieldCheck, Mail, Globe } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';

export default function SettingsPage() {
  const { workspace, updateWorkspaceDetails, resetToDemo, isDemoMode } = useWorkspace();
  const { toast } = useToast();

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: workspace.name,
    event_name: workspace.event_name,
    institution_name: workspace.institution_name,
    event_description: workspace.event_description || '',
    event_start_date: workspace.event_start_date || '',
    event_end_date: workspace.event_end_date || '',
    expected_attendance: String(workspace.expected_attendance || 25000),
    audience_description: workspace.audience_description || '',
    contact_email: workspace.contact_email,
    website_url: workspace.website_url || '',
    currency: workspace.currency || 'INR',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateWorkspaceDetails({
      name: form.name.trim(),
      event_name: form.event_name.trim(),
      institution_name: form.institution_name.trim(),
      event_description: form.event_description.trim(),
      event_start_date: form.event_start_date || undefined,
      event_end_date: form.event_end_date || undefined,
      expected_attendance: Number(form.expected_attendance) || 25000,
      audience_description: form.audience_description.trim(),
      contact_email: form.contact_email.trim(),
      website_url: form.website_url.trim(),
      currency: form.currency,
    });
    toast.success('Workspace details updated successfully!', 'Settings Saved');
  };

  const handleConfirmReset = () => {
    resetToDemo();
    toast.success('Reset workspace to initial LNMIIT Vivacity 2026 demo data!', 'Demo Reset');
    setIsResetModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          <span>Festival & Workspace Settings</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure festival metadata, attendee counts, and audience demographics used in AI pitch generation.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Festival Basics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Festival Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Festival / Event Name *"
                required
                value={form.event_name}
                onChange={(e) => setForm({ ...form, event_name: e.target.value })}
              />
              <Input
                label="College / Institution *"
                required
                value={form.institution_name}
                onChange={(e) => setForm({ ...form, institution_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Event Start Date"
                type="date"
                value={form.event_start_date}
                onChange={(e) => setForm({ ...form, event_start_date: e.target.value })}
              />
              <Input
                label="Event End Date"
                type="date"
                value={form.event_end_date}
                onChange={(e) => setForm({ ...form, event_end_date: e.target.value })}
              />
              <Input
                label="Expected Footfall"
                type="number"
                value={form.expected_attendance}
                onChange={(e) => setForm({ ...form, expected_attendance: e.target.value })}
              />
            </div>

            <Textarea
              label="Festival Overview & Core Highlights"
              rows={3}
              value={form.event_description}
              onChange={(e) => setForm({ ...form, event_description: e.target.value })}
              helperText="Brief summary included in sponsorship pitch introductions."
            />

            <Textarea
              label="Audience Demographics & Consumer Profile"
              rows={2}
              value={form.audience_description}
              onChange={(e) => setForm({ ...form, audience_description: e.target.value })}
              helperText="e.g. Undergraduate tech/management students aged 18-24, high consumer spending on tech & food."
            />
          </CardContent>
        </Card>

        {/* Contact & Committee Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Sponsorship Committee Contacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Official Sponsorship Email *"
                type="email"
                required
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              />
              <Input
                label="Fest Website / Social URL"
                value={form.website_url}
                onChange={(e) => setForm({ ...form, website_url: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Default Currency"
                disabled
                value={form.currency}
                helperText="Fixed to INR (₹) for Indian collegiate festivals."
              />
              <Input
                label="Workspace Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between pt-2">
          <Button type="submit" size="md" className="bg-indigo-600 hover:bg-indigo-700">
            <Save className="w-4 h-4 mr-1.5" />
            <span>Save Settings</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => setIsResetModalOpen(true)}
            className="text-slate-600"
          >
            <RotateCcw className="w-4 h-4 mr-1.5 text-slate-500" />
            <span>Reset Demo Workspace Data</span>
          </Button>
        </div>
      </form>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Demo Data"
        description="This will restore all 14 sample sponsor prospects, pipeline stages, and follow-ups to the initial Vivacity 2026 festival seed."
        maxWidth="sm"
      >
        <div className="flex items-center justify-end gap-2 pt-3">
          <Button variant="outline" size="sm" onClick={() => setIsResetModalOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" variant="danger" onClick={handleConfirmReset}>
            Confirm Reset
          </Button>
        </div>
      </Modal>
    </div>
  );
}
