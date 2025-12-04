/**
 * Chat Panel Component
 *
 * Left sidebar (30%) for conversation-based feedback
 * Features:
 * - Full conversation history
 * - Quick action buttons
 * - Section context display
 * - Message input
 *
 * Epic #146: Interactive Website Feedback & Refinement System
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { ProposedChangeCard } from './ProposedChangeCard';
import { QuickActions } from './QuickActions';
import { MessageInput } from './MessageInput';
import { MessageCircle, Sparkles } from 'lucide-react';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  sequence_number: number;
}

export interface ProposedChange {
  id: string;
  description: string;
  type: string;
  preview?: {
    before: string;
    after: string;
  };
}

interface ChatPanelProps {
  conversationId: string | null;
  messages: ConversationMessage[];
  proposedChanges: ProposedChange[];
  selectedSection: string | null;
  onSendMessage: (text: string, sectionId?: string) => Promise<void>;
  onApplyChange: (changeId: string) => Promise<void>;
  isLoading?: boolean;
}

export function ChatPanel({
  conversationId,
  messages,
  proposedChanges,
  selectedSection,
  onSendMessage,
  onApplyChange,
  isLoading = false,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, proposedChanges]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(inputValue, selectedSection || undefined);
      setInputValue(''); // Clear input after sending
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    if (isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(action, selectedSection || undefined);
    } catch (error) {
      console.error('Failed to send quick action:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Feedback & Refinement</h3>
        </div>
        {selectedSection && (
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
            <Sparkles className="h-3 w-3" />
            Section: {selectedSection}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && proposedChanges.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <MessageCircle className="h-12 w-12 text-gray-300 mb-3" />
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              Start a Conversation
            </h4>
            <p className="text-xs text-gray-500 mb-4">
              Click a section in the preview or type your feedback below
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {proposedChanges.map((change) => (
              <ProposedChangeCard
                key={change.id}
                change={change}
                applied={true}
              />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                AI is thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-2 border-t border-gray-100">
        <QuickActions
          onSelect={handleQuickAction}
          disabled={isSending || !selectedSection}
        />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <MessageInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          disabled={isSending}
          placeholder={
            selectedSection
              ? "Describe how you'd like to improve this section..."
              : "Select a section or describe general feedback..."
          }
        />
      </div>
    </div>
  );
}
