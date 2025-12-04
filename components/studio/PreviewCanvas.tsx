/**
 * Preview Canvas Component
 *
 * Right panel (70%) of Studio - Live website preview with section selection
 *
 * Epic: NextGenWeb Complete Product Reimplementation
 * Phase 2: Preview Studio & Refinement
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DynamicPageRenderer } from '@/components/runtime/DynamicPageRenderer';

interface PreviewCanvasProps {
  websiteId: string;
  device: 'desktop' | 'tablet' | 'mobile';
  selectedSection: string | null;
  onSectionClick?: (sectionId: string) => void;
  snapshot: any;
}

export function PreviewCanvas({
  websiteId,
  device,
  selectedSection,
  onSectionClick,
  snapshot,
}: PreviewCanvasProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [previewData, setPreviewData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPreview();
  }, [websiteId, snapshot]);

  const loadPreview = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // If snapshot provided, use it directly
      if (snapshot) {
        setPreviewData(snapshot);
        setIsLoading(false);
        return;
      }

      // Otherwise fetch current version
      const response = await fetch(`/api/websites/${websiteId}/preview`);

      if (!response.ok) {
        throw new Error('Failed to load preview');
      }

      const data = await response.json();
      setPreviewData(data.snapshot);
    } catch (err) {
      console.error('Error loading preview:', err);
      setError('Failed to load preview');
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceDimensions = () => {
    switch (device) {
      case 'mobile':
        return { width: '375px', height: '100%' };
      case 'tablet':
        return { width: '768px', height: '100%' };
      default:
        return { width: '100%', height: '100%' };
    }
  };

  const dimensions = getDeviceDimensions();

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Preview Failed to Load
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadPreview} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-100 flex items-start justify-center overflow-auto p-8">
      {/* Device Frame */}
      <motion.div
        key={device}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-lg shadow-2xl overflow-hidden"
        style={{
          width: dimensions.width,
          minHeight: device === 'desktop' ? '100%' : '812px',
        }}
      >
        {previewData ? (
          <div className="relative">
            {/* Preview content */}
            <DynamicPageRenderer
              pageData={{
                pageId: previewData.id || 'preview',
                websiteId: previewData.websiteId || '',
                title: previewData.title || 'Preview',
                slug: 'preview',
                path: '/preview',
                sections: previewData.sections || [],
                metadata: {
                  title: previewData.title || 'Preview',
                  description: '',
                  keywords: [],
                },
                availablePersonas: [],
              }}
              autoInitTracking={false}
            />

            {/* Section selection overlay */}
            {selectedSection && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="relative h-full">
                  {/* Highlight selected section */}
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-blue-500" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-12 text-center">
            <div>
              <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Preview Available
              </h3>
              <p className="text-gray-600">
                Your website is being generated. This preview will update automatically.
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
