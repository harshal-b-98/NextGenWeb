/**
 * Database types for NextGenWeb
 * Auto-generated types should be placed in types/supabase.ts
 * This file contains custom types that extend the generated types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// User roles for workspace access
export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';

// Document processing status
export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Website generation status
export type WebsiteStatus = 'draft' | 'generating' | 'published' | 'archived';

// Persona confidence level
export type PersonaConfidence = 'low' | 'medium' | 'high';

// Core database tables
export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: UserRole;
          invited_by: string | null;
          invited_at: string | null;
          joined_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: UserRole;
          invited_by?: string | null;
          invited_at?: string | null;
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: UserRole;
          invited_by?: string | null;
          invited_at?: string | null;
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          file_path: string;
          file_type: string;
          file_size: number;
          status: DocumentStatus;
          extracted_text: string | null;
          metadata: Json;
          uploaded_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          file_path: string;
          file_type: string;
          file_size: number;
          status?: DocumentStatus;
          extracted_text?: string | null;
          metadata?: Json;
          uploaded_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          file_path?: string;
          file_type?: string;
          file_size?: number;
          status?: DocumentStatus;
          extracted_text?: string | null;
          metadata?: Json;
          uploaded_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      knowledge_base_items: {
        Row: {
          id: string;
          workspace_id: string;
          document_id: string | null;
          entity_type: string;
          content: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          document_id?: string | null;
          entity_type: string;
          content: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          document_id?: string | null;
          entity_type?: string;
          content?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      knowledge_embeddings: {
        Row: {
          id: string;
          knowledge_item_id: string;
          embedding: number[];
          chunk_index: number;
          chunk_text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          knowledge_item_id: string;
          embedding: number[];
          chunk_index: number;
          chunk_text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          knowledge_item_id?: string;
          embedding?: number[];
          chunk_index?: number;
          chunk_text?: string;
          created_at?: string;
        };
      };
      personas: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          description: string | null;
          attributes: Json;
          pain_points: string[];
          goals: string[];
          keywords: string[];
          confidence: PersonaConfidence;
          is_auto_detected: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          description?: string | null;
          attributes?: Json;
          pain_points?: string[];
          goals?: string[];
          keywords?: string[];
          confidence?: PersonaConfidence;
          is_auto_detected?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          description?: string | null;
          attributes?: Json;
          pain_points?: string[];
          goals?: string[];
          keywords?: string[];
          confidence?: PersonaConfidence;
          is_auto_detected?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      websites: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          slug: string;
          status: WebsiteStatus;
          domain: string | null;
          settings: Json;
          brand_config: Json;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          slug: string;
          status?: WebsiteStatus;
          domain?: string | null;
          settings?: Json;
          brand_config?: Json;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          slug?: string;
          status?: WebsiteStatus;
          domain?: string | null;
          settings?: Json;
          brand_config?: Json;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
      };
      pages: {
        Row: {
          id: string;
          website_id: string;
          title: string;
          slug: string;
          path: string;
          content: Json;
          seo_metadata: Json;
          is_homepage: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          website_id: string;
          title: string;
          slug: string;
          path: string;
          content?: Json;
          seo_metadata?: Json;
          is_homepage?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          website_id?: string;
          title?: string;
          slug?: string;
          path?: string;
          content?: Json;
          seo_metadata?: Json;
          is_homepage?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      lead_captures: {
        Row: {
          id: string;
          website_id: string;
          page_id: string | null;
          email: string;
          name: string | null;
          data: Json;
          persona_id: string | null;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          website_id: string;
          page_id?: string | null;
          email: string;
          name?: string | null;
          data?: Json;
          persona_id?: string | null;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          website_id?: string;
          page_id?: string | null;
          email?: string;
          name?: string | null;
          data?: Json;
          persona_id?: string | null;
          source?: string | null;
          created_at?: string;
        };
      };
      analytics_events: {
        Row: {
          id: string;
          website_id: string;
          page_id: string | null;
          session_id: string;
          event_type: string;
          event_data: Json;
          persona_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          website_id: string;
          page_id?: string | null;
          session_id: string;
          event_type: string;
          event_data?: Json;
          persona_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          website_id?: string;
          page_id?: string | null;
          session_id?: string;
          event_type?: string;
          event_data?: Json;
          persona_id?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      match_embeddings: {
        Args: {
          query_embedding: number[];
          match_threshold: number;
          match_count: number;
          workspace_id: string;
        };
        Returns: {
          id: string;
          content: string;
          similarity: number;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      document_status: DocumentStatus;
      website_status: WebsiteStatus;
      persona_confidence: PersonaConfidence;
    };
  };
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Convenience type aliases
export type Workspace = Tables<'workspaces'>;
export type WorkspaceMember = Tables<'workspace_members'>;
export type Document = Tables<'documents'>;
export type KnowledgeBaseItem = Tables<'knowledge_base_items'>;
export type KnowledgeEmbedding = Tables<'knowledge_embeddings'>;
export type Persona = Tables<'personas'>;
export type Website = Tables<'websites'>;
export type Page = Tables<'pages'>;
export type LeadCapture = Tables<'lead_captures'>;
export type AnalyticsEvent = Tables<'analytics_events'>;
