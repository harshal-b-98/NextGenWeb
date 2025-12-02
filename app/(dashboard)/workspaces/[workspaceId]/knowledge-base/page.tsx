'use client';

/**
 * Knowledge Base Page
 * Browse and manage extracted entities and relationships
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Brain,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Network,
  List,
  Grid,
  Loader2,
  Tag,
  Link as LinkIcon,
  Eye,
  MoreHorizontal,
  Trash2,
  Edit,
  Box,
  Zap,
  Home,
  CheckCircle,
  Clock,
  AlertCircle,
  Database,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/client';
import type { EntityType, RelationshipType } from '@/lib/ai/types';

// Entity type colors for visual distinction
const ENTITY_TYPE_COLORS: Record<EntityType, string> = {
  product: 'bg-blue-100 text-blue-700 border-blue-200',
  service: 'bg-purple-100 text-purple-700 border-purple-200',
  feature: 'bg-green-100 text-green-700 border-green-200',
  benefit: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pricing: 'bg-amber-100 text-amber-700 border-amber-200',
  testimonial: 'bg-pink-100 text-pink-700 border-pink-200',
  company: 'bg-slate-100 text-slate-700 border-slate-200',
  person: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  statistic: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  faq: 'bg-orange-100 text-orange-700 border-orange-200',
  cta: 'bg-red-100 text-red-700 border-red-200',
  process_step: 'bg-teal-100 text-teal-700 border-teal-200',
  use_case: 'bg-violet-100 text-violet-700 border-violet-200',
  integration: 'bg-lime-100 text-lime-700 border-lime-200',
  contact: 'bg-rose-100 text-rose-700 border-rose-200',
};

// All entity types
const ALL_ENTITY_TYPES: EntityType[] = [
  'product',
  'service',
  'feature',
  'benefit',
  'pricing',
  'testimonial',
  'company',
  'person',
  'statistic',
  'faq',
  'cta',
  'process_step',
  'use_case',
  'integration',
  'contact',
];

interface KnowledgeEntity {
  id: string;
  workspace_id: string;
  knowledge_item_id: string;
  entity_type: EntityType;
  name: string;
  description: string | null;
  confidence: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface EntityRelationship {
  id: string;
  workspace_id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: RelationshipType;
  confidence: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface KnowledgeStats {
  totalEntities: number;
  totalRelationships: number;
  entityTypeCounts: Record<EntityType, number>;
}

interface EmbeddingStats {
  totalItems: number;
  pendingCount: number;
  generatingCount: number;
  completedCount: number;
  failedCount: number;
  totalEmbeddings: number;
  itemsWithErrors: Array<{ id: string; error: string }>;
}

type ViewMode = 'list' | 'grid';

export default function KnowledgeBasePage() {
  const params = useParams();
  const { addToast } = useToast();
  const workspaceId = params.workspaceId as string;

  // State
  const [entities, setEntities] = useState<KnowledgeEntity[]>([]);
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [embeddingStats, setEmbeddingStats] = useState<EmbeddingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<EntityType[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<KnowledgeEntity | null>(null);
  const [entityRelationships, setEntityRelationships] = useState<EntityRelationship[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Fetch entities
  const fetchEntities = useCallback(async () => {
    const supabase = createClient();

    try {
      let query = supabase
        .from('knowledge_entities')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('confidence', { ascending: false })
        .limit(200);

      // Apply type filter
      if (selectedTypes.length > 0) {
        query = query.in('entity_type', selectedTypes);
      }

      // Apply search filter
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      // Cast the entity_type from string to EntityType
      const typedData: KnowledgeEntity[] = (data || []).map(item => ({
        ...item,
        entity_type: item.entity_type as EntityType,
        metadata: (item.metadata as Record<string, unknown>) || {},
      }));
      setEntities(typedData);
    } catch (error) {
      console.error('Error fetching entities:', error);
      addToast({
        title: 'Error',
        description: 'Failed to load knowledge base',
        variant: 'error',
      });
    }
  }, [workspaceId, selectedTypes, searchQuery, addToast]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    const supabase = createClient();

    try {
      // Get entity count
      const { count: entityCount, error: entityError } = await supabase
        .from('knowledge_entities')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId);

      if (entityError) throw entityError;

      // Get relationship count
      const { count: relCount, error: relError } = await supabase
        .from('knowledge_entity_relationships')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId);

      if (relError) throw relError;

      // Get entity type counts
      const { data: typeData, error: typeError } = await supabase
        .from('knowledge_entities')
        .select('entity_type')
        .eq('workspace_id', workspaceId);

      if (typeError) throw typeError;

      const typeCounts: Record<EntityType, number> = {} as Record<EntityType, number>;
      ALL_ENTITY_TYPES.forEach(type => {
        typeCounts[type] = 0;
      });

      (typeData || []).forEach(item => {
        const type = item.entity_type as EntityType;
        if (typeCounts[type] !== undefined) {
          typeCounts[type]++;
        }
      });

      setStats({
        totalEntities: entityCount || 0,
        totalRelationships: relCount || 0,
        entityTypeCounts: typeCounts,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [workspaceId]);

  // Fetch embedding stats
  const fetchEmbeddingStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/knowledge/embedding-stats?workspaceId=${workspaceId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setEmbeddingStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching embedding stats:', error);
    }
  }, [workspaceId]);

  // Fetch relationships for selected entity
  const fetchEntityRelationships = useCallback(
    async (entityId: string) => {
      const supabase = createClient();

      try {
        const { data, error } = await supabase
          .from('knowledge_entity_relationships')
          .select('*')
          .eq('workspace_id', workspaceId)
          .or(`source_entity_id.eq.${entityId},target_entity_id.eq.${entityId}`);

        if (error) throw error;
        // Cast the relationship_type from string to RelationshipType
        const typedData: EntityRelationship[] = (data || []).map(item => ({
          ...item,
          relationship_type: item.relationship_type as RelationshipType,
          metadata: (item.metadata as Record<string, unknown>) || {},
        }));
        setEntityRelationships(typedData);
      } catch (error) {
        console.error('Error fetching relationships:', error);
      }
    },
    [workspaceId]
  );

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchEntities(), fetchStats(), fetchEmbeddingStats()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchEntities, fetchStats, fetchEmbeddingStats]);

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchEntities(), fetchStats(), fetchEmbeddingStats()]);
    setIsRefreshing(false);
    addToast({
      title: 'Refreshed',
      description: 'Knowledge base data has been updated',
      variant: 'success',
    });
  };

  // Regenerate embeddings
  const handleRegenerateEmbeddings = async () => {
    setIsRegenerating(true);
    try {
      const response = await fetch('/api/knowledge/regenerate-embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate embeddings');
      }

      addToast({
        title: 'Embeddings Regenerated',
        description: `Generated ${data.totalEmbeddings} embeddings from ${data.processed} knowledge items`,
        variant: 'success',
      });

      // Refresh embedding stats after regeneration
      await fetchEmbeddingStats();
    } catch (error) {
      console.error('Error regenerating embeddings:', error);
      addToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to regenerate embeddings',
        variant: 'error',
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  // Toggle entity type filter
  const toggleTypeFilter = (type: EntityType) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedTypes([]);
    setSearchQuery('');
  };

  // Select entity to view details
  const handleSelectEntity = async (entity: KnowledgeEntity) => {
    setSelectedEntity(entity);
    await fetchEntityRelationships(entity.id);
  };

  // Delete entity
  const handleDeleteEntity = async (entityId: string) => {
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('knowledge_entities')
        .delete()
        .eq('id', entityId);

      if (error) throw error;

      setEntities(prev => prev.filter(e => e.id !== entityId));
      if (selectedEntity?.id === entityId) {
        setSelectedEntity(null);
        setEntityRelationships([]);
      }

      addToast({
        title: 'Deleted',
        description: 'Entity has been removed',
        variant: 'success',
      });

      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error('Error deleting entity:', error);
      addToast({
        title: 'Error',
        description: 'Failed to delete entity',
        variant: 'error',
      });
    }
  };

  // Format entity type for display
  const formatEntityType = (type: EntityType): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  // Format confidence as percentage
  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
        <Link
          href={`/workspaces/${workspaceId}`}
          className="hover:text-neutral-700 flex items-center gap-1"
        >
          <Home className="h-4 w-4" />
          Workspace
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-neutral-900 font-medium">Knowledge Base</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            Knowledge Base
          </h1>
          <p className="text-neutral-500">
            Browse and manage extracted entities and relationships
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button onClick={handleRegenerateEmbeddings} disabled={isRegenerating}>
          {isRegenerating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Zap className="h-4 w-4 mr-2" />
          )}
          {isRegenerating ? 'Generating...' : 'Regenerate Embeddings'}
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Total Entities</p>
                  <p className="text-3xl font-bold">{stats.totalEntities}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Box className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Relationships</p>
                  <p className="text-3xl font-bold">{stats.totalRelationships}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Network className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Entity Types</p>
                  <p className="text-3xl font-bold">
                    {Object.values(stats.entityTypeCounts).filter(c => c > 0).length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Tag className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Embedding Status Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Embeddings</p>
                  <p className="text-3xl font-bold">{embeddingStats?.totalEmbeddings || 0}</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Database className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              {embeddingStats && (
                <div className="mt-3 pt-3 border-t space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      Completed
                    </span>
                    <span>{embeddingStats.completedCount}</span>
                  </div>
                  {embeddingStats.pendingCount > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-amber-600">
                        <Clock className="h-3 w-3" />
                        Pending
                      </span>
                      <span>{embeddingStats.pendingCount}</span>
                    </div>
                  )}
                  {embeddingStats.generatingCount > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-blue-600">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Generating
                      </span>
                      <span>{embeddingStats.generatingCount}</span>
                    </div>
                  )}
                  {embeddingStats.failedCount > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="h-3 w-3" />
                        Failed
                      </span>
                      <span>{embeddingStats.failedCount}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search entities by name or description..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-neutral-100' : ''}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {selectedTypes.length > 0 && (
                <span className="ml-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                  {selectedTypes.length}
                </span>
              )}
              <ChevronDown
                className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`}
              />
            </Button>

            {/* View Mode Toggle */}
            <div className="flex border rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-neutral-100' : ''}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-neutral-100' : ''}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Filter by Entity Type</p>
                {selectedTypes.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {ALL_ENTITY_TYPES.map(type => {
                  const count = stats?.entityTypeCounts[type] || 0;
                  const isSelected = selectedTypes.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleTypeFilter(type)}
                      disabled={count === 0}
                      className={`
                        px-3 py-1.5 text-sm rounded-full border transition-all
                        ${
                          isSelected
                            ? ENTITY_TYPE_COLORS[type]
                            : count > 0
                              ? 'bg-white hover:bg-neutral-50 border-neutral-200'
                              : 'bg-neutral-50 text-neutral-400 border-neutral-100 cursor-not-allowed'
                        }
                      `}
                    >
                      {formatEntityType(type)}
                      <span className="ml-1 text-xs opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Entity List */}
        <div className={selectedEntity ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5" />
                Entities
              </CardTitle>
              <CardDescription>
                {entities.length === 0
                  ? 'No entities found'
                  : `Showing ${entities.length} entities`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {entities.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium mb-1">No entities found</p>
                  <p className="text-sm">
                    {searchQuery || selectedTypes.length > 0
                      ? 'Try adjusting your search or filters'
                      : 'Upload documents to extract knowledge'}
                  </p>
                </div>
              ) : viewMode === 'list' ? (
                <div className="space-y-2">
                  {entities.map(entity => (
                    <div
                      key={entity.id}
                      onClick={() => handleSelectEntity(entity)}
                      className={`
                        p-4 rounded-lg border cursor-pointer transition-all
                        ${
                          selectedEntity?.id === entity.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-neutral-50 border-neutral-200'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full border ${ENTITY_TYPE_COLORS[entity.entity_type]}`}
                            >
                              {formatEntityType(entity.entity_type)}
                            </span>
                            <span className="text-xs text-neutral-400">
                              {formatConfidence(entity.confidence)} confidence
                            </span>
                          </div>
                          <h4 className="font-medium truncate">{entity.name}</h4>
                          {entity.description && (
                            <p className="text-sm text-neutral-500 line-clamp-2 mt-1">
                              {entity.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteEntity(entity.id);
                          }}
                          className="text-neutral-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {entities.map(entity => (
                    <div
                      key={entity.id}
                      onClick={() => handleSelectEntity(entity)}
                      className={`
                        p-4 rounded-lg border cursor-pointer transition-all
                        ${
                          selectedEntity?.id === entity.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-neutral-50 border-neutral-200'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full border ${ENTITY_TYPE_COLORS[entity.entity_type]}`}
                        >
                          {formatEntityType(entity.entity_type)}
                        </span>
                      </div>
                      <h4 className="font-medium truncate mb-1">{entity.name}</h4>
                      {entity.description && (
                        <p className="text-sm text-neutral-500 line-clamp-2">
                          {entity.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <span className="text-xs text-neutral-400">
                          {formatConfidence(entity.confidence)} confidence
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteEntity(entity.id);
                          }}
                          className="h-8 w-8 text-neutral-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Entity Detail Panel */}
        {selectedEntity && (
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Entity Details</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedEntity(null);
                      setEntityRelationships([]);
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Type Badge */}
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Type</p>
                  <span
                    className={`inline-flex px-3 py-1 text-sm rounded-full border ${ENTITY_TYPE_COLORS[selectedEntity.entity_type]}`}
                  >
                    {formatEntityType(selectedEntity.entity_type)}
                  </span>
                </div>

                {/* Name */}
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Name</p>
                  <p className="font-medium">{selectedEntity.name}</p>
                </div>

                {/* Description */}
                {selectedEntity.description && (
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">Description</p>
                    <p className="text-sm">{selectedEntity.description}</p>
                  </div>
                )}

                {/* Confidence */}
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Confidence</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${selectedEntity.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {formatConfidence(selectedEntity.confidence)}
                    </span>
                  </div>
                </div>

                {/* Metadata */}
                {Object.keys(selectedEntity.metadata || {}).length > 0 && (
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">Additional Data</p>
                    <div className="bg-neutral-50 rounded-lg p-3">
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(selectedEntity.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Relationships */}
                <div>
                  <p className="text-sm text-neutral-500 mb-2">
                    Relationships ({entityRelationships.length})
                  </p>
                  {entityRelationships.length === 0 ? (
                    <p className="text-sm text-neutral-400 italic">No relationships found</p>
                  ) : (
                    <div className="space-y-2">
                      {entityRelationships.map(rel => {
                        const isSource = rel.source_entity_id === selectedEntity.id;
                        const connectedId = isSource ? rel.target_entity_id : rel.source_entity_id;
                        const connectedEntity = entities.find(e => e.id === connectedId);
                        return (
                          <div
                            key={rel.id}
                            className="flex items-center gap-2 text-sm p-2 bg-neutral-50 rounded-lg"
                          >
                            <LinkIcon className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-neutral-500">
                                {isSource ? 'links to' : 'linked from'}
                              </span>
                              <span className="mx-1 font-medium truncate">
                                {connectedEntity?.name || 'Unknown'}
                              </span>
                              <span className="text-xs text-neutral-400">
                                ({rel.relationship_type.replace(/_/g, ' ')})
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4 border-t flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleDeleteEntity(selectedEntity.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Empty State */}
      {stats?.totalEntities === 0 && (
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Build Your Knowledge Base</h3>
                <p className="text-sm text-neutral-600 mb-4">
                  Upload documents to automatically extract entities like products, features,
                  benefits, and more. The AI will identify relationships between them to create
                  a comprehensive knowledge graph.
                </p>
                <Link href={`/workspaces/${workspaceId}/documents`}>
                  <Button>Upload Documents</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
