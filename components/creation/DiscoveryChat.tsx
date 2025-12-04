/**
 * Discovery Chat Component
 *
 * Step 2 of creation wizard - Conversational AI discovery
 * AI shows understanding and asks 5-10 clarifying questions
 *
 * Epic: NextGenWeb Complete Product Reimplementation
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Send, Sparkles, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DiscoveryChatProps {
  workspaceId: string;
  onDiscoveryComplete: (sessionId: string) => void;
}

export function DiscoveryChat({ workspaceId, onDiscoveryComplete }: DiscoveryChatProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [readyToGenerate, setReadyToGenerate] = useState(false);
  const [suggestedAnswers, setSuggestedAnswers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Start conversation on mount
  useEffect(() => {
    startConversation();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startConversation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/conversation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, type: 'discovery' }),
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const data = await response.json();
      setSessionId(data.session.id);

      // Add understanding summary
      setMessages([
        {
          role: 'assistant',
          content: data.understanding,
          timestamp: new Date(),
        },
      ]);

      // Add first question if exists
      if (data.firstQuestion) {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: data.firstQuestion.question,
              timestamp: new Date(),
            },
          ]);
          setSuggestedAnswers(data.firstQuestion.suggestedAnswers || []);
        }, 1000);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start AI discovery');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (message: string) => {
    if (!sessionId || !message.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/conversation/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Add AI response
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        },
      ]);

      // Update suggested answers
      setSuggestedAnswers(data.question?.suggestedAnswers || []);

      // Check if ready to generate
      if (data.readyToGenerate) {
        setReadyToGenerate(true);
        setSuggestedAnswers(["Yes, let's build it!", "Wait, I have changes"]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to process response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmGeneration = () => {
    if (sessionId) {
      onDiscoveryComplete(sessionId);
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
        <Sparkles className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          AI Discovery Conversation
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <Loader2 className="h-5 w-5 text-gray-600 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Answers */}
      {suggestedAnswers.length > 0 && !isLoading && (
        <div className="mb-4 space-y-2">
          <p className="text-xs text-gray-500 mb-2">Suggested responses:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedAnswers.map((answer, index) => (
              <button
                key={index}
                onClick={() => sendMessage(answer)}
                className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-full hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                {answer}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input or Generate Button */}
      {readyToGenerate ? (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="flex-1 text-sm text-green-900 font-medium">
            Perfect! I have everything I need to build your website.
          </p>
          <Button
            onClick={handleConfirmGeneration}
            className="bg-green-600 hover:bg-green-700"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Website
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(inputValue)}
            placeholder="Type your answer..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <Button
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || isLoading}
            size="lg"
            className="px-6"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
