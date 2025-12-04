/**
 * Finalization Checklist Modal
 *
 * Pre-flight validation modal shown before creating production branch.
 * Validates website readiness and guides users through final steps.
 *
 * Epic #146: Interactive Website Feedback & Refinement System
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Loader2,
  Rocket,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface ValidationCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface FinalizationChecklistProps {
  isOpen: boolean;
  onClose: () => void;
  websiteId: string;
  workspaceId: string;
  websiteName: string;
  onFinalizationComplete: () => void;
}

export function FinalizationChecklist({
  isOpen,
  onClose,
  websiteId,
  workspaceId,
  websiteName,
  onFinalizationComplete,
}: FinalizationChecklistProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    passed: boolean;
    checks: ValidationCheck[];
  } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Run validation when modal opens
  useEffect(() => {
    if (isOpen) {
      runValidation();
    }
  }, [isOpen]);

  const runValidation = async () => {
    setIsValidating(true);
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/websites/${websiteId}/finalize`,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error('Failed to run validation');
      }

      const data = await response.json();
      setValidationResult(data.validation);
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Failed to validate website');
    } finally {
      setIsValidating(false);
    }
  };

  const handleFinalize = async () => {
    if (!validationResult?.passed) {
      toast.error('Please fix all errors before finalizing');
      return;
    }

    setIsFinalizing(true);
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/websites/${websiteId}/finalize`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to finalize website');
      }

      const data = await response.json();

      // Show celebration
      setShowCelebration(true);
      toast.success('Production branch created successfully!');

      // Wait for celebration, then callback
      setTimeout(() => {
        onFinalizationComplete();
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Finalization error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to finalize website');
    } finally {
      setIsFinalizing(false);
    }
  };

  const getCheckIcon = (check: ValidationCheck) => {
    if (check.passed) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    if (check.severity === 'error') {
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
    if (check.severity === 'warning') {
      return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
    return <Info className="w-5 h-5 text-blue-600" />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full pointer-events-auto overflow-hidden">
              {/* Celebration Overlay */}
              <AnimatePresence>
                {showCelebration && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center z-10"
                  >
                    <div className="text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', duration: 0.5 }}
                      >
                        <div className="text-6xl mb-4">🎉</div>
                      </motion.div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Production Branch Created!
                      </h2>
                      <p className="text-gray-600">Your website is ready to deploy</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Rocket className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Ready to Finalize?</h2>
                      <p className="text-sm text-gray-600">{websiteName}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Validation Checklist */}
              <div className="p-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">
                  Pre-flight Check
                </h3>

                {isValidating ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                ) : validationResult ? (
                  <div className="space-y-3">
                    {validationResult.checks.map((check, index) => (
                      <motion.div
                        key={check.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
                      >
                        {getCheckIcon(check)}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{check.message}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Click "Run Validation" to check your website</p>
                  </div>
                )}
              </div>

              {/* What Happens Next */}
              <div className="px-6 pb-6">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    What happens next:
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      Creates a "Production" branch (locked snapshot)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      You can keep editing the "Draft" branch
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      Production branch is ready for deployment
                    </li>
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 flex items-center justify-between gap-3">
                <button
                  onClick={runValidation}
                  disabled={isValidating}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {isValidating ? 'Validating...' : 'Re-run Validation'}
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Continue Editing
                  </button>
                  <button
                    onClick={handleFinalize}
                    disabled={!validationResult?.passed || isFinalizing}
                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isFinalizing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating Production Branch...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-4 h-4" />
                        Create Production Branch
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
