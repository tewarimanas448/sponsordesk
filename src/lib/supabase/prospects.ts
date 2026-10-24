import { SupabaseClient, User } from '@supabase/supabase-js';
import { Prospect, Workspace, SponsorshipTier, PipelineStage, FollowUp, Pitch, ActivityLog } from '@/types';

export interface CreateProspectInput {
  company_name: string;
  industry?: string;
  contact_name?: string;
  contact_designation?: string;
  email?: string;
  phone?: string;
  website_url?: string;
  linkedin_url?: string;
  notes?: string;
  fit_rationale?: string;
  stage?: PipelineStage;
  tier_id?: string;
  expected_value?: number;
  agreed_value?: number;
  lead_source?: string;
  assigned_to?: string;
  next_follow_up_at?: string;
  last_contacted_at?: string;
  lost_reason?: string;
}

/**
 * Gets currently authenticated user if present
 */
export async function getAuthenticatedUser(supabase: SupabaseClient): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return null;
    }
    return user;
  } catch (err: any) {
    console.warn('[SponsorDesk Auth] Unable to resolve session user:', err?.message || 'Network error');
    return null;
  }
}

/**
 * Ensures user has an active Supabase workspace and membership.
 * If none exists, creates a fresh workspace and associates user as owner.
 */
export async function getOrCreateUserWorkspace(
  supabase: SupabaseClient,
  user: User,
  initialData?: Partial<Workspace>
): Promise<Workspace> {
  console.info(`[SponsorDesk Provisioning] Checking workspace memberships for user UUID: ${user.id}`);

  // 1. Check existing memberships
  const { data: memberships, error: memberError } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces (*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1);

  if (!memberError && memberships && memberships.length > 0) {
    const ws = (memberships[0] as any).workspaces;
    if (ws) {
      console.info(`[SponsorDesk Provisioning] Found existing member workspace: "${ws.name}" (${ws.id})`);
      return ws as Workspace;
    }
  }

  // 2. Check if user created any workspace directly
  const { data: ownedWorkspaces, error: wsError } = await supabase
    .from('workspaces')
    .select('*')
    .eq('created_by', user.id)
    .order('created_at', { ascending: true })
    .limit(1);

  if (!wsError && ownedWorkspaces && ownedWorkspaces.length > 0) {
    const existingWs = ownedWorkspaces[0] as Workspace;
    console.info(`[SponsorDesk Provisioning] Found creator workspace: "${existingWs.name}" (${existingWs.id}). Ensuring owner membership.`);
    await supabase
      .from('workspace_members')
      .upsert({ workspace_id: existingWs.id, user_id: user.id, role: 'owner' }, { onConflict: 'workspace_id,user_id' });
    return existingWs;
  }

  // 3. Create a brand new workspace for this user
  console.info(`[SponsorDesk Provisioning] Provisioning new festival workspace in Supabase for user UUID: ${user.id}`);
  const eventName = initialData?.event_name || 'My College Fest 2026';
  const name = initialData?.name || `${eventName} Hub`;
  const institutionName = initialData?.institution_name || 'Engineering & Tech Campus';
  const contactEmail = initialData?.contact_email || user.email || 'sponsorship@fest.edu';

  const newWorkspacePayload = {
    name,
    institution_name: institutionName,
    event_name: eventName,
    event_description: initialData?.event_description || 'Annual college flagship cultural & technical festival',
    contact_email: contactEmail,
    currency: initialData?.currency || 'INR',
    expected_attendance: initialData?.expected_attendance || 12000,
    created_by: user.id,
  };

  const { data: createdWs, error: createError } = await supabase
    .from('workspaces')
    .insert(newWorkspacePayload)
    .select('*')
    .single();

  if (createError || !createdWs) {
    const errorMsg = createError?.message || 'Unknown database error';
    console.error(`[SponsorDesk Provisioning] Workspace creation failed: ${errorMsg}`);
    throw new Error(`Failed to create workspace in Supabase: ${errorMsg}`);
  }

  console.info(`[SponsorDesk Provisioning] Workspace successfully created (${createdWs.id}). Setting owner membership.`);

  // Insert membership record
  await supabase
    .from('workspace_members')
    .upsert({ workspace_id: createdWs.id, user_id: user.id, role: 'owner' }, { onConflict: 'workspace_id,user_id' });

  // Seed standard sponsorship tiers for the new workspace
  const defaultTiers = [
    {
      workspace_id: createdWs.id,
      name: 'Title Sponsor',
      price: 1500000,
      description: 'Exclusive title branding across all festival collaterals, main stage naming, and prime stalls.',
      benefits: ['Main stage naming rights', 'Logo on all passes & hoardings', '10 VIP backstage passes', 'Prime stall 20x20 ft'],
      is_active: true,
      sort_order: 1,
    },
    {
      workspace_id: createdWs.id,
      name: 'Powered By Sponsor',
      price: 800000,
      description: 'Secondary headline branding across campus and social digital campaigns.',
      benefits: ['Co-branding on official fest website', 'Social media shoutouts (50k+ reach)', 'Stall space 10x10 ft'],
      is_active: true,
      sort_order: 2,
    },
    {
      workspace_id: createdWs.id,
      name: 'Associate Partner',
      price: 350000,
      description: 'Category exclusivity for student engagement and product giveaways.',
      benefits: ['Banner placements at food courts', 'Flyer inserts in welcome kits', 'Live announcements'],
      is_active: true,
      sort_order: 3,
    },
    {
      workspace_id: createdWs.id,
      name: 'Tech & Hackathon Partner',
      price: 200000,
      description: 'Direct recruitment branding and problem statement sponsor for 1200+ hackathon participants.',
      benefits: ['Dedicated judging slot', 'Resume database access', 'Branded challenge track'],
      is_active: true,
      sort_order: 4,
    },
  ];

  await supabase.from('sponsorship_tiers').insert(defaultTiers);

  return createdWs as Workspace;
}

/**
 * Fetch all sponsorship tiers for a workspace from Supabase
 */
export async function fetchWorkspaceTiersFromDatabase(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<SponsorshipTier[]> {
  const { data, error } = await supabase
    .from('sponsorship_tiers')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error(`[SponsorDesk CRM] Failed to load tiers for workspace ${workspaceId}:`, error.message);
    throw new Error(`Failed to load sponsorship tiers: ${error.message}`);
  }

  return (data || []).map((t: any) => ({
    ...t,
    price: Number(t.price) || 0,
    benefits: Array.isArray(t.benefits) ? t.benefits : [],
  }));
}

/**
 * Fetch all prospects for a workspace from Supabase
 */
export async function fetchProspectsFromDatabase(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<Prospect[]> {
  const { data, error } = await supabase
    .from('prospects')
    .select('*, tier:sponsorship_tiers(*)')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`[SponsorDesk CRM] Failed to load prospects for workspace ${workspaceId}:`, error.message);
    throw new Error(`Failed to load prospects from Supabase: ${error.message}`);
  }

  return (data || []).map((row: any) => ({
    ...row,
    expected_value: Number(row.expected_value) || 0,
    agreed_value: row.agreed_value !== null ? Number(row.agreed_value) : undefined,
    tier: row.tier
      ? {
          ...row.tier,
          price: Number(row.tier.price) || 0,
          benefits: Array.isArray(row.tier.benefits) ? row.tier.benefits : [],
        }
      : undefined,
  }));
}

/**
 * Fetch follow-ups for a workspace from Supabase
 */
export async function fetchFollowUpsFromDatabase(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<FollowUp[]> {
  const { data, error } = await supabase
    .from('follow_ups')
    .select('*, prospect:prospects(*)')
    .eq('workspace_id', workspaceId)
    .order('due_at', { ascending: true });

  if (error) {
    return [];
  }

  return (data || []).map((row: any) => ({
    ...row,
    prospect: row.prospect
      ? {
          ...row.prospect,
          expected_value: Number(row.prospect.expected_value) || 0,
        }
      : undefined,
  }));
}

/**
 * Fetch pitches for a workspace from Supabase
 */
export async function fetchPitchesFromDatabase(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<Pitch[]> {
  const { data, error } = await supabase
    .from('pitches')
    .select('*, prospect:prospects(*)')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return (data || []).map((row: any) => ({
    ...row,
    prospect: row.prospect
      ? {
          ...row.prospect,
          expected_value: Number(row.prospect.expected_value) || 0,
        }
      : undefined,
  }));
}

/**
 * Fetch activity logs for a workspace from Supabase
 */
export async function fetchActivityLogsFromDatabase(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return [];
  }

  return (data || []).map((row: any) => ({
    ...row,
    actor_name: row.actor_name || 'Fest Sponsorship Team',
  }));
}

/**
 * Create a new prospect in Supabase public.prospects table with RLS enforcement
 */
export async function createProspectInDatabase(
  supabase: SupabaseClient,
  workspaceId: string,
  prospectData: CreateProspectInput,
  userId?: string
): Promise<Prospect> {
  if (!workspaceId) {
    throw new Error('Workspace ID is required to create a prospect row in Supabase');
  }

  const payload: Record<string, any> = {
    workspace_id: workspaceId,
    company_name: prospectData.company_name.trim(),
    industry: prospectData.industry?.trim() || 'General',
    contact_name: prospectData.contact_name?.trim() || null,
    contact_designation: prospectData.contact_designation?.trim() || null,
    email: prospectData.email?.trim() || null,
    phone: prospectData.phone?.trim() || null,
    website_url: prospectData.website_url?.trim() || null,
    linkedin_url: prospectData.linkedin_url?.trim() || null,
    notes: prospectData.notes?.trim() || null,
    fit_rationale: prospectData.fit_rationale?.trim() || null,
    stage: prospectData.stage || 'lead',
    tier_id: prospectData.tier_id || null,
    expected_value: Number(prospectData.expected_value) || 0,
    agreed_value: prospectData.agreed_value !== undefined ? Number(prospectData.agreed_value) : null,
    lead_source: prospectData.lead_source?.trim() || 'Manual Entry',
    assigned_to: prospectData.assigned_to || null,
    created_by: userId || null,
    next_follow_up_at: prospectData.next_follow_up_at || null,
    last_contacted_at: prospectData.last_contacted_at || null,
    lost_reason: prospectData.lost_reason?.trim() || null,
  };

  const { data, error } = await supabase
    .from('prospects')
    .insert(payload)
    .select('*, tier:sponsorship_tiers(*)')
    .single();

  if (error || !data) {
    let failureReason = error?.message || 'No record returned from database';
    if (error?.code === '42501' || error?.message?.toLowerCase().includes('row-level security')) {
      failureReason = `Access denied by Row-Level Security: Current user is not recognized as a member of workspace ${workspaceId}.`;
    } else if (error?.code === '23503') {
      failureReason = `Foreign key violation: Referencing non-existent workspace (${workspaceId}) or tier ID.`;
    }
    console.error(`[SponsorDesk CRM] Database write error:`, failureReason);
    throw new Error(`Supabase prospect creation failed: ${failureReason}`);
  }

  console.info(`[SponsorDesk CRM] Row inserted into public.prospects (id: ${data.id}, company: "${data.company_name}")`);

  // Record activity log asynchronously in Supabase
  try {
    await supabase.from('activity_logs').insert({
      workspace_id: workspaceId,
      prospect_id: data.id,
      actor_id: userId || null,
      event_type: 'prospect_created',
      description: `Added sponsor lead: ${data.company_name} (${data.stage})`,
      metadata: { stage: data.stage, company: data.company_name, source: payload.lead_source },
    });
  } catch (logErr: any) {
    console.warn('[SponsorDesk CRM] Non-fatal activity log creation error:', logErr?.message || logErr);
  }

  return {
    ...data,
    expected_value: Number(data.expected_value) || 0,
    agreed_value: data.agreed_value !== null ? Number(data.agreed_value) : undefined,
    tier: data.tier
      ? {
          ...data.tier,
          price: Number(data.tier.price) || 0,
          benefits: Array.isArray(data.tier.benefits) ? data.tier.benefits : [],
        }
      : undefined,
  };
}

/**
 * Update an existing prospect in Supabase
 */
export async function updateProspectInDatabase(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Prospect>
): Promise<Prospect> {
  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.company_name !== undefined) updatePayload.company_name = updates.company_name.trim();
  if (updates.industry !== undefined) updatePayload.industry = updates.industry.trim();
  if (updates.contact_name !== undefined) updatePayload.contact_name = updates.contact_name.trim();
  if (updates.contact_designation !== undefined) updatePayload.contact_designation = updates.contact_designation.trim();
  if (updates.email !== undefined) updatePayload.email = updates.email.trim();
  if (updates.phone !== undefined) updatePayload.phone = updates.phone.trim();
  if (updates.website_url !== undefined) updatePayload.website_url = updates.website_url.trim();
  if (updates.linkedin_url !== undefined) updatePayload.linkedin_url = updates.linkedin_url.trim();
  if (updates.notes !== undefined) updatePayload.notes = updates.notes;
  if (updates.fit_rationale !== undefined) updatePayload.fit_rationale = updates.fit_rationale;
  if (updates.stage !== undefined) updatePayload.stage = updates.stage;
  if (updates.tier_id !== undefined) updatePayload.tier_id = updates.tier_id || null;
  if (updates.expected_value !== undefined) updatePayload.expected_value = Number(updates.expected_value) || 0;
  if (updates.agreed_value !== undefined) updatePayload.agreed_value = updates.agreed_value !== null ? Number(updates.agreed_value) : null;
  if (updates.lead_source !== undefined) updatePayload.lead_source = updates.lead_source;
  if (updates.assigned_to !== undefined) updatePayload.assigned_to = updates.assigned_to || null;
  if (updates.last_contacted_at !== undefined) updatePayload.last_contacted_at = updates.last_contacted_at;
  if (updates.next_follow_up_at !== undefined) updatePayload.next_follow_up_at = updates.next_follow_up_at;
  if (updates.lost_reason !== undefined) updatePayload.lost_reason = updates.lost_reason;
  if (updates.archived_at !== undefined) updatePayload.archived_at = updates.archived_at;

  const { data, error } = await supabase
    .from('prospects')
    .update(updatePayload)
    .eq('id', id)
    .select('*, tier:sponsorship_tiers(*)')
    .single();

  if (error || !data) {
    throw new Error(`Failed to update prospect in Supabase: ${error?.message || 'Record not found'}`);
  }

  return {
    ...data,
    expected_value: Number(data.expected_value) || 0,
    agreed_value: data.agreed_value !== null ? Number(data.agreed_value) : undefined,
    tier: data.tier
      ? {
          ...data.tier,
          price: Number(data.tier.price) || 0,
          benefits: Array.isArray(data.tier.benefits) ? data.tier.benefits : [],
        }
      : undefined,
  };
}

/**
 * Delete a prospect row in Supabase
 */
export async function deleteProspectInDatabase(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('prospects').delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete prospect in Supabase: ${error.message}`);
  }
}
