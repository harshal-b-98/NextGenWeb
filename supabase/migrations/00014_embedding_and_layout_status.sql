-- Migration: Add embedding status tracking and layout status
-- This enables tracking of embedding generation status in the knowledge base
-- and layout generation status for pages

-- ============================================================================
-- 1. ADD EMBEDDING STATUS TO KNOWLEDGE BASE ITEMS
-- ============================================================================

-- Add embedding_status column to knowledge_base_items
ALTER TABLE knowledge_base_items
ADD COLUMN IF NOT EXISTS embedding_status TEXT DEFAULT 'pending'
CHECK (embedding_status IN ('pending', 'generating', 'completed', 'failed'));

-- Add embedding error tracking
ALTER TABLE knowledge_base_items
ADD COLUMN IF NOT EXISTS embedding_error TEXT;

-- Add embedding count for quick reference
ALTER TABLE knowledge_base_items
ADD COLUMN IF NOT EXISTS embeddings_count INTEGER DEFAULT 0;

-- Add timestamp for when embeddings were generated
ALTER TABLE knowledge_base_items
ADD COLUMN IF NOT EXISTS embeddings_generated_at TIMESTAMPTZ;

-- Create index for faster queries on embedding status
CREATE INDEX IF NOT EXISTS idx_knowledge_base_items_embedding_status
ON knowledge_base_items(embedding_status);

-- ============================================================================
-- 2. ADD LAYOUT STATUS TO PAGES
-- ============================================================================

-- Add layout_status column to pages
ALTER TABLE pages
ADD COLUMN IF NOT EXISTS layout_status TEXT DEFAULT 'draft'
CHECK (layout_status IN ('draft', 'generating', 'generated', 'published', 'failed'));

-- Add layout error tracking
ALTER TABLE pages
ADD COLUMN IF NOT EXISTS layout_error TEXT;

-- Add timestamp for when layout was generated
ALTER TABLE pages
ADD COLUMN IF NOT EXISTS layout_generated_at TIMESTAMPTZ;

-- Create index for faster queries on layout status
CREATE INDEX IF NOT EXISTS idx_pages_layout_status
ON pages(layout_status);

-- ============================================================================
-- 3. ADD GENERATION STATUS TO WEBSITES
-- ============================================================================

-- Add generation_status column to websites
ALTER TABLE websites
ADD COLUMN IF NOT EXISTS generation_status TEXT DEFAULT 'draft'
CHECK (generation_status IN ('draft', 'generating', 'generated', 'published'));

-- Add last generation timestamp
ALTER TABLE websites
ADD COLUMN IF NOT EXISTS last_generated_at TIMESTAMPTZ;

-- ============================================================================
-- 4. UPDATE EXISTING RECORDS
-- ============================================================================

-- Update existing knowledge_base_items with embeddings to 'completed'
UPDATE knowledge_base_items kbi
SET embedding_status = 'completed',
    embeddings_count = (
      SELECT COUNT(*)
      FROM knowledge_embeddings ke
      WHERE ke.knowledge_item_id = kbi.id
    ),
    embeddings_generated_at = NOW()
WHERE EXISTS (
  SELECT 1
  FROM knowledge_embeddings ke
  WHERE ke.knowledge_item_id = kbi.id
);

-- Update existing pages with content to 'generated'
UPDATE pages
SET layout_status = 'generated',
    layout_generated_at = NOW()
WHERE content IS NOT NULL
  AND content::text != '{}'
  AND content::text != 'null';

-- Update existing websites with pages to 'generated'
UPDATE websites w
SET generation_status = 'generated',
    last_generated_at = NOW()
WHERE EXISTS (
  SELECT 1
  FROM pages p
  WHERE p.website_id = w.id
);

-- ============================================================================
-- 5. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to get embedding stats for a workspace
CREATE OR REPLACE FUNCTION get_workspace_embedding_stats(workspace_id_param UUID)
RETURNS TABLE (
  total_items BIGINT,
  pending_count BIGINT,
  generating_count BIGINT,
  completed_count BIGINT,
  failed_count BIGINT,
  total_embeddings BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_items,
    COUNT(*) FILTER (WHERE embedding_status = 'pending')::BIGINT as pending_count,
    COUNT(*) FILTER (WHERE embedding_status = 'generating')::BIGINT as generating_count,
    COUNT(*) FILTER (WHERE embedding_status = 'completed')::BIGINT as completed_count,
    COUNT(*) FILTER (WHERE embedding_status = 'failed')::BIGINT as failed_count,
    COALESCE(SUM(embeddings_count), 0)::BIGINT as total_embeddings
  FROM knowledge_base_items
  WHERE knowledge_base_items.workspace_id = workspace_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get layout generation stats for a website
CREATE OR REPLACE FUNCTION get_website_layout_stats(website_id_param UUID)
RETURNS TABLE (
  total_pages BIGINT,
  draft_count BIGINT,
  generating_count BIGINT,
  generated_count BIGINT,
  published_count BIGINT,
  failed_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_pages,
    COUNT(*) FILTER (WHERE layout_status = 'draft')::BIGINT as draft_count,
    COUNT(*) FILTER (WHERE layout_status = 'generating')::BIGINT as generating_count,
    COUNT(*) FILTER (WHERE layout_status = 'generated')::BIGINT as generated_count,
    COUNT(*) FILTER (WHERE layout_status = 'published')::BIGINT as published_count,
    COUNT(*) FILTER (WHERE layout_status = 'failed')::BIGINT as failed_count
  FROM pages
  WHERE pages.website_id = website_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_workspace_embedding_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_website_layout_stats(UUID) TO authenticated;
