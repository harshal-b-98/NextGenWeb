/**
 * Live Generation Component
 *
 * Step 3 of creation wizard - Live streaming website generation
 * Shows real-time progress with stage updates and preview thumbnails
 *
 * Epic: NextGenWeb Complete Product Reimplementation
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Wand2, Layout, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LiveGenerationProps {
  conversationId: string;
  onGenerationComplete: (websiteId: string) => void;
}

interface GenerationStage {
  id: string;
  label: string;
  description: string;
  icon: typeof Sparkles;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
}

export function LiveGeneration({
  conversationId,
  onGenerationComplete,
}: LiveGenerationProps) {
  const [stages, setStages] = useState<GenerationStage[]>([
    {
      id: 'layout',
      label: 'Generating Layout',
      description: 'Selecting optimal components for your content',
      icon: Layout,
      status: 'pending',
      progress: 0,
    },
    {
      id: 'storyline',
      label: 'Creating Storyline',
      description: 'Building narrative flow and emotional journey',
      icon: Wand2,
      status: 'pending',
      progress: 0,
    },
    {
      id: 'content',
      label: 'Generating Content',
      description: 'Writing copy for all sections',
      icon: FileText,
      status: 'pending',
      progress: 0,
    },
    {
      id: 'finalize',
      label: 'Finalizing Website',
      description: 'Creating version and preparing preview',
      icon: CheckCircle,
      status: 'pending',
      progress: 0,
    },
  ]);

  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [websiteId, setWebsiteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    startGeneration();
  }, []);

  // Handle redirect when generation is complete
  useEffect(() => {
    if (isComplete && websiteId) {
      const timer = setTimeout(() => {
        onGenerationComplete(websiteId);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, websiteId, onGenerationComplete]);

  const startGeneration = async () => {
    try {
      // Trigger generation via conversation
      const response = await fetch(`/api/conversation/${conversationId}/generate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start generation');
      }

      const data = await response.json();
      setWebsiteId(data.websiteId);

      // Simulate streaming progress for now
      // TODO: Replace with actual SSE streaming in streaming-pipeline.ts implementation
      simulateProgress();
    } catch (error) {
      console.error('Generation error:', error);
      setError(error instanceof Error ? error.message : 'Generation failed');
      toast.error('Failed to generate website');
    }
  };

  const simulateProgress = () => {
    let currentIndex = 0;

    const progressInterval = setInterval(() => {
      setStages((prev) => {
        const updated = [...prev];

        // Update current stage
        if (updated[currentIndex]) {
          const currentProgress = updated[currentIndex].progress;

          if (currentProgress < 100) {
            updated[currentIndex].status = 'in_progress';
            updated[currentIndex].progress = Math.min(100, currentProgress + 10);
          } else if (updated[currentIndex].status !== 'completed') {
            updated[currentIndex].status = 'completed';
            currentIndex++;
            setCurrentStageIndex(currentIndex);

            if (currentIndex >= updated.length) {
              clearInterval(progressInterval);
              // Mark as complete
              setIsComplete(true);
            }
          }
        }

        return updated;
      });
    }, 300);
  };

  const overallProgress = Math.round(
    stages.reduce((sum, stage) => sum + stage.progress, 0) / stages.length
  );

  return (
    <div className="space-y-8">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4"
        >
          <Sparkles className="h-8 w-8 text-blue-600" />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Generating Your Website
        </h2>
        <p className="text-gray-600">
          This will take about 30 seconds. Watch the magic happen!
        </p>
      </div>

      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">Overall Progress</span>
          <span className="font-semibold text-gray-900">{overallProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
          />
        </div>
      </div>

      {/* Stage Progress */}
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = index === currentStageIndex;
          const isPast = stage.status === 'completed';
          const isFuture = stage.status === 'pending' && !isActive;

          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                isPast
                  ? 'border-green-200 bg-green-50'
                  : isActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  isPast
                    ? 'bg-green-500'
                    : isActive
                    ? 'bg-blue-600'
                    : 'bg-gray-200'
                }`}
              >
                {isPast ? (
                  <CheckCircle className="h-6 w-6 text-white" />
                ) : isActive ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Icon className="h-6 w-6 text-gray-400" />
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                <p className="text-sm text-gray-600">{stage.description}</p>

                {isActive && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stage.progress}%` }}
                      className="bg-blue-600 h-1.5 rounded-full"
                    />
                  </div>
                )}
              </div>

              {isPast && <CheckCircle className="h-5 w-5 text-green-600" />}
            </motion.div>
          );
        })}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}
