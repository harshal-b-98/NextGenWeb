-- Migration: 00015_site_global_components
-- Description: Create table for storing global website components (headers, footers, etc.)
-- Task #130: Create site_global_components database migration
-- Task #131: Add RLS policies for global components

-- =============================================================================
-- SITE GLOBAL COMPONENTS TABLE
-- =============================================================================
-- Stores global components like headers, footers, announcement bars that are
-- shared across all pages of a website.

CREATE TABLE IF NOT EXISTS site_global_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,

    -- Component type: header, footer, announcement-bar, cookie-banner
    type VARCHAR(50) NOT NULL CHECK (type IN ('header', 'footer', 'announcement-bar', 'cookie-banner', 'sidebar', 'chat-widget')),

    -- The component variant from the registry (e.g., 'nav-header', 'nav-mega-menu', 'footer-standard')
    component_id VARCHAR(100) NOT NULL,

    -- Content for the component (nav items, footer columns, etc.)
    content JSONB NOT NULL DEFAULT '{}',

    -- Styling overrides for the component
    styling JSONB DEFAULT '{}',

    -- Visibility configuration (which pages to show on)
    visibility JSONB NOT NULL DEFAULT '{"showOn": "all"}',

    -- Sort order for components of the same type (for future use)
    sort_order INTEGER DEFAULT 0,

    -- Whether this component is currently active
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Enforce unique active component per type per website
    -- This ensures only one header, one footer, etc. per website
    UNIQUE (website_id, type)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Index for fast lookup by website
CREATE INDEX IF NOT EXISTS idx_global_components_website
    ON site_global_components(website_id);

-- Index for active components (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_global_components_active
    ON site_global_components(website_id)
    WHERE is_active = true;

-- Index for component type lookups
CREATE INDEX IF NOT EXISTS idx_global_components_type
    ON site_global_components(type);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE site_global_components ENABLE ROW LEVEL SECURITY;

-- Public can view active global components of any website
-- This is needed for public website rendering
CREATE POLICY "Public can view active global components"
    ON site_global_components
    FOR SELECT
    USING (is_active = true);

-- Workspace members can manage (CRUD) global components for their websites
CREATE POLICY "Workspace members can manage global components"
    ON site_global_components
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM websites w
            JOIN workspace_members wm ON wm.workspace_id = w.workspace_id
            WHERE w.id = site_global_components.website_id
            AND wm.user_id = auth.uid()
        )
    );

-- =============================================================================
-- TRIGGER FOR UPDATED_AT
-- =============================================================================

-- Create or replace the trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_site_global_components_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_site_global_components_updated_at ON site_global_components;
CREATE TRIGGER trigger_update_site_global_components_updated_at
    BEFORE UPDATE ON site_global_components
    FOR EACH ROW
    EXECUTE FUNCTION update_site_global_components_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE site_global_components IS 'Stores global website components like headers, footers, announcement bars';
COMMENT ON COLUMN site_global_components.type IS 'Component type: header, footer, announcement-bar, cookie-banner, sidebar, chat-widget';
COMMENT ON COLUMN site_global_components.component_id IS 'Reference to component variant in the registry (e.g., nav-header, footer-standard)';
COMMENT ON COLUMN site_global_components.content IS 'JSONB content for the component (nav items, links, text, etc.)';
COMMENT ON COLUMN site_global_components.styling IS 'Optional styling overrides for the component';
COMMENT ON COLUMN site_global_components.visibility IS 'Configuration for which pages to show this component on';
COMMENT ON COLUMN site_global_components.is_active IS 'Whether this component is currently active and should be rendered';
