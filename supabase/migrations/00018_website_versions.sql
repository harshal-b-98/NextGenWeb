-- Migration: Website-Level Versioning System
-- Purpose: Enable iterative refinement with draft/production branches
-- Epic #146: Iterative Website Feedback & Refinement System

-- ============================================================================
-- 1. Create website_versions table
-- ============================================================================
-- This table tracks website-level versions (not individual page versions)
-- Each version is a snapshot of all pages at a specific point in time

CREATE TABLE website_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'production')),

  -- Snapshot all page revisions at this version
  -- Format: { "pageId": "revisionId", ... }
  page_revisions JSONB NOT NULL,

  -- Version metadata
  version_name VARCHAR(200),
  description TEXT,
  trigger_type VARCHAR(50) CHECK (trigger_type IN ('initial', 'feedback', 'rollback', 'manual', 'finalization')),

  -- Audit fields
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,

  -- Ensure unique version numbers per website
  UNIQUE(website_id, version_number)
);

-- ============================================================================
-- 2. Create indexes for performance
-- ============================================================================

-- Fast lookup of versions for a website (most recent first)
CREATE INDEX idx_website_versions_site
ON website_versions(website_id, version_number DESC);

-- Fast filtering by status (draft vs production)
CREATE INDEX idx_website_versions_status
ON website_versions(website_id, status);

-- Fast lookup by trigger type (for analytics)
CREATE INDEX idx_website_versions_trigger
ON website_versions(trigger_type, created_at DESC);

-- ============================================================================
-- 3. Extend websites table with version references
-- ============================================================================

ALTER TABLE websites
ADD COLUMN draft_version_id UUID REFERENCES website_versions(id),
ADD COLUMN production_version_id UUID REFERENCES website_versions(id);

-- Create index for fast version lookups from websites
CREATE INDEX idx_websites_draft_version ON websites(draft_version_id);
CREATE INDEX idx_websites_production_version ON websites(production_version_id);

-- ============================================================================
-- 4. Row-Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on website_versions table
ALTER TABLE website_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view versions for websites they have access to
CREATE POLICY "Users can view website versions for their workspaces"
ON website_versions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM websites w
    INNER JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
    WHERE w.id = website_versions.website_id
    AND wm.user_id = auth.uid()
  )
);

-- Policy: Users can create versions for websites in their workspaces
CREATE POLICY "Users can create website versions for their workspaces"
ON website_versions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM websites w
    INNER JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
    WHERE w.id = website_versions.website_id
    AND wm.user_id = auth.uid()
  )
);

-- Policy: Users can update versions for websites in their workspaces
CREATE POLICY "Users can update website versions for their workspaces"
ON website_versions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM websites w
    INNER JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
    WHERE w.id = website_versions.website_id
    AND wm.user_id = auth.uid()
  )
);

-- Policy: Users can delete versions for websites in their workspaces
CREATE POLICY "Users can delete website versions for their workspaces"
ON website_versions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM websites w
    INNER JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
    WHERE w.id = website_versions.website_id
    AND wm.user_id = auth.uid()
  )
);

-- ============================================================================
-- 5. Helper Functions
-- ============================================================================

-- Function: Get next version number for a website
CREATE OR REPLACE FUNCTION get_next_version_number(p_website_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_max_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_max_version
  FROM website_versions
  WHERE website_id = p_website_id;

  RETURN v_max_version;
END;
$$;

-- Function: Create initial version for a website
-- This is called automatically when a website's first pages are generated
CREATE OR REPLACE FUNCTION create_initial_website_version(
  p_website_id UUID,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_version_id UUID;
  v_version_number INTEGER;
  v_page_revisions JSONB;
BEGIN
  -- Get next version number
  v_version_number := get_next_version_number(p_website_id);

  -- Get current page revisions for all pages in this website
  SELECT jsonb_object_agg(p.id, p.current_revision_id)
  INTO v_page_revisions
  FROM pages p
  WHERE p.website_id = p_website_id
  AND p.current_revision_id IS NOT NULL;

  -- If no pages have revisions yet, return NULL
  IF v_page_revisions IS NULL THEN
    RETURN NULL;
  END IF;

  -- Create the version
  INSERT INTO website_versions (
    website_id,
    version_number,
    status,
    page_revisions,
    version_name,
    description,
    trigger_type,
    created_by
  )
  VALUES (
    p_website_id,
    v_version_number,
    'draft',
    v_page_revisions,
    'v' || v_version_number || ' - Initial',
    'Initial website generation',
    'initial',
    COALESCE(p_created_by, auth.uid())
  )
  RETURNING id INTO v_version_id;

  -- Update website to point to this draft version
  UPDATE websites
  SET draft_version_id = v_version_id
  WHERE id = p_website_id;

  RETURN v_version_id;
END;
$$;

-- Function: Promote draft version to production
CREATE OR REPLACE FUNCTION publish_website_version(
  p_version_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_website_id UUID;
  v_old_production_id UUID;
BEGIN
  -- Get website_id and check if version exists
  SELECT website_id INTO v_website_id
  FROM website_versions
  WHERE id = p_version_id;

  IF v_website_id IS NULL THEN
    RAISE EXCEPTION 'Version not found: %', p_version_id;
  END IF;

  -- Get current production version (to demote it)
  SELECT production_version_id INTO v_old_production_id
  FROM websites
  WHERE id = v_website_id;

  -- Demote old production version to draft
  IF v_old_production_id IS NOT NULL THEN
    UPDATE website_versions
    SET status = 'draft'
    WHERE id = v_old_production_id;
  END IF;

  -- Promote new version to production
  UPDATE website_versions
  SET
    status = 'production',
    published_at = NOW()
  WHERE id = p_version_id;

  -- Update website reference
  UPDATE websites
  SET production_version_id = p_version_id
  WHERE id = v_website_id;

  RETURN TRUE;
END;
$$;

-- ============================================================================
-- 6. Add comments for documentation
-- ============================================================================

COMMENT ON TABLE website_versions IS
'Tracks website-level versions for iterative refinement. Each version is a snapshot of all pages at a specific point in time.';

COMMENT ON COLUMN website_versions.page_revisions IS
'JSONB object mapping page IDs to their revision IDs at this version: { "pageId": "revisionId", ... }';

COMMENT ON COLUMN website_versions.trigger_type IS
'How this version was created: initial (first generation), feedback (user feedback), rollback (restored old version), manual (user edit), finalization (production branch)';

COMMENT ON COLUMN website_versions.status IS
'draft = actively being edited, production = published/finalized version';

COMMENT ON FUNCTION get_next_version_number IS
'Returns the next version number for a website (max + 1)';

COMMENT ON FUNCTION create_initial_website_version IS
'Creates the first version for a website after initial page generation';

COMMENT ON FUNCTION publish_website_version IS
'Promotes a draft version to production, demoting the old production version';
