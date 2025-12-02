/**
 * Knowledge Depth Analyzer Service
 * Phase 6.3: Rendering & UX (Wave 2)
 *
 * Analyzes the knowledge base to determine topic coverage and content depth.
 * Used by the Smart CTA Generator to suggest relevant follow-ups based on
 * what topics have substantial knowledge available.
 *
 * Features:
 * - Topic coverage scoring
 * - Content depth measurement
 * - Gap identification
 * - Persona-specific knowledge availability
 * - Caching for performance
 */

import { similaritySearch } from '@/lib/knowledge/embeddings/store';
import { generateEmbedding } from '@/lib/knowledge/embeddings/client';
import { completeJSON } from '@/lib/ai/client';
import type { KnowledgeContextItem, IntentCategory } from './types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Topic with associated coverage metrics
 */
export interface TopicCoverage {
  /** Topic identifier */
  topic: string;
  /** Display label for the topic */
  label: string;
  /** Coverage depth score (0-1) */
  depthScore: number;
  /** Number of knowledge chunks related to this topic */
  chunkCount: number;
  /** Average relevance score of chunks */
  averageRelevance: number;
  /** Related sub-topics discovered */
  subTopics: string[];
  /** Related intent categories */
  intents: IntentCategory[];
  /** Sample content snippets */
  sampleContent: string[];
  /** Whether topic has enough content for rich sections */
  hasRichContent: boolean;
}

/**
 * Knowledge depth analysis result
 */
export interface KnowledgeDepthAnalysis {
  /** Workspace ID analyzed */
  workspaceId: string;
  /** Overall knowledge depth score */
  overallDepthScore: number;
  /** Topics with coverage info */
  topics: TopicCoverage[];
  /** Topics with good coverage (>0.6 depth) */
  strongTopics: string[];
  /** Topics with weak coverage (<0.3 depth) */
  weakTopics: string[];
  /** Identified gaps in knowledge */
  gaps: KnowledgeGap[];
  /** Analysis timestamp */
  analyzedAt: Date;
  /** Tokens used for analysis */
  tokensUsed: number;
}

/**
 * Identified gap in knowledge coverage
 */
export interface KnowledgeGap {
  /** Topic with gap */
  topic: string;
  /** Type of gap */
  gapType: 'missing' | 'shallow' | 'outdated' | 'inconsistent';
  /** Description of the gap */
  description: string;
  /** Suggested actions to fill the gap */
  suggestions: string[];
}

/**
 * Per-topic depth query result
 */
export interface TopicDepthResult {
  topic: string;
  depthScore: number;
  chunkCount: number;
  hasEnoughContent: boolean;
  knowledgeItems: KnowledgeContextItem[];
}

/**
 * Cache entry for topic analysis
 */
interface CacheEntry<T> {
  data: T;
  expiry: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Standard marketing topics to analyze */
const STANDARD_TOPICS = [
  { topic: 'product-features', label: 'Product Features', intents: ['product-info'] as IntentCategory[] },
  { topic: 'pricing', label: 'Pricing & Plans', intents: ['pricing'] as IntentCategory[] },
  { topic: 'how-it-works', label: 'How It Works', intents: ['how-it-works'] as IntentCategory[] },
  { topic: 'use-cases', label: 'Use Cases', intents: ['use-case'] as IntentCategory[] },
  { topic: 'integrations', label: 'Integrations', intents: ['integration'] as IntentCategory[] },
  { topic: 'comparisons', label: 'Comparisons', intents: ['comparison'] as IntentCategory[] },
  { topic: 'testimonials', label: 'Customer Stories', intents: ['general'] as IntentCategory[] },
  { topic: 'support', label: 'Support & Help', intents: ['support'] as IntentCategory[] },
  { topic: 'company', label: 'About Company', intents: ['general'] as IntentCategory[] },
  { topic: 'security', label: 'Security & Privacy', intents: ['product-info'] as IntentCategory[] },
];

/** Depth score thresholds */
const DEPTH_THRESHOLDS = {
  STRONG: 0.6,
  MODERATE: 0.3,
  WEAK: 0.1,
};

/** Cache duration in milliseconds (5 minutes) */
const CACHE_DURATION = 5 * 60 * 1000;

// ============================================================================
// KNOWLEDGE DEPTH ANALYZER SERVICE
// ============================================================================

export class KnowledgeDepthAnalyzer {
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  /**
   * Analyze knowledge depth for a workspace
   */
  async analyzeWorkspaceKnowledge(workspaceId: string): Promise<KnowledgeDepthAnalysis> {
    const cacheKey = `workspace-analysis-${workspaceId}`;
    const cached = this.getFromCache<KnowledgeDepthAnalysis>(cacheKey);
    if (cached) return cached;

    const startTime = Date.now();
    let totalTokens = 0;

    // Analyze each standard topic
    const topicResults = await Promise.all(
      STANDARD_TOPICS.map(async (topicConfig) => {
        const depth = await this.analyzeTopicDepth(workspaceId, topicConfig.topic);
        return {
          ...topicConfig,
          ...depth,
        };
      })
    );

    // Build topic coverage array
    const topics: TopicCoverage[] = topicResults.map((result) => ({
      topic: result.topic,
      label: result.label,
      depthScore: result.depthScore,
      chunkCount: result.chunkCount,
      averageRelevance: result.knowledgeItems.length > 0
        ? result.knowledgeItems.reduce((sum, item) => sum + item.similarity, 0) / result.knowledgeItems.length
        : 0,
      subTopics: [],
      intents: result.intents,
      sampleContent: result.knowledgeItems.slice(0, 2).map((item) => item.content.slice(0, 100)),
      hasRichContent: result.hasEnoughContent,
    }));

    // Discover sub-topics for strong topics
    const strongTopics = topics.filter((t) => t.depthScore >= DEPTH_THRESHOLDS.STRONG);
    for (const topic of strongTopics) {
      const { subTopics, tokensUsed } = await this.discoverSubTopics(workspaceId, topic.topic);
      topic.subTopics = subTopics;
      totalTokens += tokensUsed;
    }

    // Identify gaps
    const gaps = this.identifyGaps(topics);

    // Calculate overall depth score
    const overallDepthScore = topics.length > 0
      ? topics.reduce((sum, t) => sum + t.depthScore, 0) / topics.length
      : 0;

    const analysis: KnowledgeDepthAnalysis = {
      workspaceId,
      overallDepthScore,
      topics,
      strongTopics: topics.filter((t) => t.depthScore >= DEPTH_THRESHOLDS.STRONG).map((t) => t.topic),
      weakTopics: topics.filter((t) => t.depthScore < DEPTH_THRESHOLDS.MODERATE).map((t) => t.topic),
      gaps,
      analyzedAt: new Date(),
      tokensUsed: totalTokens,
    };

    this.setCache(cacheKey, analysis);
    return analysis;
  }

  /**
   * Analyze depth for a specific topic
   */
  async analyzeTopicDepth(
    workspaceId: string,
    topic: string
  ): Promise<TopicDepthResult> {
    const cacheKey = `topic-depth-${workspaceId}-${topic}`;
    const cached = this.getFromCache<TopicDepthResult>(cacheKey);
    if (cached) return cached;

    try {
      // Generate embedding for the topic query
      const topicQuery = this.buildTopicQuery(topic);
      const embeddingResult = await generateEmbedding(topicQuery);

      // Search for related knowledge
      const results = await similaritySearch(
        {
          workspaceId,
          query: topicQuery,
          limit: 20,
          threshold: 0.4, // Lower threshold to find all related content
        },
        embeddingResult.embedding
      );

      const knowledgeItems: KnowledgeContextItem[] = results.map((r) => ({
        id: r.id,
        content: r.content,
        entityType: r.entityType || 'general',
        similarity: r.similarity,
      }));

      // Calculate depth score based on quantity and quality
      const depthScore = this.calculateDepthScore(knowledgeItems);
      const hasEnoughContent = knowledgeItems.length >= 3 && depthScore >= DEPTH_THRESHOLDS.MODERATE;

      const result: TopicDepthResult = {
        topic,
        depthScore,
        chunkCount: knowledgeItems.length,
        hasEnoughContent,
        knowledgeItems,
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`Topic depth analysis failed for ${topic}:`, error);
      return {
        topic,
        depthScore: 0,
        chunkCount: 0,
        hasEnoughContent: false,
        knowledgeItems: [],
      };
    }
  }

  /**
   * Get topics that have enough content for a given intent
   */
  async getTopicsForIntent(
    workspaceId: string,
    intent: IntentCategory
  ): Promise<TopicCoverage[]> {
    const analysis = await this.analyzeWorkspaceKnowledge(workspaceId);
    return analysis.topics.filter(
      (t) => t.intents.includes(intent) && t.hasRichContent
    );
  }

  /**
   * Check if a specific query has good knowledge coverage
   */
  async hasGoodCoverage(workspaceId: string, query: string): Promise<boolean> {
    try {
      const embeddingResult = await generateEmbedding(query);
      const results = await similaritySearch(
        {
          workspaceId,
          query,
          limit: 5,
          threshold: 0.6,
        },
        embeddingResult.embedding
      );
      return results.length >= 2;
    } catch {
      return false;
    }
  }

  /**
   * Get recommended topics based on current knowledge depth
   */
  async getRecommendedTopics(
    workspaceId: string,
    excludeTopics: string[] = []
  ): Promise<TopicCoverage[]> {
    const analysis = await this.analyzeWorkspaceKnowledge(workspaceId);
    return analysis.topics
      .filter((t) => t.hasRichContent && !excludeTopics.includes(t.topic))
      .sort((a, b) => b.depthScore - a.depthScore)
      .slice(0, 5);
  }

  /**
   * Build a topic query for embedding search
   */
  private buildTopicQuery(topic: string): string {
    const queryTemplates: Record<string, string> = {
      'product-features': 'What are the main features and capabilities of the product?',
      'pricing': 'What are the pricing plans and costs?',
      'how-it-works': 'How does the product work? What is the process?',
      'use-cases': 'What are the use cases and applications?',
      'integrations': 'What integrations and connections are supported?',
      'comparisons': 'How does it compare to alternatives and competitors?',
      'testimonials': 'What do customers say? Success stories and reviews.',
      'support': 'How to get help and support?',
      'company': 'About the company, team, and mission.',
      'security': 'Security features, privacy, and compliance.',
    };
    return queryTemplates[topic] || `Information about ${topic}`;
  }

  /**
   * Calculate depth score from knowledge items
   */
  private calculateDepthScore(items: KnowledgeContextItem[]): number {
    if (items.length === 0) return 0;

    // Factors:
    // 1. Quantity (more items = better coverage)
    // 2. Quality (higher similarity = more relevant)
    // 3. Diversity (different entity types = broader coverage)

    const quantityScore = Math.min(items.length / 10, 1); // Cap at 10 items
    const qualityScore = items.reduce((sum, item) => sum + item.similarity, 0) / items.length;
    const entityTypes = new Set(items.map((item) => item.entityType));
    const diversityScore = Math.min(entityTypes.size / 4, 1); // Cap at 4 types

    // Weighted average
    return (quantityScore * 0.3 + qualityScore * 0.5 + diversityScore * 0.2);
  }

  /**
   * Discover sub-topics within a main topic
   */
  private async discoverSubTopics(
    workspaceId: string,
    topic: string
  ): Promise<{ subTopics: string[]; tokensUsed: number }> {
    const cacheKey = `subtopics-${workspaceId}-${topic}`;
    const cached = this.getFromCache<{ subTopics: string[]; tokensUsed: number }>(cacheKey);
    if (cached) return cached;

    try {
      // Get knowledge items for this topic
      const depth = await this.analyzeTopicDepth(workspaceId, topic);
      if (depth.knowledgeItems.length < 3) {
        return { subTopics: [], tokensUsed: 0 };
      }

      // Use AI to extract sub-topics
      const contentSample = depth.knowledgeItems
        .slice(0, 5)
        .map((item) => item.content)
        .join('\n\n');

      const { data, tokensUsed } = await completeJSON<{ subTopics: string[] }>({
        messages: [
          {
            role: 'system',
            content: `Extract 3-5 specific sub-topics from this content about "${topic}".
Return only distinct, meaningful sub-topics that could be used as follow-up questions.

Respond in JSON:
{ "subTopics": ["sub-topic 1", "sub-topic 2", ...] }`,
          },
          {
            role: 'user',
            content: contentSample,
          },
        ],
        config: { maxTokens: 200 },
      });

      const result = { subTopics: data.subTopics || [], tokensUsed };
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`Sub-topic discovery failed for ${topic}:`, error);
      return { subTopics: [], tokensUsed: 0 };
    }
  }

  /**
   * Identify gaps in knowledge coverage
   */
  private identifyGaps(topics: TopicCoverage[]): KnowledgeGap[] {
    const gaps: KnowledgeGap[] = [];

    for (const topic of topics) {
      if (topic.depthScore < DEPTH_THRESHOLDS.WEAK) {
        gaps.push({
          topic: topic.topic,
          gapType: 'missing',
          description: `Topic "${topic.label}" has almost no content coverage.`,
          suggestions: [
            `Upload documents about ${topic.label.toLowerCase()}`,
            `Add knowledge base entries for ${topic.label.toLowerCase()}`,
          ],
        });
      } else if (topic.depthScore < DEPTH_THRESHOLDS.MODERATE) {
        gaps.push({
          topic: topic.topic,
          gapType: 'shallow',
          description: `Topic "${topic.label}" has limited content depth (${topic.chunkCount} items).`,
          suggestions: [
            `Add more detailed content about ${topic.label.toLowerCase()}`,
            `Include specific examples and use cases`,
          ],
        });
      }
    }

    return gaps;
  }

  /**
   * Get cached value if not expired
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (entry && entry.expiry > Date.now()) {
      return entry.data;
    }
    if (entry) {
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * Set cache value with expiry
   */
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + CACHE_DURATION,
    });
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear cache for a specific workspace
   */
  clearWorkspaceCache(workspaceId: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(workspaceId)) {
        this.cache.delete(key);
      }
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let analyzerInstance: KnowledgeDepthAnalyzer | null = null;

export function getKnowledgeDepthAnalyzer(): KnowledgeDepthAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new KnowledgeDepthAnalyzer();
  }
  return analyzerInstance;
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export { STANDARD_TOPICS, DEPTH_THRESHOLDS };
