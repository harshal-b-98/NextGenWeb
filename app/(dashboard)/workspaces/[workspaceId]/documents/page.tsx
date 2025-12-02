'use client';

/**
 * Documents Page
 * Upload and manage documents for a workspace
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileUpload } from '@/components/documents/file-upload';
import { DocumentsList, type Document } from '@/components/documents/documents-list';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';

export default function DocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const workspaceId = params.workspaceId as string;

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch(`/api/documents?workspaceId=${workspaceId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data.documents);
    } catch (error) {
      addToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load documents',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, addToast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUploadComplete = (documentId: string, fileName: string) => {
    addToast({
      title: 'Upload Complete',
      description: `${fileName} has been uploaded and processed.`,
      variant: 'success',
    });
    // Refresh the document list
    fetchDocuments();
  };

  const handleUploadError = (fileName: string, error: string) => {
    addToast({
      title: 'Upload Failed',
      description: `${fileName}: ${error}`,
      variant: 'error',
    });
  };

  const handleDelete = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents?id=${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete document');
      }

      addToast({
        title: 'Document Deleted',
        description: 'The document has been permanently deleted.',
        variant: 'success',
      });

      // Update local state
      setDocuments(prev => prev.filter(d => d.id !== documentId));
    } catch (error) {
      addToast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete document',
        variant: 'error',
      });
    }
  };

  const handleView = (documentId: string) => {
    // TODO: Implement document viewer
    router.push(`/workspaces/${workspaceId}/documents/${documentId}`);
  };

  const handleRetry = async (documentId: string) => {
    try {
      const response = await fetch('/api/documents/retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to retry document');
      }

      addToast({
        title: 'Processing Started',
        description: 'The document is being reprocessed.',
        variant: 'success',
      });

      // Refresh the document list to show updated status
      fetchDocuments();
    } catch (error) {
      addToast({
        title: 'Retry Failed',
        description: error instanceof Error ? error.message : 'Failed to retry document',
        variant: 'error',
      });
    }
  };

  const handleExtractKnowledge = async (documentId: string) => {
    try {
      const response = await fetch('/api/knowledge/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract knowledge');
      }

      if (data.warning) {
        addToast({
          title: 'Partial Success',
          description: data.warning,
          variant: 'warning',
        });
      } else {
        addToast({
          title: 'Knowledge Extracted',
          description: `Extracted ${data.stats?.entitiesExtracted || 0} entities and ${data.stats?.relationshipsExtracted || 0} relationships.`,
          variant: 'success',
        });
      }
    } catch (error) {
      addToast({
        title: 'Extraction Failed',
        description: error instanceof Error ? error.message : 'Failed to extract knowledge',
        variant: 'error',
      });
    }
  };

  return (
    <div className="container max-w-5xl py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/workspaces/${workspaceId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-neutral-500">
            Upload and manage documents to build your knowledge base
          </p>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)}>
          {showUpload ? (
            <>
              <FileText className="mr-2 h-4 w-4" />
              View Documents
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Upload Documents
            </>
          )}
        </Button>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Documents
            </CardTitle>
            <CardDescription>
              Upload PDF, Word, Excel, or text files to extract knowledge
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              workspaceId={workspaceId}
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              maxFiles={10}
            />
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Documents
          </CardTitle>
          <CardDescription>
            {documents.length === 0
              ? 'No documents uploaded yet'
              : `${documents.length} document${documents.length !== 1 ? 's' : ''} in this workspace`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentsList
            documents={documents}
            isLoading={isLoading}
            onDelete={handleDelete}
            onView={handleView}
            onRetry={handleRetry}
            onExtractKnowledge={handleExtractKnowledge}
            onRefresh={fetchDocuments}
          />
        </CardContent>
      </Card>

      {/* Help Section */}
      {documents.length === 0 && !showUpload && (
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Get Started with Documents</h3>
                <p className="text-sm text-neutral-600 mb-4">
                  Upload your marketing materials, product documentation, or any content
                  you want to use for generating your website. Our AI will extract knowledge
                  and help create personalized content.
                </p>
                <Button onClick={() => setShowUpload(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Your First Document
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
