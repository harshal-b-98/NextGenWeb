/**
 * Chat Message Service
 * Phase 4.4: AI-Powered Conversational Interface
 *
 * Service for storing and retrieving chat messages.
 * Uses in-memory storage initially, with database persistence option.
 */

import { v4 as uuidv4 } from 'uuid';
import type { Json } from '@/types/database';
import type {
  ChatMessage,
  ChatMessageRole,
  ChatContentType,
  ChatStructuredContent,
  ChatMessageMetadata,
} from './types';

// ============================================================================
// IN-MEMORY STORAGE (for initial implementation)
// ============================================================================

interface MessageStore {
  messages: Map<string, ChatMessage[]>; // sessionId -> messages
  sessions: Map<string, SessionInfo>;
}

interface SessionInfo {
  websiteId: string;
  visitorId?: string;
  createdAt: string;
  lastActivityAt: string;
}

// Global in-memory store (will be replaced with DB in production)
const store: MessageStore = {
  messages: new Map(),
  sessions: new Map(),
};

// ============================================================================
// MESSAGE SERVICE
// ============================================================================

export class MessageService {
  /**
   * Save a new message
   */
  async saveMessage(params: {
    sessionId: string;
    websiteId: string;
    role: ChatMessageRole;
    content: string;
    contentType: ChatContentType;
    structuredContent?: ChatStructuredContent;
    metadata?: Partial<ChatMessageMetadata>;
  }): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: uuidv4(),
      sessionId: params.sessionId,
      websiteId: params.websiteId,
      role: params.role,
      content: params.content,
      contentType: params.contentType,
      structuredContent: params.structuredContent,
      metadata: params.metadata || {},
      createdAt: new Date().toISOString(),
    };

    // Get or create session messages
    const sessionMessages = store.messages.get(params.sessionId) || [];
    sessionMessages.push(message);
    store.messages.set(params.sessionId, sessionMessages);

    // Update session info
    const now = new Date().toISOString();
    const existingSession = store.sessions.get(params.sessionId);
    store.sessions.set(params.sessionId, {
      websiteId: params.websiteId,
      visitorId: existingSession?.visitorId,
      createdAt: existingSession?.createdAt || now,
      lastActivityAt: now,
    });

    // TODO: Persist to database
    // await this.persistToDatabase(message);

    return message;
  }

  /**
   * Get message history for a session
   */
  async getHistory(sessionId: string, limit: number = 50): Promise<ChatMessage[]> {
    const messages = store.messages.get(sessionId) || [];

    // Return last N messages
    return messages.slice(-limit);
  }

  /**
   * Get a single message by ID
   */
  async getMessage(messageId: string): Promise<ChatMessage | null> {
    for (const messages of store.messages.values()) {
      const message = messages.find(m => m.id === messageId);
      if (message) return message;
    }
    return null;
  }

  /**
   * Clear history for a session
   */
  async clearHistory(sessionId: string): Promise<void> {
    store.messages.delete(sessionId);
  }

  /**
   * Get session info
   */
  async getSession(sessionId: string): Promise<SessionInfo | null> {
    return store.sessions.get(sessionId) || null;
  }

  /**
   * Update session with visitor ID
   */
  async updateSessionVisitor(sessionId: string, visitorId: string): Promise<void> {
    const session = store.sessions.get(sessionId);
    if (session) {
      session.visitorId = visitorId;
      store.sessions.set(sessionId, session);
    }
  }

  /**
   * Get all sessions for a website
   */
  async getWebsiteSessions(websiteId: string): Promise<Array<{
    sessionId: string;
    messageCount: number;
    lastActivity: string;
  }>> {
    const sessions: Array<{
      sessionId: string;
      messageCount: number;
      lastActivity: string;
    }> = [];

    for (const [sessionId, info] of store.sessions.entries()) {
      if (info.websiteId === websiteId) {
        const messages = store.messages.get(sessionId) || [];
        sessions.push({
          sessionId,
          messageCount: messages.length,
          lastActivity: info.lastActivityAt,
        });
      }
    }

    // Sort by last activity, most recent first
    return sessions.sort((a, b) =>
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );
  }

  /**
   * Get message count for analytics
   */
  async getMessageCount(websiteId: string, startDate?: Date, endDate?: Date): Promise<{
    total: number;
    byRole: { user: number; assistant: number };
    byDay: Array<{ date: string; count: number }>;
  }> {
    let userCount = 0;
    let assistantCount = 0;
    const byDay = new Map<string, number>();

    for (const [sessionId, info] of store.sessions.entries()) {
      if (info.websiteId !== websiteId) continue;

      const messages = store.messages.get(sessionId) || [];
      for (const message of messages) {
        const messageDate = new Date(message.createdAt);

        // Apply date filters if provided
        if (startDate && messageDate < startDate) continue;
        if (endDate && messageDate > endDate) continue;

        if (message.role === 'user') userCount++;
        if (message.role === 'assistant') assistantCount++;

        const dateKey = messageDate.toISOString().split('T')[0];
        byDay.set(dateKey, (byDay.get(dateKey) || 0) + 1);
      }
    }

    return {
      total: userCount + assistantCount,
      byRole: { user: userCount, assistant: assistantCount },
      byDay: Array.from(byDay.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  /**
   * Export conversation for lead capture
   */
  async exportConversation(sessionId: string): Promise<{
    messages: Array<{
      role: string;
      content: string;
      timestamp: string;
    }>;
    summary: string;
    intentsDetected: string[];
  }> {
    const messages = await this.getHistory(sessionId);

    const intentsDetected = new Set<string>();
    messages.forEach(m => {
      if (m.metadata.intentCategory) {
        intentsDetected.add(m.metadata.intentCategory);
      }
    });

    return {
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.createdAt,
      })),
      summary: this.generateConversationSummary(messages),
      intentsDetected: Array.from(intentsDetected),
    };
  }

  /**
   * Generate a simple conversation summary
   */
  private generateConversationSummary(messages: ChatMessage[]): string {
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) return 'No conversation';

    const topics = new Set<string>();
    userMessages.forEach(m => {
      if (m.metadata.intentCategory) {
        topics.add(m.metadata.intentCategory);
      }
    });

    const topicStr = topics.size > 0
      ? `Topics discussed: ${Array.from(topics).join(', ')}.`
      : '';

    return `Conversation with ${messages.length} messages. ${topicStr}`.trim();
  }
}

// ============================================================================
// DATABASE PERSISTENCE (Future Implementation)
// ============================================================================

/**
 * Database-backed message service
 * To be used when chat_messages table is created
 */
export class DatabaseMessageService extends MessageService {
  /**
   * Save message to database
   */
  async saveMessage(params: {
    sessionId: string;
    websiteId: string;
    role: ChatMessageRole;
    content: string;
    contentType: ChatContentType;
    structuredContent?: ChatStructuredContent;
    metadata?: Partial<ChatMessageMetadata>;
  }): Promise<ChatMessage> {
    // First save to in-memory for fast access
    const message = await super.saveMessage(params);

    // Then persist to database
    try {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();

      await supabase.from('chat_messages').insert({
        id: message.id,
        session_id: message.sessionId,
        website_id: message.websiteId,
        role: message.role as 'user' | 'assistant' | 'system',
        content: message.content,
        content_type: message.contentType,
        structured_content: (message.structuredContent as unknown) as Json | null,
        metadata: (message.metadata as unknown) as Json,
        created_at: message.createdAt,
      });
    } catch (error) {
      // Log but don't fail - in-memory storage is backup
      console.error('Failed to persist chat message to database:', error);
    }

    return message;
  }

  /**
   * Load history from database
   */
  async loadFromDatabase(sessionId: string): Promise<ChatMessage[]> {
    try {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(row => ({
        id: row.id,
        sessionId: row.session_id,
        websiteId: row.website_id,
        role: row.role as ChatMessageRole,
        content: row.content,
        contentType: row.content_type as ChatContentType,
        structuredContent: (row.structured_content as unknown) as ChatStructuredContent | undefined,
        metadata: (row.metadata as unknown) as ChatMessageMetadata,
        createdAt: row.created_at,
      }));
    } catch (error) {
      console.error('Failed to load chat messages from database:', error);
      // Fall back to in-memory
      return super.getHistory(sessionId);
    }
  }
}

// ============================================================================
// FACTORY
// ============================================================================

let messageServiceInstance: MessageService | null = null;

export function getMessageService(useDatabase: boolean = false): MessageService {
  if (!messageServiceInstance) {
    messageServiceInstance = useDatabase
      ? new DatabaseMessageService()
      : new MessageService();
  }
  return messageServiceInstance;
}
