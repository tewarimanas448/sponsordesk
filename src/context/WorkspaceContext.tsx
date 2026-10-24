'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
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
import { SponsorDeskStore, calculateDashboardMetrics } from '@/lib/store';
import { getComputedFollowUpStatus } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import {
  getAuthenticatedUser,
  getOrCreateUserWorkspace,
  fetchProspectsFromDatabase,
  fetchWorkspaceTiersFromDatabase,
  fetchFollowUpsFromDatabase,
  fetchPitchesFromDatabase,
  fetchActivityLogsFromDatabase,
  createProspectInDatabase,
  updateProspectInDatabase,
  deleteProspectInDatabase,
} from '@/lib/supabase/prospects';

interface WorkspaceContextType {
  workspace: Workspace;
  setWorkspace: (ws: Workspace) => void;
  updateWorkspaceDetails: (data: Partial<Workspace>) => void;
  tiers: SponsorshipTier[];
  prospects: Prospect[];
  followUps: FollowUp[];
  pitches: Pitch[];
  activityLogs: ActivityLog[];
  metrics: DashboardMetrics;
  isDemoMode: boolean;
  isLoading: boolean;
  currentUser: User | null;
  syncError: string | null;
  signOut: () => Promise<void>;
  // Mutations
  addProspect: (data: Omit<Prospect, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>) => Promise<Prospect>;
  updateProspect: (id: string, data: Partial<Prospect>) => Promise<void>;
  updateProspectStage: (id: string, stage: PipelineStage, note?: string) => Promise<void>;
  deleteProspect: (id: string) => Promise<void>;
  archiveProspect: (id: string) => void;
  refreshProspects: () => Promise<void>;
  addFollowUp: (data: Omit<FollowUp, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>) => FollowUp;
  completeFollowUp: (id: string) => void;
  rescheduleFollowUp: (id: string, newDueAt: string) => void;
  deleteFollowUp: (id: string) => void;
  addTier: (data: Omit<SponsorshipTier, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>) => SponsorshipTier;
  updateTier: (id: string, data: Partial<SponsorshipTier>) => void;
  deleteTier: (id: string) => void;
  savePitch: (pitch: Omit<Pitch, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>) => Pitch;
  markPitchSent: (id: string) => void;
  bulkImportProspects: (items: Partial<Prospect>[]) => Promise<{ added: number; errors: string[] }>;
  resetToDemo: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspaceState] = useState<Workspace>(() => SponsorDeskStore.getWorkspace());
  const [tiers, setTiersState] = useState<SponsorshipTier[]>(() => SponsorDeskStore.getTiers());
  const [prospects, setProspectsState] = useState<Prospect[]>(() => SponsorDeskStore.getProspects());
  const [followUps, setFollowUpsState] = useState<FollowUp[]>(() => SponsorDeskStore.getFollowUps());
  const [pitches, setPitchesState] = useState<Pitch[]>(() => SponsorDeskStore.getPitches());
  const [activityLogs, setActivityLogsState] = useState<ActivityLog[]>(() => SponsorDeskStore.getActivityLogs());
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Sync authenticated session or fallback to local demo store
  const syncWorkspaceData = useCallback(async (user: User | null) => {
    const supabase = createClient();
    if (!supabase || !user) {
      console.info('[SponsorDesk Auth] Operating in Demo Sandbox (unauthenticated session).');
      setWorkspaceState(SponsorDeskStore.getWorkspace());
      setTiersState(SponsorDeskStore.getTiers());
      setProspectsState(SponsorDeskStore.getProspects());
      setFollowUpsState(SponsorDeskStore.getFollowUps());
      setPitchesState(SponsorDeskStore.getPitches());
      setActivityLogsState(SponsorDeskStore.getActivityLogs());
      setIsDemoMode(true);
      setCurrentUser(null);
      setSyncError(null);
      setIsLoading(false);
      return;
    }

    try {
      console.info(`[SponsorDesk Auth] Active Supabase session detected for user UUID: ${user.id}`);
      setCurrentUser(user);
      setIsDemoMode(false);
      setSyncError(null);

      // 1. Get or create user workspace in Supabase
      const dbWs = await getOrCreateUserWorkspace(supabase, user);
      setWorkspaceState(dbWs);

      // 2. Fetch tiers from Supabase
      const dbTiers = await fetchWorkspaceTiersFromDatabase(supabase, dbWs.id);
      if (dbTiers && dbTiers.length > 0) {
        setTiersState(dbTiers);
      }

      // 3. Fetch prospects from Supabase
      const dbProspects = await fetchProspectsFromDatabase(supabase, dbWs.id);
      setProspectsState(dbProspects);

      // 4. Fetch follow-ups from Supabase
      const dbFollowUps = await fetchFollowUpsFromDatabase(supabase, dbWs.id);
      setFollowUpsState(dbFollowUps);

      // 5. Fetch pitches from Supabase
      const dbPitches = await fetchPitchesFromDatabase(supabase, dbWs.id);
      setPitchesState(dbPitches);

      // 6. Fetch activity logs from Supabase
      const dbLogs = await fetchActivityLogsFromDatabase(supabase, dbWs.id);
      setActivityLogsState(dbLogs);

      console.info(`[SponsorDesk CRM] Workspace "${dbWs.name}" (${dbWs.id}) successfully loaded from Supabase.`);
    } catch (err: any) {
      const errorMessage = err?.message || 'Database synchronization failure';
      console.error('[SponsorDesk CRM] Error synchronizing Supabase workspace data:', errorMessage);
      // DO NOT silently fall back to demo mode! Keep authenticated status and record sync error
      setCurrentUser(user);
      setIsDemoMode(false);
      setSyncError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load and auth subscription
  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    if (!supabase) {
      setWorkspaceState(SponsorDeskStore.getWorkspace());
      setTiersState(SponsorDeskStore.getTiers());
      setProspectsState(SponsorDeskStore.getProspects());
      setFollowUpsState(SponsorDeskStore.getFollowUps());
      setPitchesState(SponsorDeskStore.getPitches());
      setActivityLogsState(SponsorDeskStore.getActivityLogs());
      setIsDemoMode(true);
      setIsLoading(false);
      return;
    }

    // Check existing auth session
    getAuthenticatedUser(supabase).then((user) => {
      if (!mounted) return;
      syncWorkspaceData(user);
    });

    // Listen to auth state transitions
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (session?.user) {
        syncWorkspaceData(session.user);
      } else {
        syncWorkspaceData(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [syncWorkspaceData]);

  // Compute live metrics honestly from persisted records
  const metrics = calculateDashboardMetrics(prospects, followUps);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    SponsorDeskStore.resetToDemo();
    setWorkspaceState(SponsorDeskStore.getWorkspace());
    setTiersState(SponsorDeskStore.getTiers());
    setProspectsState(SponsorDeskStore.getProspects());
    setFollowUpsState(SponsorDeskStore.getFollowUps());
    setPitchesState(SponsorDeskStore.getPitches());
    setActivityLogsState(SponsorDeskStore.getActivityLogs());
    setCurrentUser(null);
    setIsDemoMode(true);
    setSyncError(null);
  }, []);

  const setWorkspace = useCallback((ws: Workspace) => {
    setWorkspaceState(ws);
    SponsorDeskStore.saveWorkspace(ws);
  }, []);

  const updateWorkspaceDetails = useCallback(
    async (data: Partial<Workspace>) => {
      setWorkspaceState((prev) => {
        const updated = { ...prev, ...data, updated_at: new Date().toISOString() };
        if (isDemoMode) {
          SponsorDeskStore.saveWorkspace(updated);
        }
        return updated;
      });

      const supabase = createClient();
      if (supabase && currentUser && !isDemoMode && workspace.id) {
        try {
          await supabase
            .from('workspaces')
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', workspace.id);
        } catch (err) {
          console.error('[SponsorDesk CRM] Failed to update workspace in Supabase:', err);
        }
      }
    },
    [currentUser, isDemoMode, workspace.id]
  );

  const refreshProspects = useCallback(async () => {
    const supabase = createClient();
    if (supabase && currentUser && !isDemoMode && workspace.id) {
      const dbProspects = await fetchProspectsFromDatabase(supabase, workspace.id);
      setProspectsState(dbProspects);
    }
  }, [currentUser, isDemoMode, workspace.id]);

  const addProspect = useCallback(
    async (
      data: Omit<Prospect, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>
    ): Promise<Prospect> => {
      const supabase = createClient();

      if (supabase && currentUser && !isDemoMode) {
        if (!workspace.id || workspace.id.startsWith('ws-')) {
          throw new Error('Valid Supabase workspace ID not found. Please refresh the page to reconnect.');
        }

        console.info(`[SponsorDesk CRM] Writing prospect "${data.company_name}" to Supabase workspace UUID: ${workspace.id}`);
        // Authenticated database insertion with RLS
        const created = await createProspectInDatabase(
          supabase,
          workspace.id,
          data,
          currentUser.id
        );

        setProspectsState((prev) => [created, ...prev]);

        // Local activity log update
        const log: ActivityLog = {
          id: 'act-' + Date.now(),
          workspace_id: workspace.id,
          prospect_id: created.id,
          event_type: 'prospect_created',
          description: `Added sponsor lead: ${created.company_name} (${created.stage})`,
          actor_name: currentUser.email || 'Fest Sponsorship Team',
          created_at: new Date().toISOString(),
        };
        setActivityLogsState((prev) => [log, ...prev]);

        return created;
      }

      // Demo / Local mode fallback
      console.info(`[SponsorDesk Demo] Storing prospect "${data.company_name}" in browser localStorage (Demo Sandbox).`);
      const newProspect: Prospect = {
        ...data,
        id: 'p-' + Date.now(),
        workspace_id: workspace.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setProspectsState((prev) => {
        const next = [newProspect, ...prev];
        SponsorDeskStore.saveProspects(next);
        return next;
      });

      // Log activity
      const log = SponsorDeskStore.logActivity({
        workspace_id: workspace.id,
        prospect_id: newProspect.id,
        event_type: 'prospect_created',
        description: `Added sponsor lead: ${newProspect.company_name} (${newProspect.stage})`,
        actor_name: 'Fest Sponsorship Team',
      });
      setActivityLogsState((prev) => [log, ...prev]);

      return newProspect;
    },
    [workspace.id, currentUser, isDemoMode]
  );

  const updateProspect = useCallback(
    async (id: string, data: Partial<Prospect>) => {
      const supabase = createClient();
      if (supabase && currentUser && !isDemoMode) {
        await updateProspectInDatabase(supabase, id, data);
      }

      setProspectsState((prev) => {
        const next = prev.map((p) =>
          p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p
        );
        if (isDemoMode) SponsorDeskStore.saveProspects(next);
        return next;
      });

      const target = prospects.find((p) => p.id === id);
      if (target) {
        const log = SponsorDeskStore.logActivity({
          workspace_id: target.workspace_id,
          prospect_id: target.id,
          event_type: 'prospect_updated',
          description: `Updated profile & contact info for ${target.company_name}`,
          actor_name: currentUser?.email || 'Fest Sponsorship Team',
        });
        setActivityLogsState((prev) => [log, ...prev]);
      }
    },
    [currentUser, isDemoMode, prospects]
  );

  const updateProspectStage = useCallback(
    async (id: string, stage: PipelineStage, note?: string) => {
      const supabase = createClient();
      if (supabase && currentUser && !isDemoMode) {
        await updateProspectInDatabase(supabase, id, {
          stage,
          last_contacted_at: ['contacted', 'replied', 'meeting', 'negotiation', 'won'].includes(stage)
            ? new Date().toISOString()
            : undefined,
        });
      }

      setProspectsState((prev) => {
        const next = prev.map((p) => {
          if (p.id === id) {
            const last_contacted_at = ['contacted', 'replied', 'meeting', 'negotiation', 'won'].includes(stage)
              ? new Date().toISOString()
              : p.last_contacted_at;

            return {
              ...p,
              stage,
              last_contacted_at,
              updated_at: new Date().toISOString(),
            };
          }
          return p;
        });
        if (isDemoMode) SponsorDeskStore.saveProspects(next);
        return next;
      });

      const target = prospects.find((p) => p.id === id);
      if (target) {
        let eventType: ActivityLog['event_type'] = 'stage_changed';
        if (stage === 'won') eventType = 'deal_won';
        else if (stage === 'lost') eventType = 'deal_lost';
        else if (stage === 'meeting') eventType = 'meeting_scheduled';
        else if (stage === 'replied') eventType = 'reply_recorded';

        const description = `Moved ${target.company_name} to "${stage.toUpperCase()}"${note ? ` — Note: ${note}` : ''}`;

        if (supabase && currentUser && !isDemoMode) {
          try {
            await supabase.from('activity_logs').insert({
              workspace_id: target.workspace_id,
              prospect_id: target.id,
              actor_id: currentUser.id,
              event_type: eventType,
              description,
              metadata: { stage, note },
            });
          } catch {}
        }

        const log = SponsorDeskStore.logActivity({
          workspace_id: target.workspace_id,
          prospect_id: target.id,
          event_type: eventType,
          description,
          actor_name: currentUser?.email || 'Fest Sponsorship Team',
        });
        setActivityLogsState((prev) => [log, ...prev]);
      }
    },
    [currentUser, isDemoMode, prospects]
  );

  const deleteProspect = useCallback(
    async (id: string) => {
      const supabase = createClient();
      if (supabase && currentUser && !isDemoMode) {
        await deleteProspectInDatabase(supabase, id);
      }

      const target = prospects.find((p) => p.id === id);
      setProspectsState((prev) => {
        const next = prev.filter((p) => p.id !== id);
        if (isDemoMode) SponsorDeskStore.saveProspects(next);
        return next;
      });
      // Cascade delete related followups
      setFollowUpsState((prev) => {
        const next = prev.filter((f) => f.prospect_id !== id);
        if (isDemoMode) SponsorDeskStore.saveFollowUps(next);
        return next;
      });

      if (target) {
        const log = SponsorDeskStore.logActivity({
          workspace_id: target.workspace_id,
          event_type: 'prospect_updated',
          description: `Deleted prospect: ${target.company_name}`,
          actor_name: currentUser?.email || 'Fest Sponsorship Team',
        });
        setActivityLogsState((prev) => [log, ...prev]);
      }
    },
    [currentUser, isDemoMode, prospects]
  );

  const archiveProspect = useCallback(
    async (id: string) => {
      const supabase = createClient();
      if (supabase && currentUser && !isDemoMode) {
        await updateProspectInDatabase(supabase, id, {
          archived_at: new Date().toISOString(),
        });
      }

      setProspectsState((prev) => {
        const next = prev.map((p) =>
          p.id === id ? { ...p, archived_at: new Date().toISOString() } : p
        );
        if (isDemoMode) SponsorDeskStore.saveProspects(next);
        return next;
      });
    },
    [currentUser, isDemoMode]
  );

  const addFollowUp = useCallback(
    (data: Omit<FollowUp, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>): FollowUp => {
      const computedStatus = getComputedFollowUpStatus(data.due_at, data.status);
      const newFollowUp: FollowUp = {
        ...data,
        status: computedStatus,
        id: 'fu-' + Date.now(),
        workspace_id: workspace.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setFollowUpsState((prev) => {
        const next = [newFollowUp, ...prev];
        SponsorDeskStore.saveFollowUps(next);
        return next;
      });

      const relatedProspect = prospects.find((p) => p.id === data.prospect_id);
      const log = SponsorDeskStore.logActivity({
        workspace_id: workspace.id,
        prospect_id: data.prospect_id,
        event_type: 'follow_up_scheduled',
        description: `Scheduled follow-up: "${newFollowUp.title}" for ${relatedProspect?.company_name || 'sponsor'}`,
        actor_name: currentUser?.email || 'Fest Sponsorship Team',
      });
      setActivityLogsState((prev) => [log, ...prev]);

      // If live mode, asynchronously persist
      const supabase = createClient();
      if (supabase && currentUser && !isDemoMode) {
        supabase.from('follow_ups').insert({
          workspace_id: workspace.id,
          prospect_id: data.prospect_id,
          title: data.title,
          description: data.description || null,
          due_at: data.due_at,
          priority: data.priority,
          status: computedStatus,
          created_by: currentUser.id,
        }).then();
      }

      return newFollowUp;
    },
    [workspace.id, prospects, currentUser, isDemoMode]
  );

  const completeFollowUp = useCallback(
    (id: string) => {
      const target = followUps.find((f) => f.id === id);
      setFollowUpsState((prev) => {
        const next = prev.map((f) =>
          f.id === id
            ? {
                ...f,
                status: 'completed' as const,
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : f
        );
        SponsorDeskStore.saveFollowUps(next);
        return next;
      });

      if (target) {
        const log = SponsorDeskStore.logActivity({
          workspace_id: target.workspace_id,
          prospect_id: target.prospect_id,
          event_type: 'follow_up_completed',
          description: `Completed follow-up: "${target.title}"`,
          actor_name: currentUser?.email || 'Fest Sponsorship Team',
        });
        setActivityLogsState((prev) => [log, ...prev]);

        const supabase = createClient();
        if (supabase && currentUser && !isDemoMode) {
          supabase
            .from('follow_ups')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .then();
        }
      }
    },
    [followUps, currentUser, isDemoMode]
  );

  const rescheduleFollowUp = useCallback(
    (id: string, newDueAt: string) => {
      setFollowUpsState((prev) => {
        const next = prev.map((f) => {
          if (f.id === id) {
            const status = getComputedFollowUpStatus(newDueAt, 'upcoming');
            return {
              ...f,
              due_at: newDueAt,
              status,
              updated_at: new Date().toISOString(),
            };
          }
          return f;
        });
        SponsorDeskStore.saveFollowUps(next);
        return next;
      });

      const supabase = createClient();
      if (supabase && currentUser && !isDemoMode) {
        supabase
          .from('follow_ups')
          .update({
            due_at: newDueAt,
            status: getComputedFollowUpStatus(newDueAt, 'upcoming'),
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .then();
      }
    },
    [currentUser, isDemoMode]
  );

  const deleteFollowUp = useCallback(
    (id: string) => {
      setFollowUpsState((prev) => {
        const next = prev.filter((f) => f.id !== id);
        SponsorDeskStore.saveFollowUps(next);
        return next;
      });

      const supabase = createClient();
      if (supabase && currentUser && !isDemoMode) {
        supabase.from('follow_ups').delete().eq('id', id).then();
      }
    },
    [currentUser, isDemoMode]
  );

  const addTier = useCallback(
    (data: Omit<SponsorshipTier, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>): SponsorshipTier => {
      const newTier: SponsorshipTier = {
        ...data,
        id: 'tier-' + Date.now(),
        workspace_id: workspace.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setTiersState((prev) => {
        const next = [...prev, newTier];
        SponsorDeskStore.saveTiers(next);
        return next;
      });

      const supabase = createClient();
      if (supabase && currentUser && !isDemoMode) {
        supabase.from('sponsorship_tiers').insert({
          workspace_id: workspace.id,
          name: data.name,
          price: Number(data.price) || 0,
          description: data.description,
          benefits: data.benefits,
          is_active: data.is_active,
          sort_order: data.sort_order,
        }).then();
      }

      return newTier;
    },
    [workspace.id, currentUser, isDemoMode]
  );

  const updateTier = useCallback(
    (id: string, data: Partial<SponsorshipTier>) => {
      setTiersState((prev) => {
        const next = prev.map((t) =>
          t.id === id ? { ...t, ...data, updated_at: new Date().toISOString() } : t
        );
        SponsorDeskStore.saveTiers(next);
        return next;
      });

      const supabase = createClient();
      if (supabase && currentUser && !isDemoMode) {
        supabase.from('sponsorship_tiers').update({
          ...data,
          updated_at: new Date().toISOString(),
        }).eq('id', id).then();
      }
    },
    [currentUser, isDemoMode]
  );

  const deleteTier = useCallback(
    (id: string) => {
      setTiersState((prev) => {
        const next = prev.filter((t) => t.id !== id);
        SponsorDeskStore.saveTiers(next);
        return next;
      });

      const supabase = createClient();
      if (supabase && currentUser && !isDemoMode) {
        supabase.from('sponsorship_tiers').delete().eq('id', id).then();
      }
    },
    [currentUser, isDemoMode]
  );

  const savePitch = useCallback(
    (pitchData: Omit<Pitch, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>): Pitch => {
      const newPitch: Pitch = {
        ...pitchData,
        id: 'pitch-' + Date.now(),
        workspace_id: workspace.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setPitchesState((prev) => {
        const next = [newPitch, ...prev];
        SponsorDeskStore.savePitches(next);
        return next;
      });

      const relatedProspect = prospects.find((p) => p.id === pitchData.prospect_id);
      const log = SponsorDeskStore.logActivity({
        workspace_id: workspace.id,
        prospect_id: pitchData.prospect_id,
        event_type: 'pitch_saved',
        description: `Saved ${pitchData.channel.toUpperCase()} pitch for ${relatedProspect?.company_name || 'sponsor'} (${pitchData.generation_source})`,
        actor_name: currentUser?.email || 'Fest Sponsorship Team',
      });
      setActivityLogsState((prev) => [log, ...prev]);

      const supabase = createClient();
      if (supabase && currentUser && !isDemoMode) {
        supabase.from('pitches').insert({
          workspace_id: workspace.id,
          prospect_id: pitchData.prospect_id,
          tier_id: pitchData.tier_id || null,
          channel: pitchData.channel,
          tone: pitchData.tone,
          subject: pitchData.subject || null,
          body: pitchData.body,
          generation_source: pitchData.generation_source,
          generation_inputs: pitchData.generation_inputs,
          status: pitchData.status,
          created_by: currentUser.id,
        }).then();
      }

      return newPitch;
    },
    [workspace.id, prospects, currentUser, isDemoMode]
  );

  const markPitchSent = useCallback(
    (id: string) => {
      const target = pitches.find((p) => p.id === id);
      setPitchesState((prev) => {
        const next = prev.map((p) =>
          p.id === id ? { ...p, status: 'sent' as const, updated_at: new Date().toISOString() } : p
        );
        SponsorDeskStore.savePitches(next);
        return next;
      });

      if (target) {
        updateProspectStage(target.prospect_id, 'contacted', 'Pitch dispatched to prospect');

        const log = SponsorDeskStore.logActivity({
          workspace_id: target.workspace_id,
          prospect_id: target.prospect_id,
          event_type: 'pitch_sent',
          description: `Dispatched ${target.channel.toUpperCase()} pitch`,
          actor_name: currentUser?.email || 'Fest Sponsorship Team',
        });
        setActivityLogsState((prev) => [log, ...prev]);

        const supabase = createClient();
        if (supabase && currentUser && !isDemoMode) {
          supabase.from('pitches').update({
            status: 'sent',
            updated_at: new Date().toISOString(),
          }).eq('id', id).then();
        }
      }
    },
    [pitches, updateProspectStage, currentUser, isDemoMode]
  );

  const bulkImportProspects = useCallback(
    async (items: Partial<Prospect>[]): Promise<{ added: number; errors: string[] }> => {
      const errors: string[] = [];
      const newItems: Prospect[] = [];
      const supabase = createClient();

      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        if (!item.company_name || !item.company_name.trim()) {
          errors.push(`Row ${idx + 1}: Missing required Company Name`);
          continue;
        }

        const validStage: PipelineStage = [
          'lead',
          'contacted',
          'replied',
          'meeting',
          'negotiation',
          'won',
          'lost',
        ].includes(item.stage as any)
          ? (item.stage as PipelineStage)
          : 'lead';

        if (supabase && currentUser && !isDemoMode) {
          try {
            const created = await createProspectInDatabase(
              supabase,
              workspace.id,
              {
                company_name: item.company_name.trim(),
                industry: item.industry || 'General',
                contact_name: item.contact_name,
                contact_designation: item.contact_designation,
                email: item.email,
                phone: item.phone,
                website_url: item.website_url,
                linkedin_url: item.linkedin_url,
                notes: item.notes,
                fit_rationale: item.fit_rationale,
                stage: validStage,
                tier_id: item.tier_id,
                expected_value: Number(item.expected_value) || 0,
                lead_source: item.lead_source || 'CSV Import',
              },
              currentUser.id
            );
            newItems.push(created);
          } catch (err: any) {
            errors.push(`Row ${idx + 1} (${item.company_name}): ${err.message}`);
          }
        } else {
          newItems.push({
            id: 'p-' + Date.now() + '-' + idx,
            workspace_id: workspace.id,
            company_name: item.company_name.trim(),
            stage: validStage,
            industry: item.industry || 'General',
            website_url: item.website_url,
            contact_name: item.contact_name,
            contact_designation: item.contact_designation,
            email: item.email,
            phone: item.phone,
            linkedin_url: item.linkedin_url,
            notes: item.notes,
            fit_rationale: item.fit_rationale,
            tier_id: item.tier_id,
            expected_value: Number(item.expected_value) || 0,
            agreed_value: Number(item.agreed_value) || 0,
            lead_source: item.lead_source || 'CSV Import',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }

      if (newItems.length > 0) {
        setProspectsState((prev) => {
          const next = [...newItems, ...prev];
          if (isDemoMode) SponsorDeskStore.saveProspects(next);
          return next;
        });

        const log = SponsorDeskStore.logActivity({
          workspace_id: workspace.id,
          event_type: 'prospect_created',
          description: `Imported ${newItems.length} sponsor prospects via CSV`,
          actor_name: currentUser?.email || 'Fest Sponsorship Team',
        });
        setActivityLogsState((prev) => [log, ...prev]);
      }

      return { added: newItems.length, errors };
    },
    [workspace.id, currentUser, isDemoMode]
  );

  const resetToDemo = useCallback(() => {
    SponsorDeskStore.resetToDemo();
    setWorkspaceState(SponsorDeskStore.getWorkspace());
    setTiersState(SponsorDeskStore.getTiers());
    setProspectsState(SponsorDeskStore.getProspects());
    setFollowUpsState(SponsorDeskStore.getFollowUps());
    setPitchesState(SponsorDeskStore.getPitches());
    setActivityLogsState(SponsorDeskStore.getActivityLogs());
    setIsDemoMode(true);
    setSyncError(null);
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        setWorkspace,
        updateWorkspaceDetails,
        tiers,
        prospects,
        followUps,
        pitches,
        activityLogs,
        metrics,
        isDemoMode,
        isLoading,
        currentUser,
        syncError,
        signOut,
        addProspect,
        updateProspect,
        updateProspectStage,
        deleteProspect,
        archiveProspect,
        refreshProspects,
        addFollowUp,
        completeFollowUp,
        rescheduleFollowUp,
        deleteFollowUp,
        addTier,
        updateTier,
        deleteTier,
        savePitch,
        markPitchSent,
        bulkImportProspects,
        resetToDemo,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
