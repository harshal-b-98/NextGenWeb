/**
 * Message Bubble Component
 * Displays user and assistant messages in chat
 */

'use client';

import { User, Bot } from 'lucide-react';
import { format } from 'date-fns';
import type { ConversationMessage } from './ChatPanel';

interface MessageBubbleProps {
  message: ConversationMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gradient-to-br from-purple-500 to-blue-600 text-white'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message Content */}
      <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
        <div
          className={`inline-block max-w-[85%] rounded-lg px-4 py-2 ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {format(new Date(message.created_at), 'h:mm a')}
        </p>
      </div>
    </div>
  );
}
