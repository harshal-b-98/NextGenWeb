/**
 * LLM Client
 *
 * Unified client for interacting with LLM providers (OpenAI, Anthropic).
 * Implements fallback chain for reliability.
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import type { LLMConfig, LLMModel, LLMProvider } from './types';
import { DEFAULT_LLM_CHAIN } from './types';

/**
 * Message format for LLM interactions
 */
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * LLM completion options
 */
export interface CompletionOptions {
  messages: LLMMessage[];
  config?: Partial<LLMConfig>;
  jsonMode?: boolean;
}

/**
 * LLM completion result
 */
export interface CompletionResult {
  content: string;
  tokensUsed: number;
  model: LLMModel;
  provider: LLMProvider;
}

/**
 * Create OpenAI client
 */
function createOpenAIClient(apiKey?: string): OpenAI {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error('OpenAI API key is required');
  }
  return new OpenAI({ apiKey: key });
}

/**
 * Create Anthropic client
 */
function createAnthropicClient(apiKey?: string): Anthropic {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error('Anthropic API key is required');
  }
  return new Anthropic({ apiKey: key });
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  messages: LLMMessage[],
  config: LLMConfig,
  jsonMode: boolean = false
): Promise<CompletionResult> {
  const client = createOpenAIClient(config.apiKey);

  const systemMessage = messages.find(m => m.role === 'system');
  const otherMessages = messages.filter(m => m.role !== 'system');

  const response = await client.chat.completions.create({
    model: config.model,
    messages: [
      ...(systemMessage ? [{ role: 'system' as const, content: systemMessage.content }] : []),
      ...otherMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ],
    temperature: config.temperature ?? 0.1,
    max_tokens: config.maxTokens ?? 4096,
    response_format: jsonMode ? { type: 'json_object' as const } : undefined,
  });

  const content = response.choices[0]?.message?.content || '';
  const tokensUsed = response.usage?.total_tokens || 0;

  return {
    content,
    tokensUsed,
    model: config.model,
    provider: 'openai',
  };
}

/**
 * Call Anthropic API
 */
async function callAnthropic(
  messages: LLMMessage[],
  config: LLMConfig,
  jsonMode: boolean = false
): Promise<CompletionResult> {
  const client = createAnthropicClient(config.apiKey);

  const systemMessage = messages.find(m => m.role === 'system');
  const otherMessages = messages.filter(m => m.role !== 'system');

  // Add JSON instruction to system prompt if json mode
  let systemContent = systemMessage?.content || '';
  if (jsonMode) {
    systemContent += '\n\nIMPORTANT: You must respond with valid JSON only. No additional text or explanation.';
  }

  const response = await client.messages.create({
    model: config.model,
    max_tokens: config.maxTokens ?? 4096,
    system: systemContent,
    messages: otherMessages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  });

  const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
  const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

  return {
    content,
    tokensUsed,
    model: config.model,
    provider: 'anthropic',
  };
}

/**
 * Complete a prompt using the configured LLM
 */
export async function complete(options: CompletionOptions): Promise<CompletionResult> {
  const { messages, config, jsonMode = false } = options;

  // Build the chain of models to try
  const chain: LLMConfig[] = config
    ? [{ ...DEFAULT_LLM_CHAIN[0], ...config }, ...DEFAULT_LLM_CHAIN.slice(1)]
    : DEFAULT_LLM_CHAIN;

  let lastError: Error | null = null;

  for (const llmConfig of chain) {
    try {
      if (llmConfig.provider === 'openai') {
        return await callOpenAI(messages, llmConfig, jsonMode);
      } else if (llmConfig.provider === 'anthropic') {
        return await callAnthropic(messages, llmConfig, jsonMode);
      }
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `LLM call failed for ${llmConfig.provider}/${llmConfig.model}: ${lastError.message}`
      );
      // Continue to next model in chain
    }
  }

  throw lastError || new Error('All LLM providers failed');
}

/**
 * Complete with JSON output
 */
export async function completeJSON<T>(options: CompletionOptions): Promise<{
  data: T;
  tokensUsed: number;
  model: LLMModel;
  provider: LLMProvider;
}> {
  // Ensure sufficient max tokens for JSON responses
  const jsonOptions = {
    ...options,
    config: {
      ...options.config,
      maxTokens: options.config?.maxTokens ?? 8192,
    },
  };

  const result = await complete({ ...jsonOptions, jsonMode: true });

  try {
    // Try to parse the JSON response
    let content = result.content.trim();

    // Handle potential markdown code blocks
    if (content.startsWith('```json')) {
      content = content.slice(7);
    }
    if (content.startsWith('```')) {
      content = content.slice(3);
    }
    if (content.endsWith('```')) {
      content = content.slice(0, -3);
    }

    content = content.trim();

    // Try to repair truncated JSON by finding valid JSON structure
    let data: T;
    try {
      data = JSON.parse(content) as T;
    } catch {
      // Try to repair truncated JSON
      const repaired = repairTruncatedJSON(content);
      data = JSON.parse(repaired) as T;
    }

    return {
      data,
      tokensUsed: result.tokensUsed,
      model: result.model,
      provider: result.provider,
    };
  } catch (e) {
    throw new Error(`Failed to parse JSON response: ${result.content.slice(0, 200)}...`);
  }
}

/**
 * Attempt to repair truncated JSON by closing open brackets/braces
 */
function repairTruncatedJSON(json: string): string {
  let repaired = json;

  // Count open brackets and braces
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escapeNext = false;

  for (const char of repaired) {
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === '{') openBraces++;
    if (char === '}') openBraces--;
    if (char === '[') openBrackets++;
    if (char === ']') openBrackets--;
  }

  // If we're in the middle of a string, close it
  if (inString) {
    repaired += '"';
  }

  // Remove trailing incomplete values (like "confidence": without a value)
  repaired = repaired.replace(/,\s*"[^"]*":\s*\.{0,3}$/g, '');
  repaired = repaired.replace(/,\s*"[^"]*":\s*$/g, '');
  repaired = repaired.replace(/,\s*$/g, '');

  // Close open brackets and braces
  while (openBrackets > 0) {
    repaired += ']';
    openBrackets--;
  }
  while (openBraces > 0) {
    repaired += '}';
    openBraces--;
  }

  return repaired;
}

/**
 * Stream a completion (OpenAI only for now)
 */
export async function* streamComplete(
  options: CompletionOptions
): AsyncGenerator<string, void, unknown> {
  const { messages, config } = options;
  const llmConfig = config
    ? { ...DEFAULT_LLM_CHAIN[0], ...config }
    : DEFAULT_LLM_CHAIN[0];

  if (llmConfig.provider !== 'openai') {
    // Fall back to non-streaming for Anthropic
    const result = await complete(options);
    yield result.content;
    return;
  }

  const client = createOpenAIClient(llmConfig.apiKey);

  const systemMessage = messages.find(m => m.role === 'system');
  const otherMessages = messages.filter(m => m.role !== 'system');

  const stream = await client.chat.completions.create({
    model: llmConfig.model,
    messages: [
      ...(systemMessage ? [{ role: 'system' as const, content: systemMessage.content }] : []),
      ...otherMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ],
    temperature: llmConfig.temperature ?? 0.1,
    max_tokens: llmConfig.maxTokens ?? 4096,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}
