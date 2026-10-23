import { describe, it, expect } from 'vitest';
import { calculateDashboardMetrics, calculateFunnelMetrics } from '@/lib/store';
import { Prospect, FollowUp, SponsorshipTier } from '@/types';

describe('calculateDashboardMetrics', () => {
  const mockProspects: Prospect[] = [
    {
      id: '1',
      workspace_id: 'ws-1',
      company_name: 'Lead Corp',
      stage: 'lead',
      expected_value: 100000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      workspace_id: 'ws-1',
      company_name: 'Contacted Corp',
      stage: 'contacted',
      expected_value: 200000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      workspace_id: 'ws-1',
      company_name: 'Replied Corp',
      stage: 'replied',
      expected_value: 300000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '4',
      workspace_id: 'ws-1',
      company_name: 'Meeting Corp',
      stage: 'meeting',
      expected_value: 400000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '5',
      workspace_id: 'ws-1',
      company_name: 'Won Corp',
      stage: 'won',
      expected_value: 500000,
      agreed_value: 450000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '6',
      workspace_id: 'ws-1',
      company_name: 'Lost Corp',
      stage: 'lost',
      expected_value: 600000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const mockFollowUps: FollowUp[] = [
    {
      id: 'f1',
      workspace_id: 'ws-1',
      prospect_id: '1',
      title: 'Due today task',
      due_at: new Date().toISOString(),
      priority: 'high',
      status: 'due_today',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'f2',
      workspace_id: 'ws-1',
      prospect_id: '2',
      title: 'Overdue task',
      due_at: '2020-01-01T00:00:00Z',
      priority: 'high',
      status: 'overdue',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'f3',
      workspace_id: 'ws-1',
      prospect_id: '3',
      title: 'Completed task',
      due_at: '2020-01-01T00:00:00Z',
      priority: 'medium',
      status: 'completed',
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  it('calculates active prospects correctly (excluding lost and archived)', () => {
    const metrics = calculateDashboardMetrics(mockProspects, mockFollowUps);
    expect(metrics.totalActiveProspects).toBe(5);
  });

  it('calculates contacted count correctly (contacted or beyond)', () => {
    const metrics = calculateDashboardMetrics(mockProspects, mockFollowUps);
    // Contacted, Replied, Meeting, Won = 4
    expect(metrics.contactedCount).toBe(4);
  });

  it('calculates closed value from agreed_value of won prospects without double counting', () => {
    const metrics = calculateDashboardMetrics(mockProspects, mockFollowUps);
    expect(metrics.closedValue).toBe(450000);
    expect(metrics.dealsWonCount).toBe(1);
    expect(metrics.averageWonDealValue).toBe(450000);
  });

  it('calculates open potential value strictly from open opportunities', () => {
    const metrics = calculateDashboardMetrics(mockProspects, mockFollowUps);
    // 100k + 200k + 300k + 400k = 1,000,000
    expect(metrics.potentialValue).toBe(1000000);
  });

  it('calculates win rate based on terminal outcomes (won / (won + lost))', () => {
    const metrics = calculateDashboardMetrics(mockProspects, mockFollowUps);
    // 1 won / (1 won + 1 lost) = 50%
    expect(metrics.winRate).toBe(50);
  });

  it('calculates reply rate correctly', () => {
    const metrics = calculateDashboardMetrics(mockProspects, mockFollowUps);
    // Replied or beyond: Replied, Meeting, Won = 3
    // Contacted or beyond: 4
    // 3 / 4 = 75%
    expect(metrics.replyRate).toBe(75);
  });

  it('aggregates follow up completion rate and statuses', () => {
    const metrics = calculateDashboardMetrics(mockProspects, mockFollowUps);
    expect(metrics.completedFollowUps).toBe(1);
    expect(metrics.overdueFollowUps).toBe(1);
    expect(metrics.followUpsDueToday).toBe(1);
    expect(metrics.followUpCompletionRate).toBe(33); // 1 out of 3 = 33%
  });
});

describe('calculateFunnelMetrics', () => {
  it('computes monotonic conversion funnel numbers', () => {
    const testProspects: Prospect[] = [
      { id: '1', workspace_id: 'w', company_name: 'A', stage: 'lead', expected_value: 0, created_at: '', updated_at: '' },
      { id: '2', workspace_id: 'w', company_name: 'B', stage: 'contacted', expected_value: 0, created_at: '', updated_at: '' },
      { id: '3', workspace_id: 'w', company_name: 'C', stage: 'won', expected_value: 0, created_at: '', updated_at: '' },
    ];

    const funnel = calculateFunnelMetrics(testProspects);
    expect(funnel).toHaveLength(6);
    expect(funnel[0].count).toBe(3); // Total
    expect(funnel[1].count).toBe(2); // Contacted or beyond (B, C)
    expect(funnel[5].count).toBe(1); // Won (C)
  });
});
