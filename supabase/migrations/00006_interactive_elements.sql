-- Migration: 00006_interactive_elements
-- Phase 4.1: Interactive Elements System
-- Creates tables for interactive elements (quizzes, calculators, surveys, etc.)

-- Interactive element type enum
CREATE TYPE interactive_element_type AS ENUM (
  'quiz',
  'calculator',
  'survey',
  'comparison',
  'configurator',
  'form'
);

-- Interactive element status enum
CREATE TYPE interactive_element_status AS ENUM (
  'draft',
  'published',
  'archived'
);

-- Interactive elements table
CREATE TABLE interactive_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  page_id UUID REFERENCES pages(id) ON DELETE SET NULL,
  type interactive_element_type NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  status interactive_element_status NOT NULL DEFAULT 'draft',
  analytics_config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Interactive responses table
CREATE TABLE interactive_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  element_id UUID NOT NULL REFERENCES interactive_elements(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  responses JSONB NOT NULL DEFAULT '{}',
  results JSONB,
  completion_percentage INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  email TEXT,
  name TEXT,
  device_type TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for interactive_elements
CREATE INDEX idx_interactive_elements_website_id ON interactive_elements(website_id);
CREATE INDEX idx_interactive_elements_page_id ON interactive_elements(page_id);
CREATE INDEX idx_interactive_elements_type ON interactive_elements(type);
CREATE INDEX idx_interactive_elements_status ON interactive_elements(status);
CREATE INDEX idx_interactive_elements_created_at ON interactive_elements(created_at DESC);

-- Indexes for interactive_responses
CREATE INDEX idx_interactive_responses_element_id ON interactive_responses(element_id);
CREATE INDEX idx_interactive_responses_website_id ON interactive_responses(website_id);
CREATE INDEX idx_interactive_responses_visitor_id ON interactive_responses(visitor_id);
CREATE INDEX idx_interactive_responses_session_id ON interactive_responses(session_id);
CREATE INDEX idx_interactive_responses_created_at ON interactive_responses(created_at DESC);
CREATE INDEX idx_interactive_responses_email ON interactive_responses(email) WHERE email IS NOT NULL;

-- Row Level Security policies
ALTER TABLE interactive_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactive_responses ENABLE ROW LEVEL SECURITY;

-- RLS policy for interactive_elements: access through website's workspace
CREATE POLICY "Users can access interactive elements through workspace membership"
  ON interactive_elements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM websites w
      JOIN workspace_members wm ON wm.workspace_id = w.workspace_id
      WHERE w.id = interactive_elements.website_id
      AND wm.user_id = auth.uid()
    )
  );

-- RLS policy for interactive_responses: access through element's workspace
CREATE POLICY "Users can access responses through workspace membership"
  ON interactive_responses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM interactive_elements ie
      JOIN websites w ON w.id = ie.website_id
      JOIN workspace_members wm ON wm.workspace_id = w.workspace_id
      WHERE ie.id = interactive_responses.element_id
      AND wm.user_id = auth.uid()
    )
  );

-- Public read policy for published interactive elements (for website visitors)
CREATE POLICY "Anyone can view published interactive elements"
  ON interactive_elements
  FOR SELECT
  USING (status = 'published');

-- Public insert policy for responses (visitors can submit responses)
CREATE POLICY "Anyone can submit responses to published elements"
  ON interactive_responses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interactive_elements ie
      WHERE ie.id = interactive_responses.element_id
      AND ie.status = 'published'
    )
  );

-- Update timestamp trigger for interactive_elements
CREATE TRIGGER update_interactive_elements_updated_at
  BEFORE UPDATE ON interactive_elements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add workspace_id column to lead_captures if it doesn't exist
-- (needed for the response service's lead capture integration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_captures' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE lead_captures ADD COLUMN workspace_id UUID REFERENCES workspaces(id);

    -- Update existing records to set workspace_id from website
    UPDATE lead_captures lc
    SET workspace_id = w.workspace_id
    FROM websites w
    WHERE lc.website_id = w.id
    AND lc.workspace_id IS NULL;
  END IF;
END $$;

-- Add source_component column to lead_captures if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_captures' AND column_name = 'source_component'
  ) THEN
    ALTER TABLE lead_captures ADD COLUMN source_component TEXT;
  END IF;
END $$;

-- Add phone column to lead_captures if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_captures' AND column_name = 'phone'
  ) THEN
    ALTER TABLE lead_captures ADD COLUMN phone TEXT;
  END IF;
END $$;

-- Add company column to lead_captures if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_captures' AND column_name = 'company'
  ) THEN
    ALTER TABLE lead_captures ADD COLUMN company TEXT;
  END IF;
END $$;

-- Add form_data column to lead_captures if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_captures' AND column_name = 'form_data'
  ) THEN
    ALTER TABLE lead_captures ADD COLUMN form_data JSONB;
  END IF;
END $$;

-- Add UTM columns to lead_captures if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_captures' AND column_name = 'utm_source'
  ) THEN
    ALTER TABLE lead_captures ADD COLUMN utm_source TEXT;
    ALTER TABLE lead_captures ADD COLUMN utm_medium TEXT;
    ALTER TABLE lead_captures ADD COLUMN utm_campaign TEXT;
  END IF;
END $$;

-- Comment on tables
COMMENT ON TABLE interactive_elements IS 'Stores interactive element configurations (quizzes, calculators, surveys, etc.)';
COMMENT ON TABLE interactive_responses IS 'Stores visitor responses to interactive elements';

-- Comment on columns
COMMENT ON COLUMN interactive_elements.config IS 'JSON configuration for the interactive element including questions, formulas, styling, etc.';
COMMENT ON COLUMN interactive_elements.analytics_config IS 'Analytics tracking configuration for the element';
COMMENT ON COLUMN interactive_responses.responses IS 'Visitor answers/inputs to the interactive element';
COMMENT ON COLUMN interactive_responses.results IS 'Computed results (e.g., quiz score, calculator output)';
