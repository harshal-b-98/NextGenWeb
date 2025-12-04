/**
 * Regeneration Progress Component
 *
 * Multi-stage progress indicator shown during AI regeneration.
 * Displays current stage, progress percentage, and estimated time.
 *
 * Epic #146: Interactive Website Feedback & Refinement System
 */

'use client';

import { motion } from 'framer-motion';
import { Loader2, Sparkles, Wand2, RefreshCw } from 'lucide-react';

type RegenerationStage = 'analyzing' | 'regenerating' | 'updating';

interface RegenerationProgressProps {
  stage: RegenerationStage;
  progress: number; // 0-100
  estimatedTimeRemaining: number | null; // seconds
}

const stageConfig = {
  analyzing: {
    title: 'Analyzing Feedback',
    description: 'Understanding your requested changes',
    icon: Sparkles,
    color: 'blue',
    progressRange: [0, 30],
  },
  regenerating: {
    title: 'Regenerating Content',
    description: 'Creating improved content with AI',
    icon: Wand2,
    color: 'purple',
    progressRange: [30, 80],
  },
  updating: {
    title: 'Updating Preview',
    description: 'Applying changes to your website',
    icon: RefreshCw,
    color: 'green',
    progressRange: [80, 100],
  },
};

export function RegenerationProgress({
  stage,
  progress,
  estimatedTimeRemaining,
}: RegenerationProgressProps) {
  const config = stageConfig[stage];
  const Icon = config.icon;

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-600',
        text: 'text-blue-600',
        ring: 'ring-blue-500',
      },
      purple: {
        bg: 'bg-purple-600',
        text: 'text-purple-600',
        ring: 'ring-purple-500',
      },
      green: {
        bg: 'bg-green-600',
        text: 'text-green-600',
        ring: 'ring-green-500',
      },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const colorClasses = getColorClasses(config.color);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4"
    >
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className={`relative ${colorClasses.ring} ring-8 ring-opacity-20 rounded-full p-4`}>
          <Icon className={`w-8 h-8 ${colorClasses.text}`} />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0"
          >
            <Loader2 className={`w-16 h-16 ${colorClasses.text} opacity-20 -m-4`} />
          </motion.div>
        </div>
      </div>

      {/* Stage Title */}
      <h3 className="text-xl font-bold text-gray-900 text-center mb-2">{config.title}</h3>
      <p className="text-sm text-gray-600 text-center mb-6">{config.description}</p>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700">Progress</span>
          <span className="text-xs font-semibold text-gray-900">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full ${colorClasses.bg} rounded-full`}
          />
        </div>
      </div>

      {/* Estimated Time */}
      {estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 && (
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Estimated time remaining:{' '}
            <span className="font-semibold text-gray-700">
              {estimatedTimeRemaining < 60
                ? `${estimatedTimeRemaining}s`
                : `${Math.ceil(estimatedTimeRemaining / 60)}m`}
            </span>
          </p>
        </div>
      )}

      {/* Stage Indicators */}
      <div className="mt-6 flex items-center justify-center space-x-2">
        {(['analyzing', 'regenerating', 'updating'] as const).map((stageName, index) => {
          const isPast = config.progressRange[0] > stageConfig[stageName].progressRange[1];
          const isCurrent = stageName === stage;
          const isFuture = config.progressRange[1] < stageConfig[stageName].progressRange[0];

          return (
            <div key={stageName} className="flex items-center">
              <div
                className={`w-2 h-2 rounded-full transition-colors ${
                  isPast
                    ? 'bg-green-500'
                    : isCurrent
                    ? `${colorClasses.bg}`
                    : 'bg-gray-300'
                }`}
              />
              {index < 2 && <div className="w-8 h-0.5 bg-gray-300 mx-1" />}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
