'use client';

/**
 * Chat Widget Component
 * Phase 4.4: AI-Powered Conversational Interface
 *
 * Floating chat bubble with expandable chat interface.
 * Supports real-time AI conversations with knowledge base retrieval.
 * Integrates with ChatContext for section triggers and persona detection.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Sparkles, User } from 'lucide-react';
import type { ChatResponse, ChatStructuredContent } from '@/lib/interactive/chat/types';
import { useChatContextOptional } from '@/lib/interactive/chat/chat-context';
import { usePersonaContextOptional } from '@/lib/interactive/persona';

// ============================================================================
// TYPES
// ============================================================================

interface ChatWidgetProps {
  websiteId: string;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  welcomeMessage?: string;
  placeholderText?: string;
  suggestedQuestions?: string[];
  companyName?: string;
  /** If true, widget is controlled by ChatContext */
  useContext?: boolean;
  /** Callback to trigger dynamic UI generation for a chat question */
  onGenerateUI?: (question: string, topic: string) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  structuredContent?: ChatStructuredContent;
  timestamp: Date;
  isLoading?: boolean;
}

// ============================================================================
// CHAT WIDGET COMPONENT
// ============================================================================

export function ChatWidget({
  websiteId,
  position = 'bottom-right',
  primaryColor = '#3B82F6',
  welcomeMessage = "Hi there! How can I help you today?",
  placeholderText = "Type your message...",
  suggestedQuestions = [],
  companyName = "Assistant",
  useContext = true,
  onGenerateUI,
}: ChatWidgetProps) {
  // Get chat context if available
  const chatContext = useChatContextOptional();
  // Get persona context for detailed persona information
  const personaContext = usePersonaContextOptional();

  // Local state for when not using context
  const [localIsOpen, setLocalIsOpen] = useState(false);

  // Use context state if available and useContext is true
  const isOpen = useContext && chatContext ? chatContext.isOpen : localIsOpen;
  const setIsOpen = useContext && chatContext
    ? (open: boolean) => open ? chatContext.openChat() : chatContext.closeChat()
    : setLocalIsOpen;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get persona hint from chat context or persona context
  const personaHint = chatContext?.getPersonaHint() || personaContext?.activePersonaLabel;
  // Get detailed adaptation hints from persona context
  const adaptationHints = personaContext?.getAdaptationHints();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Add welcome message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Personalize welcome message if persona is set
      const personalizedWelcome = personaHint
        ? `Hi there! I see you're a ${personaHint}. ${welcomeMessage}`
        : welcomeMessage;

      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: personalizedWelcome,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, messages.length, welcomeMessage, personaHint]);

  // Handle pending messages from context
  useEffect(() => {
    if (chatContext?.pendingMessage && chatContext.autoSend && isOpen && !isLoading) {
      const messageToSend = chatContext.pendingMessage;
      chatContext.clearPendingMessage();
      sendMessage(messageToSend);
    } else if (chatContext?.pendingMessage && !chatContext.autoSend && isOpen) {
      // Just pre-fill the input
      setInput(chatContext.pendingMessage);
      chatContext.clearPendingMessage();
    }
  }, [chatContext?.pendingMessage, chatContext?.autoSend, isOpen, isLoading]);

  // Send message to API
  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    // Record the chat message in persona context for analysis
    personaContext?.recordInteraction({
      type: 'chat_message',
      target: 'chat-widget',
      value: messageText,
    });

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setFollowUps([]);

    // Add loading message
    const loadingId = `loading-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: loadingId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isLoading: true,
      },
    ]);

    try {
      const requestBody = {
        websiteId,
        sessionId,
        message: messageText,
        sectionContext: chatContext?.sectionContext,
        personaHint: personaHint,
        adaptationHints: adaptationHints,
      };
      console.log('[ChatWidget] Sending request:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[ChatWidget] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ChatWidget] Error response body:', errorText);
        throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
      }

      const data: ChatResponse = await response.json();

      // Update session ID
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      // Remove loading message and add real response
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== loadingId);
        return [
          ...filtered,
          {
            id: data.message.id,
            role: 'assistant',
            content: data.message.content,
            structuredContent: data.message.structuredContent,
            timestamp: new Date(data.message.createdAt),
          },
        ];
      });

      // Set follow-up suggestions
      if (data.suggestedFollowUps) {
        setFollowUps(data.suggestedFollowUps);
      }

      // Trigger dynamic UI generation for the question
      // This will generate a visual section alongside the chat response
      if (onGenerateUI) {
        // Extract a topic from the message for the UI generation
        const topic = messageText.toLowerCase()
          .replace(/[?!.,]/g, '')
          .split(' ')
          .slice(0, 5)
          .join('-');
        onGenerateUI(messageText, topic);
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Remove loading message and add error
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== loadingId);
        return [
          ...filtered,
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: "I'm sorry, I encountered an error. Please try again.",
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  }, [websiteId, sessionId, isLoading, chatContext?.sectionContext, personaHint, adaptationHints, personaContext, onGenerateUI]);

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Handle suggested question click
  const handleSuggestionClick = (question: string) => {
    sendMessage(question);
  };

  // Position classes
  const positionClasses = position === 'bottom-right'
    ? 'right-4 sm:right-6'
    : 'left-4 sm:left-6';

  return (
    <div className={`fixed bottom-4 sm:bottom-6 ${positionClasses} z-50`}>
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="w-[350px] sm:w-[400px] h-[500px] sm:h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
          >
            {/* Header */}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">{companyName}</h3>
                  {personaHint ? (
                    <p className="text-white/80 text-xs flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {personaHint}
                    </p>
                  ) : (
                    <p className="text-white/80 text-xs">Powered by AI</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors p-1"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  primaryColor={primaryColor}
                />
              ))}

              {/* Follow-up suggestions */}
              {followUps.length > 0 && !isLoading && (
                <div className="flex flex-wrap gap-2">
                  {followUps.map((followUp, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(followUp)}
                      className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      {followUp}
                    </button>
                  ))}
                </div>
              )}

              {/* Initial suggestions */}
              {messages.length === 1 && suggestedQuestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Popular questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedQuestions.slice(0, 4).map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(question)}
                        className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={placeholderText}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-2 rounded-full text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: primaryColor }}
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.button
            key="chat-bubble"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white"
            style={{ backgroundColor: primaryColor }}
            aria-label="Open chat"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// MESSAGE BUBBLE COMPONENT
// ============================================================================

interface MessageBubbleProps {
  message: Message;
  primaryColor: string;
}

function MessageBubble({ message, primaryColor }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (message.isLoading) {
    return (
      <div className="flex justify-start">
        <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100 max-w-[85%]">
          <div className="flex items-center gap-2">
            <div className="flex space-x-1">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                className="w-2 h-2 rounded-full bg-gray-400"
              />
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                className="w-2 h-2 rounded-full bg-gray-400"
              />
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                className="w-2 h-2 rounded-full bg-gray-400"
              />
            </div>
            <span className="text-xs text-gray-400">Thinking...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? 'rounded-br-sm text-white'
            : 'rounded-bl-sm bg-white shadow-sm border border-gray-100'
        }`}
        style={isUser ? { backgroundColor: primaryColor } : {}}
      >
        {/* Text content */}
        <p className={`text-sm ${isUser ? 'text-white' : 'text-gray-800'}`}>
          {message.content}
        </p>

        {/* Structured content */}
        {message.structuredContent && !isUser && (
          <StructuredContentRenderer content={message.structuredContent} />
        )}

        {/* Timestamp */}
        <p className={`text-xs mt-1 ${isUser ? 'text-white/70' : 'text-gray-400'}`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// STRUCTURED CONTENT RENDERER
// ============================================================================

interface StructuredContentRendererProps {
  content: ChatStructuredContent;
}

function StructuredContentRenderer({ content }: StructuredContentRendererProps) {
  switch (content.type) {
    case 'card-grid':
      return (
        <div className="mt-3 space-y-2">
          {content.title && (
            <h4 className="font-medium text-sm text-gray-900">{content.title}</h4>
          )}
          <div className="grid gap-2">
            {content.cards.map((card) => (
              <div
                key={card.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <h5 className="font-medium text-sm text-gray-900">{card.title}</h5>
                <p className="text-xs text-gray-600 mt-1">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'stats-display':
      return (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {content.stats.map((stat, index) => (
            <div key={index} className="p-2 bg-gray-50 rounded-lg text-center">
              <p className="text-lg font-bold text-blue-600">{stat.value}</p>
              <p className="text-xs text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      );

    case 'faq-accordion':
      return (
        <div className="mt-3 space-y-2">
          {content.items.map((item, index) => (
            <details
              key={index}
              className="group bg-gray-50 rounded-lg border border-gray-100"
            >
              <summary className="px-3 py-2 cursor-pointer text-sm font-medium text-gray-900 list-none flex items-center justify-between">
                {item.question}
                <span className="text-gray-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="px-3 pb-2 text-xs text-gray-600">{item.answer}</p>
            </details>
          ))}
        </div>
      );

    case 'cta-block':
      return (
        <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
          <h4 className="font-medium text-sm text-gray-900">{content.title}</h4>
          <p className="text-xs text-gray-600 mt-1">{content.description}</p>
          <button className="mt-2 px-4 py-1.5 bg-blue-600 text-white text-xs rounded-full hover:bg-blue-700 transition-colors">
            {content.primaryButton.text}
          </button>
        </div>
      );

    default:
      return null;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ChatWidget;
