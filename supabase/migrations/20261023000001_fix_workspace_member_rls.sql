-- Migration: Fix Workspace Member RLS and Auto-Membership
-- Description: Allows authenticated users to view workspaces they created and become the initial owner member.

-- 1. Ensure creators can view workspaces even before member row query propagates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'workspaces' AND policyname = 'Users can view workspaces they created'
  ) THEN
    CREATE POLICY "Users can view workspaces they created"
      ON public.workspaces FOR SELECT
      TO authenticated
      USING (created_by = auth.uid());
  END IF;
END $$;

-- 2. Allow workspace creators to insert their initial owner membership record
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'workspace_members' AND policyname = 'Workspace creators can insert initial membership'
  ) THEN
    CREATE POLICY "Workspace creators can insert initial membership"
      ON public.workspace_members FOR INSERT
      TO authenticated
      WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
          SELECT 1 FROM public.workspaces
          WHERE id = workspace_members.workspace_id AND (created_by = auth.uid() OR created_by IS NULL)
        )
      );
  END IF;
END $$;

-- 3. Automatic trigger to ensure workspace creator is registered as owner in workspace_members
CREATE OR REPLACE FUNCTION public.handle_new_workspace_creator_membership()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_workspace_created_add_membership ON public.workspaces;
CREATE TRIGGER on_workspace_created_add_membership
  AFTER INSERT ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_workspace_creator_membership();
