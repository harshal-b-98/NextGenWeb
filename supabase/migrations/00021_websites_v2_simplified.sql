-- Migration: Simplified Websites V2 Schema
-- Purpose: Streamlined website table for conversation-driven creation
-- Epic: NextGenWeb Complete Product Reimplementation

-- ============================================================================
-- 1. Websites V2 Table (Simplified)
-- ============================================================================
-- Much simpler than original websites table - conversation-first design

CREATE TABLE websites_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  domain TEXT UNIQUE, -- subdomain: acme.nextgenweb.app OR custom: www.acme.com

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'creating' CHECK (status IN ('creating', 'draft', 'published', 'archived')),

  -- Link to conversation that created this website
  creation_conversation_id UUID REFERENCES conversation_sessions(id),

  -- Current state (points to versions)
  current_version_id UUID, -- Will reference website_versions_v2
  published_version_id UUID, -- Will reference website_versions_v2

  -- Simplified brand config (moved from complex nested structure)
  brand_config JSONB DEFAULT '{
    "primaryColor": "#3B82F6",
    "tone": "professional",
    "industry": "general"
  }'::jsonb,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_websites_v2_workspace ON websites_v2(workspace_id, status);
CREATE INDEX idx_websites_v2_domain ON websites_v2(domain) WHERE domain IS NOT NULL;
CREATE INDEX idx_websites_v2_conversation ON websites_v2(creation_conversation_id);

-- ============================================================================
-- 2. Website Versions V2 Table (Snapshot-Based)
-- ============================================================================
-- Simplified version control using complete snapshots

CREATE TABLE website_versions_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites_v2(id) ON DELETE CASCADE,

  -- Version info
  version_number INTEGER NOT NULL,

  -- Complete website snapshot (includes all pages, sections, content)
  snapshot JSONB NOT NULL,

  -- Trigger (what feedback created this version)
  trigger_message_id UUID REFERENCES conversation_messages(id),
  trigger_description TEXT, -- Human-readable: "Made hero bigger"

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(website_id, version_number)
);

-- Indexes
CREATE INDEX idx_versions_v2_website ON website_versions_v2(website_id, version_number DESC);
CREATE INDEX idx_versions_v2_trigger ON website_versions_v2(trigger_message_id);

-- Add foreign keys back to websites_v2 (circular reference handled)
ALTER TABLE websites_v2
ADD CONSTRAINT fk_current_version
FOREIGN KEY (current_version_id) REFERENCES website_versions_v2(id) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE websites_v2
ADD CONSTRAINT fk_published_version
FOREIGN KEY (published_version_id) REFERENCES website_versions_v2(id) DEFERRABLE INITIALLY DEFERRED;

-- ============================================================================
-- 3. Row-Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE websites_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_versions_v2 ENABLE ROW LEVEL SECURITY;

-- Websites policies
CREATE POLICY "Users can view websites in their workspaces"
ON websites_v2
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = websites_v2.workspace_id
    AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create websites in their workspaces"
ON websites_v2
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = websites_v2.workspace_id
    AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update websites in their workspaces"
ON websites_v2
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = websites_v2.workspace_id
    AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete websites in their workspaces"
ON websites_v2
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = websites_v2.workspace_id
    AND wm.user_id = auth.uid()
  )
);

-- Version policies
CREATE POLICY "Users can view versions for their websites"
ON website_versions_v2
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM websites_v2 w
    INNER JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
    WHERE w.id = website_versions_v2.website_id
    AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create versions for their websites"
ON website_versions_v2
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM websites_v2 w
    INNER JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
    WHERE w.id = website_versions_v2.website_id
    AND wm.user_id = auth.uid()
  )
);

-- ============================================================================
-- 4. Helper Functions
-- ============================================================================

-- Function: Get next version number
CREATE OR REPLACE FUNCTION get_next_version_number_v2(p_website_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_max_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_max_version
  FROM website_versions_v2
  WHERE website_id = p_website_id;

  RETURN v_max_version;
END;
$$;

-- Function: Create snapshot version
CREATE OR REPLACE FUNCTION create_website_snapshot_v2(
  p_website_id UUID,
  p_snapshot JSONB,
  p_trigger_description TEXT DEFAULT NULL,
  p_trigger_message_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_version_id UUID;
  v_version_number INTEGER;
BEGIN
  -- Get next version number
  v_version_number := get_next_version_number_v2(p_website_id);

  -- Create version
  INSERT INTO website_versions_v2 (
    website_id,
    version_number,
    snapshot,
    trigger_message_id,
    trigger_description,
    created_by
  )
  VALUES (
    p_website_id,
    v_version_number,
    p_snapshot,
    p_trigger_message_id,
    p_trigger_description,
    auth.uid()
  )
  RETURNING id INTO v_version_id;

  -- Update website's current_version_id
  UPDATE websites_v2
  SET
    current_version_id = v_version_id,
    updated_at = NOW()
  WHERE id = p_website_id;

  RETURN v_version_id;
END;
$$;

-- ============================================================================
-- 5. Comments
-- ============================================================================

COMMENT ON TABLE websites_v2 IS
'Simplified website table for conversation-driven creation. Links to conversation that created it.';

COMMENT ON TABLE website_versions_v2 IS
'Snapshot-based version control. Each version stores complete website state in JSONB.';

COMMENT ON COLUMN websites_v2.creation_conversation_id IS
'References the discovery conversation that created this website';

COMMENT ON COLUMN website_versions_v2.snapshot IS
'Complete website snapshot: pages, sections, content, styling - everything needed to render';

COMMENT ON COLUMN website_versions_v2.trigger_message_id IS
'The conversation message (user feedback) that triggered this version creation';
