/**
 * Document Processing Queue
 *
 * A simple in-memory queue for processing documents asynchronously.
 * In production, this should be replaced with a proper job queue like:
 * - Redis + BullMQ
 * - Supabase Edge Functions
 * - AWS SQS
 * - Inngest
 */

import { createClient } from '@/lib/supabase/server';
import { runAutoGeneratePipeline, buildResultMessage } from '@/lib/pipeline/auto-generate';
import type { SupportedFileType } from './parsers';

/**
 * Trigger auto-generation pipeline after document processing
 */
async function triggerAutoGenerate(workspaceId: string, documentId: string): Promise<void> {
  try {
    const result = await runAutoGeneratePipeline({
      workspaceId,
      documentId,
    });
    console.log('Auto-generate pipeline completed (queue):', buildResultMessage(result));
    if (result.errors.length > 0) {
      console.warn('Pipeline warnings:', result.errors);
    }
  } catch (error) {
    console.error('Auto-generate pipeline error (queue):', error);
  }
}

export interface QueueJob {
  id: string;
  documentId: string;
  workspaceId: string;
  filePath: string;
  fileType: SupportedFileType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  progress?: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

// In-memory job storage (replace with Redis in production)
const jobs = new Map<string, QueueJob>();
const processingQueue: string[] = [];
let isProcessing = false;

/**
 * Add a document to the processing queue
 */
export function enqueueDocument(
  documentId: string,
  workspaceId: string,
  filePath: string,
  fileType: SupportedFileType
): QueueJob {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const job: QueueJob = {
    id: jobId,
    documentId,
    workspaceId,
    filePath,
    fileType,
    status: 'pending',
    progress: 0,
    createdAt: new Date(),
  };

  jobs.set(jobId, job);
  processingQueue.push(jobId);

  // Start processing if not already running
  processNextJob();

  return job;
}

/**
 * Get a job by ID
 */
export function getJob(jobId: string): QueueJob | undefined {
  return jobs.get(jobId);
}

/**
 * Get jobs for a specific document
 */
export function getJobsByDocument(documentId: string): QueueJob[] {
  return Array.from(jobs.values()).filter(job => job.documentId === documentId);
}

/**
 * Get jobs for a workspace
 */
export function getJobsByWorkspace(workspaceId: string): QueueJob[] {
  return Array.from(jobs.values()).filter(job => job.workspaceId === workspaceId);
}

/**
 * Get queue statistics
 */
export function getQueueStats(): QueueStats {
  const allJobs = Array.from(jobs.values());

  return {
    pending: allJobs.filter(j => j.status === 'pending').length,
    processing: allJobs.filter(j => j.status === 'processing').length,
    completed: allJobs.filter(j => j.status === 'completed').length,
    failed: allJobs.filter(j => j.status === 'failed').length,
    total: allJobs.length,
  };
}

/**
 * Update job progress
 */
export function updateJobProgress(jobId: string, progress: number): void {
  const job = jobs.get(jobId);
  if (job) {
    job.progress = Math.min(100, Math.max(0, progress));
  }
}

/**
 * Process the next job in the queue
 */
async function processNextJob(): Promise<void> {
  if (isProcessing || processingQueue.length === 0) {
    return;
  }

  isProcessing = true;

  const jobId = processingQueue.shift();
  if (!jobId) {
    isProcessing = false;
    return;
  }

  const job = jobs.get(jobId);
  if (!job) {
    isProcessing = false;
    processNextJob();
    return;
  }

  job.status = 'processing';
  job.startedAt = new Date();
  job.progress = 10;

  try {
    // Import server-only modules dynamically
    const { parseDocument } = await import('./parsers.server');

    const supabase = await createClient();

    // Download file from storage
    job.progress = 20;
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(job.filePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message || 'Unknown error'}`);
    }

    // Convert to buffer
    job.progress = 40;
    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Parse document
    job.progress = 60;
    const parsed = await parseDocument(buffer, job.fileType);

    // Update document in database
    job.progress = 80;
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        extracted_text: parsed.text,
        status: 'completed',
        metadata: {
          ...parsed.metadata,
          processedAt: new Date().toISOString(),
          processedBy: 'queue',
        },
      })
      .eq('id', job.documentId);

    if (updateError) {
      throw new Error(`Failed to update document: ${updateError.message}`);
    }

    // Mark job as completed
    job.status = 'completed';
    job.progress = 100;
    job.completedAt = new Date();

    // Trigger auto-generate pipeline in background
    triggerAutoGenerate(job.workspaceId, job.documentId);

  } catch (error) {
    // Mark job as failed
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Unknown error';
    job.completedAt = new Date();

    // Update document status in database
    try {
      const supabase = await createClient();
      await supabase
        .from('documents')
        .update({
          status: 'failed',
          metadata: {
            error: job.error,
            failedAt: new Date().toISOString(),
          },
        })
        .eq('id', job.documentId);
    } catch {
      console.error('Failed to update document status after queue failure');
    }
  }

  isProcessing = false;

  // Process next job
  processNextJob();
}

/**
 * Retry a failed job
 */
export function retryJob(jobId: string): boolean {
  const job = jobs.get(jobId);
  if (!job || job.status !== 'failed') {
    return false;
  }

  job.status = 'pending';
  job.error = undefined;
  job.progress = 0;
  job.startedAt = undefined;
  job.completedAt = undefined;

  processingQueue.push(jobId);
  processNextJob();

  return true;
}

/**
 * Cancel a pending job
 */
export function cancelJob(jobId: string): boolean {
  const job = jobs.get(jobId);
  if (!job || job.status !== 'pending') {
    return false;
  }

  const queueIndex = processingQueue.indexOf(jobId);
  if (queueIndex > -1) {
    processingQueue.splice(queueIndex, 1);
  }

  jobs.delete(jobId);
  return true;
}

/**
 * Clear completed jobs older than a certain age
 */
export function clearOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
  const cutoff = Date.now() - maxAgeMs;
  let cleared = 0;

  for (const [id, job] of jobs.entries()) {
    if (
      (job.status === 'completed' || job.status === 'failed') &&
      job.completedAt &&
      job.completedAt.getTime() < cutoff
    ) {
      jobs.delete(id);
      cleared++;
    }
  }

  return cleared;
}
