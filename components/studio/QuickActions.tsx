/**
 * Quick Actions Component
 * Preset feedback buttons for common requests
 */

'use client';

import { Zap } from 'lucide-react';

interface QuickActionsProps {
  onSelect: (action: string) => void;
  disabled?: boolean;
}

const QUICK_ACTIONS = [
  { label: 'Make shorter', value: 'Make this section shorter and more concise' },
  { label: 'More professional', value: 'Make this sound more professional' },
  { label: 'Add urgency', value: 'Add a sense of urgency to this section' },
  { label: 'Stronger CTA', value: 'Make the call-to-action stronger' },
];

export function QuickActions({ onSelect, disabled = false }: QuickActionsProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
        <Zap className="h-3 w-3" />
        Quick Actions
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => onSelect(action.value)}
            disabled={disabled}
            className="px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded hover:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-left"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
