/**
 * Embedding Client
 *
 * Client for generating embeddings using OpenAI's API.
 */

import OpenAI from 'openai';
import type {
  EmbeddingModel,
  EmbeddingInput,
  EmbeddingResult,
  BatchEmbeddingResult,
  EmbeddingModelConfig,
} from './types';
import { EMBEDDING_MODELS } from './types';

/**
 * Default embedding model to use
 */
const DEFAULT_MODEL: EmbeddingModel = 'text-embedding-3-small';

/**
 * Maximum batch size for embedding requests
 */
const MAX_BATCH_SIZE = 100;

/**
 * Embedding client configuration
 */
interface EmbeddingClientConfig {
  apiKey?: string;
  model?: EmbeddingModel;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Create an OpenAI client instance
 */
function createOpenAIClient(apiKey?: string): OpenAI {
  const key = apiKey || process.env.OPENAI_API_KEY;

  if (!key) {
    throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable.');
  }

  return new OpenAI({ apiKey: key });
}

/**
 * Estimate token count for text (rough approximation)
 */
function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for English
  return Math.ceil(text.length / 4);
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(
  text: string,
  config?: EmbeddingClientConfig
): Promise<EmbeddingResult> {
  const client = createOpenAIClient(config?.apiKey);
  const model = config?.model || DEFAULT_MODEL;
  const modelConfig = EMBEDDING_MODELS[model];

  // Truncate text if it exceeds token limit
  const estimatedTokens = estimateTokens(text);
  let truncatedText = text;

  if (estimatedTokens > modelConfig.maxTokens) {
    // Rough truncation based on character count
    const maxChars = modelConfig.maxTokens * 4;
    truncatedText = text.slice(0, maxChars);
  }

  const response = await client.embeddings.create({
    model,
    input: truncatedText,
  });

  return {
    id: '',
    embedding: response.data[0].embedding,
    tokenCount: response.usage.total_tokens,
    model,
  };
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateBatchEmbeddings(
  inputs: EmbeddingInput[],
  config?: EmbeddingClientConfig
): Promise<BatchEmbeddingResult> {
  const startTime = Date.now();
  const client = createOpenAIClient(config?.apiKey);
  const model = config?.model || DEFAULT_MODEL;
  const modelConfig = EMBEDDING_MODELS[model];
  const maxRetries = config?.maxRetries || 3;
  const retryDelay = config?.retryDelay || 1000;

  const results: EmbeddingResult[] = [];
  const errors: Array<{ id: string; error: string }> = [];
  let totalTokens = 0;

  // Process in batches
  for (let i = 0; i < inputs.length; i += MAX_BATCH_SIZE) {
    const batch = inputs.slice(i, i + MAX_BATCH_SIZE);

    // Prepare texts, truncating if necessary
    const texts = batch.map(input => {
      const estimatedTokens = estimateTokens(input.text);
      if (estimatedTokens > modelConfig.maxTokens) {
        const maxChars = modelConfig.maxTokens * 4;
        return input.text.slice(0, maxChars);
      }
      return input.text;
    });

    // Filter out empty texts
    const validInputs: Array<{ input: EmbeddingInput; text: string; index: number }> = [];
    batch.forEach((input, index) => {
      const text = texts[index].trim();
      if (text) {
        validInputs.push({ input, text, index });
      } else {
        errors.push({ id: input.id, error: 'Empty text content' });
      }
    });

    if (validInputs.length === 0) continue;

    // Generate embeddings with retry logic
    let attempt = 0;
    let success = false;

    while (attempt < maxRetries && !success) {
      try {
        const response = await client.embeddings.create({
          model,
          input: validInputs.map(v => v.text),
        });

        // Map results back to inputs
        response.data.forEach((embedding, idx) => {
          const { input } = validInputs[idx];
          results.push({
            id: input.id,
            embedding: embedding.embedding,
            tokenCount: 0, // Individual token counts not available in batch
            model,
          });
        });

        totalTokens += response.usage.total_tokens;
        success = true;
      } catch (error) {
        attempt++;

        if (attempt >= maxRetries) {
          // Add all inputs in this batch to errors
          validInputs.forEach(({ input }) => {
            errors.push({
              id: input.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          });
        } else {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }
  }

  const processingTime = Date.now() - startTime;
  const estimatedCost = (totalTokens / 1000) * modelConfig.costPer1kTokens;

  return {
    results,
    errors,
    totalTokens,
    processingTime,
    estimatedCost,
  };
}

/**
 * Get the configuration for a specific model
 */
export function getModelConfig(model: EmbeddingModel = DEFAULT_MODEL): EmbeddingModelConfig {
  return EMBEDDING_MODELS[model];
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Normalize a vector to unit length
 */
export function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));

  if (magnitude === 0) {
    return vector;
  }

  return vector.map(v => v / magnitude);
}
