# Phase 6: Conversational Marketing Platform

## Implementation Plan

### Vision
Transform NextGenWeb from static marketing websites into dynamic, conversation-driven experiences where every CTA generates inline content instead of navigating to new pages. Users explore through a dialogue, and the page grows as their journey deepens.

---

## Epic & Stories Summary

### Epic: Phase 6 - Conversational Marketing Platform
**Issue #95** | Priority: Highest

### Stories

| # | Story | Priority | Tasks |
|---|-------|----------|-------|
| 96 | 6.1 Conversational Landing Experience | Highest | 5 |
| 97 | 6.2 Inline Section Generation Engine | Highest | 6 |
| 98 | 6.3 Knowledge Depth & Smart CTA Generation | High | 5 |
| 99 | 6.4 Conversation Journey & Conversion Flow | High | 7 |

**Total Tasks: 23**

---

## Implementation Order

### Wave 1: Foundation (Stories 6.1 + 6.2 Core)
**Goal: CTA click → Inline section generation working end-to-end**

1. **#101** Create CTA-to-Chat bridge in ChatContext
2. **#100** Build ConversationalHero component
3. **#102** Implement ConversationalCTA component
4. **#105** Build Section Generation API endpoint
5. **#106** Create InlineGeneratedSection React component
6. **#107** Build Generated Sections Zustand store
7. **#110** Build ConversationalPage container component

### Wave 2: Rendering & UX (Story 6.2 Completion)
**Goal: Polish the inline section experience**

8. **#108** Implement component-to-React renderer
9. **#109** Create section generation loading & error UX
10. **#104** Build smooth scroll animation system
11. **#103** Add intent mapping for initial CTAs

### Wave 3: Intelligence (Story 6.3)
**Goal: Smart CTA generation based on knowledge depth**

12. **#111** Build Knowledge Depth Analyzer service
13. **#112** Create Smart CTA Generator
14. **#113** Implement topic coverage scoring
15. **#114** Build human handoff detection
16. **#115** Add persona-aware CTA prioritization

### Wave 4: Conversion (Story 6.4)
**Goal: Track journey and convert users**

17. **#116** Build Conversation State Store
18. **#117** Implement engagement scoring algorithm
19. **#119** Create journey depth tracking
20. **#118** Build context-aware lead capture forms
21. **#120** Build adaptive conversion CTA prominence
22. **#121** Implement lead capture with journey data
23. **#122** Create conversation analytics dashboard widget

---

## Dependencies

### Existing Systems to Leverage

| System | Location | Usage |
|--------|----------|-------|
| Chat Engine | `lib/interactive/chat/chat-engine.ts` | Intent classification, KB retrieval |
| Chat Context | `lib/interactive/chat/chat-context.tsx` | Global chat state, triggers |
| Knowledge Embeddings | `lib/knowledge/embeddings/store.ts` | Similarity search |
| Layout Generation | `lib/layout/generation.ts` | Component selection |
| Persona Context | `lib/interactive/persona/persona-context.tsx` | Persona awareness |
| Marketing Components | `components/marketing/*` | 60+ component variants |

### Database Requirements

New tables needed:
- `conversation_sessions` - Track conversation state
- `generated_sections` - Log generated sections
- `website_cta_configs` - Initial CTA configurations
- Extend `lead_captures` with journey data

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CONVERSATIONAL PAGE                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              ConversationalHero                       │   │
│  │  [CTA 1] [CTA 2] [CTA 3]  +  [Chat Bubble]           │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           InlineGeneratedSection #1                   │   │
│  │    [Generated Content] + [Follow-up CTAs]            │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           InlineGeneratedSection #2                   │   │
│  │    [Generated Content] + [Follow-up CTAs]            │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│                        ...                                   │
└─────────────────────────────────────────────────────────────┘

Data Flow:
CTA Click → ChatContext.triggerFromCTA() → Section Generation API
    → Knowledge Depth Analysis → Component Selection
    → Content Generation → Smart CTA Generation
    → InlineGeneratedSection renders → Scroll to section
```

---

## Key Files to Create

### New Files
```
lib/
├── interactive/
│   ├── cta/
│   │   ├── cta-config.ts
│   │   └── smart-cta-generator.ts
│   ├── section/
│   │   ├── section-generator.ts
│   │   ├── component-renderer.ts
│   │   └── component-map.ts
│   ├── conversation/
│   │   ├── types.ts
│   │   ├── engagement-scorer.ts
│   │   └── depth-tracker.ts
│   ├── handoff/
│   │   └── handoff-detector.ts
│   └── scroll-manager.ts
├── knowledge/
│   ├── depth-analyzer.ts
│   └── topic-coverage.ts
├── stores/
│   ├── generated-sections-store.ts
│   └── conversation-state-store.ts

components/
├── interactive/
│   ├── ConversationalPage.tsx
│   ├── ConversationalCTA.tsx
│   ├── InlineGeneratedSection.tsx
│   ├── SectionLoadingSkeleton.tsx
│   ├── SectionErrorState.tsx
│   ├── ContextualLeadForm.tsx
│   ├── JourneySummary.tsx
│   └── AdaptiveConversionCTA.tsx
├── marketing/heroes/
│   └── HeroConversational.tsx

app/api/
├── generate/
│   └── section/
│       └── route.ts

hooks/
├── useConversationalPage.ts
└── useScrollManager.ts
```

### Files to Modify
```
lib/interactive/chat/chat-context.tsx  # Add CTA bridge
lib/interactive/chat/types.ts          # Add ConversationalCTA type
lib/layout/component-registry.ts       # Register new hero
app/api/leads/route.ts                 # Enrich with journey data
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Section generation time | < 3 seconds |
| Knowledge depth accuracy | > 80% |
| Conversation to conversion rate | > 5% |
| Average journey depth | > 3 sections |
| User engagement time | > 2 minutes |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Slow section generation | Pre-fetch related topics, cache common sections |
| Poor CTA relevance | A/B test CTA configurations, use persona data |
| High AI costs | Batch embedding lookups, cache knowledge depth |
| Complex state management | Use Zustand for simplicity, persist to localStorage |

---

## Getting Started

### Recommended First Ticket
**#101: Create CTA-to-Chat bridge in ChatContext**

This ticket:
- Minimal code changes (extending existing context)
- Enables testing the core concept immediately
- Unblocks all other Wave 1 tickets

### Development Environment
```bash
npm run dev          # Start dev server
npm run storybook    # View component library
```

### Testing Approach
1. Unit tests for services (depth analyzer, CTA generator)
2. Component tests for new React components
3. E2E test for full conversation flow
4. Manual testing with BevGenie test website

---

## Notes

- Phase 6 builds on the existing chat system (Phase 4.4) which is already production-ready
- The knowledge base depth analysis uses existing pgvector embeddings
- All new components should follow the existing design system and AI metadata patterns
- Consider feature flagging for gradual rollout
