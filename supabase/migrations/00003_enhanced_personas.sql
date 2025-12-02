-- Enhanced Personas Schema Migration
-- Adds advanced persona modeling fields for detection and content mapping

-- Add communication style enum
CREATE TYPE communication_style AS ENUM ('technical', 'business', 'executive');

-- Add buyer journey stage enum
CREATE TYPE buyer_journey_stage AS ENUM ('awareness', 'consideration', 'decision');

-- Alter personas table to add new columns
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS industry VARCHAR(255),
ADD COLUMN IF NOT EXISTS company_size VARCHAR(100),
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS decision_criteria TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS objections TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS key_metrics TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS communication_style communication_style DEFAULT 'business',
ADD COLUMN IF NOT EXISTS buyer_journey_stage buyer_journey_stage DEFAULT 'consideration',
ADD COLUMN IF NOT EXISTS detection_rules JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS relevant_knowledge_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_content_types TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS content_preferences JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) DEFAULT 0.8;

-- Rename is_auto_detected to ai_generated if it exists (backward compat)
-- Note: This may fail if column doesn't exist, that's okay
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'personas' AND column_name = 'is_auto_detected'
    ) THEN
        UPDATE personas SET ai_generated = is_auto_detected WHERE ai_generated IS NULL;
        ALTER TABLE personas DROP COLUMN IF EXISTS is_auto_detected;
    END IF;
END $$;

-- Drop old confidence enum column if it exists and use decimal instead
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'personas' AND column_name = 'confidence' AND data_type = 'persona_confidence'
    ) THEN
        ALTER TABLE personas DROP COLUMN IF EXISTS confidence;
    END IF;
END $$;

-- Create indexes for enhanced persona queries
CREATE INDEX IF NOT EXISTS idx_personas_active ON personas(workspace_id, is_active);
CREATE INDEX IF NOT EXISTS idx_personas_primary ON personas(workspace_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_personas_communication_style ON personas(communication_style);
CREATE INDEX IF NOT EXISTS idx_personas_journey_stage ON personas(buyer_journey_stage);
CREATE INDEX IF NOT EXISTS idx_personas_confidence ON personas(confidence_score DESC);

-- Create GIN index for detection rules JSON queries
CREATE INDEX IF NOT EXISTS idx_personas_detection_rules ON personas USING GIN(detection_rules);

-- Create visitor sessions table for persona detection
CREATE TABLE IF NOT EXISTS visitor_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    visitor_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,

    -- Behavior tracking
    click_history JSONB DEFAULT '[]',
    scroll_behavior JSONB DEFAULT '[]',
    time_on_sections JSONB DEFAULT '{}',
    navigation_path TEXT[] DEFAULT '{}',

    -- Referrer data
    referrer_url TEXT,
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),

    -- Device info
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),

    -- Persona detection
    detected_persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
    persona_confidence DECIMAL(3,2),
    detection_signals JSONB DEFAULT '[]',

    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visitor_sessions_website ON visitor_sessions(website_id);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_visitor ON visitor_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_session ON visitor_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_persona ON visitor_sessions(detected_persona_id);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_activity ON visitor_sessions(last_activity_at DESC);

-- Create persona content mapping table
CREATE TABLE IF NOT EXISTS persona_content_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    knowledge_entity_id UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,

    -- Mapping details
    relevance_score DECIMAL(3,2) NOT NULL DEFAULT 0.5,
    preferred_format VARCHAR(50) DEFAULT 'summary',
    priority VARCHAR(20) DEFAULT 'medium',

    -- Adaptation hints
    content_adaptation JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(persona_id, knowledge_entity_id)
);

CREATE INDEX IF NOT EXISTS idx_persona_content_persona ON persona_content_mappings(persona_id);
CREATE INDEX IF NOT EXISTS idx_persona_content_entity ON persona_content_mappings(knowledge_entity_id);
CREATE INDEX IF NOT EXISTS idx_persona_content_relevance ON persona_content_mappings(relevance_score DESC);

-- Enable RLS on new tables
ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_content_mappings ENABLE ROW LEVEL SECURITY;

-- Visitor sessions policies
CREATE POLICY "Members can view visitor sessions"
    ON visitor_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM websites w
            WHERE w.id = visitor_sessions.website_id
            AND is_workspace_member(w.workspace_id)
        )
    );

CREATE POLICY "Public can create visitor sessions"
    ON visitor_sessions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Public can update visitor sessions"
    ON visitor_sessions FOR UPDATE
    USING (true);

-- Persona content mappings policies
CREATE POLICY "Members can view persona content mappings"
    ON persona_content_mappings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM personas p
            WHERE p.id = persona_content_mappings.persona_id
            AND is_workspace_member(p.workspace_id)
        )
    );

CREATE POLICY "Editors and above can manage persona content mappings"
    ON persona_content_mappings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM personas p
            WHERE p.id = persona_content_mappings.persona_id
            AND get_workspace_role(p.workspace_id) IN ('owner', 'admin', 'editor')
        )
    );

-- Function to update visitor session activity
CREATE OR REPLACE FUNCTION update_visitor_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_visitor_session_activity
    BEFORE UPDATE ON visitor_sessions
    FOR EACH ROW EXECUTE FUNCTION update_visitor_session_activity();

-- Trigger for persona content mappings
CREATE TRIGGER update_persona_content_mappings_updated_at
    BEFORE UPDATE ON persona_content_mappings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
