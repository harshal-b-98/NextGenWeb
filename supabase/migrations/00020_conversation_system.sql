-- Migration: Conversation System for AI Discovery & Refinement
-- Purpose: Enable conversational interface for website creation and refinement
-- Epic: NextGenWeb Complete Product Reimplementation

-- ============================================================================
-- 1. Conversation Sessions Table
-- ============================================================================
-- Tracks discovery and refinement conversations with state machine

CREATE TABLE conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Conversation type
  type VARCHAR(50) NOT NULL CHECK (type IN ('discovery', 'refinement')),

  -- State machine
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  current_stage VARCHAR(100), -- 'understanding', 'clarifying', 'generating', 'refining'

  -- Accumulated context from conversation
  context JSONB DEFAULT '{}'::jsonb,

  -- Output
  generated_website_id UUID REFERENCES websites(id),

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_conversation_workspace ON conversation_sessions(workspace_id, status);
CREATE INDEX idx_conversation_type ON conversation_sessions(type, status);
CREATE INDEX idx_conversation_website ON conversation_sessions(generated_website_id);

-- ============================================================================
-- 2. Conversation Messages Table
-- ============================================================================
-- Stores the complete conversation transcript

CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,

  -- Message details
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- AI metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- intent, entities, confidence, etc.

  -- Ordering
  sequence_number INTEGER NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(session_id, sequence_number)
);

-- Indexes for performance
CREATE INDEX idx_messages_session ON conversation_messages(session_id, sequence_number);
CREATE INDEX idx_messages_role ON conversation_messages(session_id, role);

-- ============================================================================
-- 3. Row-Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view conversations for their workspaces
CREATE POLICY "Users can view conversations for their workspaces"
ON conversation_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = conversation_sessions.workspace_id
    AND wm.user_id = auth.uid()
  )
);

-- Policy: Users can create conversations in their workspaces
CREATE POLICY "Users can create conversations in their workspaces"
ON conversation_sessions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = conversation_sessions.workspace_id
    AND wm.user_id = auth.uid()
  )
);

-- Policy: Users can update their conversations
CREATE POLICY "Users can update conversations in their workspaces"
ON conversation_sessions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = conversation_sessions.workspace_id
    AND wm.user_id = auth.uid()
  )
);

-- Policy: Users can delete their conversations
CREATE POLICY "Users can delete conversations in their workspaces"
ON conversation_sessions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = conversation_sessions.workspace_id
    AND wm.user_id = auth.uid()
  )
);

-- Messages policies (inherit from session)
CREATE POLICY "Users can view messages for their conversations"
ON conversation_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_sessions cs
    INNER JOIN workspace_members wm ON cs.workspace_id = wm.workspace_id
    WHERE cs.id = conversation_messages.session_id
    AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their conversations"
ON conversation_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversation_sessions cs
    INNER JOIN workspace_members wm ON cs.workspace_id = wm.workspace_id
    WHERE cs.id = conversation_messages.session_id
    AND wm.user_id = auth.uid()
  )
);

-- ============================================================================
-- 4. Helper Functions
-- ============================================================================

-- Function: Get next message sequence number
CREATE OR REPLACE FUNCTION get_next_message_sequence(p_session_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_max_sequence INTEGER;
BEGIN
  SELECT COALESCE(MAX(sequence_number), 0) + 1
  INTO v_max_sequence
  FROM conversation_messages
  WHERE session_id = p_session_id;

  RETURN v_max_sequence;
END;
$$;

-- Function: Update conversation timestamp on new message
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE conversation_sessions
  SET updated_at = NOW()
  WHERE id = NEW.session_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_conversation_timestamp
AFTER INSERT ON conversation_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- ============================================================================
-- 5. Comments for documentation
-- ============================================================================

COMMENT ON TABLE conversation_sessions IS
'Tracks AI-driven discovery and refinement conversations with state machine for website creation';

COMMENT ON COLUMN conversation_sessions.type IS
'Type of conversation: discovery (initial creation) or refinement (iterating on existing website)';

COMMENT ON COLUMN conversation_sessions.context IS
'JSONB storing accumulated answers, decisions, and extracted information from the conversation';

COMMENT ON TABLE conversation_messages IS
'Complete conversation transcript with AI metadata for intent classification and entity extraction';

COMMENT ON FUNCTION get_next_message_sequence IS
'Returns the next sequence number for messages in a conversation session';
