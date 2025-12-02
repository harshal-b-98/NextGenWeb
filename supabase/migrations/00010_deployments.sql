-- Migration: Deployments
-- Phase 3.6: Hosting & Deployment
-- Adds deployments and custom domains support

-- Deployment status enum
CREATE TYPE deployment_status AS ENUM (
  'pending',
  'building',
  'deploying',
  'ready',
  'error',
  'canceled'
);

-- Deployment provider enum
CREATE TYPE deployment_provider AS ENUM (
  'vercel',
  'netlify',
  'custom'
);

-- Deployments table
CREATE TABLE IF NOT EXISTS deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  provider deployment_provider NOT NULL DEFAULT 'vercel',
  status deployment_status NOT NULL DEFAULT 'pending',

  -- Vercel-specific fields
  deployment_id TEXT,
  project_id TEXT,

  -- URLs
  url TEXT,
  preview_url TEXT,
  production_url TEXT,
  inspector_url TEXT,

  -- Build info
  build_logs TEXT,
  error TEXT,

  -- Metadata
  meta JSONB DEFAULT '{}',

  -- Timestamps
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_deployments_website_id ON deployments(website_id);
CREATE INDEX idx_deployments_status ON deployments(status);
CREATE INDEX idx_deployments_created_at ON deployments(created_at DESC);

-- Custom domains table
CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_records JSONB,
  ssl_status TEXT NOT NULL DEFAULT 'pending',

  -- Provider info
  provider deployment_provider,
  provider_domain_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,

  -- Unique constraint per domain
  UNIQUE(domain)
);

-- Create indexes
CREATE INDEX idx_custom_domains_website_id ON custom_domains(website_id);
CREATE INDEX idx_custom_domains_domain ON custom_domains(domain);
CREATE INDEX idx_custom_domains_verified ON custom_domains(verified);

-- Updated at trigger for deployments
CREATE TRIGGER set_deployments_updated_at
  BEFORE UPDATE ON deployments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated at trigger for custom_domains
CREATE TRIGGER set_custom_domains_updated_at
  BEFORE UPDATE ON custom_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS policies for deployments
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deployments for their workspace websites"
  ON deployments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM websites w
      JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
      WHERE w.id = deployments.website_id
      AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create deployments"
  ON deployments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites w
      JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
      WHERE w.id = website_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update deployments"
  ON deployments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM websites w
      JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
      WHERE w.id = deployments.website_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

-- RLS policies for custom_domains
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view domains for their workspace websites"
  ON custom_domains FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM websites w
      JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
      WHERE w.id = custom_domains.website_id
      AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage domains"
  ON custom_domains FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM websites w
      JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
      WHERE w.id = custom_domains.website_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

-- Add deployment-related columns to websites table
ALTER TABLE websites
  ADD COLUMN IF NOT EXISTS vercel_project_id TEXT,
  ADD COLUMN IF NOT EXISTS production_url TEXT,
  ADD COLUMN IF NOT EXISTS last_deployed_at TIMESTAMPTZ;
