# NextGenWeb: Ground-Up Rebuild Implementation Plan

## Executive Summary

This document outlines a comprehensive plan for rebuilding NextGenWeb from scratch with modern, type-safe architecture that eliminates current anti-patterns and technical debt.

**Recommendation**: DON'T rebuild from scratch - use incremental migration strategy instead.

**Why This Document Exists**: To serve as a reference architecture for new features and gradual improvements.

---

## Table of Contents

1. Current Architecture Issues
2. Proposed Architecture
3. Technology Stack
4. Implementation Timeline
5. Migration Strategy
6. Cost-Benefit Analysis
7. Key Architectural Decisions

---

## 1. Current Architecture Issues

### Critical Problems Identified

#### 1.1 Type System Chaos
**Problem**: 6+ parallel type definition systems with no single source of truth

**Evidence**:
- `types/database.ts` - Supabase auto-generated types
- `lib/ai/types.ts` - AI entity types (24 different types)
- `lib/runtime/types.ts` - Runtime types
- `lib/layout/types.ts` - Layout types
- `lib/content/types.ts` - Content types
- `lib/storyline/types.ts` - Narrative types

**Impact**:
- Heavy use of `any` casts to bridge type systems
- Types drift between layers over time
- Changes require updates in multiple files
- Runtime errors from type mismatches

**Example**:
```typescript
// Current: Type mismatch between API and UI
// ChatPanel.tsx defines:
interface ProposedChange {
  type: string;  // ← Different from API
  preview?: { ... }
}

// But API returns:
{
  changeType: string,  // ← Not "type"
  sectionId: string,   // ← Missing from interface
  styleUpdates: {},    // ← Missing from interface
}
```

#### 1.2 Data Flow Inconsistency
**Problem**: 5 transformation layers between database and UI

**Flow**:
```
Database (JSONB)
  ↓ (Supabase client transform)
Row Types
  ↓ (API layer transform)
DTO Types
  ↓ (Zustand store transform)
Store State
  ↓ (Component prop transform)
Component Local State
```

**Impact**:
- Each transform is a bug opportunity
- Data loss possible at each layer
- No validation between layers
- Hard to debug where data corruption happens

#### 1.3 Component Prop Explosion
**Problem**: Deep component hierarchies with 10+ props each

**Evidence**:
- `DynamicPageRenderer` receives ~10 props
- Props drilled 3-4 levels deep
- Context + Zustand + Props all used simultaneously
- Unclear which is source of truth

**Impact**:
- Hard to refactor components
- Changing parent affects many children
- Props interface grows over time
- Testing requires many mock props

#### 1.4 Schema-Code Mismatch
**Problem**: Database schema doesn't match TypeScript types

**Evidence**:
- `websites` and `websites_v2` tables both exist
- Migrations reference `websites_v2` but code uses `websites`
- JSONB columns have no schema validation
- Status enums duplicated: 5 different status patterns

**Impact**:
- Runtime errors from schema changes
- Migrations don't update TypeScript types
- No compile-time schema validation

#### 1.5 API Design Fragmentation
**Problem**: 70 API routes with different patterns

**Inconsistencies**:
- Error shapes: `{ error }` vs `{ error: { code, message } }` vs throwing
- Success shapes: `{ data }` vs `{ success, data }` vs `{ layoutId, success }`
- Auth checks: Some use middleware, some inline, some skip
- Validation: Some Zod, some manual, some none

**Impact**:
- Frontend can't rely on consistent API contract
- Error handling duplicated 70 times
- No rate limiting on expensive AI endpoints

#### 1.6 State Management Confusion
**Problem**: Multiple state systems with unclear boundaries

**Current State**:
- 5 Zustand stores in `/lib/stores/`
- React Context in multiple places
- Component local state
- No clear ownership rules

**Impact**:
- State updates trigger unexpected side effects
- Race conditions between stores
- Hard to debug state flow
- Stores directly call APIs (circular dependency)

#### 1.7 Entity Type Explosion
**Problem**: 24+ entity types without clear hierarchy

**Current Types**:
```typescript
// Base types (15)
product, service, feature, benefit, pricing, testimonial,
company, person, statistic, faq, cta, process_step,
use_case, integration, contact

// KB-grounded types (9)
company_name, company_tagline, company_description,
mission_statement, social_link, nav_category,
brand_voice, product_category, service_offering
```

**Impact**:
- Unclear when to use which type
- AI agents confused about entity classification
- No clear relationships between entities
- Hard to add new entity types

#### 1.8 Status Enum Proliferation
**Problem**: Same concept modeled differently across tables

**Duplicated Patterns**:
```typescript
DocumentStatus: 'pending' | 'processing' | 'completed' | 'failed'
WebsiteStatus: 'draft' | 'generating' | 'published' | 'archived'
WebsiteGenerationStatus: 'draft' | 'generating' | 'generated' | 'published'
EmbeddingStatus: 'pending' | 'generating' | 'completed' | 'failed'
LayoutStatus: 'draft' | 'generating' | 'generated' | 'published' | 'failed'
```

**Impact**:
- Easy to use wrong enum for wrong table
- No state machine enforcement
- Unclear valid state transitions

#### 1.9 Missing Error Standardization
**Problem**: Each API route handles errors uniquely

**Impact**:
- Frontend can't handle errors consistently
- No error codes for specific handling
- No recovery suggestions for users
- Error messages vary in quality

#### 1.10 Performance Issues
**Problem**: No optimization strategy

**Issues**:
- All persona variants loaded upfront (no lazy loading)
- No memoization strategy
- Unnecessary re-renders
- No query optimization
- No caching strategy

---

## 2. Proposed Architecture (From Scratch)

### 2.1 Type System Architecture

#### End-to-End Type Safety with tRPC + Prisma

**Architecture**:
```
┌─────────────────┐
│ Prisma Schema   │ ← Single Source of Truth
│  (schema.prisma)│
└────────┬────────┘
         │ codegen
         ▼
┌─────────────────┐
│ Database Types  │
│ (@prisma/client)│
└────────┬────────┘
         │ tRPC inference
         ▼
┌─────────────────┐
│ API Types       │
│ (tRPC router)   │
└────────┬────────┘
         │ automatic inference
         ▼
┌─────────────────┐
│ Component Types │
│ (React Query)   │
└─────────────────┘
```

**Example Prisma Schema**:
```prisma
// schema.prisma - Single source of truth

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// CORE ENTITIES
// ============================================================================

model Workspace {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  ownerId     String   @map("owner_id")
  
  // Relations
  owner       User     @relation("WorkspaceOwner", fields: [ownerId], references: [id])
  members     WorkspaceMember[]
  websites    Website[]
  documents   Document[]
  knowledgeBase KnowledgeItem[]
  
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  @@map("workspaces")
}

model Website {
  id              String          @id @default(uuid())
  workspaceId     String          @map("workspace_id")
  workspace       Workspace       @relation(fields: [workspaceId], references: [id])
  
  name            String
  slug            String          @unique
  
  // Typed JSON with Zod validation
  brandConfig     Json            @default("{}") @map("brand_config")
  
  // Single status enum (no proliferation)
  status          WebsiteStatus   @default(DRAFT)
  
  // Clear version references (no v1/v2 confusion)
  draftVersionId      String?     @map("draft_version_id")
  productionVersionId String?     @map("production_version_id")
  
  draftVersion        WebsiteVersion? @relation("DraftVersion", fields: [draftVersionId], references: [id])
  productionVersion   WebsiteVersion? @relation("ProductionVersion", fields: [productionVersionId], references: [id])
  
  // Relations
  versions        WebsiteVersion[] @relation("WebsiteVersions")
  pages           Page[]
  globalComponents GlobalComponent[]
  
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")
  
  @@map("websites")
}

enum WebsiteStatus {
  DRAFT
  GENERATING
  GENERATED
  PUBLISHED
  ARCHIVED
}

model Page {
  id          String      @id @default(uuid())
  websiteId   String      @map("website_id")
  website     Website     @relation(fields: [websiteId], references: [id])
  
  title       String
  slug        String
  path        String
  
  // Typed content with validation
  content     Json        @default("{}")
  
  isHomepage  Boolean     @default(false) @map("is_homepage")
  sortOrder   Int         @map("sort_order")
  
  // Relations
  revisions   PageRevision[]
  feedback    SectionFeedback[]
  
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")
  
  @@unique([websiteId, slug])
  @@map("pages")
}

// ============================================================================
// KNOWLEDGE BASE
// ============================================================================

model KnowledgeItem {
  id              String          @id @default(uuid())
  workspaceId     String          @map("workspace_id")
  workspace       Workspace       @relation(fields: [workspaceId], references: [id])
  
  // Simplified entity type (7 core types, not 24)
  entityType      EntityType      @map("entity_type")
  entitySubtype   String?         @map("entity_subtype")
  
  name            String
  content         String          @db.Text
  
  // Structured metadata (validated with Zod)
  metadata        Json            @default("{}")
  
  confidence      Float           @default(1.0)
  
  // Relations
  embeddings      KnowledgeEmbedding[]
  sourceChunks    DocumentChunk[]
  relationships   KnowledgeRelationship[] @relation("SourceEntity")
  inverseRelations KnowledgeRelationship[] @relation("TargetEntity")
  
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")
  
  @@map("knowledge_base_items")
}

// Simplified from 24 types to 7 core types
enum EntityType {
  COMPANY       // Company info, mission, values
  PRODUCT       // Products/services offered
  FEATURE       // Product features, capabilities
  PERSONA       // Target audiences
  CONTENT       // General content (FAQs, testimonials)
  MEDIA         // Images, videos, documents
  CONFIG        // Settings, pricing, contact
}

model KnowledgeRelationship {
  id              String              @id @default(uuid())
  sourceId        String              @map("source_id")
  targetId        String              @map("target_id")
  
  source          KnowledgeItem       @relation("SourceEntity", fields: [sourceId], references: [id])
  target          KnowledgeItem       @relation("TargetEntity", fields: [targetId], references: [id])
  
  // Simplified from 11 types to 4 core relationships
  relationshipType RelationshipType   @map("relationship_type")
  
  confidence      Float               @default(1.0)
  metadata        Json                @default("{}")
  
  createdAt       DateTime            @default(now()) @map("created_at")
  
  @@unique([sourceId, targetId, relationshipType])
  @@map("knowledge_entity_relationships")
}

// Simplified relationship types
enum RelationshipType {
  PARENT_CHILD    // Hierarchical (company → product → feature)
  REFERENCE       // Cross-reference (persona → product)
  PREREQUISITE    // Ordering (feature A requires feature B)
  ALTERNATIVE     // Options (product A vs product B)
}

// ============================================================================
// FEEDBACK & REFINEMENT
// ============================================================================

model SectionFeedback {
  id              String          @id @default(uuid())
  pageId          String          @map("page_id")
  page            Page            @relation(fields: [pageId], references: [id])
  
  sectionId       String          @map("section_id")
  
  // Single feedback type enum
  feedbackType    FeedbackType    @map("feedback_type")
  feedbackText    String          @db.Text @map("feedback_text")
  targetField     String?         @map("target_field")
  
  // AI processing results
  aiInterpretation String?        @db.Text @map("ai_interpretation")
  aiConfidence     Float?         @map("ai_confidence")
  proposedChanges  Json?          @map("proposed_changes")
  
  // Single status enum
  status          FeedbackStatus  @default(PENDING)
  
  resolvedAt      DateTime?       @map("resolved_at")
  resolvedBy      String?         @map("resolved_by")
  
  createdBy       String?         @map("created_by")
  createdAt       DateTime        @default(now()) @map("created_at")
  
  @@map("section_feedback")
}

enum FeedbackType {
  CONTENT
  STYLE
  LAYOUT
  ADD
  REMOVE
  REORDER
}

enum FeedbackStatus {
  PENDING
  PROCESSING
  APPLIED
  REJECTED
  SUPERSEDED
}
```

**Benefits of Prisma Schema**:
- ✅ Single source of truth
- ✅ Type generation automatic
- ✅ Clear relationships with foreign keys
- ✅ Enums prevent typos
- ✅ Migration generation built-in

---

### 2.2 API Layer Architecture

#### tRPC for Type-Safe APIs

**Current Problem**:
- 70 REST API routes with inconsistent shapes
- Manual fetch() calls throughout frontend
- No type safety between client and server
- Each route has custom error handling

**New Approach - tRPC Router**:

```typescript
// server/routers/_app.ts
import { router } from '../trpc';
import { workspaceRouter } from './workspace';
import { feedbackRouter } from './feedback';
import { generationRouter } from './generation';

export const appRouter = router({
  workspace: workspaceRouter,
  feedback: feedbackRouter,
  generation: generationRouter,
});

export type AppRouter = typeof appRouter;
```

```typescript
// server/routers/feedback.ts
import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';

export const feedbackRouter = router({
  // Submit feedback with auto-apply
  submitFeedback: protectedProcedure
    .input(z.object({
      pageId: z.string().uuid(),
      sectionId: z.string(),
      feedbackText: z.string().min(1).max(5000),
      feedbackType: z.enum(['CONTENT', 'STYLE', 'LAYOUT', 'ADD', 'REMOVE', 'REORDER']),
      targetField: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Process feedback with AI
      const change = await aiService.generateChange({
        feedbackText: input.feedbackText,
        feedbackType: input.feedbackType,
        pageId: input.pageId,
        sectionId: input.sectionId,
        workspaceId: ctx.workspace.id,
      });

      // 2. Apply change in transaction
      const updatedPage = await ctx.prisma.$transaction(async (tx) => {
        // Store feedback
        const feedback = await tx.sectionFeedback.create({
          data: {
            pageId: input.pageId,
            sectionId: input.sectionId,
            feedbackType: input.feedbackType,
            feedbackText: input.feedbackText,
            targetField: input.targetField,
            aiInterpretation: change.interpretation,
            aiConfidence: change.confidence,
            proposedChanges: change,
            status: 'APPLIED',
            createdBy: ctx.user.id,
          },
        });

        // Apply change to page
        const page = await tx.page.findUnique({
          where: { id: input.pageId },
        });

        const updatedContent = applyChangeToContent(
          page.content as PageContent,
          change
        );

        // Update page
        return await tx.page.update({
          where: { id: input.pageId },
          data: {
            content: updatedContent,
            updatedAt: new Date(),
          },
        });
      });

      // 3. Return updated page (client auto-updates via query invalidation)
      return {
        page: updatedPage,
        change: change,
        message: `✅ Applied ${change.description}`,
      };
    }),

  // Get proposed changes for a page
  getProposedChanges: protectedProcedure
    .input(z.object({
      pageId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      return await ctx.prisma.sectionFeedback.findMany({
        where: {
          pageId: input.pageId,
          status: 'APPLIED',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }),
});
```

**Client Usage**:
```typescript
// components/studio/ChatPanel.tsx
import { trpc } from '@/lib/trpc/client';

export function ChatPanel({ pageId }: ChatPanelProps) {
  // Type-safe query (auto-typed from server)
  const { data: proposedChanges } = trpc.feedback.getProposedChanges.useQuery({
    pageId,
  });

  // Type-safe mutation (auto-typed from server)
  const submitFeedback = trpc.feedback.submitFeedback.useMutation({
    onSuccess: (result) => {
      // result.page is fully typed
      // result.change is fully typed
      toast.success(result.message);
    },
    onError: (error) => {
      // Standardized error shape
      toast.error(error.message);
    },
  });

  const handleSubmit = (text: string) => {
    submitFeedback.mutate({
      pageId,
      sectionId: selectedSection,
      feedbackText: text,
      feedbackType: 'CONTENT',
    });
  };

  return (
    <div>
      {/* UI automatically gets typed data */}
      {proposedChanges?.map(change => (
        <ProposedChangeCard 
          key={change.id} 
          change={change}  // Fully typed!
        />
      ))}
    </div>
  );
}
```

**Benefits**:
- ✅ Types flow automatically from server to client
- ✅ No manual type definitions needed
- ✅ Compile-time API contract validation
- ✅ Autocomplete for API calls
- ✅ Refactoring is safe (types catch breaks)

---

### 2.3 State Management Architecture

#### Clear Separation: Server State vs Client State

**Architecture**:

```typescript
// ============================================================================
// SERVER STATE - React Query (TanStack Query)
// ============================================================================
// Anything that comes from the database

// Example: Fetch page data
const { data: page } = trpc.page.get.useQuery({ pageId });

// Example: Fetch website
const { data: website } = trpc.workspace.getWebsite.useQuery({ websiteId });

// ============================================================================
// CLIENT STATE - Zustand
// ============================================================================
// UI-only state that doesn't persist

interface PreviewState {
  selectedSection: string | null;
  selectedVersion: string | null;
  previewMode: 'desktop' | 'tablet' | 'mobile';
  showGrid: boolean;
}

const usePreviewStore = create<PreviewState>((set) => ({
  selectedSection: null,
  selectedVersion: null,
  previewMode: 'desktop',
  showGrid: false,

  // Pure actions (no side effects)
  selectSection: (id) => set({ selectedSection: id }),
  selectVersion: (id) => set({ selectedVersion: id }),
  setPreviewMode: (mode) => set({ previewMode: mode }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
}));

// ============================================================================
// FORM STATE - React Hook Form
// ============================================================================
// Form inputs with validation

const form = useForm<FeedbackInput>({
  resolver: zodResolver(FeedbackInputSchema),
  defaultValues: {
    feedbackText: '',
    feedbackType: 'CONTENT',
  },
});
```

**State Boundaries**:

| State Type | Tool | Purpose | Persistence |
|------------|------|---------|-------------|
| Server State | React Query | Database data | Server (automatic) |
| Client State | Zustand | UI preferences | None (session only) |
| Form State | React Hook Form | Input data | None (until submit) |
| URL State | Next.js router | Navigation | URL params |

**Benefits**:
- ✅ Clear ownership of each piece of state
- ✅ No prop drilling (components query what they need)
- ✅ Automatic cache management
- ✅ Optimistic updates built-in
- ✅ No manual state sync needed

---

### 2.4 Component Architecture

#### Composition Over Configuration

**Current Problem**:
- 8 hero variants → code duplication
- 10 feature variants → hard to maintain
- Variant selection hardcoded in AI logic

**New Approach - Slot-Based Composition**:

```typescript
// ============================================================================
// COMPONENT TEMPLATE DEFINITION
// ============================================================================

interface ComponentTemplate {
  id: string;
  category: 'hero' | 'features' | 'cta' | 'testimonials' | 'pricing' | 'faq';
  
  // Slots define what content can be placed
  slots: {
    headline?: SlotConfig;
    subheadline?: SlotConfig;
    description?: SlotConfig;
    image?: SlotConfig;
    primaryCTA?: SlotConfig;
    secondaryCTA?: SlotConfig;
    features?: SlotConfig;  // Repeatable slot
  };
  
  // Layout configuration
  layout: {
    direction: 'row' | 'column' | 'grid';
    alignment: 'left' | 'center' | 'right';
    imagePosition?: 'left' | 'right' | 'background';
  };
  
  // Styling (Tailwind classes)
  styling: {
    base: string;                           // Base container classes
    variants: Record<string, string>;       // Size/color variants
  };
  
  // AI selection criteria
  selectionCriteria: {
    contentTypes: string[];      // ['product-launch', 'saas', 'b2b']
    personaMatch: string[];      // ['enterprise', 'sme', 'individual']
    narrativeRoles: string[];    // ['awareness', 'consideration', 'decision']
    contentDensity: 'minimal' | 'moderate' | 'detailed';
  };
}

interface SlotConfig {
  type: 'text' | 'richtext' | 'image' | 'cta' | 'list';
  required: boolean;
  maxLength?: number;
  validation?: z.ZodSchema;
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

// Template definition (cataloged once)
const heroSplitTemplate: ComponentTemplate = {
  id: 'hero-split-image-right',
  category: 'hero',
  
  slots: {
    headline: { type: 'text', required: true, maxLength: 100 },
    description: { type: 'richtext', required: true, maxLength: 500 },
    image: { type: 'image', required: true },
    primaryCTA: { type: 'cta', required: true },
    secondaryCTA: { type: 'cta', required: false },
  },
  
  layout: {
    direction: 'row',
    alignment: 'left',
    imagePosition: 'right',
  },
  
  styling: {
    base: 'grid grid-cols-1 lg:grid-cols-2 gap-8 items-center',
    variants: {
      size: {
        sm: 'py-12',
        md: 'py-16',
        lg: 'py-24',
      },
    },
  },
  
  selectionCriteria: {
    contentTypes: ['product-launch', 'saas'],
    personaMatch: ['enterprise', 'sme'],
    narrativeRoles: ['awareness'],
    contentDensity: 'moderate',
  },
};

// AI selects and populates
const template = await aiSelectTemplate(context);
const slots = await aiPopulateSlots(template, knowledgeBase);

// Render with composition
<TemplateRenderer template={template} slots={slots} />
```

**Rendering**:
```typescript
// components/TemplateRenderer.tsx
export function TemplateRenderer({ template, slots }: TemplateRendererProps) {
  const Container = getLayoutComponent(template.layout);
  
  return (
    <Container className={cn(template.styling.base, variantClasses)}>
      {template.slots.headline && slots.headline && (
        <Headline>{slots.headline}</Headline>
      )}
      {template.slots.description && slots.description && (
        <Description>{slots.description}</Description>
      )}
      {template.slots.image && slots.image && (
        <Image src={slots.image.url} alt={slots.image.alt} />
      )}
      {template.slots.primaryCTA && slots.primaryCTA && (
        <CTA {...slots.primaryCTA} />
      )}
    </Container>
  );
}
```

**Benefits**:
- ✅ No variant explosion (infinite combinations via slot composition)
- ✅ Easy to add new templates (just add to catalog)
- ✅ AI selection criteria explicit and tunable
- ✅ Styling separate from content logic
- ✅ Reusable slot components

---

### 2.5 Error Handling Architecture

#### Standardized Error Codes and Recovery

**Error Code System**:

```typescript
// lib/errors/codes.ts

export enum ErrorCode {
  // ============================================================================
  // AUTH ERRORS (1xxx)
  // ============================================================================
  UNAUTHORIZED = 'AUTH_1001',
  FORBIDDEN = 'AUTH_1002',
  SESSION_EXPIRED = 'AUTH_1003',
  INVALID_CREDENTIALS = 'AUTH_1004',

  // ============================================================================
  // VALIDATION ERRORS (2xxx)
  // ============================================================================
  INVALID_INPUT = 'VALIDATION_2001',
  MISSING_REQUIRED_FIELD = 'VALIDATION_2002',
  INVALID_FORMAT = 'VALIDATION_2003',
  VALUE_OUT_OF_RANGE = 'VALIDATION_2004',

  // ============================================================================
  // BUSINESS LOGIC ERRORS (3xxx)
  // ============================================================================
  WORKSPACE_LIMIT_EXCEEDED = 'BUSINESS_3001',
  GENERATION_QUOTA_EXCEEDED = 'BUSINESS_3002',
  DUPLICATE_SLUG = 'BUSINESS_3003',
  INSUFFICIENT_KNOWLEDGE_BASE = 'BUSINESS_3004',

  // ============================================================================
  // RESOURCE ERRORS (4xxx)
  // ============================================================================
  WORKSPACE_NOT_FOUND = 'RESOURCE_4001',
  WEBSITE_NOT_FOUND = 'RESOURCE_4002',
  PAGE_NOT_FOUND = 'RESOURCE_4003',

  // ============================================================================
  // SYSTEM ERRORS (5xxx)
  // ============================================================================
  DATABASE_ERROR = 'SYSTEM_5001',
  AI_SERVICE_ERROR = 'SYSTEM_5002',
  EMBEDDING_SERVICE_ERROR = 'SYSTEM_5003',
  FILE_STORAGE_ERROR = 'SYSTEM_5004',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public httpStatus: number = 500,
    public details?: any,
    public recovery?: ErrorRecovery
  ) {
    super(message);
    this.name = 'AppError';
  }
}

interface ErrorRecovery {
  action: string;          // e.g., "upgrade_plan", "add_documents", "retry"
  actionUrl?: string;      // Where to send user
  actionLabel?: string;    // Button text
}
```

**tRPC Error Handler**:

```typescript
// server/trpc.ts

export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in',
      cause: new AppError(
        ErrorCode.UNAUTHORIZED,
        'Authentication required',
        401,
        undefined,
        { action: 'login', actionUrl: '/login', actionLabel: 'Sign In' }
      ),
    });
  }
  
  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

**Client Error Handling**:

```typescript
// components/ErrorBoundary.tsx

export function handleApiError(error: TRPCClientError<AppRouter>) {
  const appError = error.data?.cause as AppError;
  
  if (appError?.code === ErrorCode.GENERATION_QUOTA_EXCEEDED) {
    return {
      title: 'Generation Quota Exceeded',
      message: appError.message,
      action: {
        label: 'Upgrade Plan',
        onClick: () => router.push('/settings/billing'),
      },
    };
  }
  
  if (appError?.code === ErrorCode.INSUFFICIENT_KNOWLEDGE_BASE) {
    return {
      title: 'Not Enough Content',
      message: appError.message,
      action: {
        label: 'Upload Documents',
        onClick: () => router.push('/documents/upload'),
      },
    };
  }
  
  // Default error handling
  return {
    title: 'Something went wrong',
    message: error.message,
  };
}
```

**Benefits**:
- ✅ Consistent error handling across all APIs
- ✅ Specific error codes for client handling
- ✅ Recovery actions for better UX
- ✅ Error tracking and monitoring easy

---

### 2.6 Data Flow Architecture

#### Unidirectional with CQRS Pattern

**Current Problem**:
- Bidirectional data flow (components ↔ stores ↔ APIs)
- Race conditions
- Unclear data flow direction

**New Flow**:

```
┌──────────────┐
│ USER ACTION  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ MUTATION     │ ← tRPC mutation
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ DATABASE     │ ← Prisma transaction
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ INVALIDATE   │ ← React Query cache invalidation
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ RE-FETCH     │ ← Automatic query refetch
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ UI UPDATE    │ ← Component re-renders
└──────────────┘
```

**Example**:

```typescript
// User submits feedback
const submitFeedback = trpc.feedback.submitFeedback.useMutation({
  onMutate: async (variables) => {
    // OPTIONAL: Optimistic update
    await queryClient.cancelQueries(['page', variables.pageId]);
    
    const previousPage = queryClient.getQueryData(['page', variables.pageId]);
    
    queryClient.setQueryData(['page', variables.pageId], (old) => {
      return applyChangeOptimistically(old, variables);
    });
    
    return { previousPage };
  },
  
  onError: (err, variables, context) => {
    // Rollback optimistic update
    queryClient.setQueryData(['page', variables.pageId], context.previousPage);
  },
  
  onSuccess: (data, variables) => {
    // Server returned updated page, invalidate to refetch
    queryClient.invalidateQueries(['page', variables.pageId]);
    queryClient.invalidateQueries(['proposedChanges', variables.pageId]);
  },
});

// Component automatically updates when query refetches
const { data: page } = trpc.page.get.useQuery({ pageId });

// No manual state management needed!
```

**Benefits**:
- ✅ One-way data flow (predictable)
- ✅ Optimistic updates built-in
- ✅ Automatic rollback on error
- ✅ No race conditions
- ✅ Cache management automatic

---

## 3. Recommended Technology Stack

### 3.1 Core Framework

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| Next.js | 15+ | App framework | ✓ Current (16.0.5) |
| React | 19+ | UI library | ✓ Current (18+) |
| TypeScript | 5.3+ | Type safety | ✓ Current |

### 3.2 Type Safety & API

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| **tRPC** | 11+ | Type-safe API | ✗ **NEW** |
| **Prisma** | 5+ | Type-safe ORM | ✗ **NEW** |
| Zod | 3+ | Runtime validation | ✓ Current |
| React Query | 5+ | Server state | ✗ **NEW** |

### 3.3 State Management

| Technology | Purpose | Status |
|------------|---------|--------|
| TanStack Query (React Query) | Server state | ✗ **NEW** |
| Zustand | Client state | ✓ Current |
| React Hook Form | Form state | ✗ **NEW** |

### 3.4 Database & Storage

| Technology | Purpose | Status |
|------------|---------|--------|
| Supabase PostgreSQL | Database | ✓ Current |
| Prisma Client | Query builder | ✗ **NEW** |
| pgvector | Vector embeddings | ✓ Current |
| Supabase Storage | File storage | ✓ Current |

### 3.5 Styling

| Technology | Purpose | Status |
|------------|---------|--------|
| Tailwind CSS v4 | Utility CSS | ✓ Current |
| shadcn/ui | Component library | ✓ Current |
| CVA (Class Variance Authority) | Variant management | ✗ **NEW** |
| Framer Motion | Animations | ✓ Current |

### 3.6 AI/LLM

| Technology | Purpose | Status |
|------------|---------|--------|
| Vercel AI SDK | Streaming, tools | ✗ **NEW** (better than current) |
| OpenAI | Primary LLM | ✓ Current |
| Anthropic Claude | Fallback LLM | ✓ Current |
| LangChain | Complex agents only | ✓ Current (minimize usage) |

---

## 4. Implementation Timeline (From Scratch)

### Month 1: Foundation (Weeks 1-4)

#### Week 1: Project Setup & Type System
**Goal**: Set up tRPC + Prisma with core types

- [ ] Initialize Next.js 15 project with TypeScript
- [ ] Install and configure Prisma
- [ ] Install and configure tRPC
- [ ] Define Prisma schema for core entities (Workspace, User, Website)
- [ ] Set up tRPC router structure
- [ ] Configure React Query client
- [ ] Set up error handling middleware

**Deliverables**:
- Working tRPC endpoint
- Prisma schema with 5 core tables
- Type flow working end-to-end

#### Week 2: Auth & Workspace Management
**Goal**: User authentication and multi-tenant workspaces

- [ ] Implement Supabase Auth integration
- [ ] Build workspace CRUD with tRPC
- [ ] Add workspace member management
- [ ] Implement RLS policies in Prisma
- [ ] Build workspace switcher UI
- [ ] Add role-based access control

**Deliverables**:
- Working auth flow
- Workspace creation and management
- Multi-tenant isolation

#### Week 3: Document Upload & Processing
**Goal**: Document ingestion pipeline

- [ ] Build file upload with drag-drop
- [ ] Implement document parsers (PDF, DOCX, etc.)
- [ ] Set up document processing queue
- [ ] Add OCR for scanned documents
- [ ] Build document management UI

**Deliverables**:
- Working document upload
- All file types supported
- Queue processing working

#### Week 4: Basic Knowledge Base
**Goal**: Entity extraction and storage

- [ ] Implement text chunking
- [ ] Set up pgvector for embeddings
- [ ] Build entity extraction with LLM
- [ ] Create knowledge base UI
- [ ] Implement semantic search

**Deliverables**:
- Knowledge base operational
- Entity extraction working
- Search functionality

---

### Month 2: Content Generation (Weeks 5-8)

#### Week 5: Entity Extraction with Clean Types
**Goal**: Extract entities using simplified 7-type system

- [ ] Implement EntityType enum (7 types)
- [ ] Build entity extraction agent
- [ ] Create relationship detection (4 types)
- [ ] Build knowledge graph visualization
- [ ] Add entity management UI

**Deliverables**:
- Clean entity type system
- Relationship detection working
- Graph visualization

#### Week 6: Component Template Catalog
**Goal**: Build shadcn/ui + Tailwind UI template catalog

- [ ] Catalog 10 hero templates with slots
- [ ] Catalog 8 feature templates
- [ ] Catalog 6 CTA templates
- [ ] Define selection criteria metadata
- [ ] Build template browser UI

**Deliverables**:
- 24 cataloged templates
- Selection criteria defined
- Template preview UI

#### Week 7: Slot-Based Component System
**Goal**: Build slot composition rendering

- [ ] Implement TemplateRenderer component
- [ ] Build slot validation system
- [ ] Create slot population logic
- [ ] Add template variant support (CVA)
- [ ] Build component inspector

**Deliverables**:
- Slot rendering working
- Infinite template combinations
- Variant system operational

#### Week 8: AI Template Selection & Population
**Goal**: AI-powered template selection and content generation

- [ ] Build template selector agent
- [ ] Implement slot population agent
- [ ] Add KB-grounded content generation
- [ ] Build layout generation pipeline
- [ ] Add generation progress UI

**Deliverables**:
- AI selects appropriate templates
- Slots populated with KB content
- Full page generation working

---

### Month 3: Intelligence & Interactivity (Weeks 9-12)

#### Week 9: Persona Detection
**Goal**: Runtime persona inference

- [ ] Build visitor behavior tracking
- [ ] Implement persona inference engine
- [ ] Create persona-to-content mapping
- [ ] Add persona debugging UI

**Deliverables**:
- Persona detection working
- 70%+ accuracy

#### Week 10: Dynamic Content Adaptation
**Goal**: Real-time content swapping based on persona

- [ ] Build content swap engine
- [ ] Implement smooth transitions
- [ ] Add A/B variant serving
- [ ] Create adaptation analytics

**Deliverables**:
- Content swaps in <200ms
- Smooth animations
- Analytics tracking

#### Week 11: Interactive Elements
**Goal**: Quizzes, forms, popups

- [ ] Build quiz/survey builder
- [ ] Implement popup trigger system
- [ ] Add micro-interactions library
- [ ] Create Framer Motion animation system

**Deliverables**:
- Interactive elements working
- Animation system polished

#### Week 12: Conversion & Lead Tools
**Goal**: Lead capture and conversion optimization

- [ ] Build context-aware lead forms
- [ ] Implement engagement scoring
- [ ] Add conversion CTA prioritization
- [ ] Create lead analytics dashboard

**Deliverables**:
- Lead capture operational
- Conversion tracking working

---

### Month 4: Refinement & Polish (Weeks 13-16)

#### Week 13: Feedback + Preview System (Done Right!)
**Goal**: Auto-applying feedback with proper type safety

- [ ] Build split-view studio UI
- [ ] Implement conversational feedback with Claude
- [ ] Add automatic change application (no type mismatches!)
- [ ] Build real-time preview updates
- [ ] Add change history and undo

**Deliverables**:
- Working feedback system
- Changes apply instantly
- Undo/redo support

#### Week 14: Version Control & Approval
**Goal**: Version management and publishing workflow

- [ ] Build version management system
- [ ] Implement revision history with diffs
- [ ] Add approval workflow
- [ ] Create version timeline UI
- [ ] Build rollback functionality

**Deliverables**:
- Version control operational
- Approval workflow working

#### Week 15: Export & Deployment
**Goal**: Export to Next.js and one-click deploy

- [ ] Build Next.js project exporter
- [ ] Generate project documentation
- [ ] Implement one-click Vercel deploy
- [ ] Add custom domain configuration

**Deliverables**:
- Export working
- Deployment automated

#### Week 16: Testing & Documentation
**Goal**: Comprehensive testing and docs

- [ ] Write unit tests for critical paths
- [ ] Add E2E tests with Playwright
- [ ] Create user documentation
- [ ] Build developer documentation
- [ ] Performance optimization

**Deliverables**:
- 80%+ test coverage
- Complete documentation
- Performance benchmarks met

---

## 5. Migration Strategy (Incremental)

### Option A: Big Bang Rebuild (NOT RECOMMENDED)
- **Timeline**: 4 months
- **Risk**: Very high
- **Cost**: High (maintain both systems)
- **Benefit**: Clean architecture

### Option B: Incremental Migration (RECOMMENDED)
- **Timeline**: 3 months
- **Risk**: Low
- **Cost**: Lower (fixes add value immediately)
- **Benefit**: Continuous improvement

### Incremental Migration Plan

#### Phase 1: Fix Critical Bugs (Weeks 1-2)
**Focus**: Fix immediate issues without architectural changes

**Tasks**:
1. Fix ProposedChange type mismatch
   - Update interface to match API response
   - Add missing fields (sectionId, changeType, etc.)
   
2. Add missing change type handlers
   - Implement 'add' case in applyChangeLocally()
   - Implement 'remove' case in applyChangeLocally()
   
3. Force React re-renders
   - Ensure new object references for state updates
   - Add debug logging

**Impact**: Preview bug fixed in 1-2 days

#### Phase 2: Introduce Better Patterns (Weeks 3-6)
**Focus**: Add tRPC + React Query for NEW features only

**Tasks**:
1. Install tRPC and React Query
   - Set up alongside existing REST APIs
   - Don't break existing code
   
2. Build tRPC router for Epic #205 (templates)
   - Template catalog APIs use tRPC
   - Template selection uses React Query
   - New features get better architecture
   
3. Migrate 5 high-traffic API routes
   - `/api/conversation/refine` → tRPC
   - `/api/conversation/apply-change` → tRPC
   - `/api/workspaces/[id]/websites` → tRPC
   - Show performance improvements

**Impact**: New features easier to build

#### Phase 3: Type System Cleanup (Weeks 7-10)
**Focus**: Consolidate type definitions

**Tasks**:
1. Create single types file per domain
   - `types/workspace.ts` - all workspace types
   - `types/knowledge.ts` - all KB types
   - `types/generation.ts` - all generation types
   
2. Remove `any` types systematically
   - Add ESLint rule to ban `any`
   - Replace with proper types
   
3. Add Zod validation to all API routes
   - Input validation everywhere
   - Output validation for critical routes

**Impact**: 80% type coverage (up from 50%)

#### Phase 4: Database Schema Consolidation (Weeks 11-12)
**Focus**: Clean up schema

**Tasks**:
1. Migrate from `websites` to `websites_v2`
   - Data migration script
   - Update all queries
   - Drop old table
   
2. Add JSONB validation constraints
   - CHECK constraints for required fields
   - Validate structure
   
3. Consolidate status enums
   - Single enum per domain
   - State machine validation

**Impact**: Schema matches code exactly

---

## 6. Cost-Benefit Analysis

### Rebuild from Scratch

**Costs**:
- **Development Time**: 4 months full-time (16 weeks)
- **Team Size**: 2-3 developers
- **Risk Level**: High (70% of rewrites fail)
- **Opportunity Cost**: 4 months of no new features
- **Learning Curve**: Team learns tRPC, Prisma (2 weeks)
- **Maintenance**: Need to run both systems during transition

**Benefits**:
- **Type Coverage**: 90%+ (vs current 50%)
- **Bug Rate**: 70% reduction
- **Developer Velocity**: 2-3x faster after Month 4
- **Code Quality**: Clean architecture
- **Performance**: Optimized queries
- **Scalability**: Clear patterns for growth

**ROI Timeline**: Break-even at Month 6 (2 months after completion)

### Fix Current System

**Costs**:
- **Development Time**: 3 months incremental fixes
- **Team Size**: 1-2 developers
- **Risk Level**: Low (fixes add value immediately)
- **Opportunity Cost**: Can ship new features simultaneously
- **Learning Curve**: Minimal (use current stack)

**Benefits**:
- **Type Coverage**: 70-80% (improvement but not perfect)
- **Bug Rate**: 50% reduction
- **Developer Velocity**: 1.5x faster after Month 3
- **Code Quality**: Improved but still has debt
- **Performance**: Better but not optimal

**ROI Timeline**: Immediate (each fix adds value)

---

## 7. Key Architectural Decisions

### Decision 1: tRPC vs REST
**Recommendation**: tRPC for new projects

**Why**:
- End-to-end type safety
- No API contract drift
- Better DX (autocomplete, refactoring)

**When to use REST**:
- Public APIs (tRPC is internal only)
- Webhooks
- Third-party integrations

### Decision 2: Prisma vs Supabase Client
**Recommendation**: Prisma for complex apps

**Why**:
- Type-safe queries
- Better transaction support
- Migration management
- Relation handling

**When to use Supabase Client**:
- Simple CRUD apps
- Need Supabase Realtime
- Using Supabase Auth heavily

### Decision 3: React Query vs Zustand for Server State
**Recommendation**: React Query for all server data

**Why**:
- Automatic caching and refetching
- Built-in loading/error states
- Optimistic updates
- No manual state sync

**Use Zustand for**:
- UI-only state (sidebar open/closed)
- Preferences (theme, language)
- Temporary state (search filters)

### Decision 4: Slot Composition vs Variant Explosion
**Recommendation**: Slot-based composition

**Why**:
- Infinite combinations without code duplication
- Easy to add new templates
- Clear component API
- Better for AI selection

**Avoid**:
- HeroVariant1, HeroVariant2, ... Variant50
- Leads to unmaintainable code

### Decision 5: Error Codes vs Plain Messages
**Recommendation**: Structured error codes

**Why**:
- Client can handle specific errors
- Analytics and monitoring easier
- Recovery actions possible
- i18n-friendly

---

## 8. Final Recommendation

### ⚠️ DON'T Rebuild from Scratch

**Reasons**:
1. **Working features**: 10 months of development has value
2. **Issues are fixable**: Type mismatches can be resolved incrementally
3. **Lower risk**: Big bang rewrites often fail
4. **Faster ROI**: Ship fixes in weeks, not months
5. **Team morale**: Throwing away work is demotivating

### ✅ DO Incremental Migration

**Strategy**:
1. **Fix critical bugs now** (1-2 weeks)
2. **Introduce better patterns gradually** (3 months)
3. **Use new architecture for new features** (ongoing)
4. **Migrate high-value routes** (as needed)

**Timeline**: 3 months to significantly improved state

---

## 9. Next Steps

### Immediate Actions (This Week)
1. **Exit plan mode**
2. **Fix feedback preview bug** (1-2 days)
   - Update ProposedChange interface
   - Add 'add'/'remove' handlers
   - Force React re-renders
3. **Create type cleanup epic**

### Short-Term (Next Month)
1. **Install tRPC + React Query**
2. **Migrate Epic #205 to use tRPC** (templates)
3. **Document new patterns**

### Long-Term (Next Quarter)
1. **Migrate 20 most-used API routes to tRPC**
2. **Consolidate type definitions**
3. **Clean up database schema**
4. **Add Prisma alongside Supabase client**

---

## Appendix A: Detailed Type Definitions

### Prisma Schema (Complete)

See section 2.1 for core schema. Additional models:

```prisma
model WebsiteVersion {
  id              String          @id @default(uuid())
  websiteId       String          @map("website_id")
  website         Website         @relation("WebsiteVersions", fields: [websiteId], references: [id])
  
  versionNumber   Int             @map("version_number")
  versionName     String?         @map("version_name")
  
  status          VersionStatus   @default(DRAFT)
  
  snapshot        Json            @default("{}")  // Full website state
  
  createdAt       DateTime        @default(now()) @map("created_at")
  publishedAt     DateTime?       @map("published_at")
  
  @@unique([websiteId, versionNumber])
  @@map("website_versions")
}

enum VersionStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

---

## Appendix B: Migration Checklist

### Pre-Migration Checklist
- [ ] All tests passing
- [ ] Database backup created
- [ ] Feature freeze announced
- [ ] Team trained on new stack
- [ ] Documentation updated

### Migration Checklist
- [ ] Prisma schema matches Supabase schema
- [ ] All API routes have tRPC equivalent
- [ ] All components use React Query
- [ ] All types properly defined
- [ ] Error handling standardized
- [ ] Performance benchmarks met

### Post-Migration Checklist
- [ ] Old code removed
- [ ] Documentation complete
- [ ] Team comfortable with new patterns
- [ ] Monitoring in place
- [ ] Performance validated

---

## Document Version

- **Version**: 1.0
- **Created**: 2025-12-03
- **Author**: Claude (AI Assistant)
- **Status**: Reference Architecture

