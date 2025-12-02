-- Migration: Create workspace function
-- This function creates a workspace and adds the creator as an owner
-- It bypasses RLS to handle the chicken-and-egg problem

CREATE OR REPLACE FUNCTION create_workspace_with_owner(
  workspace_name VARCHAR(255),
  workspace_slug VARCHAR(255),
  workspace_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace_id UUID;
  current_user_id UUID;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if slug already exists
  IF EXISTS (SELECT 1 FROM workspaces WHERE slug = workspace_slug) THEN
    RAISE EXCEPTION 'Workspace slug already exists';
  END IF;

  -- Create the workspace
  INSERT INTO workspaces (name, slug, description)
  VALUES (workspace_name, workspace_slug, workspace_description)
  RETURNING id INTO new_workspace_id;

  -- Add the creator as owner
  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (new_workspace_id, current_user_id, 'owner');

  RETURN new_workspace_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_workspace_with_owner TO authenticated;
