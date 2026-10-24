'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Send,
  Copy,
  Check,
  RotateCcw,
  Building2,
  Mail,
  MessageSquare,
  Linkedin,
  Save,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Flame,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { PitchChannel, PitchTone, Prospect, SponsorshipTier } from '@/types';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function PitchStudioPage() {
  const searchParams = useSearchParams();
  const preselectedProspectId = searchParams?.get('prospectId');

  const { workspace, prospects, tiers, savePitch, markPitchSent, isDemoMode } = useWorkspace();
  const { toast } = useToast();

  // Selected prospect & tier
  const [selectedProspectId, setSelectedProspectId] = useState<string>(
    preselectedProspectId || (prospects.length > 0 ? prospects[0].id : '')
  );
  const [selectedTierId, setSelectedTierId] = useState<string>('');

  // Generation options
  const [channel, setChannel] = useState<PitchChannel>('email');
  const [tone, setTone] = useState<PitchTone>('persuasive');
  const [customCallToAction, setCustomCallToAction] = useState<string>(
    'A 15-minute introductory call this week'
  );

  // Overrides / customization
  const [customCompanyContext, setCustomCompanyContext] = useState('');

  // Generated Pitch State
  const [generatedSubject, setGeneratedSubject] = useState('');
  const [generatedBody, setGeneratedBody] = useState('');
  const [generationSource, setGenerationSource] = useState<'gemini' | 'demo' | 'manual'>('gemini');
  const [isDemoEngineUsed, setIsDemoEngineUsed] = useState(false);
  const [demoNote, setDemoNote] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentSavedPitchId, setCurrentSavedPitchId] = useState<string | null>(null);

  // Sync tier when prospect changes
  useEffect(() => {
    if (selectedProspectId) {
      const p = prospects.find((item) => item.id === selectedProspectId);
      if (p) {
        if (p.tier_id) {
          setSelectedTierId(p.tier_id);
        } else if (tiers.length > 0 && !selectedTierId) {
          setSelectedTierId(tiers[0].id);
        }
      }
    }
  }, [selectedProspectId, prospects, tiers]);

  const activeProspect = prospects.find((p) => p.id === selectedProspectId);
  const activeTier = tiers.find((t) => t.id === selectedTierId);

  const handleGenerate = async (modifier?: string) => {
    if (!activeProspect) {
      toast.error('Please select a sponsor prospect first', 'Input Required');
      return;
    }

    if (!activeProspect.company_name?.trim()) {
      toast.error('Selected prospect is missing a company name', 'Validation Error');
      return;
    }

    const eventName = workspace.event_name?.trim() || workspace.name?.trim() || 'College Festival 2026';

    setIsGenerating(true);
    setCopied(false);

    try {
      let finalTone = tone;
      let finalCta = customCallToAction;

      if (modifier === 'more_formal') finalTone = 'professional';
      if (modifier === 'more_persuasive') finalTone = 'persuasive';

      const payload = {
        companyName: activeProspect.company_name.trim(),
        industry: activeProspect.industry || undefined,
        websiteUrl: activeProspect.website_url || undefined,
        contactName: activeProspect.contact_name || undefined,
        contactDesignation: activeProspect.contact_designation || undefined,
        fitRationale: customCompanyContext?.trim() || activeProspect.fit_rationale || undefined,
        eventName,
        eventDescription: workspace.event_description || undefined,
        eventDates:
          workspace.event_start_date && workspace.event_end_date
            ? `${workspace.event_start_date} to ${workspace.event_end_date}`
            : undefined,
        expectedAttendance: workspace.expected_attendance ? Number(workspace.expected_attendance) : undefined,
        audienceDescription: workspace.audience_description || undefined,
        tierName: activeTier?.name || undefined,
        tierPrice:
          activeTier?.price !== undefined && activeTier?.price !== null
            ? Number(activeTier.price)
            : undefined,
        tierBenefits: activeTier?.benefits || [],
        channel,
        tone: finalTone,
        customCallToAction: finalCta?.trim() || undefined,
        forceDemo: isDemoMode,
      };

      const res = await fetch('/api/ai/pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate pitch');
      }

      setGeneratedSubject(data.subject || '');
      setGeneratedBody(data.body || '');
      setGenerationSource(data.source);
      setIsDemoEngineUsed(Boolean(data.isDemoEngine));
      setDemoNote(data.note || data.warning);
      setCurrentSavedPitchId(null);

      toast.success(
        data.source === 'gemini'
          ? 'Generated customized pitch with Gemini AI!'
          : 'Generated pitch via SponsorDesk Pitch Engine',
        'Pitch Ready'
      );
    } catch (err: any) {
      toast.error(err?.message || 'Error communicating with AI service', 'Generation Error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToProspect = () => {
    if (!activeProspect || !generatedBody) return;

    const saved = savePitch({
      prospect_id: activeProspect.id,
      tier_id: activeTier?.id,
      channel,
      tone,
      subject: generatedSubject || undefined,
      body: generatedBody,
      generation_source: generationSource,
      generation_inputs: {
        company_name: activeProspect.company_name,
        tier_name: activeTier?.name,
        tier_price: activeTier?.price,
      },
      status: 'saved',
    });

    setCurrentSavedPitchId(saved.id);
    toast.success(`Saved pitch to ${activeProspect.company_name}'s profile!`, 'Pitch Saved');
  };

  const handleMarkSent = () => {
    if (currentSavedPitchId) {
      markPitchSent(currentSavedPitchId);
      toast.success('Marked pitch as sent and updated pipeline stage to Contacted!', 'Pitch Sent');
    } else {
      // Auto-save and mark sent
      if (!activeProspect || !generatedBody) return;
      const saved = savePitch({
        prospect_id: activeProspect.id,
        tier_id: activeTier?.id,
        channel,
        tone,
        subject: generatedSubject || undefined,
        body: generatedBody,
        generation_source: generationSource,
        generation_inputs: {
          company_name: activeProspect.company_name,
          tier_name: activeTier?.name,
          tier_price: activeTier?.price,
        },
        status: 'sent',
      });
      markPitchSent(saved.id);
      setCurrentSavedPitchId(saved.id);
      toast.success('Marked pitch as sent and updated pipeline stage to Contacted!', 'Pitch Sent');
    }
  };

  const handleCopy = () => {
    const fullText = generatedSubject
      ? `Subject: ${generatedSubject}\n\n${generatedBody}`
      : generatedBody;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success('Copied pitch to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              <span>AI Pitch Studio</span>
            </h2>
            <Badge variant="indigo">Gemini Flash</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Craft tailored, high-converting sponsorship outreach for Email, WhatsApp, and LinkedIn.
          </p>
        </div>

        {demoNote && (
          <div className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{demoNote}</span>
          </div>
        )}
      </div>

      {/* Main Studio Grid: Controls on Left, Live Output on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Parameter Controls */}
        <div className="lg:col-span-5 space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">1. Target Sponsor & Package</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Select Prospect */}
              <Select
                label="Select Prospect *"
                value={selectedProspectId}
                onChange={(e) => setSelectedProspectId(e.target.value)}
              >
                {prospects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.company_name} ({p.industry || 'Category not set'})
                  </option>
                ))}
              </Select>

              {/* Select Tier */}
              <Select
                label="Proposed Sponsorship Package"
                value={selectedTierId}
                onChange={(e) => setSelectedTierId(e.target.value)}
              >
                <option value="">No tier (Custom inquiry)</option>
                {tiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {formatINR(t.price, true)}
                  </option>
                ))}
              </Select>

              {/* Custom context or fit override */}
              <Textarea
                label="Custom Angle / Pitch Fit (Optional)"
                placeholder="e.g. Sponsoring EDM Night, exclusive product booth, campus sampling..."
                rows={2}
                value={customCompanyContext}
                onChange={(e) => setCustomCompanyContext(e.target.value)}
                helperText="Supplements company details into the AI prompt."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">2. Format & Communication Tone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Channel Selector Pills */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Communication Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setChannel('email')}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition-all ${
                      channel === 'email'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannel('whatsapp')}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition-all ${
                      channel === 'whatsapp'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannel('linkedin')}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition-all ${
                      channel === 'linkedin'
                        ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    <span>LinkedIn</span>
                  </button>
                </div>
              </div>

              {/* Tone Selector */}
              <Select
                label="Voice & Tone"
                value={tone}
                onChange={(e) => setTone(e.target.value as PitchTone)}
                options={[
                  { value: 'persuasive', label: 'Persuasive & Value-Driven (Recommended)' },
                  { value: 'professional', label: 'Formal & Corporate' },
                  { value: 'friendly', label: 'Conversational & Warm' },
                  { value: 'concise', label: 'Direct & Concise (Short)' },
                ]}
              />

              {/* Call to action */}
              <Input
                label="Desired Next Step / CTA"
                placeholder="e.g. A 15-minute call this Thursday"
                value={customCallToAction}
                onChange={(e) => setCustomCallToAction(e.target.value)}
              />

              <Button
                type="button"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                loading={isGenerating}
                onClick={() => handleGenerate()}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                <span>{generatedBody ? 'Regenerate Pitch' : 'Generate AI Pitch'}</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (7 cols): Live Editor & Actions */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="flex flex-col h-full min-h-[550px]">
            <CardHeader className="flex flex-row items-center justify-between pb-3 bg-slate-50/60 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">Pitch Draft</CardTitle>
                {isDemoEngineUsed ? (
                  <Badge variant="amber">Demo Engine</Badge>
                ) : (
                  <Badge variant="emerald">Gemini AI</Badge>
                )}
                {channel && (
                  <Badge variant="slate">{channel.toUpperCase()}</Badge>
                )}
              </div>

              {/* Quick refinement controls */}
              {generatedBody && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleGenerate('more_formal')}
                    disabled={isGenerating}
                    className="text-[11px] font-medium text-slate-600 hover:text-indigo-600 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                  >
                    More Formal
                  </button>
                  <button
                    onClick={() => handleGenerate('more_persuasive')}
                    disabled={isGenerating}
                    className="text-[11px] font-medium text-slate-600 hover:text-indigo-600 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                  >
                    More Persuasive
                  </button>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-5 flex-1 flex flex-col space-y-4">
              {!generatedBody && !isGenerating ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Ready to generate a tailored pitch
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                    Select a prospect on the left and click Generate. SponsorDesk will tailor the
                    proposal using your fest metrics, tier benefits, and company synergy.
                  </p>
                  <Button
                    size="sm"
                    className="mt-4 bg-indigo-600"
                    onClick={() => handleGenerate()}
                  >
                    Generate Pitch Now
                  </Button>
                </div>
              ) : isGenerating ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-xs font-semibold text-slate-700">Synthesizing sponsorship proposal...</p>
                  <p className="text-[11px] text-slate-400 mt-1">Applying anti-fabrication guidelines & tier benefits.</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col space-y-3">
                  {/* Subject line (for Email) */}
                  {channel === 'email' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Subject Line
                      </label>
                      <input
                        type="text"
                        value={generatedSubject}
                        onChange={(e) => setGeneratedSubject(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  {/* Body editable textarea */}
                  <div className="flex-1 flex flex-col">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Message Content (Editable)
                    </label>
                    <textarea
                      value={generatedBody}
                      onChange={(e) => setGeneratedBody(e.target.value)}
                      rows={14}
                      className="w-full flex-1 p-3.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                    />
                  </div>

                  {/* Action Toolbar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                        className={copied ? 'border-emerald-500 text-emerald-700' : ''}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-1.5 text-emerald-600" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1.5" />
                            <span>Copy to Clipboard</span>
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveToProspect}
                        disabled={Boolean(currentSavedPitchId)}
                      >
                        <Save className="w-4 h-4 mr-1.5" />
                        <span>{currentSavedPitchId ? 'Saved' : 'Save to Prospect'}</span>
                      </Button>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleMarkSent}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Send className="w-4 h-4 mr-1.5" />
                      <span>Confirm Sent</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
