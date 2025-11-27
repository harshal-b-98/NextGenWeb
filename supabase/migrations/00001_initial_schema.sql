-- NextGenWeb Initial Database Schema
-- Multi-tenant architecture with Row Level Security (RLS)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- Create custom types
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
CREATE TYPE document_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE website_status AS ENUM ('draft', 'generating', 'published', 'archived');
CREATE TYPE persona_confidence AS ENUM ('low', 'medium', 'high');

-- =====================
-- WORKSPACES TABLE
-- =====================
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workspaces_slug ON workspaces(slug);

-- =====================
-- WORKSPACE MEMBERS TABLE
-- =====================
CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'viewer',
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);

-- =====================
-- DOCUMENTS TABLE
-- =====================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    status document_status DEFAULT 'pending',
    extracted_text TEXT,
    metadata JSONB DEFAULT '{}',
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_workspace ON documents(workspace_id);
CREATE INDEX idx_documents_status ON documents(status);

-- =====================
-- KNOWLEDGE BASE ITEMS TABLE
-- =====================
CREATE TABLE knowledge_base_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    entity_type VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_knowledge_items_workspace ON knowledge_base_items(workspace_id);
CREATE INDEX idx_knowledge_items_type ON knowledge_base_items(entity_type);
CREATE INDEX idx_knowledge_items_document ON knowledge_base_items(document_id);

-- =====================
-- KNOWLEDGE EMBEDDINGS TABLE
-- =====================
CREATE TABLE knowledge_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    knowledge_item_id UUID NOT NULL REFERENCES knowledge_base_items(id) ON DELETE CASCADE,
    embedding vector(1536), -- OpenAI text-embedding-3-small dimension
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_embeddings_item ON knowledge_embeddings(knowledge_item_id);

-- Create HNSW index for fast similarity search
CREATE INDEX idx_embeddings_vector ON knowledge_embeddings
USING hnsw (embedding vector_cosine_ops);

-- =====================
-- PERSONAS TABLE
-- =====================
CREATE TABLE personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    attributes JSONB DEFAULT '{}',
    pain_points TEXT[] DEFAULT '{}',
    goals TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    confidence persona_confidence DEFAULT 'medium',
    is_auto_detected BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_personas_workspace ON personas(workspace_id);

-- =====================
-- WEBSITES TABLE
-- =====================
CREATE TABLE websites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    status website_status DEFAULT 'draft',
    domain VARCHAR(255),
    settings JSONB DEFAULT '{}',
    brand_config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    UNIQUE(workspace_id, slug)
);

CREATE INDEX idx_websites_workspace ON websites(workspace_id);
CREATE INDEX idx_websites_status ON websites(status);

-- =====================
-- PAGES TABLE
-- =====================
CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    path VARCHAR(512) NOT NULL,
    content JSONB DEFAULT '{}',
    seo_metadata JSONB DEFAULT '{}',
    is_homepage BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(website_id, path)
);

CREATE INDEX idx_pages_website ON pages(website_id);
CREATE INDEX idx_pages_path ON pages(path);

-- =====================
-- PAGE VERSIONS TABLE
-- =====================
CREATE TABLE page_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content JSONB NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(page_id, version_number)
);

CREATE INDEX idx_page_versions_page ON page_versions(page_id);

-- =====================
-- LEAD CAPTURES TABLE
-- =====================
CREATE TABLE lead_captures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    page_id UUID REFERENCES pages(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    data JSONB DEFAULT '{}',
    persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
    source VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_website ON lead_captures(website_id);
CREATE INDEX idx_leads_email ON lead_captures(email);
CREATE INDEX idx_leads_created ON lead_captures(created_at DESC);

-- =====================
-- ANALYTICS EVENTS TABLE
-- =====================
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    page_id UUID REFERENCES pages(id) ON DELETE SET NULL,
    session_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}',
    persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_website ON analytics_events(website_id);
CREATE INDEX idx_analytics_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created ON analytics_events(created_at DESC);

-- =====================
-- FUNCTIONS
-- =====================

-- Function to match embeddings for semantic search
CREATE OR REPLACE FUNCTION match_embeddings(
    query_embedding vector(1536),
    match_threshold float,
    match_count int,
    filter_workspace_id uuid
)
RETURNS TABLE (
    id uuid,
    content text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ke.id,
        ke.chunk_text as content,
        1 - (ke.embedding <=> query_embedding) as similarity
    FROM knowledge_embeddings ke
    JOIN knowledge_base_items kbi ON ke.knowledge_item_id = kbi.id
    WHERE kbi.workspace_id = filter_workspace_id
    AND 1 - (ke.embedding <=> query_embedding) > match_threshold
    ORDER BY ke.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_members_updated_at BEFORE UPDATE ON workspace_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_items_updated_at BEFORE UPDATE ON knowledge_base_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_websites_updated_at BEFORE UPDATE ON websites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- ROW LEVEL SECURITY (RLS)
-- =====================

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Helper function to check workspace membership
CREATE OR REPLACE FUNCTION is_workspace_member(workspace_uuid uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_id = workspace_uuid
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's role in workspace
CREATE OR REPLACE FUNCTION get_workspace_role(workspace_uuid uuid)
RETURNS user_role AS $$
DECLARE
    user_role_result user_role;
BEGIN
    SELECT role INTO user_role_result
    FROM workspace_members
    WHERE workspace_id = workspace_uuid
    AND user_id = auth.uid();

    RETURN user_role_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Workspaces policies
CREATE POLICY "Users can view workspaces they are members of"
    ON workspaces FOR SELECT
    USING (is_workspace_member(id));

CREATE POLICY "Only owners and admins can update workspaces"
    ON workspaces FOR UPDATE
    USING (get_workspace_role(id) IN ('owner', 'admin'));

CREATE POLICY "Only owners can delete workspaces"
    ON workspaces FOR DELETE
    USING (get_workspace_role(id) = 'owner');

CREATE POLICY "Authenticated users can create workspaces"
    ON workspaces FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Workspace members policies
CREATE POLICY "Members can view other members in their workspaces"
    ON workspace_members FOR SELECT
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Only owners and admins can manage members"
    ON workspace_members FOR ALL
    USING (get_workspace_role(workspace_id) IN ('owner', 'admin'));

-- Documents policies
CREATE POLICY "Members can view documents"
    ON documents FOR SELECT
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Editors and above can create documents"
    ON documents FOR INSERT
    WITH CHECK (get_workspace_role(workspace_id) IN ('owner', 'admin', 'editor'));

CREATE POLICY "Editors and above can update documents"
    ON documents FOR UPDATE
    USING (get_workspace_role(workspace_id) IN ('owner', 'admin', 'editor'));

CREATE POLICY "Admins and owners can delete documents"
    ON documents FOR DELETE
    USING (get_workspace_role(workspace_id) IN ('owner', 'admin'));

-- Knowledge base items policies
CREATE POLICY "Members can view knowledge items"
    ON knowledge_base_items FOR SELECT
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Editors and above can manage knowledge items"
    ON knowledge_base_items FOR ALL
    USING (get_workspace_role(workspace_id) IN ('owner', 'admin', 'editor'));

-- Knowledge embeddings policies (inherit from knowledge items)
CREATE POLICY "Members can view embeddings"
    ON knowledge_embeddings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM knowledge_base_items kbi
            WHERE kbi.id = knowledge_embeddings.knowledge_item_id
            AND is_workspace_member(kbi.workspace_id)
        )
    );

CREATE POLICY "System can manage embeddings"
    ON knowledge_embeddings FOR ALL
    USING (true)
    WITH CHECK (true);

-- Personas policies
CREATE POLICY "Members can view personas"
    ON personas FOR SELECT
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Editors and above can manage personas"
    ON personas FOR ALL
    USING (get_workspace_role(workspace_id) IN ('owner', 'admin', 'editor'));

-- Websites policies
CREATE POLICY "Members can view websites"
    ON websites FOR SELECT
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Editors and above can manage websites"
    ON websites FOR ALL
    USING (get_workspace_role(workspace_id) IN ('owner', 'admin', 'editor'));

-- Pages policies
CREATE POLICY "Members can view pages"
    ON pages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM websites w
            WHERE w.id = pages.website_id
            AND is_workspace_member(w.workspace_id)
        )
    );

CREATE POLICY "Editors and above can manage pages"
    ON pages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM websites w
            WHERE w.id = pages.website_id
            AND get_workspace_role(w.workspace_id) IN ('owner', 'admin', 'editor')
        )
    );

-- Page versions policies
CREATE POLICY "Members can view page versions"
    ON page_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM pages p
            JOIN websites w ON w.id = p.website_id
            WHERE p.id = page_versions.page_id
            AND is_workspace_member(w.workspace_id)
        )
    );

CREATE POLICY "Editors and above can manage page versions"
    ON page_versions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM pages p
            JOIN websites w ON w.id = p.website_id
            WHERE p.id = page_versions.page_id
            AND get_workspace_role(w.workspace_id) IN ('owner', 'admin', 'editor')
        )
    );

-- Lead captures policies
CREATE POLICY "Members can view leads"
    ON lead_captures FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM websites w
            WHERE w.id = lead_captures.website_id
            AND is_workspace_member(w.workspace_id)
        )
    );

CREATE POLICY "Public can submit leads"
    ON lead_captures FOR INSERT
    WITH CHECK (true);

-- Analytics events policies
CREATE POLICY "Members can view analytics"
    ON analytics_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM websites w
            WHERE w.id = analytics_events.website_id
            AND is_workspace_member(w.workspace_id)
        )
    );

CREATE POLICY "Public can submit analytics events"
    ON analytics_events FOR INSERT
    WITH CHECK (true);

-- =====================
-- STORAGE BUCKETS
-- =====================

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for website assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('website-assets', 'website-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Members can upload documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'documents'
        AND auth.uid() IS NOT NULL
    );

CREATE POLICY "Members can view their workspace documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'documents'
        AND auth.uid() IS NOT NULL
    );

-- Storage policies for website-assets bucket (public)
CREATE POLICY "Anyone can view website assets"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'website-assets');

CREATE POLICY "Members can upload website assets"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'website-assets'
        AND auth.uid() IS NOT NULL
    );
