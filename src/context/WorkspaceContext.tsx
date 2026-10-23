'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  // Mutations
  addProspect: (data: Omit<Prospect, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>) => Prospect;
  updateProspect: (id: string, data: Partial<Prospect>) => void;
  updateProspectStage: (id: string, stage: PipelineStage, note?: string) => void;
  deleteProspect: (id: string) => void;
  archiveProspect: (id: string) => void;
  addFollowUp: (data: Omit<FollowUp, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>) => FollowUp;
  completeFollowUp: (id: string) => void;
  rescheduleFollowUp: (id: string, newDueAt: string) => void;
  deleteFollowUp: (id: string) => void;
  addTier: (data: Omit<SponsorshipTier, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>) => SponsorshipTier;
  updateTier: (id: string, data: Partial<SponsorshipTier>) => void;
  deleteTier: (id: string) => void;
  savePitch: (pitch: Omit<Pitch, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>) => Pitch;
  markPitchSent: (id: string) => void;
  bulkImportProspects: (items: Partial<Prospect>[]) => { added: number; errors: string[] };
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

  // Sync from localStorage on initial mount
  useEffect(() => {
    setWorkspaceState(SponsorDeskStore.getWorkspace());
    setTiersState(SponsorDeskStore.getTiers());
    setProspectsState(SponsorDeskStore.getProspects());
    setFollowUpsState(SponsorDeskStore.getFollowUps());
    setPitchesState(SponsorDeskStore.getPitches());
    setActivityLogsState(SponsorDeskStore.getActivityLogs());
    setIsDemoMode(SponsorDeskStore.isDemoMode());
    setIsLoading(false);
  }, []);

  // Compute live metrics honestly from persisted records
  const metrics = calculateDashboardMetrics(prospects, followUps);

  const setWorkspace = useCallback((ws: Workspace) => {
    setWorkspaceState(ws);
    SponsorDeskStore.saveWorkspace(ws);
  }, []);

  const updateWorkspaceDetails = useCallback((data: Partial<Workspace>) => {
    setWorkspaceState((prev) => {
      const updated = { ...prev, ...data, updated_at: new Date().toISOString() };
      SponsorDeskStore.saveWorkspace(updated);
      return updated;
    });
  }, []);

  const addProspect = useCallback(
    (data: Omit<Prospect, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>): Prospect => {
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
    [workspace.id]
  );

  const updateProspect = useCallback((id: string, data: Partial<Prospect>) => {
    setProspectsState((prev) => {
      const next = prev.map((p) =>
        p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p
      );
      SponsorDeskStore.saveProspects(next);
      return next;
    });

    const target = prospects.find((p) => p.id === id);
    if (target) {
      const log = SponsorDeskStore.logActivity({
        workspace_id: target.workspace_id,
        prospect_id: target.id,
        event_type: 'prospect_updated',
        description: `Updated profile & contact info for ${target.company_name}`,
        actor_name: 'Fest Sponsorship Team',
      });
      setActivityLogsState((prev) => [log, ...prev]);
    }
  }, [prospects]);

  const updateProspectStage = useCallback(
    (id: string, stage: PipelineStage, note?: string) => {
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
        SponsorDeskStore.saveProspects(next);
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
        const log = SponsorDeskStore.logActivity({
          workspace_id: target.workspace_id,
          prospect_id: target.id,
          event_type: eventType,
          description,
          actor_name: 'Fest Sponsorship Team',
        });
        setActivityLogsState((prev) => [log, ...prev]);
      }
    },
    [prospects]
  );

  const deleteProspect = useCallback(
    (id: string) => {
      const target = prospects.find((p) => p.id === id);
      setProspectsState((prev) => {
        const next = prev.filter((p) => p.id !== id);
        SponsorDeskStore.saveProspects(next);
        return next;
      });
      // Cascade delete related followups
      setFollowUpsState((prev) => {
        const next = prev.filter((f) => f.prospect_id !== id);
        SponsorDeskStore.saveFollowUps(next);
        return next;
      });

      if (target) {
        const log = SponsorDeskStore.logActivity({
          workspace_id: target.workspace_id,
          event_type: 'prospect_updated',
          description: `Deleted prospect: ${target.company_name}`,
          actor_name: 'Fest Sponsorship Team',
        });
        setActivityLogsState((prev) => [log, ...prev]);
      }
    },
    [prospects]
  );

  const archiveProspect = useCallback(
    (id: string) => {
      setProspectsState((prev) => {
        const next = prev.map((p) =>
          p.id === id ? { ...p, archived_at: new Date().toISOString() } : p
        );
        SponsorDeskStore.saveProspects(next);
        return next;
      });
    },
    []
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
        actor_name: 'Fest Sponsorship Team',
      });
      setActivityLogsState((prev) => [log, ...prev]);

      return newFollowUp;
    },
    [workspace.id, prospects]
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
          actor_name: 'Fest Sponsorship Team',
        });
        setActivityLogsState((prev) => [log, ...prev]);
      }
    },
    [followUps]
  );

  const rescheduleFollowUp = useCallback((id: string, newDueAt: string) => {
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
  }, []);

  const deleteFollowUp = useCallback((id: string) => {
    setFollowUpsState((prev) => {
      const next = prev.filter((f) => f.id !== id);
      SponsorDeskStore.saveFollowUps(next);
      return next;
    });
  }, []);

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
      return newTier;
    },
    [workspace.id]
  );

  const updateTier = useCallback((id: string, data: Partial<SponsorshipTier>) => {
    setTiersState((prev) => {
      const next = prev.map((t) =>
        t.id === id ? { ...t, ...data, updated_at: new Date().toISOString() } : t
      );
      SponsorDeskStore.saveTiers(next);
      return next;
    });
  }, []);

  const deleteTier = useCallback((id: string) => {
    setTiersState((prev) => {
      const next = prev.filter((t) => t.id !== id);
      SponsorDeskStore.saveTiers(next);
      return next;
    });
  }, []);

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
        actor_name: 'Fest Sponsorship Team',
      });
      setActivityLogsState((prev) => [log, ...prev]);

      return newPitch;
    },
    [workspace.id, prospects]
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
        // Also advance prospect to contacted if in lead stage
        updateProspectStage(target.prospect_id, 'contacted', 'Pitch dispatched to prospect');

        const log = SponsorDeskStore.logActivity({
          workspace_id: target.workspace_id,
          prospect_id: target.prospect_id,
          event_type: 'pitch_sent',
          description: `Dispatched ${target.channel.toUpperCase()} pitch`,
          actor_name: 'Fest Sponsorship Team',
        });
        setActivityLogsState((prev) => [log, ...prev]);
      }
    },
    [pitches, updateProspectStage]
  );

  const bulkImportProspects = useCallback(
    (items: Partial<Prospect>[]) => {
      const errors: string[] = [];
      const newItems: Prospect[] = [];

      items.forEach((item, idx) => {
        if (!item.company_name || !item.company_name.trim()) {
          errors.push(`Row ${idx + 1}: Missing required Company Name`);
          return;
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
      });

      if (newItems.length > 0) {
        setProspectsState((prev) => {
          const next = [...newItems, ...prev];
          SponsorDeskStore.saveProspects(next);
          return next;
        });

        const log = SponsorDeskStore.logActivity({
          workspace_id: workspace.id,
          event_type: 'prospect_created',
          description: `Imported ${newItems.length} sponsor prospects via CSV`,
          actor_name: 'Fest Sponsorship Team',
        });
        setActivityLogsState((prev) => [log, ...prev]);
      }

      return { added: newItems.length, errors };
    },
    [workspace.id]
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
        addProspect,
        updateProspect,
        updateProspectStage,
        deleteProspect,
        archiveProspect,
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
