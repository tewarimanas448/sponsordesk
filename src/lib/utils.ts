import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { FollowUpStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency to Indian Rupee (INR) representation
 * e.g., 250000 -> ₹2,50,000 or ₹2.5 Lakh
 */
export function formatINR(amount: number | null | undefined, compact = false): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  if (compact) {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} Lakh`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(0)}k`;
    }
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format ISO date string into readable date (e.g. 24 Oct 2026)
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Format date with time
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

/**
 * Dynamically computes follow-up status based on current date vs due date
 */
export function getComputedFollowUpStatus(
  dueAt: string,
  currentStatus: FollowUpStatus,
  completedAt?: string | null
): FollowUpStatus {
  if (currentStatus === 'completed' || completedAt) return 'completed';
  if (currentStatus === 'cancelled') return 'cancelled';

  const now = new Date();
  const due = new Date(dueAt);

  // Set hours to 0 to compare calendar dates
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueCalendar = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  if (dueCalendar < todayStart) {
    return 'overdue';
  } else if (dueCalendar.getTime() === todayStart.getTime()) {
    return 'due_today';
  } else {
    return 'upcoming';
  }
}
