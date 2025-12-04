/**
 * Iterative Website Feedback & Refinement System
 *
 * Epic #150: Enables users to preview generated websites, provide feedback,
 * have AI implement changes, and iterate until finalized.
 *
 * Tables:
 * - section_feedback: Stores user feedback on individual sections
 * - page_revisions: Tracks complete page states for history/rollback
 * - page_approvals: Manages approval workflow before publishing
 */

-- =============================================
-- SECTION FEEDBACK TABLE
-- Stores user feedback on individual sections
-- =============================================
CREATE TABLE IF NOT EXISTS section_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    section_id VARCHAR(100) NOT NULL,

    -- Feedback content
    feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('content', 'style', 'layout', 'remove', 'add', 'reorder')),
    feedback_text TEXT NOT NULL,
    target_field VARCHAR(100), -- e.g., 'headline', 'description', 'primaryCTA.text'

    -- Resolution status
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'applied', 'rejected', 'superseded')),

    -- AI processing metadata
    ai_interpretation TEXT,
    ai_confidence DECIMAL(3,2),
    proposed_changes JSONB DEFAULT '{}',

    -- User info
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- PAGE REVISIONS TABLE
-- Tracks complete page states for history/rollback
-- =============================================
CREATE TABLE IF NOT EXISTS page_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,

    -- Revision metadata
    revision_number INTEGER NOT NULL,
    revision_type VARCHAR(50) NOT NULL CHECK (revision_type IN ('initial', 'feedback', 'rollback', 'manual', 'regeneration')),

    -- Change summary
    change_summary TEXT,
    sections_modified JSONB DEFAULT '[]',
    feedback_ids JSONB DEFAULT '[]', -- Array of section_feedback IDs that were applied

    -- Snapshot of the page state
    content_snapshot JSONB NOT NULL,

    -- User info
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Rollback reference (if this revision was created from a rollback)
    rolled_back_from UUID REFERENCES page_revisions(id),

    UNIQUE(page_id, revision_number)
);

-- =============================================
-- PAGE APPROVALS TABLE
-- Manages approval workflow before publishing
-- =============================================
CREATE TABLE IF NOT EXISTS page_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    revision_id UUID NOT NULL REFERENCES page_revisions(id),

    -- Approval status
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'changes_requested', 'approved', 'published')),

    -- Submission info
    submitted_by UUID REFERENCES auth.users(id),
    submitted_at TIMESTAMPTZ,
    submission_notes TEXT,

    -- Review info
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,

    -- Approval info
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    approval_notes TEXT,

    -- Publishing info
    published_at TIMESTAMPTZ,
    published_by UUID REFERENCES auth.users(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ALTER PAGES TABLE
-- Add columns for revision tracking and approval status
-- =============================================
ALTER TABLE pages
ADD COLUMN IF NOT EXISTS current_revision_id UUID REFERENCES page_revisions(id);

ALTER TABLE pages
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'draft' CHECK (approval_status IN ('draft', 'in_review', 'changes_requested', 'approved', 'published'));

-- =============================================
-- INDEXES
-- =============================================

-- Section feedback indexes
CREATE INDEX IF NOT EXISTS idx_feedback_page ON section_feedback(page_id);
CREATE INDEX IF NOT EXISTS idx_feedback_section ON section_feedback(page_id, section_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON section_feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON section_feedback(created_at DESC);

-- Page revisions indexes
CREATE INDEX IF NOT EXISTS idx_revisions_page ON page_revisions(page_id, revision_number DESC);
CREATE INDEX IF NOT EXISTS idx_revisions_created ON page_revisions(page_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_revisions_type ON page_revisions(revision_type);

-- Page approvals indexes
CREATE INDEX IF NOT EXISTS idx_approvals_page ON page_approvals(page_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON page_approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_revision ON page_approvals(revision_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE section_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_approvals ENABLE ROW LEVEL SECURITY;

-- Section feedback policies
CREATE POLICY "Members can view feedback for their pages"
    ON section_feedback FOR SELECT
    USING (
        page_id IN (
            SELECT p.id FROM pages p
            JOIN websites w ON p.website_id = w.id
            WHERE is_workspace_member(w.workspace_id)
        )
    );

CREATE POLICY "Members can create feedback for their pages"
    ON section_feedback FOR INSERT
    WITH CHECK (
        page_id IN (
            SELECT p.id FROM pages p
            JOIN websites w ON p.website_id = w.id
            WHERE is_workspace_member(w.workspace_id)
        )
    );

CREATE POLICY "Members can update feedback for their pages"
    ON section_feedback FOR UPDATE
    USING (
        page_id IN (
            SELECT p.id FROM pages p
            JOIN websites w ON p.website_id = w.id
            WHERE is_workspace_member(w.workspace_id)
        )
    );

CREATE POLICY "Members can delete feedback for their pages"
    ON section_feedback FOR DELETE
    USING (
        page_id IN (
            SELECT p.id FROM pages p
            JOIN websites w ON p.website_id = w.id
            WHERE is_workspace_member(w.workspace_id)
        )
    );

-- Page revisions policies
CREATE POLICY "Members can view revisions for their pages"
    ON page_revisions FOR SELECT
    USING (
        page_id IN (
            SELECT p.id FROM pages p
            JOIN websites w ON p.website_id = w.id
            WHERE is_workspace_member(w.workspace_id)
        )
    );

CREATE POLICY "Members can create revisions for their pages"
    ON page_revisions FOR INSERT
    WITH CHECK (
        page_id IN (
            SELECT p.id FROM pages p
            JOIN websites w ON p.website_id = w.id
            WHERE is_workspace_member(w.workspace_id)
        )
    );

CREATE POLICY "Members can update revisions for their pages"
    ON page_revisions FOR UPDATE
    USING (
        page_id IN (
            SELECT p.id FROM pages p
            JOIN websites w ON p.website_id = w.id
            WHERE is_workspace_member(w.workspace_id)
        )
    );

-- Page approvals policies
CREATE POLICY "Members can view approvals for their pages"
    ON page_approvals FOR SELECT
    USING (
        page_id IN (
            SELECT p.id FROM pages p
            JOIN websites w ON p.website_id = w.id
            WHERE is_workspace_member(w.workspace_id)
        )
    );

CREATE POLICY "Members can manage approvals for their pages"
    ON page_approvals FOR ALL
    USING (
        page_id IN (
            SELECT p.id FROM pages p
            JOIN websites w ON p.website_id = w.id
            WHERE is_workspace_member(w.workspace_id)
        )
    );

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to get the next revision number for a page
CREATE OR REPLACE FUNCTION get_next_revision_number(p_page_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_max_revision INTEGER;
BEGIN
    SELECT COALESCE(MAX(revision_number), 0) INTO v_max_revision
    FROM page_revisions
    WHERE page_id = p_page_id;

    RETURN v_max_revision + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to create initial revision when a page is created
CREATE OR REPLACE FUNCTION create_initial_page_revision()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create initial revision if page has content
    IF NEW.content IS NOT NULL AND NEW.content != '{}' THEN
        INSERT INTO page_revisions (
            page_id,
            revision_number,
            revision_type,
            change_summary,
            content_snapshot,
            created_by
        ) VALUES (
            NEW.id,
            1,
            'initial',
            'Initial page creation',
            NEW.content,
            auth.uid()
        );

        -- Update the page with the revision ID
        UPDATE pages
        SET current_revision_id = (
            SELECT id FROM page_revisions
            WHERE page_id = NEW.id AND revision_number = 1
        )
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create initial revision (disabled by default, can enable if needed)
-- CREATE TRIGGER tr_create_initial_revision
--     AFTER INSERT ON pages
--     FOR EACH ROW
--     EXECUTE FUNCTION create_initial_page_revision();

-- =============================================
-- UPDATE TIMESTAMPS TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION update_page_approvals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_page_approvals_updated_at
    BEFORE UPDATE ON page_approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_page_approvals_updated_at();

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE section_feedback IS 'Stores user feedback on individual page sections for iterative refinement';
COMMENT ON TABLE page_revisions IS 'Tracks complete page content snapshots for version history and rollback';
COMMENT ON TABLE page_approvals IS 'Manages the approval workflow for publishing pages';

COMMENT ON COLUMN section_feedback.feedback_type IS 'Type of change: content, style, layout, remove, add, reorder';
COMMENT ON COLUMN section_feedback.target_field IS 'Specific content field to modify, e.g., headline, description';
COMMENT ON COLUMN section_feedback.ai_interpretation IS 'AI analysis of what the user wants changed';
COMMENT ON COLUMN section_feedback.proposed_changes IS 'JSON containing the proposed before/after changes';

COMMENT ON COLUMN page_revisions.revision_type IS 'How this revision was created: initial, feedback, rollback, manual, regeneration';
COMMENT ON COLUMN page_revisions.sections_modified IS 'Array of section IDs that were modified in this revision';
COMMENT ON COLUMN page_revisions.feedback_ids IS 'Array of section_feedback IDs that were applied to create this revision';
COMMENT ON COLUMN page_revisions.content_snapshot IS 'Complete snapshot of page content at this revision';

COMMENT ON COLUMN page_approvals.status IS 'Workflow status: draft, in_review, changes_requested, approved, published';
