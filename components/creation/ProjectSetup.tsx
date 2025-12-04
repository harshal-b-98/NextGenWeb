/**
 * Project Setup Component
 *
 * First step in creation flow - collect project name and brief details
 * Creates workspace and initializes the project
 *
 * Epic: NextGenWeb Complete Product Reimplementation
 * Phase 1: Foundation
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, ArrowRight } from 'lucide-react';

interface ProjectSetupProps {
  onSetupComplete: (workspaceId: string, projectName: string) => void;
}

export function ProjectSetup({ onSetupComplete }: ProjectSetupProps) {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      setError('Please enter a project name');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Create workspace
      const response = await fetch('/api/workspaces/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create workspace');
      }

      const data = await response.json();

      // Call parent with workspace ID
      onSetupComplete(data.workspace.id, projectName);
    } catch (err) {
      console.error('Error creating workspace:', err);
      setError('Failed to create project. Please try again.');
      setIsCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Let's Start Your Project
        </h2>
        <p className="text-gray-600">
          Give your website a name and tell us a bit about it
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Name */}
        <div className="space-y-2">
          <Label htmlFor="projectName" className="text-base font-semibold text-gray-900">
            Project Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="projectName"
            placeholder="e.g., My Coffee Shop, Tech Startup, Portfolio Site"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="text-lg h-12"
            maxLength={100}
            disabled={isCreating}
            autoFocus
          />
          <p className="text-sm text-gray-500">
            Choose a memorable name for your project
          </p>
        </div>

        {/* Project Description */}
        <div className="space-y-2">
          <Label htmlFor="projectDescription" className="text-base font-semibold text-gray-900">
            Brief Description <span className="text-gray-400">(Optional)</span>
          </Label>
          <Textarea
            id="projectDescription"
            placeholder="Tell us about your business, goals, or what you'd like the website to achieve..."
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            className="min-h-[120px] text-base"
            maxLength={500}
            disabled={isCreating}
          />
          <p className="text-sm text-gray-500">
            This helps our AI understand your vision better
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            size="lg"
            disabled={isCreating || !projectName.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-6"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Project...
              </>
            ) : (
              <>
                Continue to Upload Documents
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> You can always change these details later from your dashboard
          </p>
        </div>
      </form>
    </motion.div>
  );
}
