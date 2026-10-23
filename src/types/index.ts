export type PipelineStage =
  | 'lead'
  | 'contacted'
  | 'replied'
  | 'meeting'
  | 'negotiation'
  | 'won'
  | 'lost';

export const STAGE_CONFIG: Record<
  PipelineStage,
  { label: string; color: string; bg: string; border: string; step: number }
> = {
  lead: { label: 'Lead', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300', step: 1 },
  contacted: { label: 'Contacted', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-300', step: 2 },
  replied: { label: 'Replied', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-300', step: 3 },
  meeting: { label: 'Meeting Scheduled', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300', step: 4 },
  negotiation: { label: 'Negotiation', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-300', step: 5 },
  won: { label: 'Closed Won', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300', step: 6 },
  lost: { label: 'Closed Lost', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-300', step: 7 },
};

export type FollowUpStatus = 'upcoming' | 'due_today' | 'overdue' | 'completed' | 'cancelled';
export type PriorityLevel = 'low' | 'medium' | 'high';
export type PitchChannel = 'email' | 'linkedin' | 'whatsapp';
export type PitchTone = 'professional' | 'friendly' | 'concise' | 'persuasive';

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  institution_name: string;
  event_name: string;
  event_description?: string;
  event_start_date?: string;
  event_end_date?: string;
  expected_attendance: number;
  audience_description?: string;
  contact_email: string;
  website_url?: string;
  currency: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  profile?: Profile;
  created_at: string;
}

export interface SponsorshipTier {
  id: string;
  workspace_id: string;
  name: string;
  price: number;
  description: string;
  benefits: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Prospect {
  id: string;
  workspace_id: string;
  company_name: string;
  website_url?: string;
  industry?: string;
  contact_name?: string;
  contact_designation?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  notes?: string;
  fit_rationale?: string;
  stage: PipelineStage;
  tier_id?: string;
  expected_value: number;
  agreed_value?: number;
  lead_source?: string;
  assigned_to?: string;
  last_contacted_at?: string;
  next_follow_up_at?: string;
  lost_reason?: string;
  archived_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined or helper fields
  tier?: SponsorshipTier;
}

export interface FollowUp {
  id: string;
  workspace_id: string;
  prospect_id: string;
  title: string;
  description?: string;
  due_at: string;
  priority: PriorityLevel;
  status: FollowUpStatus;
  assigned_to?: string;
  completed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined or helper fields
  prospect?: Prospect;
}

export interface Pitch {
  id: string;
  workspace_id: string;
  prospect_id: string;
  tier_id?: string;
  channel: PitchChannel;
  tone: PitchTone;
  subject?: string;
  body: string;
  generation_source: 'gemini' | 'demo' | 'manual';
  generation_inputs: {
    event_name?: string;
    company_name?: string;
    audience?: string;
    tier_name?: string;
    tier_price?: number;
    benefits?: string[];
    custom_context?: string;
  };
  status: 'draft' | 'saved' | 'sent';
  created_by?: string;
  created_at: string;
  updated_at: string;
  prospect?: Prospect;
}

export interface ActivityLog {
  id: string;
  workspace_id: string;
  prospect_id?: string;
  actor_id?: string;
  event_type:
    | 'prospect_created'
    | 'prospect_updated'
    | 'stage_changed'
    | 'pitch_generated'
    | 'pitch_saved'
    | 'pitch_copied'
    | 'pitch_sent'
    | 'follow_up_scheduled'
    | 'follow_up_completed'
    | 'follow_up_cancelled'
    | 'reply_recorded'
    | 'meeting_scheduled'
    | 'deal_won'
    | 'deal_lost';
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
  actor_name?: string;
}

export interface DashboardMetrics {
  totalActiveProspects: number;
  contactedCount: number;
  repliesCount: number;
  meetingsScheduledCount: number;
  dealsWonCount: number;
  dealsLostCount: number;
  potentialValue: number;
  closedValue: number;
  followUpsDueToday: number;
  overdueFollowUps: number;
  completedFollowUps: number;
  totalFollowUps: number;
  followUpCompletionRate: number;
  replyRate: number;
  winRate: number;
  averageWonDealValue: number;
}
