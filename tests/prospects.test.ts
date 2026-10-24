import { describe, it, expect, vi } from 'vitest';
import { sanitizeSupabaseUrl, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  createProspectInDatabase,
  updateProspectInDatabase,
  deleteProspectInDatabase,
  fetchProspectsFromDatabase,
  getOrCreateUserWorkspace,
} from '@/lib/supabase/prospects';

describe('Supabase Client Configuration & URL Sanitizer', () => {
  it('strips trailing slashes correctly', () => {
    expect(sanitizeSupabaseUrl('https://example.supabase.co/')).toBe('https://example.supabase.co');
    expect(sanitizeSupabaseUrl('https://example.supabase.co///')).toBe('https://example.supabase.co');
  });

  it('strips /rest/v1/ suffix that causes auth endpoint 404s', () => {
    expect(sanitizeSupabaseUrl('https://example.supabase.co/rest/v1/')).toBe('https://example.supabase.co');
    expect(sanitizeSupabaseUrl('https://example.supabase.co/rest/v1')).toBe('https://example.supabase.co');
  });

  it('handles empty and undefined inputs safely', () => {
    expect(sanitizeSupabaseUrl(undefined)).toBe('');
    expect(sanitizeSupabaseUrl('')).toBe('');
    expect(sanitizeSupabaseUrl('   ')).toBe('');
  });

  it('determines whether Supabase is configured based on env variables', () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'valid-anon-key';
      expect(isSupabaseConfigured()).toBe(true);

      process.env.NEXT_PUBLIC_SUPABASE_URL = '';
      expect(isSupabaseConfigured()).toBe(false);

      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
      expect(isSupabaseConfigured()).toBe(false);
    } finally {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    }
  });
});

describe('Supabase Prospects CRM Service Layer', () => {
  it('throws an error if workspace_id is missing when creating prospect', async () => {
    const mockSupabase: any = {};
    await expect(
      createProspectInDatabase(mockSupabase, '', {
        company_name: 'Test Sponsor',
      })
    ).rejects.toThrow('Workspace ID is required to create a prospect row in Supabase');
  });

  it('inserts prospect into public.prospects with sanitized payload and returns mapped entity', async () => {
    let capturedPayload: any = null;

    const mockSupabase: any = {
      from: vi.fn((table: string) => {
        if (table === 'prospects') {
          return {
            insert: vi.fn((payload: any) => {
              capturedPayload = payload;
              return {
                select: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: 'prospect-uuid-1234',
                      workspace_id: 'ws-uuid-5678',
                      company_name: 'Red Bull Energy',
                      industry: 'Beverages',
                      stage: 'lead',
                      expected_value: '250000',
                      agreed_value: null,
                      tier_id: null,
                      created_at: '2026-10-24T00:00:00.000Z',
                      updated_at: '2026-10-24T00:00:00.000Z',
                      tier: null,
                    },
                    error: null,
                  }),
                })),
              };
            }),
          };
        }
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }),
    };

    const result = await createProspectInDatabase(
      mockSupabase,
      'ws-uuid-5678',
      {
        company_name: '  Red Bull Energy  ',
        industry: 'Beverages',
        expected_value: 250000,
        contact_name: 'Alex Hunter',
      },
      'user-uuid-9999'
    );

    expect(mockSupabase.from).toHaveBeenCalledWith('prospects');
    expect(capturedPayload.company_name).toBe('Red Bull Energy');
    expect(capturedPayload.workspace_id).toBe('ws-uuid-5678');
    expect(capturedPayload.created_by).toBe('user-uuid-9999');
    expect(capturedPayload.expected_value).toBe(250000);
    expect(capturedPayload.stage).toBe('lead');

    expect(result.id).toBe('prospect-uuid-1234');
    expect(result.expected_value).toBe(250000);
    expect(typeof result.expected_value).toBe('number');
  });

  it('distinctly identifies Row Level Security policy denials (code 42501)', async () => {
    const mockSupabase: any = {
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: {
                message: 'new row violates row-level security policy for table "prospects"',
                code: '42501',
              },
            }),
          })),
        })),
      })),
    };

    await expect(
      createProspectInDatabase(
        mockSupabase,
        'ws-uuid-5678',
        { company_name: 'Failing Sponsor' },
        'user-uuid-9999'
      )
    ).rejects.toThrow('Access denied by Row-Level Security: Current user is not recognized as a member of workspace ws-uuid-5678');
  });

  it('distinctly identifies Foreign Key violations (code 23503)', async () => {
    const mockSupabase: any = {
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: {
                message: 'insert or update on table "prospects" violates foreign key constraint',
                code: '23503',
              },
            }),
          })),
        })),
      })),
    };

    await expect(
      createProspectInDatabase(
        mockSupabase,
        'non-existent-ws',
        { company_name: 'Invalid Sponsor' }
      )
    ).rejects.toThrow('Foreign key violation: Referencing non-existent workspace (non-existent-ws) or tier ID');
  });

  it('fetches prospects and maps tier and numeric expected_value', async () => {
    const mockSupabase: any = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'prospect-1',
                  workspace_id: 'ws-1',
                  company_name: 'Google Cloud',
                  stage: 'negotiation',
                  expected_value: '500000',
                  agreed_value: '450000',
                  tier: {
                    id: 'tier-1',
                    name: 'Title Sponsor',
                    price: '1000000',
                    benefits: ['Main stage branding'],
                  },
                },
              ],
              error: null,
            }),
          })),
        })),
      })),
    };

    const prospects = await fetchProspectsFromDatabase(mockSupabase, 'ws-1');
    expect(prospects).toHaveLength(1);
    expect(prospects[0].company_name).toBe('Google Cloud');
    expect(prospects[0].expected_value).toBe(500000);
    expect(prospects[0].agreed_value).toBe(450000);
    expect(prospects[0].tier?.price).toBe(1000000);
  });

  it('updates prospect in Supabase and propagates errors if rejected', async () => {
    const mockSupabase: any = {
      from: vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' },
              }),
            })),
          })),
        })),
      })),
    };

    await expect(
      updateProspectInDatabase(mockSupabase, 'prospect-1', { company_name: 'Updated Name' })
    ).rejects.toThrow('Failed to update prospect in Supabase: Database connection failed');
  });

  it('deletes prospect in Supabase and propagates errors', async () => {
    const mockSupabase: any = {
      from: vi.fn(() => ({
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'Unauthorized delete action' },
          }),
        })),
      })),
    };

    await expect(
      deleteProspectInDatabase(mockSupabase, 'prospect-1')
    ).rejects.toThrow('Failed to delete prospect in Supabase: Unauthorized delete action');
  });
});

describe('Workspace Provisioning & Synchronization', () => {
  it('returns existing workspace when user is already a member', async () => {
    const mockUser: any = { id: 'user-uuid-1', email: 'test@college.edu' };
    const mockWs = { id: 'ws-100', name: 'Vivacity Hub', event_name: 'Vivacity' };

    const mockSupabase: any = {
      from: vi.fn((table: string) => {
        if (table === 'workspace_members') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue({
                    data: [{ workspace_id: 'ws-100', role: 'owner', workspaces: mockWs }],
                    error: null,
                  }),
                })),
              })),
            })),
          };
        }
        return {};
      }),
    };

    const ws = await getOrCreateUserWorkspace(mockSupabase, mockUser);
    expect(ws.id).toBe('ws-100');
    expect(ws.name).toBe('Vivacity Hub');
  });

  it('propagates error if workspace creation fails in Supabase', async () => {
    const mockUser: any = { id: 'user-uuid-1', email: 'test@college.edu' };

    const mockSupabase: any = {
      from: vi.fn((table: string) => {
        if (table === 'workspace_members') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                })),
              })),
            })),
          };
        }
        if (table === 'workspaces') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                })),
              })),
            })),
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database disk full or constraint violation' },
                }),
              })),
            })),
          };
        }
        return {};
      }),
    };

    await expect(
      getOrCreateUserWorkspace(mockSupabase, mockUser)
    ).rejects.toThrow('Failed to create workspace in Supabase: Database disk full or constraint violation');
  });
});

describe('Honest Toast and Mode Indicator Logic', () => {
  function getSubmissionToast(companyName: string, isDemoMode: boolean) {
    if (isDemoMode) {
      return {
        type: 'info',
        message: `Saved ${companyName} to Demo Sandbox — not synced to Supabase. Sign in to persist to database.`,
        title: 'Demo Sandbox (Local Only)',
      };
    }
    return {
      type: 'success',
      message: `Saved ${companyName} to Supabase database!`,
      title: 'Database Record Created',
    };
  }

  it('returns explicit offline warning in Demo mode without claiming database persistence', () => {
    const toast = getSubmissionToast('Red Bull', true);
    expect(toast.type).toBe('info');
    expect(toast.title).toBe('Demo Sandbox (Local Only)');
    expect(toast.message).toContain('not synced to Supabase');
  });

  it('returns database persistence confirmation only in Live mode', () => {
    const toast = getSubmissionToast('Red Bull', false);
    expect(toast.type).toBe('success');
    expect(toast.title).toBe('Database Record Created');
    expect(toast.message).toBe('Saved Red Bull to Supabase database!');
  });
});
