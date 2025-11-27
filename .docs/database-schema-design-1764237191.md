# Database Schema Design Document
## Supabase Multi-Tenant Architecture

**Version:** 1.0  
**Date:** November 2024

---

## 1. Overview

This document defines the complete database schema for the AI-Powered Dynamic Marketing Website Builder. The schema is designed for Supabase (PostgreSQL) with multi-tenancy implemented via Row-Level Security (RLS).

---

## 2. Schema Architecture

### 2.1 Schema Organization

```
database
├── auth (Supabase managed)
│   ├── users
│   └── sessions
├── storage (Supabase managed)
│   └── objects
├── public
│   └── (extension functions)
└── app
    ├── Core Tables
    │   ├── organizations
    │   ├── workspaces
    │   └── team_members
    ├── Document & Knowledge
    │   ├── documents
    │   ├── knowledge_items
    │   ├── knowledge_embeddings
    │   └── personas
    ├── Website Generation
    │   ├── websites
    │   ├── pages
    │   ├── page_versions
    │   ├── components
    │   └── brand_configs
    ├── Content & Assets
    │   ├── content_blocks
    │   ├── media_assets
    │   └── templates
    ├── Analytics & Tracking
    │   ├── page_views
    │   ├── interactions
    │   └── lead_captures
    └── System
        ├── generation_jobs
        └── audit_logs
```

### 2.2 Extensions Required

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- Encryption
CREATE EXTENSION IF NOT EXISTS "vector";         -- pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Trigram text search
```

---

## 3. Core Tables

### 3.1 Organizations

```sql
CREATE TABLE app.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    
    -- Subscription & Plan
    plan TEXT NOT NULL DEFAULT 'free' 
        CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
    plan_limits JSONB NOT NULL DEFAULT '{
        "max_workspaces": 1,
        "max_documents_per_workspace": 10,
        "max_websites": 1,
        "max_pages_per_website": 10,
        "max_team_members": 1,
        "ai_generations_per_month": 50,
        "storage_gb": 1
    }'::jsonb,
    
    -- Billing
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    billing_email TEXT,
    
    -- Settings
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$')
);

-- Indexes
CREATE INDEX idx_organizations_slug ON app.organizations(slug);
CREATE INDEX idx_organizations_plan ON app.organizations(plan);

-- Trigger for updated_at
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON app.organizations
    FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();
```

### 3.2 Workspaces

```sql
CREATE TABLE app.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES app.organizations(id) ON DELETE CASCADE,
    
    -- Identity
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    
    -- Configuration
    settings JSONB NOT NULL DEFAULT '{
        "default_language": "en",
        "timezone": "UTC"
    }'::jsonb,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'archived', 'suspended')),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(organization_id, slug)
);

-- Indexes
CREATE INDEX idx_workspaces_org ON app.workspaces(organization_id);
CREATE INDEX idx_workspaces_slug ON app.workspaces(organization_id, slug);
```

### 3.3 Team Members

```sql
CREATE TABLE app.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES app.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Role & Permissions
    role TEXT NOT NULL DEFAULT 'member' 
        CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Workspace Access (null = all workspaces)
    workspace_ids UUID[] DEFAULT NULL,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'invited', 'suspended')),
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(organization_id, user_id)
);

-- Indexes
CREATE INDEX idx_team_members_org ON app.team_members(organization_id);
CREATE INDEX idx_team_members_user ON app.team_members(user_id);
CREATE INDEX idx_team_members_role ON app.team_members(organization_id, role);
```

### 3.4 User Profiles

```sql
CREATE TABLE app.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Profile Info
    full_name TEXT,
    avatar_url TEXT,
    
    -- Preferences
    preferences JSONB NOT NULL DEFAULT '{
        "theme": "system",
        "notifications": {
            "email": true,
            "browser": true
        }
    }'::jsonb,
    
    -- Onboarding
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    onboarding_step INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 4. Document & Knowledge Tables

### 4.1 Documents

```sql
CREATE TABLE app.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES app.workspaces(id) ON DELETE CASCADE,
    
    -- Document Info
    name TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    
    -- Storage
    storage_path TEXT NOT NULL,
    storage_bucket TEXT NOT NULL DEFAULT 'documents',
    
    -- Processing Status
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    processing_error TEXT,
    
    -- Extracted Content
    extracted_text TEXT,
    page_count INTEGER,
    word_count INTEGER,
    
    -- Metadata
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_documents_workspace ON app.documents(workspace_id);
CREATE INDEX idx_documents_status ON app.documents(workspace_id, status);
CREATE INDEX idx_documents_tags ON app.documents USING GIN(tags);
CREATE INDEX idx_documents_fulltext ON app.documents USING GIN(to_tsvector('english', extracted_text));
```

### 4.2 Knowledge Items

```sql
CREATE TABLE app.knowledge_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES app.workspaces(id) ON DELETE CASCADE,
    document_id UUID REFERENCES app.documents(id) ON DELETE SET NULL,
    
    -- Classification
    type TEXT NOT NULL CHECK (type IN (
        'feature', 'benefit', 'pain_point', 'use_case', 
        'persona_trait', 'competitor', 'metric', 'value_proposition',
        'faq', 'testimonial', 'case_study', 'pricing'
    )),
    category TEXT,
    subcategory TEXT,
    
    -- Content
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    
    -- Relationships
    related_items UUID[] DEFAULT '{}',
    parent_item_id UUID REFERENCES app.knowledge_items(id),
    
    -- AI Metadata
    importance TEXT NOT NULL DEFAULT 'medium' 
        CHECK (importance IN ('high', 'medium', 'low')),
    confidence_score DECIMAL(3,2) DEFAULT 1.0,
    ai_generated BOOLEAN NOT NULL DEFAULT TRUE,
    manually_edited BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Source Tracking
    source_location JSONB,  -- { page, paragraph, etc. }
    
    -- Tags & Search
    tags TEXT[] DEFAULT '{}',
    search_vector TSVECTOR,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_knowledge_workspace ON app.knowledge_items(workspace_id);
CREATE INDEX idx_knowledge_type ON app.knowledge_items(workspace_id, type);
CREATE INDEX idx_knowledge_document ON app.knowledge_items(document_id);
CREATE INDEX idx_knowledge_tags ON app.knowledge_items USING GIN(tags);
CREATE INDEX idx_knowledge_search ON app.knowledge_items USING GIN(search_vector);

-- Auto-update search vector
CREATE TRIGGER knowledge_items_search_vector_update
    BEFORE INSERT OR UPDATE ON app.knowledge_items
    FOR EACH ROW EXECUTE FUNCTION
    tsvector_update_trigger(search_vector, 'pg_catalog.english', title, content);
```

### 4.3 Knowledge Embeddings

```sql
CREATE TABLE app.knowledge_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    knowledge_item_id UUID NOT NULL REFERENCES app.knowledge_items(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES app.workspaces(id) ON DELETE CASCADE,
    
    -- Embedding
    embedding vector(1536) NOT NULL,  -- OpenAI ada-002 dimension
    model TEXT NOT NULL DEFAULT 'text-embedding-ada-002',
    
    -- Metadata for filtering
    content_type TEXT NOT NULL,
    persona_ids UUID[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for vector similarity search
CREATE INDEX idx_embeddings_workspace ON app.knowledge_embeddings(workspace_id);
CREATE INDEX idx_embeddings_vector ON app.knowledge_embeddings 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Function for similarity search
CREATE OR REPLACE FUNCTION app.match_knowledge(
    query_embedding vector(1536),
    p_workspace_id UUID,
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    knowledge_item_id UUID,
    content TEXT,
    title TEXT,
    type TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ke.id,
        ke.knowledge_item_id,
        ki.content,
        ki.title,
        ki.type,
        1 - (ke.embedding <=> query_embedding) AS similarity
    FROM app.knowledge_embeddings ke
    JOIN app.knowledge_items ki ON ki.id = ke.knowledge_item_id
    WHERE ke.workspace_id = p_workspace_id
    AND 1 - (ke.embedding <=> query_embedding) > match_threshold
    ORDER BY ke.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

### 4.4 Personas

```sql
CREATE TABLE app.personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES app.workspaces(id) ON DELETE CASCADE,
    
    -- Persona Identity
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    avatar_url TEXT,
    
    -- Demographics
    industry TEXT,
    company_size TEXT,
    location TEXT,
    
    -- Characteristics
    goals TEXT[] NOT NULL DEFAULT '{}',
    pain_points TEXT[] NOT NULL DEFAULT '{}',
    decision_criteria TEXT[] NOT NULL DEFAULT '{}',
    objections TEXT[] NOT NULL DEFAULT '{}',
    
    -- Behavior
    communication_style TEXT CHECK (communication_style IN ('technical', 'business', 'executive')),
    buyer_journey_stage TEXT CHECK (buyer_journey_stage IN ('awareness', 'consideration', 'decision')),
    
    -- Detection Rules
    detection_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    /*
    Example detection_rules:
    [
        {"type": "click_pattern", "condition": "clicked_technical_docs", "weight": 0.8},
        {"type": "scroll_behavior", "condition": "read_pricing_section", "weight": 0.6},
        {"type": "referrer", "condition": "from_linkedin", "weight": 0.4}
    ]
    */
    
    -- Content Mapping
    relevant_knowledge_ids UUID[] DEFAULT '{}',
    preferred_content_types TEXT[] DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- AI Metadata
    ai_generated BOOLEAN NOT NULL DEFAULT TRUE,
    confidence_score DECIMAL(3,2) DEFAULT 1.0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_personas_workspace ON app.personas(workspace_id);
CREATE INDEX idx_personas_active ON app.personas(workspace_id, is_active);
```

---

## 5. Website Generation Tables

### 5.1 Websites

```sql
CREATE TABLE app.websites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES app.workspaces(id) ON DELETE CASCADE,
    
    -- Identity
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'generating', 'preview', 'published', 'archived')),
    
    -- Generation Config
    generation_config JSONB NOT NULL DEFAULT '{
        "includePages": ["home", "features", "pricing", "contact"],
        "enablePersonalization": true,
        "enableAnalytics": true
    }'::jsonb,
    
    -- Domain & Hosting
    custom_domain TEXT,
    subdomain TEXT,
    hosting_provider TEXT,
    deployment_url TEXT,
    
    -- SEO
    seo_config JSONB NOT NULL DEFAULT '{
        "siteName": null,
        "titleTemplate": "%s | {siteName}",
        "defaultDescription": null
    }'::jsonb,
    
    -- Analytics
    analytics_config JSONB NOT NULL DEFAULT '{
        "googleAnalyticsId": null,
        "enableHeatmaps": false
    }'::jsonb,
    
    -- Publishing
    published_at TIMESTAMPTZ,
    published_version_id UUID,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    UNIQUE(workspace_id, slug)
);

-- Indexes
CREATE INDEX idx_websites_workspace ON app.websites(workspace_id);
CREATE INDEX idx_websites_status ON app.websites(workspace_id, status);
CREATE INDEX idx_websites_domain ON app.websites(custom_domain) WHERE custom_domain IS NOT NULL;
```

### 5.2 Brand Configs

```sql
CREATE TABLE app.brand_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES app.websites(id) ON DELETE CASCADE,
    
    -- Logo
    logo JSONB NOT NULL DEFAULT '{
        "light": null,
        "dark": null,
        "favicon": null
    }'::jsonb,
    
    -- Colors
    colors JSONB NOT NULL DEFAULT '{
        "primary": {"50": "#eff6ff", "500": "#3b82f6", "900": "#1e3a8a"},
        "secondary": {"50": "#f5f3ff", "500": "#8b5cf6", "900": "#4c1d95"},
        "accent": {"500": "#f59e0b"},
        "neutral": {"50": "#fafafa", "500": "#737373", "900": "#171717"},
        "success": "#22c55e",
        "warning": "#f59e0b",
        "error": "#ef4444"
    }'::jsonb,
    
    -- Typography
    typography JSONB NOT NULL DEFAULT '{
        "fontFamily": {
            "heading": "Inter",
            "body": "Inter",
            "mono": "JetBrains Mono"
        },
        "fontSize": {
            "xs": "0.75rem",
            "sm": "0.875rem",
            "base": "1rem",
            "lg": "1.125rem",
            "xl": "1.25rem",
            "2xl": "1.5rem",
            "3xl": "1.875rem",
            "4xl": "2.25rem"
        },
        "fontWeight": {
            "normal": 400,
            "medium": 500,
            "semibold": 600,
            "bold": 700
        }
    }'::jsonb,
    
    -- Spacing & Layout
    spacing JSONB NOT NULL DEFAULT '{
        "unit": 8,
        "scale": [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24]
    }'::jsonb,
    
    -- Effects
    effects JSONB NOT NULL DEFAULT '{
        "borderRadius": {
            "none": "0",
            "sm": "0.125rem",
            "md": "0.375rem",
            "lg": "0.5rem",
            "full": "9999px"
        },
        "shadows": {
            "sm": "0 1px 2px rgba(0,0,0,0.05)",
            "md": "0 4px 6px rgba(0,0,0,0.1)",
            "lg": "0 10px 15px rgba(0,0,0,0.1)"
        }
    }'::jsonb,
    
    -- Animations
    animations JSONB NOT NULL DEFAULT '{
        "duration": {
            "fast": "150ms",
            "normal": "300ms",
            "slow": "500ms"
        },
        "easing": {
            "default": "cubic-bezier(0.4, 0, 0.2, 1)"
        }
    }'::jsonb,
    
    -- Generation Mode
    ai_generated BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE UNIQUE INDEX idx_brand_config_website ON app.brand_configs(website_id);
```

### 5.3 Pages

```sql
CREATE TABLE app.pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES app.websites(id) ON DELETE CASCADE,
    
    -- Identity
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    
    -- Classification
    type TEXT NOT NULL CHECK (type IN (
        'home', 'features', 'feature_detail', 'use_case', 
        'persona', 'pricing', 'about', 'contact', 'blog',
        'case_study', 'comparison', 'landing', 'custom'
    )),
    
    -- Content
    layout JSONB NOT NULL DEFAULT '{"sections": []}'::jsonb,
    /*
    Example layout:
    {
        "sections": [
            {
                "id": "hero-1",
                "componentId": "hero-split",
                "variant": "gradient",
                "content": {...},
                "styling": {...},
                "animations": {...}
            }
        ]
    }
    */
    
    -- SEO
    seo JSONB NOT NULL DEFAULT '{
        "title": null,
        "description": null,
        "keywords": [],
        "ogImage": null,
        "noIndex": false
    }'::jsonb,
    
    -- Personalization
    persona_variations JSONB DEFAULT NULL,
    /*
    {
        "persona-uuid": {
            "sections": {...},
            "contentOverrides": {...}
        }
    }
    */
    
    -- Navigation
    show_in_nav BOOLEAN NOT NULL DEFAULT TRUE,
    nav_label TEXT,
    nav_order INTEGER NOT NULL DEFAULT 0,
    parent_page_id UUID REFERENCES app.pages(id),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'published', 'archived')),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    
    -- Constraints
    UNIQUE(website_id, slug)
);

-- Indexes
CREATE INDEX idx_pages_website ON app.pages(website_id);
CREATE INDEX idx_pages_type ON app.pages(website_id, type);
CREATE INDEX idx_pages_nav ON app.pages(website_id, show_in_nav, nav_order);
```

### 5.4 Page Versions

```sql
CREATE TABLE app.page_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES app.pages(id) ON DELETE CASCADE,
    
    -- Version Info
    version_number INTEGER NOT NULL,
    label TEXT,
    
    -- Content Snapshot
    layout JSONB NOT NULL,
    seo JSONB NOT NULL,
    persona_variations JSONB,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- A/B Testing
    is_variant BOOLEAN NOT NULL DEFAULT FALSE,
    variant_name TEXT,
    variant_weight DECIMAL(3,2),
    
    -- Constraints
    UNIQUE(page_id, version_number)
);

-- Indexes
CREATE INDEX idx_page_versions_page ON app.page_versions(page_id);
```

---

## 6. Analytics Tables

### 6.1 Page Views

```sql
CREATE TABLE app.page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES app.websites(id) ON DELETE CASCADE,
    page_id UUID REFERENCES app.pages(id) ON DELETE SET NULL,
    
    -- Session
    session_id TEXT NOT NULL,
    visitor_id TEXT NOT NULL,
    
    -- Page Info
    page_path TEXT NOT NULL,
    page_title TEXT,
    
    -- Timing
    time_on_page INTEGER,  -- seconds
    scroll_depth INTEGER,  -- percentage
    
    -- Device & Location
    device_type TEXT,
    browser TEXT,
    os TEXT,
    country TEXT,
    city TEXT,
    
    -- Traffic Source
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    
    -- Persona Detection
    detected_persona_id UUID REFERENCES app.personas(id),
    persona_confidence DECIMAL(3,2),
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes (partitioned by month for performance)
CREATE INDEX idx_page_views_website_time ON app.page_views(website_id, created_at DESC);
CREATE INDEX idx_page_views_session ON app.page_views(session_id);
CREATE INDEX idx_page_views_visitor ON app.page_views(visitor_id);
```

### 6.2 Interactions

```sql
CREATE TABLE app.interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES app.websites(id) ON DELETE CASCADE,
    page_view_id UUID REFERENCES app.page_views(id) ON DELETE SET NULL,
    
    -- Session
    session_id TEXT NOT NULL,
    visitor_id TEXT NOT NULL,
    
    -- Interaction Details
    type TEXT NOT NULL CHECK (type IN (
        'click', 'scroll', 'form_start', 'form_submit', 'form_abandon',
        'video_play', 'video_complete', 'quiz_start', 'quiz_complete',
        'cta_click', 'download', 'share', 'custom'
    )),
    element_id TEXT,
    element_text TEXT,
    section_id TEXT,
    component_id TEXT,
    
    -- Additional Data
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_interactions_website_time ON app.interactions(website_id, created_at DESC);
CREATE INDEX idx_interactions_type ON app.interactions(website_id, type);
CREATE INDEX idx_interactions_session ON app.interactions(session_id);
```

### 6.3 Lead Captures

```sql
CREATE TABLE app.lead_captures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES app.websites(id) ON DELETE CASCADE,
    page_id UUID REFERENCES app.pages(id) ON DELETE SET NULL,
    
    -- Session
    session_id TEXT,
    visitor_id TEXT,
    
    -- Lead Data
    email TEXT NOT NULL,
    name TEXT,
    company TEXT,
    phone TEXT,
    
    -- Form Details
    form_id TEXT NOT NULL,
    form_name TEXT,
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Source
    source_page TEXT,
    source_component TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    
    -- Persona
    detected_persona_id UUID REFERENCES app.personas(id),
    
    -- Quiz/Survey Results
    quiz_results JSONB,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'new' 
        CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'rejected')),
    
    -- Integration
    synced_to_crm BOOLEAN NOT NULL DEFAULT FALSE,
    crm_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_leads_website ON app.lead_captures(website_id);
CREATE INDEX idx_leads_email ON app.lead_captures(website_id, email);
CREATE INDEX idx_leads_status ON app.lead_captures(website_id, status);
CREATE INDEX idx_leads_time ON app.lead_captures(website_id, created_at DESC);
```

---

## 7. System Tables

### 7.1 Generation Jobs

```sql
CREATE TABLE app.generation_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES app.workspaces(id) ON DELETE CASCADE,
    website_id UUID REFERENCES app.websites(id) ON DELETE SET NULL,
    
    -- Job Type
    type TEXT NOT NULL CHECK (type IN (
        'full_website', 'single_page', 'regenerate_section',
        'document_processing', 'knowledge_extraction', 'embedding_generation'
    )),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    
    -- Progress
    progress INTEGER NOT NULL DEFAULT 0,
    total_steps INTEGER,
    current_step TEXT,
    
    -- Configuration
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Results
    result JSONB,
    error_message TEXT,
    error_details JSONB,
    
    -- Resource Usage
    tokens_used INTEGER DEFAULT 0,
    processing_time_ms INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_jobs_workspace ON app.generation_jobs(workspace_id);
CREATE INDEX idx_jobs_status ON app.generation_jobs(status, created_at DESC);
CREATE INDEX idx_jobs_website ON app.generation_jobs(website_id);
```

### 7.2 Audit Logs

```sql
CREATE TABLE app.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES app.organizations(id) ON DELETE CASCADE,
    
    -- Actor
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    
    -- Action
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    
    -- Details
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_org ON app.audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_user ON app.audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_resource ON app.audit_logs(resource_type, resource_id);

-- Auto-rotate old logs (keep 90 days)
CREATE OR REPLACE FUNCTION app.cleanup_audit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM app.audit_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
```

---

## 8. Row-Level Security Policies

### 8.1 Organization Access

```sql
-- Enable RLS
ALTER TABLE app.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.team_members ENABLE ROW LEVEL SECURITY;

-- Organization policies
CREATE POLICY org_select ON app.organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM app.team_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY org_update ON app.organizations
    FOR UPDATE USING (
        id IN (
            SELECT organization_id FROM app.team_members
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
            AND status = 'active'
        )
    );

-- Workspace policies
CREATE POLICY workspace_select ON app.workspaces
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM app.team_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY workspace_insert ON app.workspaces
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM app.team_members
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
            AND status = 'active'
        )
    );

CREATE POLICY workspace_update ON app.workspaces
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM app.team_members
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
            AND status = 'active'
        )
    );
```

### 8.2 Document & Knowledge Access

```sql
ALTER TABLE app.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.personas ENABLE ROW LEVEL SECURITY;

-- Document policies
CREATE POLICY doc_select ON app.documents
    FOR SELECT USING (
        workspace_id IN (
            SELECT w.id FROM app.workspaces w
            JOIN app.team_members tm ON tm.organization_id = w.organization_id
            WHERE tm.user_id = auth.uid() AND tm.status = 'active'
        )
    );

CREATE POLICY doc_insert ON app.documents
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT w.id FROM app.workspaces w
            JOIN app.team_members tm ON tm.organization_id = w.organization_id
            WHERE tm.user_id = auth.uid() 
            AND tm.role IN ('owner', 'admin', 'editor')
            AND tm.status = 'active'
        )
    );

-- Similar policies for knowledge_items and personas
```

### 8.3 Website Access

```sql
ALTER TABLE app.websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.brand_configs ENABLE ROW LEVEL SECURITY;

-- Website policies following same pattern
CREATE POLICY website_select ON app.websites
    FOR SELECT USING (
        workspace_id IN (
            SELECT w.id FROM app.workspaces w
            JOIN app.team_members tm ON tm.organization_id = w.organization_id
            WHERE tm.user_id = auth.uid() AND tm.status = 'active'
        )
    );
```

---

## 9. Helper Functions

### 9.1 Updated At Trigger

```sql
CREATE OR REPLACE FUNCTION app.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 9.2 Get User Organizations

```sql
CREATE OR REPLACE FUNCTION app.get_user_organizations(p_user_id UUID)
RETURNS TABLE (
    organization_id UUID,
    organization_name TEXT,
    role TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        tm.role
    FROM app.organizations o
    JOIN app.team_members tm ON tm.organization_id = o.id
    WHERE tm.user_id = p_user_id
    AND tm.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 9.3 Check Plan Limits

```sql
CREATE OR REPLACE FUNCTION app.check_plan_limit(
    p_organization_id UUID,
    p_limit_key TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_limit INTEGER;
    v_current INTEGER;
BEGIN
    -- Get limit
    SELECT (plan_limits->>p_limit_key)::INTEGER 
    INTO v_limit
    FROM app.organizations WHERE id = p_organization_id;
    
    -- Get current count based on limit type
    CASE p_limit_key
        WHEN 'max_workspaces' THEN
            SELECT COUNT(*) INTO v_current 
            FROM app.workspaces WHERE organization_id = p_organization_id;
        WHEN 'max_websites' THEN
            SELECT COUNT(*) INTO v_current 
            FROM app.websites w
            JOIN app.workspaces ws ON w.workspace_id = ws.id
            WHERE ws.organization_id = p_organization_id;
        ELSE
            RETURN TRUE;
    END CASE;
    
    RETURN v_current < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 10. Migrations

### 10.1 Initial Migration

```sql
-- Migration: 001_initial_schema
-- Created: 2024-11-01

BEGIN;

-- Create schema
CREATE SCHEMA IF NOT EXISTS app;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create all tables (as defined above)
-- ...

-- Create RLS policies (as defined above)
-- ...

-- Create functions (as defined above)
-- ...

COMMIT;
```

---

## 11. Performance Considerations

### 11.1 Indexing Strategy

| Table | Index Type | Columns | Purpose |
|-------|------------|---------|---------|
| knowledge_embeddings | IVFFlat | embedding | Vector similarity search |
| knowledge_items | GIN | search_vector | Full-text search |
| documents | GIN | tags | Tag filtering |
| page_views | BRIN | created_at | Time-range queries |

### 11.2 Partitioning

Consider partitioning for high-volume tables:
- `page_views` - by month
- `interactions` - by month
- `audit_logs` - by month

### 11.3 Connection Pooling

Use Supabase connection pooler or PgBouncer for high-concurrency workloads.
