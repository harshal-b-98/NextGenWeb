/**
 * NextGenWeb Homepage & Creation Flow
 *
 * This IS the landing page - /create serves as the entry point
 * Flow: Landing Hero → Project Setup → Upload → Chat → Generate → Studio
 *
 * Epic: NextGenWeb Complete Product Reimplementation
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen';
import { ProjectSetup } from '@/components/creation/ProjectSetup';
import { DocumentUpload } from '@/components/creation/DocumentUpload';
import { DiscoveryChat } from '@/components/creation/DiscoveryChat';
import { LiveGeneration } from '@/components/creation/LiveGeneration';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';

type Step = 'landing' | 'setup' | 'upload' | 'discover' | 'generate';

export default function CreateWebsitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState<Step>('landing');
  const [user, setUser] = useState<any>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [websiteId, setWebsiteId] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [generatedWebsiteId, setGeneratedWebsiteId] = useState<string | null>(null);

  // Check authentication status
  useEffect(() => {
    checkAuth();
  }, []);

  // Check URL params for step
  useEffect(() => {
    const step = searchParams.get('step') as Step;
    if (step && ['setup', 'upload', 'discover', 'generate'].includes(step)) {
      setCurrentStep(step);
    }
  }, [searchParams]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        // If user has workspace, fetch it
        if (data.user) {
          fetchWorkspace();
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  };

  const fetchWorkspace = async () => {
    try {
      const response = await fetch('/api/user/workspace');
      if (response.ok) {
        const data = await response.json();
        if (data.workspace) {
          setWorkspaceId(data.workspace.id);
        }
      }
    } catch (error) {
      console.error('Error fetching workspace:', error);
    }
  };

  const handleSetupComplete = (newWorkspaceId: string, projectName: string) => {
    setWorkspaceId(newWorkspaceId);
    // Auto-advance to upload
    setCurrentStep('upload');
  };

  const handleUploadComplete = (documentIds: string[]) => {
    setUploadedDocuments(documentIds);
    // Auto-advance to discovery
    setCurrentStep('discover');
  };

  const handleDiscoveryComplete = (sessionId: string) => {
    setConversationId(sessionId);
    // Auto-advance to generation
    setCurrentStep('generate');
  };

  const handleGenerationComplete = (websiteId: string) => {
    setGeneratedWebsiteId(websiteId);
    // Redirect to studio
    router.push(`/studio/${websiteId}`);
  };

  const steps = [
    { id: 'setup', label: 'Project Setup', completed: workspaceId !== null },
    { id: 'upload', label: 'Upload Documents', completed: uploadedDocuments.length > 0 },
    { id: 'discover', label: 'AI Discovery', completed: conversationId !== null },
    { id: 'generate', label: 'Generate Website', completed: generatedWebsiteId !== null },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Show landing page first */}
      {currentStep === 'landing' && <WelcomeScreen />}

      {/* Show creation flow after landing */}
      {currentStep !== 'landing' && (
        <>
          {/* Header */}
          <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
            <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <h1 className="text-lg font-semibold text-gray-900">Create Your Website</h1>
              <div className="w-24" /> {/* Spacer for alignment */}
            </div>
          </div>

          {/* Progress Steps */}
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-12">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    step.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : currentStep === step.id
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {step.completed ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="font-semibold">{index + 1}</span>
                  )}
                </div>
                <span
                  className={`mt-2 text-sm font-medium ${
                    currentStep === step.id ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 transition-all ${
                    step.completed ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

            {/* Step Content */}
            <Card className="p-8">
              {currentStep === 'setup' && (
                <ProjectSetup onSetupComplete={handleSetupComplete} />
              )}

              {currentStep === 'upload' && workspaceId && (
                <DocumentUpload
                  workspaceId={workspaceId}
                  onUploadComplete={handleUploadComplete}
                />
              )}

              {currentStep === 'discover' && workspaceId && (
                <DiscoveryChat
                  workspaceId={workspaceId}
                  onDiscoveryComplete={handleDiscoveryComplete}
                />
              )}

              {currentStep === 'generate' && conversationId && (
                <LiveGeneration
                  conversationId={conversationId}
                  onGenerationComplete={handleGenerationComplete}
                />
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
