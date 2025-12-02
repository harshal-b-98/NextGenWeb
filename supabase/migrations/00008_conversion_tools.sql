-- Phase 4.4: Conversion & Lead Tools
-- Migration for conversion goals, thank you pages, and form configurations

-- ============================================================================
-- CONVERSION GOALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversion_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'form_submission',
        'page_view',
        'click',
        'scroll_depth',
        'time_on_page',
        'custom_event'
    )),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    page_id UUID REFERENCES pages(id) ON DELETE SET NULL,
    config JSONB NOT NULL DEFAULT '{}',
    value NUMERIC(10, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversion_goals_website ON conversion_goals(website_id);
CREATE INDEX IF NOT EXISTS idx_conversion_goals_type ON conversion_goals(type);
CREATE INDEX IF NOT EXISTS idx_conversion_goals_active ON conversion_goals(is_active) WHERE is_active = true;

-- ============================================================================
-- CONVERSION EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversion_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES conversion_goals(id) ON DELETE CASCADE,
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    visitor_id VARCHAR(255),
    page_id UUID REFERENCES pages(id) ON DELETE SET NULL,
    persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
    value NUMERIC(10, 2),
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversion_events_goal ON conversion_events(goal_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_website ON conversion_events(website_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_session ON conversion_events(session_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_timestamp ON conversion_events(timestamp);

-- ============================================================================
-- THANK YOU PAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS thank_you_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    form_id UUID,
    headline TEXT NOT NULL,
    subheadline TEXT,
    message TEXT,
    cta_button JSONB,
    secondary_cta JSONB,
    show_social_share BOOLEAN DEFAULT false,
    social_share_config JSONB,
    dynamic_content JSONB,
    styling JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_thank_you_pages_website ON thank_you_pages(website_id);
CREATE INDEX IF NOT EXISTS idx_thank_you_pages_form ON thank_you_pages(form_id);

-- ============================================================================
-- LEAD CAPTURE FORMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_capture_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    fields JSONB NOT NULL DEFAULT '[]',
    submit_button JSONB NOT NULL DEFAULT '{"text": "Submit"}',
    success_message TEXT,
    redirect_url TEXT,
    thank_you_page_id UUID REFERENCES thank_you_pages(id) ON DELETE SET NULL,
    styling JSONB,
    tracking JSONB,
    notifications JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_capture_forms_website ON lead_capture_forms(website_id);
CREATE INDEX IF NOT EXISTS idx_lead_capture_forms_active ON lead_capture_forms(is_active) WHERE is_active = true;

-- ============================================================================
-- ADD FORM ID TO LEAD CAPTURES IF NOT EXISTS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_captures' AND column_name = 'form_id'
  ) THEN
    ALTER TABLE lead_captures ADD COLUMN form_id UUID REFERENCES lead_capture_forms(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE conversion_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE thank_you_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_capture_forms ENABLE ROW LEVEL SECURITY;

-- Conversion goals policies
CREATE POLICY "conversion_goals_workspace_access" ON conversion_goals
    FOR ALL USING (
        website_id IN (
            SELECT w.id FROM websites w
            JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        )
    );

-- Conversion events policies (insert allowed for public, select for workspace members)
CREATE POLICY "conversion_events_insert" ON conversion_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "conversion_events_select" ON conversion_events
    FOR SELECT USING (
        website_id IN (
            SELECT w.id FROM websites w
            JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        )
    );

-- Thank you pages policies
CREATE POLICY "thank_you_pages_workspace_access" ON thank_you_pages
    FOR ALL USING (
        website_id IN (
            SELECT w.id FROM websites w
            JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        )
    );

-- Lead capture forms policies
CREATE POLICY "lead_capture_forms_workspace_access" ON lead_capture_forms
    FOR ALL USING (
        website_id IN (
            SELECT w.id FROM websites w
            JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        )
    );

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversion_goals_updated_at
    BEFORE UPDATE ON conversion_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_thank_you_pages_updated_at
    BEFORE UPDATE ON thank_you_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_capture_forms_updated_at
    BEFORE UPDATE ON lead_capture_forms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE conversion_goals IS 'Defines conversion goals for tracking user actions';
COMMENT ON TABLE conversion_events IS 'Stores individual conversion events when goals are triggered';
COMMENT ON TABLE thank_you_pages IS 'Thank you page configurations shown after form submissions';
COMMENT ON TABLE lead_capture_forms IS 'Form configurations for capturing leads';

COMMENT ON COLUMN conversion_goals.type IS 'Type of conversion: form_submission, page_view, click, scroll_depth, time_on_page, custom_event';
COMMENT ON COLUMN conversion_goals.config IS 'JSON configuration specific to the goal type';
COMMENT ON COLUMN conversion_goals.value IS 'Monetary value assigned to this conversion';

COMMENT ON COLUMN thank_you_pages.dynamic_content IS 'Configuration for personalized content based on lead data and persona';
COMMENT ON COLUMN thank_you_pages.styling IS 'Visual styling options (layout, colors, animations)';
