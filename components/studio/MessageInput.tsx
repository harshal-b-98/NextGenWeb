/**
 * Message Input Component
 * Textarea with send button for user feedback
 */

'use client';

import { Send } from 'lucide-react';
import { KeyboardEvent } from 'react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = 'Type your feedback...',
}: MessageInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="flex gap-2 items-end">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={3}
        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
      />
      <button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        title="Send (Enter)"
      >
        <Send className="h-5 w-5" />
      </button>
    </div>
  );
}
