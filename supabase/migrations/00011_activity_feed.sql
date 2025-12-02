-- Migration: Activity Feed
-- Phase 4.1: Enterprise Scale - Activity Feed
-- Adds activity events tracking for workspaces

-- Activity category enum
CREATE TYPE activity_category AS ENUM (
  'workspace',
  'member',
  'document',
  'knowledge',
  'website',
  'page',
  'deployment',
  'domain',
  'brand',
  'export'
);

-- Activity severity enum
CREATE TYPE activity_severity AS ENUM (
  'info',
  'success',
  'warning',
  'error'
);

-- Activity events table
CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Event classification
  event_type TEXT NOT NULL,
  category activity_category NOT NULL,
  severity activity_severity NOT NULL DEFAULT 'info',

  -- Event details
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_activity_events_workspace_id ON activity_events(workspace_id);
CREATE INDEX idx_activity_events_user_id ON activity_events(user_id);
CREATE INDEX idx_activity_events_category ON activity_events(category);
CREATE INDEX idx_activity_events_event_type ON activity_events(event_type);
CREATE INDEX idx_activity_events_created_at ON activity_events(created_at DESC);

-- Composite index for common query pattern
CREATE INDEX idx_activity_events_workspace_created ON activity_events(workspace_id, created_at DESC);

-- RLS policies for activity_events
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

-- Users can view activity events for their workspaces
CREATE POLICY "Users can view activity events for their workspaces"
  ON activity_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = activity_events.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

-- Users can create activity events for their workspaces
CREATE POLICY "Users can create activity events for their workspaces"
  ON activity_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = activity_events.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

-- Function to auto-cleanup old activity events (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_activity_events()
RETURNS void AS $$
BEGIN
  DELETE FROM activity_events
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for documentation
COMMENT ON TABLE activity_events IS 'Tracks all workspace activities for the activity feed';
COMMENT ON COLUMN activity_events.event_type IS 'Dot-notation event type like workspace.created, member.invited';
COMMENT ON COLUMN activity_events.category IS 'High-level category for filtering';
COMMENT ON COLUMN activity_events.severity IS 'Visual importance indicator';
COMMENT ON COLUMN activity_events.metadata IS 'Additional context as JSON (entity IDs, names, etc)';
