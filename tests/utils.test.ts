import { describe, it, expect } from 'vitest';
import { formatINR, getComputedFollowUpStatus } from '@/lib/utils';

describe('formatINR', () => {
  it('formats regular amounts into standard Indian currency with rupee symbol', () => {
    const formatted = formatINR(500000);
    // Should contain ₹ and 5,00,000
    expect(formatted).toContain('₹');
    expect(formatted).toContain('5,00,000');
  });

  it('formats compact representations correctly', () => {
    expect(formatINR(1500000, true)).toBe('₹15.0 Lakh');
    expect(formatINR(10000000, true)).toBe('₹1.0 Cr');
    expect(formatINR(50000, true)).toBe('₹50k');
  });

  it('handles null, undefined and zero gracefully', () => {
    expect(formatINR(null)).toBe('₹0');
    expect(formatINR(undefined)).toBe('₹0');
    expect(formatINR(0)).toBe('₹0');
  });
});

describe('getComputedFollowUpStatus', () => {
  it('returns completed if current status is completed or completedAt is set', () => {
    expect(getComputedFollowUpStatus('2020-01-01', 'completed')).toBe('completed');
    expect(getComputedFollowUpStatus('2020-01-01', 'upcoming', '2026-01-01')).toBe('completed');
  });

  it('detects overdue dates in the past', () => {
    expect(getComputedFollowUpStatus('2020-01-01T00:00:00Z', 'upcoming')).toBe('overdue');
  });

  it('detects due today for today calendar date', () => {
    const today = new Date().toISOString();
    expect(getComputedFollowUpStatus(today, 'upcoming')).toBe('due_today');
  });

  it('detects upcoming for future dates', () => {
    const future = new Date(Date.now() + 86400000 * 5).toISOString();
    expect(getComputedFollowUpStatus(future, 'upcoming')).toBe('upcoming');
  });
});
