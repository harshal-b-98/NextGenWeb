'use client';

/**
 * Interactive Section Triggers
 * Phase 4.4: AI-Powered Conversational Interface
 *
 * Components that trigger chat interactions from page sections:
 * - Role Picker: Self-identification for persona detection
 * - Chat Input: Inline chat input fields
 * - Section Chat Trigger: Context-aware chat buttons
 * - Quick Question: Pre-filled question buttons
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Briefcase,
  Code,
  GraduationCap,
  Heart,
  Building2,
  Sparkles,
  MessageCircle,
  ArrowRight,
  ChevronRight,
  Users,
  Lightbulb,
  Send,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface PersonaOption {
  id: string;
  label: string;
  description?: string;
  icon?: string;
}

export interface RolePickerProps {
  title?: string;
  subtitle?: string;
  options?: PersonaOption[];
  /** Called when a role is selected - receives both id and label */
  onSelect?: (personaId: string, personaLabel: string) => void;
  /** Legacy callback - only receives personaId (deprecated, use onSelect) */
  onSelectWithChat?: (personaId: string, personaLabel: string) => void;
  variant?: 'cards' | 'pills' | 'compact';
  primaryColor?: string;
}

export interface ChatInputFieldProps {
  placeholder?: string;
  sectionContext?: string;
  onSubmit?: (message: string, context?: string) => void;
  variant?: 'minimal' | 'prominent' | 'inline';
  primaryColor?: string;
  buttonText?: string;
}

export interface SectionChatTriggerProps {
  text?: string;
  context?: string;
  prefilledMessage?: string;
  onClick?: (prefilledMessage?: string, context?: string) => void;
  variant?: 'button' | 'link' | 'floating';
  primaryColor?: string;
  icon?: React.ReactNode;
}

export interface QuickQuestionProps {
  questions: string[];
  sectionContext?: string;
  onSelect?: (question: string, context?: string) => void;
  variant?: 'chips' | 'list' | 'cards';
  primaryColor?: string;
}

// ============================================================================
// ICON MAPPING
// ============================================================================

const iconMap: Record<string, React.ReactNode> = {
  user: <User className="w-5 h-5" />,
  briefcase: <Briefcase className="w-5 h-5" />,
  code: <Code className="w-5 h-5" />,
  education: <GraduationCap className="w-5 h-5" />,
  heart: <Heart className="w-5 h-5" />,
  building: <Building2 className="w-5 h-5" />,
  sparkles: <Sparkles className="w-5 h-5" />,
  users: <Users className="w-5 h-5" />,
  lightbulb: <Lightbulb className="w-5 h-5" />,
};

function getIcon(iconName?: string): React.ReactNode {
  if (!iconName) return <User className="w-5 h-5" />;
  return iconMap[iconName] || <User className="w-5 h-5" />;
}

// ============================================================================
// DEFAULT OPTIONS
// ============================================================================

const defaultPersonaOptions: PersonaOption[] = [
  {
    id: 'developer',
    label: 'Developer',
    description: 'I build software and technical solutions',
    icon: 'code',
  },
  {
    id: 'business-owner',
    label: 'Business Owner',
    description: 'I run a company or startup',
    icon: 'briefcase',
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    description: 'I work at a large organization',
    icon: 'building',
  },
  {
    id: 'student',
    label: 'Student',
    description: 'I\'m learning and exploring',
    icon: 'education',
  },
];

// ============================================================================
// ROLE PICKER COMPONENT
// ============================================================================

export function RolePicker({
  title = "Tell us about yourself",
  subtitle = "Help us personalize your experience",
  options = defaultPersonaOptions,
  onSelect,
  onSelectWithChat,
  variant = 'cards',
  primaryColor = '#3B82F6',
}: RolePickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSelect = useCallback((option: PersonaOption) => {
    setSelectedId(option.id);
    setIsAnimating(true);

    // Notify parent - now passes both id and label
    if (onSelect) {
      onSelect(option.id, option.label);
    }

    // Legacy callback - open chat with personalized message
    if (onSelectWithChat) {
      setTimeout(() => {
        onSelectWithChat(option.id, option.label);
        setIsAnimating(false);
      }, 300);
    } else {
      setTimeout(() => setIsAnimating(false), 300);
    }
  }, [onSelect, onSelectWithChat]);

  if (variant === 'pills') {
    return (
      <div className="py-8">
        <div className="text-center mb-6">
          {title && <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>}
          {subtitle && <p className="text-gray-600">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {options.map((option) => (
            <motion.button
              key={option.id}
              onClick={() => handleSelect(option)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                px-5 py-2.5 rounded-full flex items-center gap-2
                transition-all duration-200 font-medium text-sm
                ${selectedId === option.id
                  ? 'text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 shadow-sm'
                }
              `}
              style={selectedId === option.id ? { backgroundColor: primaryColor } : {}}
            >
              {getIcon(option.icon)}
              {option.label}
              {selectedId === option.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-1"
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="inline-flex items-center gap-2 bg-gray-50 rounded-lg p-2">
        <span className="text-sm text-gray-600 px-2">I am a:</span>
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option)}
            className={`
              px-3 py-1.5 rounded-md text-sm font-medium transition-all
              ${selectedId === option.id
                ? 'text-white'
                : 'text-gray-600 hover:bg-gray-100'
              }
            `}
            style={selectedId === option.id ? { backgroundColor: primaryColor } : {}}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  // Default: cards variant
  return (
    <div className="py-10">
      <div className="text-center mb-8">
        {title && <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>}
        {subtitle && <p className="text-gray-600 text-lg">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {options.map((option) => (
          <motion.button
            key={option.id}
            onClick={() => handleSelect(option)}
            whileHover={{ y: -4, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)' }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative p-6 rounded-xl text-left transition-all duration-200
              ${selectedId === option.id
                ? 'text-white'
                : 'bg-white border border-gray-200 hover:border-gray-300 shadow-sm'
              }
            `}
            style={selectedId === option.id ? { backgroundColor: primaryColor } : {}}
          >
            <div className={`
              w-12 h-12 rounded-lg flex items-center justify-center mb-4
              ${selectedId === option.id ? 'bg-white/20' : 'bg-gray-100'}
            `}>
              <span className={selectedId === option.id ? 'text-white' : 'text-gray-600'}>
                {getIcon(option.icon)}
              </span>
            </div>
            <h4 className={`font-semibold text-lg mb-1 ${selectedId === option.id ? 'text-white' : 'text-gray-900'}`}>
              {option.label}
            </h4>
            {option.description && (
              <p className={`text-sm ${selectedId === option.id ? 'text-white/80' : 'text-gray-500'}`}>
                {option.description}
              </p>
            )}
            <AnimatePresence>
              {selectedId === option.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute top-4 right-4"
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
      {isAnimating && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-6"
        >
          <span className="inline-flex items-center gap-2 text-sm text-gray-600">
            <Sparkles className="w-4 h-4" style={{ color: primaryColor }} />
            Personalizing your experience...
          </span>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================================
// CHAT INPUT FIELD COMPONENT
// ============================================================================

export function ChatInputField({
  placeholder = "Ask me anything about our product...",
  sectionContext,
  onSubmit,
  variant = 'prominent',
  primaryColor = '#3B82F6',
  buttonText = 'Ask',
}: ChatInputFieldProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && onSubmit) {
      onSubmit(value.trim(), sectionContext);
      setValue('');
    }
  };

  if (variant === 'minimal') {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="px-4 py-2 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: primaryColor }}
        >
          {buttonText}
        </button>
      </form>
    );
  }

  if (variant === 'inline') {
    return (
      <form
        onSubmit={handleSubmit}
        className="inline-flex items-center gap-2 bg-gray-50 rounded-full px-2 py-1"
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="bg-transparent border-none outline-none text-sm px-2 py-1 w-48 focus:w-64 transition-all"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="p-1.5 rounded-full text-white disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: primaryColor }}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    );
  }

  // Default: prominent variant
  return (
    <motion.form
      onSubmit={handleSubmit}
      animate={isFocused ? { scale: 1.02 } : { scale: 1 }}
      className={`
        relative bg-white rounded-2xl shadow-lg border-2 transition-colors overflow-hidden
        ${isFocused ? 'border-opacity-100' : 'border-gray-100'}
      `}
      style={{ borderColor: isFocused ? primaryColor : undefined }}
    >
      <div className="flex items-center p-2">
        <div className="pl-4 pr-2">
          <MessageCircle className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 px-2 py-3 text-gray-900 placeholder-gray-400 border-none outline-none text-base"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className={`
            flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white
            transition-all disabled:opacity-50 disabled:cursor-not-allowed
          `}
          style={{ backgroundColor: primaryColor }}
        >
          <span>{buttonText}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      {sectionContext && (
        <div className="px-6 pb-3">
          <span className="text-xs text-gray-400">
            Asking about: {sectionContext}
          </span>
        </div>
      )}
    </motion.form>
  );
}

// ============================================================================
// SECTION CHAT TRIGGER COMPONENT
// ============================================================================

export function SectionChatTrigger({
  text = "Have questions?",
  context,
  prefilledMessage,
  onClick,
  variant = 'button',
  primaryColor = '#3B82F6',
  icon,
}: SectionChatTriggerProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(prefilledMessage, context);
    }
  };

  if (variant === 'link') {
    return (
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline transition-colors"
        style={{ color: primaryColor }}
      >
        {icon || <MessageCircle className="w-4 h-4" />}
        {text}
      </button>
    );
  }

  if (variant === 'floating') {
    return (
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-6 z-40 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-white text-sm font-medium"
        style={{ backgroundColor: primaryColor }}
      >
        {icon || <MessageCircle className="w-4 h-4" />}
        {text}
      </motion.button>
    );
  }

  // Default: button variant
  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white transition-colors"
      style={{ backgroundColor: primaryColor }}
    >
      {icon || <MessageCircle className="w-5 h-5" />}
      {text}
    </motion.button>
  );
}

// ============================================================================
// QUICK QUESTION COMPONENT
// ============================================================================

export function QuickQuestion({
  questions,
  sectionContext,
  onSelect,
  variant = 'chips',
  primaryColor = '#3B82F6',
}: QuickQuestionProps) {
  const handleSelect = (question: string) => {
    if (onSelect) {
      onSelect(question, sectionContext);
    }
  };

  if (variant === 'list') {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-500 mb-3">Common questions:</p>
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => handleSelect(question)}
            className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm transition-colors flex items-center justify-between group"
          >
            <span>{question}</span>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {questions.map((question, index) => (
          <motion.button
            key={index}
            onClick={() => handleSelect(question)}
            whileHover={{ y: -2 }}
            className="text-left p-4 rounded-xl bg-white border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow transition-all"
          >
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <MessageCircle className="w-4 h-4" style={{ color: primaryColor }} />
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{question}</p>
            </div>
          </motion.button>
        ))}
      </div>
    );
  }

  // Default: chips variant
  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((question, index) => (
        <button
          key={index}
          onClick={() => handleSelect(question)}
          className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
        >
          {question}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  RolePicker,
  ChatInputField,
  SectionChatTrigger,
  QuickQuestion,
};
