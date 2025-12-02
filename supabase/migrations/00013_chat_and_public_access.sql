-- Migration: Public Website Access and Chat Messages
-- Phase 4.4: AI-Powered Conversational Interface
--
-- Adds:
-- 1. Public read policies for published websites and their pages
-- 2. Chat messages table for storing conversation history
-- 3. Chat sessions table for session management

-- =====================
-- PUBLIC ACCESS POLICIES
-- =====================

-- Allow anyone to view published websites (for public site access and chat)
CREATE POLICY "Anyone can view published websites"
    ON websites FOR SELECT
    USING (status = 'published');

-- Allow anyone to view pages of published websites
CREATE POLICY "Anyone can view pages of published websites"
    ON pages FOR SELECT
    USING (
        website_id IN (
            SELECT id FROM websites WHERE status = 'published'
        )
    );

-- =====================
-- CHAT SESSIONS TABLE
-- =====================
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    visitor_id VARCHAR(255), -- Anonymous visitor identifier (optional)
    persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
    persona_confidence DECIMAL(3,2) DEFAULT 0.0,
    engagement_score DECIMAL(5,2) DEFAULT 0.0,
    current_page VARCHAR(512),
    current_section VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

CREATE INDEX idx_chat_sessions_website ON chat_sessions(website_id);
CREATE INDEX idx_chat_sessions_visitor ON chat_sessions(visitor_id);
CREATE INDEX idx_chat_sessions_last_activity ON chat_sessions(last_activity_at);

-- =====================
-- CHAT MESSAGES TABLE
-- =====================
CREATE TYPE chat_message_role AS ENUM ('user', 'assistant', 'system');
CREATE TYPE chat_content_type AS ENUM (
    'text',
    'card-grid',
    'comparison-table',
    'stats-display',
    'cta-block',
    'faq-accordion',
    'timeline',
    'form'
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    role chat_message_role NOT NULL,
    content TEXT NOT NULL,
    content_type chat_content_type DEFAULT 'text',
    structured_content JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_website ON chat_messages(website_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);

-- =====================
-- RLS POLICIES FOR CHAT
-- =====================
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Workspace members can view all chat sessions for their websites
CREATE POLICY "Members can view chat sessions for their websites"
    ON chat_sessions FOR SELECT
    USING (
        website_id IN (
            SELECT w.id FROM websites w
            WHERE is_workspace_member(w.workspace_id)
        )
    );

-- Anyone can create chat sessions on published websites (for visitors)
CREATE POLICY "Anyone can create chat sessions on published websites"
    ON chat_sessions FOR INSERT
    WITH CHECK (
        website_id IN (
            SELECT id FROM websites WHERE status = 'published'
        )
    );

-- Anyone can update their own chat session (for tracking last_activity)
CREATE POLICY "Anyone can update chat sessions"
    ON chat_sessions FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Workspace members can view all chat messages for their websites
CREATE POLICY "Members can view chat messages for their websites"
    ON chat_messages FOR SELECT
    USING (
        website_id IN (
            SELECT w.id FROM websites w
            WHERE is_workspace_member(w.workspace_id)
        )
    );

-- Anyone can insert chat messages on published websites (for visitors)
CREATE POLICY "Anyone can insert chat messages on published websites"
    ON chat_messages FOR INSERT
    WITH CHECK (
        website_id IN (
            SELECT id FROM websites WHERE status = 'published'
        )
    );

-- =====================
-- HELPER FUNCTION FOR CHAT
-- =====================

-- Function to get workspace_id from website (used by chat engine)
CREATE OR REPLACE FUNCTION get_workspace_id_for_website(website_id_param UUID)
RETURNS UUID AS $$
    SELECT workspace_id FROM websites WHERE id = website_id_param;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to get workspace_id from website slug (used by chat engine)
CREATE OR REPLACE FUNCTION get_workspace_id_for_website_slug(slug_param VARCHAR)
RETURNS UUID AS $$
    SELECT workspace_id FROM websites WHERE slug = slug_param;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
