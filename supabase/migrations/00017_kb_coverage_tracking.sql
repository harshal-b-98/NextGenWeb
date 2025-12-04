/**
 * KB Coverage Tracking System
 *
 * Story #158: KB Coverage Analyzer Service
 * Tracks KB coverage snapshots and user-actionable suggestions.
 */

-- =============================================
-- KB COVERAGE SNAPSHOTS TABLE
-- Tracks coverage analysis over time
-- =============================================
CREATE TABLE IF NOT EXISTS kb_coverage_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

    -- Coverage data
    coverage_data JSONB NOT NULL,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    total_entities INTEGER NOT NULL DEFAULT 0,
    total_documents INTEGER NOT NULL DEFAULT 0,

    -- Missing content tracking
    missing_critical JSONB DEFAULT '[]',
    missing_high JSONB DEFAULT '[]',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- KB SUGGESTIONS TABLE
-- Tracks actionable suggestions for KB improvement
-- =============================================
CREATE TABLE IF NOT EXISTS kb_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

    -- Suggestion content
    entity_type VARCHAR(100) NOT NULL,
    suggestion_text TEXT NOT NULL,
    example_prompt TEXT,
    impact VARCHAR(20) NOT NULL CHECK (impact IN ('high', 'medium', 'low')),
    priority INTEGER NOT NULL DEFAULT 999,

    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'acted', 'dismissed')),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    acted_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,

    -- User tracking
    acted_by UUID REFERENCES auth.users(id),
    dismissed_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- ALTER KNOWLEDGE ENTITIES TABLE
-- Add source_type for tracking origin
-- =============================================
ALTER TABLE knowledge_entities
ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) DEFAULT 'document'
CHECK (source_type IN ('document', 'feedback_panel', 'chat', 'manual'));

-- =============================================
-- ALTER PAGES TABLE
-- Add KB coverage tracking columns
-- =============================================
ALTER TABLE pages
ADD COLUMN IF NOT EXISTS kb_coverage_score DECIMAL(5,2);

ALTER TABLE pages
ADD COLUMN IF NOT EXISTS generic_fallback_sections JSONB DEFAULT '[]';

-- =============================================
-- INDEXES
-- =============================================

-- KB coverage snapshots indexes
CREATE INDEX IF NOT EXISTS idx_coverage_workspace ON kb_coverage_snapshots(workspace_id);
CREATE INDEX IF NOT EXISTS idx_coverage_created ON kb_coverage_snapshots(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coverage_score ON kb_coverage_snapshots(overall_score);

-- KB suggestions indexes
CREATE INDEX IF NOT EXISTS idx_suggestions_workspace ON kb_suggestions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON kb_suggestions(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_suggestions_priority ON kb_suggestions(workspace_id, priority);
CREATE INDEX IF NOT EXISTS idx_suggestions_entity_type ON kb_suggestions(entity_type);

-- Knowledge entities source type index
CREATE INDEX IF NOT EXISTS idx_entities_source_type ON knowledge_entities(source_type);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE kb_coverage_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_suggestions ENABLE ROW LEVEL SECURITY;

-- KB coverage snapshots policies
CREATE POLICY "Members can view coverage for their workspaces"
    ON kb_coverage_snapshots FOR SELECT
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can create coverage snapshots for their workspaces"
    ON kb_coverage_snapshots FOR INSERT
    WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Members can delete coverage snapshots for their workspaces"
    ON kb_coverage_snapshots FOR DELETE
    USING (is_workspace_member(workspace_id));

-- KB suggestions policies
CREATE POLICY "Members can view suggestions for their workspaces"
    ON kb_suggestions FOR SELECT
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can create suggestions for their workspaces"
    ON kb_suggestions FOR INSERT
    WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Members can update suggestions for their workspaces"
    ON kb_suggestions FOR UPDATE
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can delete suggestions for their workspaces"
    ON kb_suggestions FOR DELETE
    USING (is_workspace_member(workspace_id));

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to get latest coverage for a workspace
CREATE OR REPLACE FUNCTION get_latest_kb_coverage(p_workspace_id UUID)
RETURNS TABLE (
    id UUID,
    overall_score INTEGER,
    total_entities INTEGER,
    total_documents INTEGER,
    missing_critical JSONB,
    missing_high JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        kcs.id,
        kcs.overall_score,
        kcs.total_entities,
        kcs.total_documents,
        kcs.missing_critical,
        kcs.missing_high,
        kcs.created_at
    FROM kb_coverage_snapshots kcs
    WHERE kcs.workspace_id = p_workspace_id
    ORDER BY kcs.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending suggestions count
CREATE OR REPLACE FUNCTION get_pending_suggestions_count(p_workspace_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM kb_suggestions
    WHERE workspace_id = p_workspace_id
    AND status = 'pending';

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE kb_coverage_snapshots IS 'Tracks KB coverage analysis snapshots over time for trend analysis';
COMMENT ON TABLE kb_suggestions IS 'Stores actionable suggestions for improving KB content';

COMMENT ON COLUMN kb_coverage_snapshots.coverage_data IS 'Full coverage report as JSON including per-type analysis';
COMMENT ON COLUMN kb_coverage_snapshots.overall_score IS 'Weighted coverage score from 0-100';
COMMENT ON COLUMN kb_coverage_snapshots.missing_critical IS 'Array of critical entity types that are missing';
COMMENT ON COLUMN kb_coverage_snapshots.missing_high IS 'Array of high-priority entity types that are missing';

COMMENT ON COLUMN kb_suggestions.entity_type IS 'The entity type this suggestion relates to';
COMMENT ON COLUMN kb_suggestions.example_prompt IS 'Example question to ask user for this content';
COMMENT ON COLUMN kb_suggestions.impact IS 'Expected impact of addressing this suggestion: high, medium, low';
COMMENT ON COLUMN kb_suggestions.priority IS 'Sort priority, lower numbers = higher priority';
COMMENT ON COLUMN kb_suggestions.status IS 'Whether user has acted on, dismissed, or not yet addressed this suggestion';

COMMENT ON COLUMN knowledge_entities.source_type IS 'Origin of entity: document extraction, feedback panel input, chat input, or manual entry';
COMMENT ON COLUMN pages.kb_coverage_score IS 'KB coverage score at time of page generation';
COMMENT ON COLUMN pages.generic_fallback_sections IS 'Array of section IDs that used generic fallback content';
