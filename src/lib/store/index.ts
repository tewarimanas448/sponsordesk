import {
  Workspace,
  SponsorshipTier,
  Prospect,
  FollowUp,
  Pitch,
  ActivityLog,
  DashboardMetrics,
  PipelineStage,
} from '@/types';
import {
  SEED_WORKSPACE,
  SEED_TIERS,
  SEED_PROSPECTS,
  SEED_FOLLOW_UPS,
  SEED_PITCHES,
  SEED_ACTIVITY_LOGS,
} from './seed-data';
import { getComputedFollowUpStatus } from '../utils';

export function calculateDashboardMetrics(
  prospects: Prospect[],
  followUps: FollowUp[]
): DashboardMetrics {
  const nonArchivedProspects = prospects.filter((p) => !p.archived_at);

  // Active prospects are all non-archived, non-lost prospects
  const activeProspects = nonArchivedProspects.filter((p) => p.stage !== 'lost');

  // Stages that represent 'contacted or beyond'
  const contactedOrBeyondStages: PipelineStage[] = [
    'contacted',
    'replied',
    'meeting',
    'negotiation',
    'won',
  ];
  const contactedProspects = nonArchivedProspects.filter((p) =>
    contactedOrBeyondStages.includes(p.stage)
  );

  // Stages that represent 'replied or beyond'
  const repliedOrBeyondStages: PipelineStage[] = ['replied', 'meeting', 'negotiation', 'won'];
  const repliedProspects = nonArchivedProspects.filter((p) =>
    repliedOrBeyondStages.includes(p.stage)
  );

  const meetings = nonArchivedProspects.filter((p) =>
    ['meeting', 'negotiation', 'won'].includes(p.stage)
  );
  const wonProspects = nonArchivedProspects.filter((p) => p.stage === 'won');
  const lostProspects = nonArchivedProspects.filter((p) => p.stage === 'lost');

  // Potential value: open opportunities (excluding won and lost)
  const openProspects = nonArchivedProspects.filter((p) => !['won', 'lost'].includes(p.stage));
  const potentialValue = openProspects.reduce(
    (sum, p) => sum + (Number(p.expected_value) || 0),
    0
  );

  // Closed value: sum of agreed_value (fallback to expected_value) for 'won'
  const closedValue = wonProspects.reduce(
    (sum, p) => sum + (Number(p.agreed_value ?? p.expected_value) || 0),
    0
  );

  const averageWonDealValue =
    wonProspects.length > 0 ? Math.round(closedValue / wonProspects.length) : 0;

  // Terminal deals (won + lost)
  const terminalDeals = wonProspects.length + lostProspects.length;
  const winRate = terminalDeals > 0 ? Math.round((wonProspects.length / terminalDeals) * 100) : 0;

  // Reply rate = replied / contacted
  const replyRate =
    contactedProspects.length > 0
      ? Math.round((repliedProspects.length / contactedProspects.length) * 100)
      : 0;

  // Follow-up status aggregation
  let followUpsDueToday = 0;
  let overdueFollowUps = 0;
  let completedFollowUps = 0;

  for (const f of followUps) {
    const status = getComputedFollowUpStatus(f.due_at, f.status, f.completed_at);
    if (status === 'completed') {
      completedFollowUps++;
    } else if (status === 'due_today') {
      followUpsDueToday++;
    } else if (status === 'overdue') {
      overdueFollowUps++;
    }
  }

  const totalFollowUps = followUps.length;
  const followUpCompletionRate =
    totalFollowUps > 0 ? Math.round((completedFollowUps / totalFollowUps) * 100) : 0;

  return {
    totalActiveProspects: activeProspects.length,
    contactedCount: contactedProspects.length,
    repliesCount: repliedProspects.length,
    meetingsScheduledCount: meetings.length,
    dealsWonCount: wonProspects.length,
    dealsLostCount: lostProspects.length,
    potentialValue,
    closedValue,
    followUpsDueToday,
    overdueFollowUps,
    completedFollowUps,
    totalFollowUps,
    followUpCompletionRate,
    replyRate,
    winRate,
    averageWonDealValue,
  };
}

export interface FunnelStep {
  stage: string;
  count: number;
  label: string;
  conversionFromPrevious: number;
}

export function calculateFunnelMetrics(prospects: Prospect[]): FunnelStep[] {
  const nonArchived = prospects.filter((p) => !p.archived_at);

  const totalLeads = nonArchived.length;
  const contacted = nonArchived.filter((p) =>
    ['contacted', 'replied', 'meeting', 'negotiation', 'won'].includes(p.stage)
  ).length;
  const replied = nonArchived.filter((p) =>
    ['replied', 'meeting', 'negotiation', 'won'].includes(p.stage)
  ).length;
  const meeting = nonArchived.filter((p) =>
    ['meeting', 'negotiation', 'won'].includes(p.stage)
  ).length;
  const negotiation = nonArchived.filter((p) =>
    ['negotiation', 'won'].includes(p.stage)
  ).length;
  const won = nonArchived.filter((p) => p.stage === 'won').length;

  return [
    { stage: 'lead', label: 'All Prospects Added', count: totalLeads, conversionFromPrevious: 100 },
    {
      stage: 'contacted',
      label: 'Pitch Sent / Contacted',
      count: contacted,
      conversionFromPrevious: totalLeads > 0 ? Math.round((contacted / totalLeads) * 100) : 0,
    },
    {
      stage: 'replied',
      label: 'Received Response',
      count: replied,
      conversionFromPrevious: contacted > 0 ? Math.round((replied / contacted) * 100) : 0,
    },
    {
      stage: 'meeting',
      label: 'Meeting / Pitch Call',
      count: meeting,
      conversionFromPrevious: replied > 0 ? Math.round((meeting / replied) * 100) : 0,
    },
    {
      stage: 'negotiation',
      label: 'Terms & Tier Negotiation',
      count: negotiation,
      conversionFromPrevious: meeting > 0 ? Math.round((negotiation / meeting) * 100) : 0,
    },
    {
      stage: 'won',
      label: 'Sponsorship Won',
      count: won,
      conversionFromPrevious: negotiation > 0 ? Math.round((won / negotiation) * 100) : 0,
    },
  ];
}

// Client Storage keys
const STORAGE_KEYS = {
  WORKSPACE: 'sponsordesk_workspace',
  TIERS: 'sponsordesk_tiers',
  PROSPECTS: 'sponsordesk_prospects',
  FOLLOW_UPS: 'sponsordesk_follow_ups',
  PITCHES: 'sponsordesk_pitches',
  ACTIVITY: 'sponsordesk_activity',
  DEMO_MODE: 'sponsordesk_is_demo',
};

export class SponsorDeskStore {
  private static isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  static isDemoMode(): boolean {
    if (!this.isBrowser()) return true;
    const item = localStorage.getItem(STORAGE_KEYS.DEMO_MODE);
    return item === null ? true : item === 'true';
  }

  static setDemoMode(value: boolean): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.DEMO_MODE, value ? 'true' : 'false');
  }

  static getWorkspace(): Workspace {
    if (!this.isBrowser()) return SEED_WORKSPACE;
    const stored = localStorage.getItem(STORAGE_KEYS.WORKSPACE);
    if (!stored) {
      this.saveWorkspace(SEED_WORKSPACE);
      return SEED_WORKSPACE;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return SEED_WORKSPACE;
    }
  }

  static saveWorkspace(ws: Workspace): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.WORKSPACE, JSON.stringify(ws));
  }

  static getTiers(): SponsorshipTier[] {
    if (!this.isBrowser()) return SEED_TIERS;
    const stored = localStorage.getItem(STORAGE_KEYS.TIERS);
    if (!stored) {
      this.saveTiers(SEED_TIERS);
      return SEED_TIERS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return SEED_TIERS;
    }
  }

  static saveTiers(tiers: SponsorshipTier[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.TIERS, JSON.stringify(tiers));
  }

  static getProspects(): Prospect[] {
    if (!this.isBrowser()) return SEED_PROSPECTS;
    const stored = localStorage.getItem(STORAGE_KEYS.PROSPECTS);
    if (!stored) {
      this.saveProspects(SEED_PROSPECTS);
      return SEED_PROSPECTS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return SEED_PROSPECTS;
    }
  }

  static saveProspects(prospects: Prospect[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.PROSPECTS, JSON.stringify(prospects));
  }

  static getFollowUps(): FollowUp[] {
    if (!this.isBrowser()) return SEED_FOLLOW_UPS;
    const stored = localStorage.getItem(STORAGE_KEYS.FOLLOW_UPS);
    if (!stored) {
      this.saveFollowUps(SEED_FOLLOW_UPS);
      return SEED_FOLLOW_UPS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return SEED_FOLLOW_UPS;
    }
  }

  static saveFollowUps(followUps: FollowUp[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.FOLLOW_UPS, JSON.stringify(followUps));
  }

  static getPitches(): Pitch[] {
    if (!this.isBrowser()) return SEED_PITCHES;
    const stored = localStorage.getItem(STORAGE_KEYS.PITCHES);
    if (!stored) {
      this.savePitches(SEED_PITCHES);
      return SEED_PITCHES;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return SEED_PITCHES;
    }
  }

  static savePitches(pitches: Pitch[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.PITCHES, JSON.stringify(pitches));
  }

  static getActivityLogs(): ActivityLog[] {
    if (!this.isBrowser()) return SEED_ACTIVITY_LOGS;
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    if (!stored) {
      this.saveActivityLogs(SEED_ACTIVITY_LOGS);
      return SEED_ACTIVITY_LOGS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return SEED_ACTIVITY_LOGS;
    }
  }

  static saveActivityLogs(logs: ActivityLog[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(logs));
  }

  static logActivity(log: Omit<ActivityLog, 'id' | 'created_at'>): ActivityLog {
    const fullLog: ActivityLog = {
      ...log,
      id: 'act-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    const current = this.getActivityLogs();
    this.saveActivityLogs([fullLog, ...current]);
    return fullLog;
  }

  static resetToDemo(): void {
    if (!this.isBrowser()) return;
    this.saveWorkspace(SEED_WORKSPACE);
    this.saveTiers(SEED_TIERS);
    this.saveProspects(SEED_PROSPECTS);
    this.saveFollowUps(SEED_FOLLOW_UPS);
    this.savePitches(SEED_PITCHES);
    this.saveActivityLogs(SEED_ACTIVITY_LOGS);
    this.setDemoMode(true);
  }
}
