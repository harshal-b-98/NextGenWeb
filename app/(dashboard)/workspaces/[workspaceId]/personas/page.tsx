'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type {
  Persona,
  CommunicationStyle,
  BuyerJourneyStage,
  DetectionRule,
} from '@/lib/personas/types';

// Communication style colors
const COMMUNICATION_STYLE_COLORS: Record<CommunicationStyle, string> = {
  technical: 'bg-blue-100 text-blue-700 border-blue-200',
  business: 'bg-green-100 text-green-700 border-green-200',
  executive: 'bg-purple-100 text-purple-700 border-purple-200',
};

// Buyer journey stage colors
const JOURNEY_STAGE_COLORS: Record<BuyerJourneyStage, string> = {
  awareness: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  consideration: 'bg-orange-100 text-orange-700 border-orange-200',
  decision: 'bg-red-100 text-red-700 border-red-200',
};

// Detection rule type icons
const RULE_TYPE_ICONS: Record<string, string> = {
  click_pattern: '🖱️',
  scroll_behavior: '📜',
  time_on_page: '⏱️',
  referrer: '🔗',
  utm_parameter: '📊',
  content_interaction: '👆',
  form_field: '📝',
  page_sequence: '📑',
  device_type: '📱',
  search_query: '🔍',
};

export default function PersonasPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStyle, setFilterStyle] = useState<CommunicationStyle | 'all'>('all');
  const [filterStage, setFilterStage] = useState<BuyerJourneyStage | 'all'>('all');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchPersonas = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('is_primary', { ascending: false })
        .order('confidence_score', { ascending: false });

      if (error) throw error;

      const typedData: Persona[] = (data || []).map(p => ({
        id: p.id,
        workspaceId: p.workspace_id,
        name: p.name,
        title: p.title || '',
        avatarUrl: p.avatar_url,
        industry: p.industry,
        companySize: p.company_size,
        location: p.location,
        goals: p.goals || [],
        painPoints: p.pain_points || [],
        decisionCriteria: p.decision_criteria || [],
        objections: p.objections || [],
        keyMetrics: p.key_metrics || [],
        communicationStyle: (p.communication_style as CommunicationStyle) || 'business',
        buyerJourneyStage: (p.buyer_journey_stage as BuyerJourneyStage) || 'consideration',
        detectionRules: (p.detection_rules as DetectionRule[]) || [],
        relevantKnowledgeIds: p.relevant_knowledge_ids || [],
        preferredContentTypes: p.preferred_content_types || [],
        contentPreferences: [],
        isActive: p.is_active,
        isPrimary: p.is_primary,
        aiGenerated: p.ai_generated,
        confidenceScore: p.confidence_score || 0.8,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }));

      setPersonas(typedData);
    } catch (err) {
      console.error('Error fetching personas:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, supabase]);

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  const handleExtractPersonas = async () => {
    setExtracting(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/personas/extract`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to extract personas');
      }

      await fetchPersonas();
    } catch (err) {
      console.error('Error extracting personas:', err);
    } finally {
      setExtracting(false);
    }
  };

  const handleToggleActive = async (personaId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('personas')
        .update({ is_active: !isActive })
        .eq('id', personaId);

      if (error) throw error;
      await fetchPersonas();
    } catch (err) {
      console.error('Error toggling persona:', err);
    }
  };

  const handleSetPrimary = async (personaId: string) => {
    try {
      // First, unset all primary
      await supabase
        .from('personas')
        .update({ is_primary: false })
        .eq('workspace_id', workspaceId);

      // Then set the selected one as primary
      const { error } = await supabase
        .from('personas')
        .update({ is_primary: true })
        .eq('id', personaId);

      if (error) throw error;
      await fetchPersonas();
    } catch (err) {
      console.error('Error setting primary persona:', err);
    }
  };

  const handleDeletePersona = async (personaId: string) => {
    if (!confirm('Are you sure you want to delete this persona?')) return;

    try {
      const { error } = await supabase.from('personas').delete().eq('id', personaId);

      if (error) throw error;
      setSelectedPersona(null);
      await fetchPersonas();
    } catch (err) {
      console.error('Error deleting persona:', err);
    }
  };

  // Filter personas
  const filteredPersonas = personas.filter(p => {
    if (filterStyle !== 'all' && p.communicationStyle !== filterStyle) return false;
    if (filterStage !== 'all' && p.buyerJourneyStage !== filterStage) return false;
    return true;
  });

  // Stats
  const stats = {
    total: personas.length,
    active: personas.filter(p => p.isActive).length,
    aiGenerated: personas.filter(p => p.aiGenerated).length,
    communicationStyles: Object.fromEntries(
      (['technical', 'business', 'executive'] as CommunicationStyle[]).map(style => [
        style,
        personas.filter(p => p.communicationStyle === style).length,
      ])
    ),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage buyer personas extracted from your knowledge base
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExtractPersonas}
            disabled={extracting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {extracting ? (
              <>
                <span className="animate-spin">⏳</span>
                Extracting...
              </>
            ) : (
              <>
                <span>✨</span>
                Extract Personas
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Personas</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-500">Active</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.aiGenerated}</div>
          <div className="text-sm text-gray-500">AI Generated</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">{stats.communicationStyles.technical}</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">Tech</span>
            <span className="text-lg">{stats.communicationStyles.business}</span>
            <span className="text-xs bg-green-100 text-green-700 px-1 rounded">Biz</span>
            <span className="text-lg">{stats.communicationStyles.executive}</span>
            <span className="text-xs bg-purple-100 text-purple-700 px-1 rounded">Exec</span>
          </div>
          <div className="text-sm text-gray-500">By Style</div>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* Communication Style Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Style:</span>
            <select
              value={filterStyle}
              onChange={e => setFilterStyle(e.target.value as CommunicationStyle | 'all')}
              className="text-sm border rounded-md px-2 py-1"
            >
              <option value="all">All</option>
              <option value="technical">Technical</option>
              <option value="business">Business</option>
              <option value="executive">Executive</option>
            </select>
          </div>

          {/* Journey Stage Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Stage:</span>
            <select
              value={filterStage}
              onChange={e => setFilterStage(e.target.value as BuyerJourneyStage | 'all')}
              className="text-sm border rounded-md px-2 py-1"
            >
              <option value="all">All</option>
              <option value="awareness">Awareness</option>
              <option value="consideration">Consideration</option>
              <option value="decision">Decision</option>
            </select>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center border rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 text-sm ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 text-sm ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
          >
            List
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Personas List */}
        <div className={selectedPersona ? 'w-1/2' : 'w-full'}>
          {filteredPersonas.length === 0 ? (
            <div className="bg-white rounded-lg border p-8 text-center">
              <div className="text-4xl mb-4">👤</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No personas yet</h3>
              <p className="text-gray-500 mb-4">
                Extract personas from your knowledge base to get started.
              </p>
              <button
                onClick={handleExtractPersonas}
                disabled={extracting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Extract Personas
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-4">
              {filteredPersonas.map(persona => (
                <div
                  key={persona.id}
                  onClick={() => setSelectedPersona(persona)}
                  className={`bg-white rounded-lg border p-4 cursor-pointer hover:shadow-md transition-shadow ${
                    selectedPersona?.id === persona.id ? 'ring-2 ring-blue-500' : ''
                  } ${!persona.isActive ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {persona.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 flex items-center gap-2">
                          {persona.name}
                          {persona.isPrimary && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                              Primary
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500">{persona.title}</p>
                      </div>
                    </div>
                    {persona.aiGenerated && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                        AI
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span
                      className={`text-xs px-2 py-1 rounded border ${
                        COMMUNICATION_STYLE_COLORS[persona.communicationStyle]
                      }`}
                    >
                      {persona.communicationStyle}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded border ${
                        JOURNEY_STAGE_COLORS[persona.buyerJourneyStage]
                      }`}
                    >
                      {persona.buyerJourneyStage}
                    </span>
                  </div>

                  {persona.industry && (
                    <p className="text-xs text-gray-500 mb-2">
                      <span className="font-medium">Industry:</span> {persona.industry}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Confidence: {Math.round(persona.confidenceScore * 100)}%</span>
                    <span>{persona.detectionRules.length} rules</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border divide-y">
              {filteredPersonas.map(persona => (
                <div
                  key={persona.id}
                  onClick={() => setSelectedPersona(persona)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedPersona?.id === persona.id ? 'bg-blue-50' : ''
                  } ${!persona.isActive ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                        {persona.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 flex items-center gap-2">
                          {persona.name}
                          {persona.isPrimary && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                              Primary
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500">{persona.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-1 rounded border ${
                          COMMUNICATION_STYLE_COLORS[persona.communicationStyle]
                        }`}
                      >
                        {persona.communicationStyle}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded border ${
                          JOURNEY_STAGE_COLORS[persona.buyerJourneyStage]
                        }`}
                      >
                        {persona.buyerJourneyStage}
                      </span>
                      <span className="text-sm text-gray-400">
                        {Math.round(persona.confidenceScore * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedPersona && (
          <div className="w-1/2 bg-white rounded-lg border p-6 sticky top-6 h-fit max-h-[calc(100vh-150px)] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
                  {selectedPersona.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    {selectedPersona.name}
                    {selectedPersona.isPrimary && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                        Primary
                      </span>
                    )}
                  </h2>
                  <p className="text-gray-600">{selectedPersona.title}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPersona(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span
                className={`text-sm px-3 py-1 rounded border ${
                  COMMUNICATION_STYLE_COLORS[selectedPersona.communicationStyle]
                }`}
              >
                {selectedPersona.communicationStyle}
              </span>
              <span
                className={`text-sm px-3 py-1 rounded border ${
                  JOURNEY_STAGE_COLORS[selectedPersona.buyerJourneyStage]
                }`}
              >
                {selectedPersona.buyerJourneyStage}
              </span>
              {selectedPersona.aiGenerated && (
                <span className="text-sm px-3 py-1 rounded border bg-purple-100 text-purple-700 border-purple-200">
                  AI Generated
                </span>
              )}
              {!selectedPersona.isActive && (
                <span className="text-sm px-3 py-1 rounded border bg-gray-100 text-gray-700 border-gray-200">
                  Inactive
                </span>
              )}
            </div>

            {/* Demographics */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
                Demographics
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedPersona.industry && (
                  <div>
                    <span className="text-gray-500">Industry:</span>{' '}
                    <span className="text-gray-900">{selectedPersona.industry}</span>
                  </div>
                )}
                {selectedPersona.companySize && (
                  <div>
                    <span className="text-gray-500">Company Size:</span>{' '}
                    <span className="text-gray-900">{selectedPersona.companySize}</span>
                  </div>
                )}
                {selectedPersona.location && (
                  <div>
                    <span className="text-gray-500">Location:</span>{' '}
                    <span className="text-gray-900">{selectedPersona.location}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Confidence:</span>{' '}
                  <span className="text-gray-900">
                    {Math.round(selectedPersona.confidenceScore * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Goals */}
            {selectedPersona.goals.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Goals</h3>
                <ul className="space-y-1">
                  {selectedPersona.goals.map((goal, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pain Points */}
            {selectedPersona.painPoints.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
                  Pain Points
                </h3>
                <ul className="space-y-1">
                  {selectedPersona.painPoints.map((pain, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      {pain}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Decision Criteria */}
            {selectedPersona.decisionCriteria.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
                  Decision Criteria
                </h3>
                <ul className="space-y-1">
                  {selectedPersona.decisionCriteria.map((criteria, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-blue-500">→</span>
                      {criteria}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Objections */}
            {selectedPersona.objections.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
                  Objections
                </h3>
                <ul className="space-y-1">
                  {selectedPersona.objections.map((objection, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-yellow-500">!</span>
                      {objection}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Detection Rules */}
            {selectedPersona.detectionRules.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
                  Detection Rules
                </h3>
                <div className="space-y-2">
                  {selectedPersona.detectionRules.map((rule, i) => (
                    <div
                      key={i}
                      className="text-sm bg-gray-50 rounded-md p-2 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span>{RULE_TYPE_ICONS[rule.type] || '📋'}</span>
                        <span className="text-gray-700">{rule.condition}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        Weight: {Math.round(rule.weight * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <button
                onClick={() => handleToggleActive(selectedPersona.id, selectedPersona.isActive)}
                className={`flex-1 px-4 py-2 rounded-lg border ${
                  selectedPersona.isActive
                    ? 'text-gray-700 hover:bg-gray-50'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {selectedPersona.isActive ? 'Deactivate' : 'Activate'}
              </button>
              {!selectedPersona.isPrimary && (
                <button
                  onClick={() => handleSetPrimary(selectedPersona.id)}
                  className="flex-1 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200 hover:bg-yellow-100"
                >
                  Set as Primary
                </button>
              )}
              <button
                onClick={() => handleDeletePersona(selectedPersona.id)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
