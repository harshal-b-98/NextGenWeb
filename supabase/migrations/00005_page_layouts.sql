-- Page Layouts Schema Enhancement
-- Phase 3.1: Layout Generation Agent
-- Adds layout support fields to pages table

-- Add page type column
ALTER TABLE pages
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'custom';

-- Add status column for publish workflow
ALTER TABLE pages
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';

-- Add layout metadata
ALTER TABLE pages
ADD COLUMN IF NOT EXISTS layout_metadata JSONB DEFAULT '{}';

-- Add persona variants for dynamic content
ALTER TABLE pages
ADD COLUMN IF NOT EXISTS persona_variants JSONB DEFAULT '[]';

-- Add generation metadata
ALTER TABLE pages
ADD COLUMN IF NOT EXISTS generation_metadata JSONB DEFAULT '{}';

-- Create index for page type
CREATE INDEX IF NOT EXISTS idx_pages_type ON pages(type);

-- Create index for status
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);

-- Create GIN index for content JSON queries
CREATE INDEX IF NOT EXISTS idx_pages_content ON pages USING GIN(content);

-- Create GIN index for layout metadata
CREATE INDEX IF NOT EXISTS idx_pages_layout_metadata ON pages USING GIN(layout_metadata);

-- =====================
-- PAGE LAYOUTS TABLE
-- Stores generated layouts with versioning
-- =====================
CREATE TABLE IF NOT EXISTS page_layouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,

    -- Layout structure
    sections JSONB NOT NULL DEFAULT '[]',

    -- Component selections and scores
    component_selections JSONB DEFAULT '[]',

    -- Navigation structure for this page
    navigation JSONB DEFAULT '{}',

    -- Generation metadata
    generated_by VARCHAR(100), -- 'llm' | 'rule-based' | 'manual'
    model_used VARCHAR(100),
    tokens_used INTEGER DEFAULT 0,
    confidence_score DECIMAL(3,2) DEFAULT 0.8,
    processing_time_ms INTEGER,

    -- Persona targeting
    target_personas JSONB DEFAULT '[]',

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(page_id, version)
);

CREATE INDEX IF NOT EXISTS idx_page_layouts_page ON page_layouts(page_id);
CREATE INDEX IF NOT EXISTS idx_page_layouts_active ON page_layouts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_page_layouts_sections ON page_layouts USING GIN(sections);

-- =====================
-- SITE ARCHITECTURES TABLE
-- Stores complete site layout structures
-- =====================
CREATE TABLE IF NOT EXISTS site_architectures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,

    -- Site-wide navigation
    navigation JSONB NOT NULL DEFAULT '{
        "primary": [],
        "secondary": [],
        "footer": [],
        "cta": null
    }',

    -- Global components (header, footer, etc.)
    global_components JSONB NOT NULL DEFAULT '[]',

    -- Page references
    page_ids UUID[] DEFAULT '{}',

    -- Generation metadata
    generated_by VARCHAR(100),
    model_used VARCHAR(100),
    confidence_score DECIMAL(3,2) DEFAULT 0.8,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(website_id) WHERE is_active = true
);

CREATE INDEX IF NOT EXISTS idx_site_arch_website ON site_architectures(website_id);
CREATE INDEX IF NOT EXISTS idx_site_arch_active ON site_architectures(is_active) WHERE is_active = true;

-- =====================
-- COMPONENT INSTANCES TABLE
-- Tracks component usage across pages
-- =====================
CREATE TABLE IF NOT EXISTS component_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_layout_id UUID NOT NULL REFERENCES page_layouts(id) ON DELETE CASCADE,

    -- Component reference
    component_id VARCHAR(100) NOT NULL, -- e.g., 'hero-split', 'features-grid'
    section_order INTEGER NOT NULL,

    -- Component content
    content JSONB NOT NULL DEFAULT '{}',

    -- Styling overrides
    styling JSONB DEFAULT '{}',

    -- Animation config
    animations JSONB DEFAULT '{}',

    -- Interactions
    interactions JSONB DEFAULT '[]',

    -- Narrative role
    narrative_role VARCHAR(50) NOT NULL, -- 'hook', 'problem', 'solution', 'proof', 'action'

    -- Persona-specific overrides
    persona_overrides JSONB DEFAULT '{}',

    -- Selection score when generated
    selection_score DECIMAL(3,2),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comp_inst_layout ON component_instances(page_layout_id);
CREATE INDEX IF NOT EXISTS idx_comp_inst_component ON component_instances(component_id);
CREATE INDEX IF NOT EXISTS idx_comp_inst_role ON component_instances(narrative_role);

-- =====================
-- RLS POLICIES
-- =====================

-- Enable RLS
ALTER TABLE page_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_architectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_instances ENABLE ROW LEVEL SECURITY;

-- Page layouts policies
CREATE POLICY "Members can view page layouts"
    ON page_layouts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM pages p
            JOIN websites w ON p.website_id = w.id
            WHERE p.id = page_layouts.page_id
            AND is_workspace_member(w.workspace_id)
        )
    );

CREATE POLICY "Editors and above can manage page layouts"
    ON page_layouts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM pages p
            JOIN websites w ON p.website_id = w.id
            WHERE p.id = page_layouts.page_id
            AND get_workspace_role(w.workspace_id) IN ('owner', 'admin', 'editor')
        )
    );

-- Site architectures policies
CREATE POLICY "Members can view site architectures"
    ON site_architectures FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM websites w
            WHERE w.id = site_architectures.website_id
            AND is_workspace_member(w.workspace_id)
        )
    );

CREATE POLICY "Editors and above can manage site architectures"
    ON site_architectures FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM websites w
            WHERE w.id = site_architectures.website_id
            AND get_workspace_role(w.workspace_id) IN ('owner', 'admin', 'editor')
        )
    );

-- Component instances policies
CREATE POLICY "Members can view component instances"
    ON component_instances FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM page_layouts pl
            JOIN pages p ON pl.page_id = p.id
            JOIN websites w ON p.website_id = w.id
            WHERE pl.id = component_instances.page_layout_id
            AND is_workspace_member(w.workspace_id)
        )
    );

CREATE POLICY "Editors and above can manage component instances"
    ON component_instances FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM page_layouts pl
            JOIN pages p ON pl.page_id = p.id
            JOIN websites w ON p.website_id = w.id
            WHERE pl.id = component_instances.page_layout_id
            AND get_workspace_role(w.workspace_id) IN ('owner', 'admin', 'editor')
        )
    );

-- =====================
-- TRIGGERS
-- =====================

-- Trigger for page_layouts updated_at
CREATE TRIGGER update_page_layouts_updated_at
    BEFORE UPDATE ON page_layouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for site_architectures updated_at
CREATE TRIGGER update_site_architectures_updated_at
    BEFORE UPDATE ON site_architectures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for component_instances updated_at
CREATE TRIGGER update_component_instances_updated_at
    BEFORE UPDATE ON component_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
