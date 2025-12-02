-- Brand Configuration Schema Migration
-- Adds complete brand system storage for website theming

-- Create brand_configs table
CREATE TABLE IF NOT EXISTS brand_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,

    -- Color system (JSONB for flexible color scales)
    colors JSONB NOT NULL DEFAULT '{
        "primary": {},
        "secondary": {},
        "accent": {},
        "neutral": {},
        "semantic": {}
    }',

    -- Typography system
    typography JSONB NOT NULL DEFAULT '{
        "fontFamily": {"heading": "Inter", "body": "Inter", "mono": "JetBrains Mono"},
        "fontSize": {},
        "fontWeight": {},
        "lineHeight": {},
        "letterSpacing": {}
    }',

    -- Spacing system
    spacing JSONB NOT NULL DEFAULT '{"unit": 8, "scale": [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24]}',

    -- Border radius
    border_radius JSONB NOT NULL DEFAULT '{
        "none": "0px",
        "sm": "4px",
        "md": "8px",
        "lg": "12px",
        "xl": "16px",
        "2xl": "24px",
        "full": "9999px"
    }',

    -- Shadows
    shadows JSONB NOT NULL DEFAULT '{
        "none": "none",
        "sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "md": "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        "lg": "0 10px 15px -3px rgb(0 0 0 / 0.1)",
        "xl": "0 20px 25px -5px rgb(0 0 0 / 0.1)",
        "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        "inner": "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)"
    }',

    -- Animation system
    animation JSONB NOT NULL DEFAULT '{
        "duration": {"fast": "150ms", "normal": "300ms", "slow": "500ms"},
        "easing": {
            "linear": "linear",
            "easeIn": "cubic-bezier(0.4, 0, 1, 1)",
            "easeOut": "cubic-bezier(0, 0, 0.2, 1)",
            "easeInOut": "cubic-bezier(0.4, 0, 0.2, 1)",
            "bounce": "cubic-bezier(0.68, -0.55, 0.265, 1.55)"
        }
    }',

    -- Logo configuration
    logo JSONB DEFAULT NULL,

    -- Brand voice and personality
    voice JSONB NOT NULL DEFAULT '{
        "tone": "professional",
        "formality": "neutral",
        "personality": [],
        "keywords": []
    }',

    -- Context
    industry VARCHAR(100),
    target_audience TEXT,

    -- Metadata
    ai_generated BOOLEAN DEFAULT false,
    confidence_score DECIMAL(3,2) DEFAULT 0.8,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: one brand config per website
    UNIQUE(website_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_brand_configs_website ON brand_configs(website_id);
CREATE INDEX IF NOT EXISTS idx_brand_configs_industry ON brand_configs(industry);
CREATE INDEX IF NOT EXISTS idx_brand_configs_ai_generated ON brand_configs(ai_generated);

-- Create GIN indexes for JSON queries
CREATE INDEX IF NOT EXISTS idx_brand_configs_colors ON brand_configs USING GIN(colors);
CREATE INDEX IF NOT EXISTS idx_brand_configs_voice ON brand_configs USING GIN(voice);

-- Enable RLS
ALTER TABLE brand_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Members can view brand configs"
    ON brand_configs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM websites w
            WHERE w.id = brand_configs.website_id
            AND is_workspace_member(w.workspace_id)
        )
    );

CREATE POLICY "Editors and above can manage brand configs"
    ON brand_configs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM websites w
            WHERE w.id = brand_configs.website_id
            AND get_workspace_role(w.workspace_id) IN ('owner', 'admin', 'editor')
        )
    );

-- Trigger for updated_at
CREATE TRIGGER update_brand_configs_updated_at
    BEFORE UPDATE ON brand_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add brand_config_id to websites table for quick reference
ALTER TABLE websites
ADD COLUMN IF NOT EXISTS brand_config_id UUID REFERENCES brand_configs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_websites_brand_config ON websites(brand_config_id);
