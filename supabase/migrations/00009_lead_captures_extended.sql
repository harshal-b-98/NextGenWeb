-- Phase 4.4: Extended Lead Captures Schema
-- Migration to add additional fields to lead_captures table

-- ============================================================================
-- ADD EXTENDED COLUMNS TO LEAD_CAPTURES
-- ============================================================================

DO $$
BEGIN
  -- Add workspace_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_captures' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE lead_captures ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
  END IF;

  -- Add phone column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_captures' AND column_name = 'phone'
  ) THEN
    ALTER TABLE lead_captures ADD COLUMN phone VARCHAR(50);
  END IF;

  -- Add company column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_captures' AND column_name = 'company'
  ) THEN
    ALTER TABLE lead_captures ADD COLUMN company VARCHAR(255);
  END IF;

  -- Add form_data column for custom form fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_captures' AND column_name = 'form_data'
  ) THEN
    ALTER TABLE lead_captures ADD COLUMN form_data JSONB DEFAULT '{}';
  END IF;

  -- Add source_component column (form or component ID)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_captures' AND column_name = 'source_component'
  ) THEN
    ALTER TABLE lead_captures ADD COLUMN source_component UUID;
  END IF;

  -- Add UTM tracking columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_captures' AND column_name = 'utm_source'
  ) THEN
    ALTER TABLE lead_captures ADD COLUMN utm_source VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_captures' AND column_name = 'utm_medium'
  ) THEN
    ALTER TABLE lead_captures ADD COLUMN utm_medium VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_captures' AND column_name = 'utm_campaign'
  ) THEN
    ALTER TABLE lead_captures ADD COLUMN utm_campaign VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_captures' AND column_name = 'utm_term'
  ) THEN
    ALTER TABLE lead_captures ADD COLUMN utm_term VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_captures' AND column_name = 'utm_content'
  ) THEN
    ALTER TABLE lead_captures ADD COLUMN utm_content VARCHAR(255);
  END IF;
END $$;

-- ============================================================================
-- CREATE INDEXES FOR NEW COLUMNS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_lead_captures_workspace ON lead_captures(workspace_id);
CREATE INDEX IF NOT EXISTS idx_lead_captures_source_component ON lead_captures(source_component);
CREATE INDEX IF NOT EXISTS idx_lead_captures_utm_source ON lead_captures(utm_source);
CREATE INDEX IF NOT EXISTS idx_lead_captures_utm_campaign ON lead_captures(utm_campaign);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN lead_captures.workspace_id IS 'Reference to the workspace that owns this lead';
COMMENT ON COLUMN lead_captures.phone IS 'Phone number of the lead';
COMMENT ON COLUMN lead_captures.company IS 'Company name of the lead';
COMMENT ON COLUMN lead_captures.form_data IS 'Additional form field data as JSON';
COMMENT ON COLUMN lead_captures.source_component IS 'ID of the form or component that captured this lead';
COMMENT ON COLUMN lead_captures.utm_source IS 'UTM source parameter for tracking';
COMMENT ON COLUMN lead_captures.utm_medium IS 'UTM medium parameter for tracking';
COMMENT ON COLUMN lead_captures.utm_campaign IS 'UTM campaign parameter for tracking';
COMMENT ON COLUMN lead_captures.utm_term IS 'UTM term parameter for tracking';
COMMENT ON COLUMN lead_captures.utm_content IS 'UTM content parameter for tracking';
