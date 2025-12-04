/**
 * Database types for NextGenWeb
 * This file contains type definitions compatible with @supabase/supabase-js v2.86+
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

// Embedding generation status for knowledge base items
export type EmbeddingStatus = 'pending' | 'generating' | 'completed' | 'failed';

// Layout generation status for pages
export type LayoutStatus = 'draft' | 'generating' | 'generated' | 'published' | 'failed';

// Website generation status
export type WebsiteGenerationStatus = 'draft' | 'generating' | 'generated' | 'published';

// Persona confidence level
export type PersonaConfidence = 'low' | 'medium' | 'high';

// Communication style for personas
export type CommunicationStyle = 'technical' | 'business' | 'executive';

// Buyer journey stage for personas
export type BuyerJourneyStage = 'awareness' | 'consideration' | 'decision';

// Interactive element type
export type InteractiveElementType = 'quiz' | 'calculator' | 'survey' | 'comparison' | 'configurator' | 'form' | 'timeline' | 'carousel' | 'tabs' | 'modal' | 'drawer';

// Interactive element status
export type InteractiveElementStatus = 'draft' | 'published' | 'archived';

// Global component type (header, footer, etc.)
export type GlobalComponentType = 'header' | 'footer' | 'announcement-bar' | 'cookie-banner' | 'sidebar' | 'chat-widget';

// Feedback system types
export type FeedbackType = 'content' | 'style' | 'layout' | 'remove' | 'add' | 'reorder';
export type FeedbackStatus = 'pending' | 'processing' | 'applied' | 'rejected' | 'superseded';
export type RevisionType = 'initial' | 'feedback' | 'rollback' | 'manual' | 'regeneration';
export type ApprovalStatus = 'draft' | 'in_review' | 'changes_requested' | 'approved' | 'published';

// Website version types (Epic #146)
export type VersionStatus = 'draft' | 'production';
export type VersionTriggerType = 'initial' | 'feedback' | 'rollback' | 'manual' | 'finalization';

// Conversation types (Epic #177 - Complete Reimplementation)
export type ConversationType = 'discovery' | 'refinement';
export type ConversationStatus = 'active' | 'completed' | 'abandoned';
export type MessageRole = 'user' | 'assistant' | 'system';

// Deployment status
export type DeploymentStatus = 'pending' | 'building' | 'deploying' | 'ready' | 'error' | 'canceled';

// Deployment provider
export type DeploymentProvider = 'vercel' | 'netlify' | 'custom';

// Activity event types
export type ActivityCategory = 'workspace' | 'member' | 'document' | 'knowledge' | 'website' | 'page' | 'deployment' | 'domain' | 'brand' | 'export';
export type ActivitySeverity = 'info' | 'success' | 'warning' | 'error';

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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: 'workspace_members_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workspace_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: 'documents_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'documents_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
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
          // Embedding status tracking fields
          embedding_status: EmbeddingStatus;
          embedding_error: string | null;
          embeddings_count: number;
          embeddings_generated_at: string | null;
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
          // Embedding status tracking fields
          embedding_status?: EmbeddingStatus;
          embedding_error?: string | null;
          embeddings_count?: number;
          embeddings_generated_at?: string | null;
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
          // Embedding status tracking fields
          embedding_status?: EmbeddingStatus;
          embedding_error?: string | null;
          embeddings_count?: number;
          embeddings_generated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'knowledge_base_items_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'knowledge_base_items_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'documents';
            referencedColumns: ['id'];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: 'knowledge_embeddings_knowledge_item_id_fkey';
            columns: ['knowledge_item_id'];
            isOneToOne: false;
            referencedRelation: 'knowledge_base_items';
            referencedColumns: ['id'];
          }
        ];
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
          // Enhanced persona fields from migration 00003
          title: string | null;
          avatar_url: string | null;
          industry: string | null;
          company_size: string | null;
          location: string | null;
          decision_criteria: string[];
          objections: string[];
          key_metrics: string[];
          communication_style: CommunicationStyle;
          buyer_journey_stage: BuyerJourneyStage;
          detection_rules: Json;
          relevant_knowledge_ids: string[];
          preferred_content_types: string[];
          content_preferences: Json;
          is_active: boolean;
          is_primary: boolean;
          ai_generated: boolean;
          confidence_score: number;
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
          // Enhanced persona fields
          title?: string | null;
          avatar_url?: string | null;
          industry?: string | null;
          company_size?: string | null;
          location?: string | null;
          decision_criteria?: string[];
          objections?: string[];
          key_metrics?: string[];
          communication_style?: CommunicationStyle;
          buyer_journey_stage?: BuyerJourneyStage;
          detection_rules?: Json;
          relevant_knowledge_ids?: string[];
          preferred_content_types?: string[];
          content_preferences?: Json;
          is_active?: boolean;
          is_primary?: boolean;
          ai_generated?: boolean;
          confidence_score?: number;
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
          // Enhanced persona fields
          title?: string | null;
          avatar_url?: string | null;
          industry?: string | null;
          company_size?: string | null;
          location?: string | null;
          decision_criteria?: string[];
          objections?: string[];
          key_metrics?: string[];
          communication_style?: CommunicationStyle;
          buyer_journey_stage?: BuyerJourneyStage;
          detection_rules?: Json;
          relevant_knowledge_ids?: string[];
          preferred_content_types?: string[];
          content_preferences?: Json;
          is_active?: boolean;
          is_primary?: boolean;
          ai_generated?: boolean;
          confidence_score?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'personas_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          }
        ];
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
          // Generation status fields
          generation_status: WebsiteGenerationStatus;
          last_generated_at: string | null;
          // Version tracking fields
          draft_version_id: string | null;
          production_version_id: string | null;
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
          // Generation status fields
          generation_status?: WebsiteGenerationStatus;
          last_generated_at?: string | null;
          // Version tracking fields
          draft_version_id?: string | null;
          production_version_id?: string | null;
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
          // Generation status fields
          generation_status?: WebsiteGenerationStatus;
          last_generated_at?: string | null;
          // Version tracking fields
          draft_version_id?: string | null;
          production_version_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'websites_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          }
        ];
      };
      conversation_sessions: {
        Row: {
          id: string;
          workspace_id: string;
          type: ConversationType;
          status: ConversationStatus;
          current_stage: string | null;
          context: Json;
          generated_website_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          type: ConversationType;
          status?: ConversationStatus;
          current_stage?: string | null;
          context?: Json;
          generated_website_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          type?: ConversationType;
          status?: ConversationStatus;
          current_stage?: string | null;
          context?: Json;
          generated_website_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'conversation_sessions_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          }
        ];
      };
      conversation_messages: {
        Row: {
          id: string;
          session_id: string;
          role: MessageRole;
          content: string;
          metadata: Json;
          sequence_number: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: MessageRole;
          content: string;
          metadata?: Json;
          sequence_number: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          role?: MessageRole;
          content?: string;
          metadata?: Json;
          sequence_number?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversation_messages_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'conversation_sessions';
            referencedColumns: ['id'];
          }
        ];
      };
      websites_v2: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          domain: string | null;
          status: string;
          creation_conversation_id: string | null;
          current_version_id: string | null;
          published_version_id: string | null;
          brand_config: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          domain?: string | null;
          status?: string;
          creation_conversation_id?: string | null;
          current_version_id?: string | null;
          published_version_id?: string | null;
          brand_config?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          domain?: string | null;
          status?: string;
          creation_conversation_id?: string | null;
          current_version_id?: string | null;
          published_version_id?: string | null;
          brand_config?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'websites_v2_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          }
        ];
      };
      website_versions_v2: {
        Row: {
          id: string;
          website_id: string;
          version_number: number;
          snapshot: Json;
          trigger_message_id: string | null;
          trigger_description: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          website_id: string;
          version_number: number;
          snapshot: Json;
          trigger_message_id?: string | null;
          trigger_description?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          website_id?: string;
          version_number?: number;
          snapshot?: Json;
          trigger_message_id?: string | null;
          trigger_description?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'website_versions_v2_website_id_fkey';
            columns: ['website_id'];
            isOneToOne: false;
            referencedRelation: 'websites_v2';
            referencedColumns: ['id'];
          }
        ];
      };
      website_versions: {
        Row: {
          id: string;
          website_id: string;
          version_number: number;
          status: VersionStatus;
          page_revisions: Json; // { pageId: revisionId }
          version_name: string | null;
          description: string | null;
          trigger_type: VersionTriggerType | null;
          created_by: string | null;
          created_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          website_id: string;
          version_number: number;
          status?: VersionStatus;
          page_revisions: Json;
          version_name?: string | null;
          description?: string | null;
          trigger_type?: VersionTriggerType | null;
          created_by?: string | null;
          created_at?: string;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          website_id?: string;
          version_number?: number;
          status?: VersionStatus;
          page_revisions?: Json;
          version_name?: string | null;
          description?: string | null;
          trigger_type?: VersionTriggerType | null;
          created_by?: string | null;
          created_at?: string;
          published_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'website_versions_website_id_fkey';
            columns: ['website_id'];
            isOneToOne: false;
            referencedRelation: 'websites';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'website_versions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
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
          // Layout generation status fields
          layout_status: LayoutStatus;
          layout_error: string | null;
          layout_generated_at: string | null;
          // Feedback system fields
          current_revision_id: string | null;
          approval_status: ApprovalStatus | null;
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
          // Layout generation status fields
          layout_status?: LayoutStatus;
          layout_error?: string | null;
          layout_generated_at?: string | null;
          // Feedback system fields
          current_revision_id?: string | null;
          approval_status?: ApprovalStatus | null;
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
          // Layout generation status fields
          layout_status?: LayoutStatus;
          layout_error?: string | null;
          layout_generated_at?: string | null;
          // Feedback system fields
          current_revision_id?: string | null;
          approval_status?: ApprovalStatus | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pages_website_id_fkey';
            columns: ['website_id'];
            isOneToOne: false;
            referencedRelation: 'websites';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pages_current_revision_id_fkey';
            columns: ['current_revision_id'];
            isOneToOne: false;
            referencedRelation: 'page_revisions';
            referencedColumns: ['id'];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: 'lead_captures_website_id_fkey';
            columns: ['website_id'];
            isOneToOne: false;
            referencedRelation: 'websites';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lead_captures_page_id_fkey';
            columns: ['page_id'];
            isOneToOne: false;
            referencedRelation: 'pages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lead_captures_persona_id_fkey';
            columns: ['persona_id'];
            isOneToOne: false;
            referencedRelation: 'personas';
            referencedColumns: ['id'];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: 'analytics_events_website_id_fkey';
            columns: ['website_id'];
            isOneToOne: false;
            referencedRelation: 'websites';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'analytics_events_page_id_fkey';
            columns: ['page_id'];
            isOneToOne: false;
            referencedRelation: 'pages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'analytics_events_persona_id_fkey';
            columns: ['persona_id'];
            isOneToOne: false;
            referencedRelation: 'personas';
            referencedColumns: ['id'];
          }
        ];
      };
      knowledge_entities: {
        Row: {
          id: string;
          workspace_id: string;
          knowledge_item_id: string;
          entity_type: string;
          name: string;
          description: string | null;
          confidence: number;
          source_chunk_ids: string[];
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          knowledge_item_id: string;
          entity_type: string;
          name: string;
          description?: string | null;
          confidence?: number;
          source_chunk_ids?: string[];
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          knowledge_item_id?: string;
          entity_type?: string;
          name?: string;
          description?: string | null;
          confidence?: number;
          source_chunk_ids?: string[];
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'knowledge_entities_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'knowledge_entities_knowledge_item_id_fkey';
            columns: ['knowledge_item_id'];
            isOneToOne: false;
            referencedRelation: 'knowledge_base_items';
            referencedColumns: ['id'];
          }
        ];
      };
      knowledge_entity_relationships: {
        Row: {
          id: string;
          workspace_id: string;
          source_entity_id: string;
          target_entity_id: string;
          relationship_type: string;
          confidence: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          source_entity_id: string;
          target_entity_id: string;
          relationship_type: string;
          confidence?: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          source_entity_id?: string;
          target_entity_id?: string;
          relationship_type?: string;
          confidence?: number;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'knowledge_entity_relationships_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'knowledge_entity_relationships_source_entity_id_fkey';
            columns: ['source_entity_id'];
            isOneToOne: false;
            referencedRelation: 'knowledge_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'knowledge_entity_relationships_target_entity_id_fkey';
            columns: ['target_entity_id'];
            isOneToOne: false;
            referencedRelation: 'knowledge_entities';
            referencedColumns: ['id'];
          }
        ];
      };
      visitor_sessions: {
        Row: {
          id: string;
          website_id: string;
          visitor_id: string;
          session_id: string;
          click_history: Json;
          scroll_behavior: Json;
          time_on_sections: Json;
          navigation_path: string[];
          referrer_url: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          device_type: string | null;
          browser: string | null;
          os: string | null;
          detected_persona_id: string | null;
          persona_confidence: number | null;
          detection_signals: Json;
          started_at: string;
          last_activity_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          website_id: string;
          visitor_id: string;
          session_id: string;
          click_history?: Json;
          scroll_behavior?: Json;
          time_on_sections?: Json;
          navigation_path?: string[];
          referrer_url?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          device_type?: string | null;
          browser?: string | null;
          os?: string | null;
          detected_persona_id?: string | null;
          persona_confidence?: number | null;
          detection_signals?: Json;
          started_at?: string;
          last_activity_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          website_id?: string;
          visitor_id?: string;
          session_id?: string;
          click_history?: Json;
          scroll_behavior?: Json;
          time_on_sections?: Json;
          navigation_path?: string[];
          referrer_url?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          device_type?: string | null;
          browser?: string | null;
          os?: string | null;
          detected_persona_id?: string | null;
          persona_confidence?: number | null;
          detection_signals?: Json;
          started_at?: string;
          last_activity_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'visitor_sessions_website_id_fkey';
            columns: ['website_id'];
            isOneToOne: false;
            referencedRelation: 'websites';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'visitor_sessions_detected_persona_id_fkey';
            columns: ['detected_persona_id'];
            isOneToOne: false;
            referencedRelation: 'personas';
            referencedColumns: ['id'];
          }
        ];
      };
      persona_content_mappings: {
        Row: {
          id: string;
          persona_id: string;
          knowledge_entity_id: string;
          relevance_score: number;
          preferred_format: string;
          priority: string;
          content_adaptation: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          persona_id: string;
          knowledge_entity_id: string;
          relevance_score?: number;
          preferred_format?: string;
          priority?: string;
          content_adaptation?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          persona_id?: string;
          knowledge_entity_id?: string;
          relevance_score?: number;
          preferred_format?: string;
          priority?: string;
          content_adaptation?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'persona_content_mappings_persona_id_fkey';
            columns: ['persona_id'];
            isOneToOne: false;
            referencedRelation: 'personas';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'persona_content_mappings_knowledge_entity_id_fkey';
            columns: ['knowledge_entity_id'];
            isOneToOne: false;
            referencedRelation: 'knowledge_entities';
            referencedColumns: ['id'];
          }
        ];
      };
      brand_configs: {
        Row: {
          id: string;
          website_id: string;
          name: string;
          colors: Json;
          typography: Json;
          spacing: Json;
          border_radius: Json;
          shadows: Json;
          animation: Json;
          logo: Json | null;
          voice: Json;
          industry: string | null;
          target_audience: string | null;
          ai_generated: boolean;
          confidence_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          website_id: string;
          name: string;
          colors?: Json;
          typography?: Json;
          spacing?: Json;
          border_radius?: Json;
          shadows?: Json;
          animation?: Json;
          logo?: Json | null;
          voice?: Json;
          industry?: string | null;
          target_audience?: string | null;
          ai_generated?: boolean;
          confidence_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          website_id?: string;
          name?: string;
          colors?: Json;
          typography?: Json;
          spacing?: Json;
          border_radius?: Json;
          shadows?: Json;
          animation?: Json;
          logo?: Json | null;
          voice?: Json;
          industry?: string | null;
          target_audience?: string | null;
          ai_generated?: boolean;
          confidence_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'brand_configs_website_id_fkey';
            columns: ['website_id'];
            isOneToOne: true;
            referencedRelation: 'websites';
            referencedColumns: ['id'];
          }
        ];
      };
      interactive_elements: {
        Row: {
          id: string;
          website_id: string;
          page_id: string | null;
          type: InteractiveElementType;
          config: Json;
          status: InteractiveElementStatus;
          analytics_config: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          website_id: string;
          page_id?: string | null;
          type: InteractiveElementType;
          config?: Json;
          status?: InteractiveElementStatus;
          analytics_config?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          website_id?: string;
          page_id?: string | null;
          type?: InteractiveElementType;
          config?: Json;
          status?: InteractiveElementStatus;
          analytics_config?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'interactive_elements_website_id_fkey';
            columns: ['website_id'];
            isOneToOne: false;
            referencedRelation: 'websites';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'interactive_elements_page_id_fkey';
            columns: ['page_id'];
            isOneToOne: false;
            referencedRelation: 'pages';
            referencedColumns: ['id'];
          }
        ];
      };
      interactive_responses: {
        Row: {
          id: string;
          element_id: string;
          website_id: string;
          visitor_id: string;
          session_id: string;
          responses: Json;
          results: Json | null;
          completion_percentage: number;
          time_spent_seconds: number;
          email: string | null;
          name: string | null;
          device_type: string | null;
          referrer: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          element_id: string;
          website_id: string;
          visitor_id: string;
          session_id: string;
          responses?: Json;
          results?: Json | null;
          completion_percentage?: number;
          time_spent_seconds?: number;
          email?: string | null;
          name?: string | null;
          device_type?: string | null;
          referrer?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          element_id?: string;
          website_id?: string;
          visitor_id?: string;
          session_id?: string;
          responses?: Json;
          results?: Json | null;
          completion_percentage?: number;
          time_spent_seconds?: number;
          email?: string | null;
          name?: string | null;
          device_type?: string | null;
          referrer?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'interactive_responses_element_id_fkey';
            columns: ['element_id'];
            isOneToOne: false;
            referencedRelation: 'interactive_elements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'interactive_responses_website_id_fkey';
            columns: ['website_id'];
            isOneToOne: false;
            referencedRelation: 'websites';
            referencedColumns: ['id'];
          }
        ];
      };
      deployments: {
        Row: {
          id: string;
          website_id: string;
          provider: DeploymentProvider;
          status: DeploymentStatus;
          deployment_id: string | null;
          project_id: string | null;
          url: string | null;
          preview_url: string | null;
          production_url: string | null;
          inspector_url: string | null;
          build_logs: string | null;
          error: string | null;
          meta: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          website_id: string;
          provider?: DeploymentProvider;
          status?: DeploymentStatus;
          deployment_id?: string | null;
          project_id?: string | null;
          url?: string | null;
          preview_url?: string | null;
          production_url?: string | null;
          inspector_url?: string | null;
          build_logs?: string | null;
          error?: string | null;
          meta?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          website_id?: string;
          provider?: DeploymentProvider;
          status?: DeploymentStatus;
          deployment_id?: string | null;
          project_id?: string | null;
          url?: string | null;
          preview_url?: string | null;
          production_url?: string | null;
          inspector_url?: string | null;
          build_logs?: string | null;
          error?: string | null;
          meta?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'deployments_website_id_fkey';
            columns: ['website_id'];
            isOneToOne: false;
            referencedRelation: 'websites';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deployments_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      custom_domains: {
        Row: {
          id: string;
          website_id: string;
          domain: string;
          verified: boolean;
          verification_records: Json | null;
          ssl_status: string;
          provider: DeploymentProvider | null;
          provider_domain_id: string | null;
          created_at: string;
          updated_at: string;
          verified_at: string | null;
        };
        Insert: {
          id?: string;
          website_id: string;
          domain: string;
          verified?: boolean;
          verification_records?: Json | null;
          ssl_status?: string;
          provider?: DeploymentProvider | null;
          provider_domain_id?: string | null;
          created_at?: string;
          updated_at?: string;
          verified_at?: string | null;
        };
        Update: {
          id?: string;
          website_id?: string;
          domain?: string;
          verified?: boolean;
          verification_records?: Json | null;
          ssl_status?: string;
          provider?: DeploymentProvider | null;
          provider_domain_id?: string | null;
          created_at?: string;
          updated_at?: string;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'custom_domains_website_id_fkey';
            columns: ['website_id'];
            isOneToOne: false;
            referencedRelation: 'websites';
            referencedColumns: ['id'];
          }
        ];
      };
      activity_events: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          event_type: string;
          category: ActivityCategory;
          severity: ActivitySeverity;
          title: string;
          description: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          event_type: string;
          category: ActivityCategory;
          severity?: ActivitySeverity;
          title: string;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          event_type?: string;
          category?: ActivityCategory;
          severity?: ActivitySeverity;
          title?: string;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'activity_events_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'activity_events_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          website_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          content_type: string;
          structured_content: Json | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          website_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          content_type?: string;
          structured_content?: Json | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          website_id?: string;
          role?: 'user' | 'assistant' | 'system';
          content?: string;
          content_type?: string;
          structured_content?: Json | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_messages_website_id_fkey';
            columns: ['website_id'];
            isOneToOne: false;
            referencedRelation: 'websites';
            referencedColumns: ['id'];
          }
        ];
      };
      site_global_components: {
        Row: {
          id: string;
          website_id: string;
          type: GlobalComponentType;
          component_id: string;
          content: Json;
          styling: Json | null;
          visibility: Json;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          website_id: string;
          type: GlobalComponentType;
          component_id: string;
          content?: Json;
          styling?: Json | null;
          visibility?: Json;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          website_id?: string;
          type?: GlobalComponentType;
          component_id?: string;
          content?: Json;
          styling?: Json | null;
          visibility?: Json;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'site_global_components_website_id_fkey';
            columns: ['website_id'];
            isOneToOne: false;
            referencedRelation: 'websites';
            referencedColumns: ['id'];
          }
        ];
      };
      // ============================================
      // FEEDBACK SYSTEM TABLES
      // ============================================
      section_feedback: {
        Row: {
          id: string;
          page_id: string;
          section_id: string;
          feedback_type: FeedbackType;
          feedback_text: string;
          target_field: string | null;
          status: FeedbackStatus;
          ai_interpretation: string | null;
          ai_confidence: number | null;
          proposed_changes: Json | null;
          created_by: string | null;
          created_at: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
        };
        Insert: {
          id?: string;
          page_id: string;
          section_id: string;
          feedback_type: FeedbackType;
          feedback_text: string;
          target_field?: string | null;
          status?: FeedbackStatus;
          ai_interpretation?: string | null;
          ai_confidence?: number | null;
          proposed_changes?: Json | null;
          created_by?: string | null;
          created_at?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Update: {
          id?: string;
          page_id?: string;
          section_id?: string;
          feedback_type?: FeedbackType;
          feedback_text?: string;
          target_field?: string | null;
          status?: FeedbackStatus;
          ai_interpretation?: string | null;
          ai_confidence?: number | null;
          proposed_changes?: Json | null;
          created_by?: string | null;
          created_at?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'section_feedback_page_id_fkey';
            columns: ['page_id'];
            isOneToOne: false;
            referencedRelation: 'pages';
            referencedColumns: ['id'];
          }
        ];
      };
      page_revisions: {
        Row: {
          id: string;
          page_id: string;
          revision_number: number;
          revision_type: RevisionType;
          change_summary: string | null;
          sections_modified: Json | null;
          feedback_ids: Json | null;
          content_snapshot: Json;
          created_by: string | null;
          created_at: string | null;
          rolled_back_from: string | null;
        };
        Insert: {
          id?: string;
          page_id: string;
          revision_number: number;
          revision_type: RevisionType;
          change_summary?: string | null;
          sections_modified?: Json | null;
          feedback_ids?: Json | null;
          content_snapshot: Json;
          created_by?: string | null;
          created_at?: string | null;
          rolled_back_from?: string | null;
        };
        Update: {
          id?: string;
          page_id?: string;
          revision_number?: number;
          revision_type?: RevisionType;
          change_summary?: string | null;
          sections_modified?: Json | null;
          feedback_ids?: Json | null;
          content_snapshot?: Json;
          created_by?: string | null;
          created_at?: string | null;
          rolled_back_from?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'page_revisions_page_id_fkey';
            columns: ['page_id'];
            isOneToOne: false;
            referencedRelation: 'pages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'page_revisions_rolled_back_from_fkey';
            columns: ['rolled_back_from'];
            isOneToOne: false;
            referencedRelation: 'page_revisions';
            referencedColumns: ['id'];
          }
        ];
      };
      page_approvals: {
        Row: {
          id: string;
          page_id: string;
          revision_id: string;
          status: ApprovalStatus;
          submitted_by: string | null;
          submitted_at: string | null;
          submission_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_notes: string | null;
          approved_by: string | null;
          approved_at: string | null;
          approval_notes: string | null;
          published_at: string | null;
          published_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          page_id: string;
          revision_id: string;
          status?: ApprovalStatus;
          submitted_by?: string | null;
          submitted_at?: string | null;
          submission_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          approval_notes?: string | null;
          published_at?: string | null;
          published_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          page_id?: string;
          revision_id?: string;
          status?: ApprovalStatus;
          submitted_by?: string | null;
          submitted_at?: string | null;
          submission_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          approval_notes?: string | null;
          published_at?: string | null;
          published_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'page_approvals_page_id_fkey';
            columns: ['page_id'];
            isOneToOne: false;
            referencedRelation: 'pages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'page_approvals_revision_id_fkey';
            columns: ['revision_id'];
            isOneToOne: false;
            referencedRelation: 'page_revisions';
            referencedColumns: ['id'];
          }
        ];
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
          workspace_id: string; // Parameter name matches deployed DB function
        };
        Returns: {
          id: string;
          content: string;
          similarity: number;
        }[];
      };
      create_workspace_with_owner: {
        Args: {
          workspace_name: string;
          workspace_slug: string;
          workspace_description?: string | null;
        };
        Returns: string; // Returns workspace_id UUID
      };
      get_workspace_id_for_website: {
        Args: {
          website_id_param: string;
        };
        Returns: string; // Returns workspace_id UUID
      };
      get_workspace_id_for_website_slug: {
        Args: {
          slug_param: string;
        };
        Returns: string; // Returns workspace_id UUID
      };
    };
    Enums: {
      user_role: UserRole;
      document_status: DocumentStatus;
      website_status: WebsiteStatus;
      persona_confidence: PersonaConfidence;
      communication_style: CommunicationStyle;
      buyer_journey_stage: BuyerJourneyStage;
      interactive_element_type: InteractiveElementType;
      interactive_element_status: InteractiveElementStatus;
      deployment_status: DeploymentStatus;
      deployment_provider: DeploymentProvider;
      activity_category: ActivityCategory;
      activity_severity: ActivitySeverity;
    };
    CompositeTypes: {
      [_ in never]: never;
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
export type KnowledgeEntity = Tables<'knowledge_entities'>;
export type KnowledgeEntityRelationship = Tables<'knowledge_entity_relationships'>;
export type Persona = Tables<'personas'>;
export type Website = Tables<'websites'>;
export type Page = Tables<'pages'>;
export type LeadCapture = Tables<'lead_captures'>;
export type AnalyticsEvent = Tables<'analytics_events'>;
export type VisitorSession = Tables<'visitor_sessions'>;
export type PersonaContentMapping = Tables<'persona_content_mappings'>;
export type BrandConfig = Tables<'brand_configs'>;
export type InteractiveElement = Tables<'interactive_elements'>;
export type InteractiveResponseRow = Tables<'interactive_responses'>;
export type ActivityEventRow = Tables<'activity_events'>;
export type SiteGlobalComponent = Tables<'site_global_components'>;

// Page type enum
export type PageType =
  | 'home'
  | 'landing'
  | 'product'
  | 'pricing'
  | 'about'
  | 'contact'
  | 'blog'
  | 'blog-post'
  | 'case-study'
  | 'features'
  | 'solutions'
  | 'resources'
  | 'careers'
  | 'legal'
  | 'custom';

// Narrative role enum
export type NarrativeRole = 'hook' | 'problem' | 'solution' | 'proof' | 'action';

// Page layout types
export interface PageLayoutRow {
  id: string;
  page_id: string;
  version: number;
  sections: Json;
  component_selections: Json;
  navigation: Json;
  generated_by: string | null;
  model_used: string | null;
  tokens_used: number;
  confidence_score: number;
  processing_time_ms: number | null;
  target_personas: Json;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Site architecture types
export interface SiteArchitectureRow {
  id: string;
  website_id: string;
  navigation: Json;
  global_components: Json;
  page_ids: string[];
  generated_by: string | null;
  model_used: string | null;
  confidence_score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Component instance types
export interface ComponentInstanceRow {
  id: string;
  page_layout_id: string;
  component_id: string;
  section_order: number;
  content: Json;
  styling: Json;
  animations: Json;
  interactions: Json;
  narrative_role: NarrativeRole;
  persona_overrides: Json;
  selection_score: number | null;
  created_at: string;
  updated_at: string;
}
