# Technical Architecture Document
## AI-Powered Dynamic Marketing Website Builder

**Version:** 1.0  
**Date:** November 2024

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Admin      │  │   Website    │  │   Preview    │  │   Export     │    │
│  │   Portal     │  │   Builder    │  │   Server     │  │   Module     │    │
│  │   (Next.js)  │  │   (React)    │  │   (Vite)     │  │   (Node)     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   API        │  │   WebSocket  │  │   Edge       │  │   Webhook    │    │
│  │   Gateway    │  │   Server     │  │   Functions  │  │   Handler    │    │
│  │   (Next.js)  │  │   (Socket.io)│  │   (Vercel)   │  │   (Node)     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AI ORCHESTRATION LAYER                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     SUPERVISOR AGENT                                 │    │
│  │         (Orchestrates all AI agents and workflows)                   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│    ┌─────────────┬─────────────┬─────┴─────┬─────────────┬─────────────┐    │
│    ▼             ▼             ▼           ▼             ▼             ▼    │
│  ┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐       │
│  │Doc  │     │Know-│     │Perso│     │Lay- │     │Brand│     │Inter│       │
│  │Inges│     │ledge│     │na   │     │out  │     │ing  │     │acti-│       │
│  │tion │     │Extra│     │Model│     │Gen  │     │Agent│     │on   │       │
│  └─────┘     └─────┘     └─────┘     └─────┘     └─────┘     └─────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Supabase   │  │   Vector     │  │   File       │  │   Redis      │    │
│  │   PostgreSQL │  │   Store      │  │   Storage    │  │   Cache      │    │
│  │   (Primary)  │  │   (pgvector) │  │   (Supabase) │  │   (Session)  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 14, React 18, TypeScript | Admin portal, website builder |
| Styling | Tailwind CSS, Framer Motion | UI components, animations |
| State | Zustand, React Query | Client state, server state |
| Backend | Next.js API Routes, Edge Functions | API endpoints |
| AI | LangChain, OpenAI/Anthropic | AI orchestration |
| Database | Supabase PostgreSQL | Primary data store |
| Vector DB | pgvector (Supabase) | Embeddings storage |
| File Storage | Supabase Storage | Document storage |
| Cache | Redis (Upstash) | Session, rate limiting |
| Preview | Vite | Local development server |
| Export | ESBuild | Code bundling |

---

## 2. System Components

### 2.1 Admin Portal

The admin portal is a Next.js application providing the primary user interface.

```typescript
// Structure
/app
├── (auth)
│   ├── login/
│   └── signup/
├── (dashboard)
│   ├── workspaces/
│   │   ├── [workspaceId]/
│   │   │   ├── documents/
│   │   │   ├── knowledge-base/
│   │   │   ├── websites/
│   │   │   ├── branding/
│   │   │   ├── analytics/
│   │   │   └── settings/
├── api/
│   ├── documents/
│   ├── knowledge/
│   ├── generate/
│   └── export/
└── components/
    ├── ui/           // Shared UI components
    ├── documents/    // Document management
    ├── editor/       // Website editor
    └── preview/      // Preview components
```

**Key Features:**
- Document upload and management
- Knowledge base visualization
- Website builder interface
- Branding configuration
- Analytics dashboard
- Team management

### 2.2 Website Generation Engine

The core engine responsible for creating websites from knowledge bases.

```typescript
interface GenerationPipeline {
  // Input
  knowledgeBase: KnowledgeBase;
  brandConfig: BrandConfig;
  personaConfig: PersonaConfig[];
  
  // Processing stages
  stages: [
    'analyze_content',      // Understand KB content
    'plan_architecture',    // Determine site structure
    'generate_layouts',     // Create page layouts
    'apply_branding',       // Apply brand styles
    'add_interactions',     // Add dynamic elements
    'optimize_ux',          // UX best practices
    'generate_code'         // Output React code
  ];
  
  // Output
  output: GeneratedWebsite;
}

interface GeneratedWebsite {
  pages: Page[];
  components: Component[];
  styles: StyleSheet;
  assets: Asset[];
  config: SiteConfig;
}
```

### 2.3 Dynamic UI Runtime

The runtime engine that handles real-time personalization.

```typescript
interface DynamicUIRuntime {
  // Persona detection
  detectPersona(behavior: UserBehavior): Persona;
  
  // Content adaptation
  adaptContent(page: Page, persona: Persona): AdaptedPage;
  
  // Dynamic page generation
  generateDynamicPage(trigger: UserAction): Page;
  
  // Interaction handling
  handleInteraction(event: InteractionEvent): Response;
}

interface UserBehavior {
  clickHistory: Click[];
  scrollDepth: number;
  timeOnPage: number;
  referrerData: ReferrerInfo;
  deviceInfo: DeviceInfo;
}
```

### 2.4 Preview Server

Local development server for real-time website preview.

```typescript
interface PreviewServer {
  // Server configuration
  port: number;  // Default: 5050
  hotReload: boolean;
  
  // Methods
  start(): Promise<void>;
  stop(): Promise<void>;
  refresh(): void;
  
  // WebSocket for live updates
  ws: WebSocketServer;
}
```

---

## 3. Data Architecture

### 3.1 Database Schema Overview

```sql
-- Multi-tenant structure
CREATE SCHEMA IF NOT EXISTS app;

-- Core tables
app.organizations
app.workspaces
app.users
app.team_members

-- Document & Knowledge
app.documents
app.knowledge_items
app.knowledge_embeddings
app.personas

-- Website Generation
app.websites
app.pages
app.components
app.layouts
app.brand_configs

-- Analytics & Tracking
app.page_views
app.interactions
app.lead_captures

-- Multi-tenancy enforced via RLS
```

### 3.2 Key Tables

**Organizations & Workspaces:**
```sql
CREATE TABLE app.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE app.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES app.organizations(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);
```

**Documents & Knowledge:**
```sql
CREATE TABLE app.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES app.workspaces(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,  -- pdf, pptx, docx, etc.
  storage_path TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending, processing, completed, failed
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE app.knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES app.workspaces(id),
  document_id UUID REFERENCES app.documents(id),
  type TEXT NOT NULL,  -- feature, benefit, pain_point, use_case, etc.
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE app.knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id UUID REFERENCES app.knowledge_items(id),
  embedding vector(1536),  -- OpenAI embedding dimension
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Websites & Pages:**
```sql
CREATE TABLE app.websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES app.workspaces(id),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  brand_config JSONB DEFAULT '{}',
  persona_config JSONB DEFAULT '[]',
  generation_config JSONB DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE app.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES app.websites(id),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,  -- home, feature, use_case, persona, etc.
  layout JSONB NOT NULL,
  content JSONB NOT NULL,
  seo_config JSONB DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(website_id, slug)
);
```

### 3.3 Row-Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE app.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.websites ENABLE ROW LEVEL SECURITY;

-- Workspace access policy
CREATE POLICY workspace_access ON app.workspaces
  USING (
    organization_id IN (
      SELECT organization_id FROM app.team_members
      WHERE user_id = auth.uid()
    )
  );

-- Document access policy
CREATE POLICY document_access ON app.documents
  USING (
    workspace_id IN (
      SELECT id FROM app.workspaces
      WHERE organization_id IN (
        SELECT organization_id FROM app.team_members
        WHERE user_id = auth.uid()
      )
    )
  );
```

---

## 4. API Design

### 4.1 API Structure

```
/api
├── /auth
│   ├── POST /login
│   ├── POST /signup
│   ├── POST /logout
│   └── GET  /session
├── /workspaces
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /:id
│   ├── PATCH  /:id
│   └── DELETE /:id
├── /documents
│   ├── GET    /workspace/:workspaceId
│   ├── POST   /upload
│   ├── GET    /:id
│   ├── DELETE /:id
│   └── POST   /:id/process
├── /knowledge
│   ├── GET    /workspace/:workspaceId
│   ├── GET    /search
│   └── GET    /personas/:workspaceId
├── /generate
│   ├── POST   /website
│   ├── POST   /page
│   ├── POST   /section
│   └── POST   /regenerate
├── /websites
│   ├── GET    /workspace/:workspaceId
│   ├── GET    /:id
│   ├── PATCH  /:id
│   ├── DELETE /:id
│   └── POST   /:id/publish
├── /preview
│   ├── POST   /start
│   ├── POST   /stop
│   └── GET    /status
└── /export
    ├── POST   /react
    └── POST   /nextjs
```

### 4.2 Key API Endpoints

**Document Upload:**
```typescript
// POST /api/documents/upload
interface UploadRequest {
  workspaceId: string;
  file: File;
}

interface UploadResponse {
  documentId: string;
  status: 'pending' | 'processing';
  message: string;
}
```

**Website Generation:**
```typescript
// POST /api/generate/website
interface GenerateWebsiteRequest {
  workspaceId: string;
  name: string;
  brandConfig?: BrandConfig;
  personaConfig?: PersonaConfig[];
  options?: GenerationOptions;
}

interface GenerateWebsiteResponse {
  websiteId: string;
  status: 'generating' | 'completed';
  pages: PageSummary[];
  previewUrl?: string;
}
```

---

## 5. AI Integration Architecture

### 5.1 LangChain Pipeline

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";

// Model configuration
const models = {
  fast: new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.7 }),
  smart: new ChatAnthropic({ model: "claude-3-5-sonnet", temperature: 0.5 }),
  creative: new ChatOpenAI({ model: "gpt-4o", temperature: 0.9 }),
};

// Vector store for knowledge retrieval
const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabaseClient,
  tableName: "knowledge_embeddings",
  queryName: "match_knowledge",
});
```

### 5.2 Agent Communication

```typescript
interface AgentMessage {
  agentId: string;
  type: 'request' | 'response' | 'status';
  payload: unknown;
  timestamp: number;
}

class SupervisorAgent {
  private agents: Map<string, Agent>;
  private messageQueue: AgentMessage[];
  
  async orchestrate(task: GenerationTask): Promise<GenerationResult> {
    // 1. Document ingestion
    const docs = await this.agents.get('docIngestion').process(task.documents);
    
    // 2. Knowledge extraction
    const kb = await this.agents.get('knowledgeExtraction').extract(docs);
    
    // 3. Persona modeling
    const personas = await this.agents.get('personaModeling').identify(kb);
    
    // 4. Layout generation
    const layouts = await this.agents.get('layoutGeneration').generate(kb, personas);
    
    // 5. Apply branding
    const branded = await this.agents.get('branding').apply(layouts, task.brand);
    
    // 6. Add interactions
    const interactive = await this.agents.get('interaction').enhance(branded);
    
    // 7. UX optimization
    const optimized = await this.agents.get('uxOptimization').optimize(interactive);
    
    return optimized;
  }
}
```

---

## 6. Component System

### 6.1 Component Architecture

```typescript
interface ComponentDefinition {
  id: string;
  name: string;
  category: ComponentCategory;
  schema: JSONSchema;          // Props schema
  variants: ComponentVariant[];
  aiMetadata: {
    useCases: string[];        // When to use this component
    contentRequirements: string[];
    personaFit: string[];
  };
}

type ComponentCategory = 
  | 'hero'
  | 'features'
  | 'testimonials'
  | 'pricing'
  | 'cta'
  | 'comparison'
  | 'timeline'
  | 'faq'
  | 'form'
  | 'gallery'
  | 'stats';
```

### 6.2 Component Registry

```typescript
class ComponentRegistry {
  private components: Map<string, ComponentDefinition>;
  
  // Register a new component
  register(component: ComponentDefinition): void;
  
  // Find best component for context
  findBestMatch(context: ContentContext): ComponentDefinition[];
  
  // Get component by ID
  get(id: string): ComponentDefinition;
  
  // List all components
  list(category?: ComponentCategory): ComponentDefinition[];
}
```

---

## 7. Security Architecture

### 7.1 Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│ Supabase │────▶│  Verify  │────▶│  Access  │
│          │     │   Auth   │     │   JWT    │     │ Granted  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                                                    │
     │              Session Token (HttpOnly Cookie)       │
     │◀──────────────────────────────────────────────────│
```

### 7.2 Authorization Model

```typescript
interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

interface Role {
  name: 'owner' | 'admin' | 'editor' | 'viewer';
  permissions: Permission[];
}

const ROLE_PERMISSIONS: Record<string, Role> = {
  owner: {
    name: 'owner',
    permissions: [
      { resource: '*', actions: ['create', 'read', 'update', 'delete'] }
    ]
  },
  admin: {
    name: 'admin',
    permissions: [
      { resource: 'documents', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'websites', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'team', actions: ['create', 'read', 'update'] },
    ]
  },
  editor: {
    name: 'editor',
    permissions: [
      { resource: 'documents', actions: ['create', 'read', 'update'] },
      { resource: 'websites', actions: ['read', 'update'] },
    ]
  },
  viewer: {
    name: 'viewer',
    permissions: [
      { resource: 'documents', actions: ['read'] },
      { resource: 'websites', actions: ['read'] },
    ]
  }
};
```

---

## 8. Deployment Architecture

### 8.1 Infrastructure Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         VERCEL                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Next.js    │  │    Edge      │  │   Serverless │       │
│  │   Frontend   │  │   Functions  │  │   Functions  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│    SUPABASE      │ │   UPSTASH    │ │   OPENAI /       │
│  ┌────────────┐  │ │   ┌──────┐   │ │   ANTHROPIC      │
│  │ PostgreSQL │  │ │   │Redis │   │ │  ┌────────────┐  │
│  │ + pgvector │  │ │   └──────┘   │ │  │  AI APIs   │  │
│  ├────────────┤  │ └──────────────┘ │  └────────────┘  │
│  │  Storage   │  │                   └──────────────────┘
│  ├────────────┤  │
│  │    Auth    │  │
│  └────────────┘  │
└──────────────────┘
```

### 8.2 Environment Configuration

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# AI Services
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx

# Redis
UPSTASH_REDIS_REST_URL=xxx
UPSTASH_REDIS_REST_TOKEN=xxx

# Preview Server
PREVIEW_SERVER_PORT=5050
```

---

## 9. Performance Considerations

### 9.1 Caching Strategy

| Cache Layer | Technology | TTL | Use Case |
|-------------|------------|-----|----------|
| API Response | Redis | 5 min | Frequent API calls |
| Knowledge Query | Redis | 30 min | Vector search results |
| Generated Pages | Redis | 1 hour | Page content cache |
| Static Assets | CDN | 1 year | Images, fonts, icons |

### 9.2 Optimization Techniques

- **Edge Functions:** Deploy latency-critical functions to edge
- **Streaming:** Stream AI responses for better UX
- **Incremental Generation:** Generate pages incrementally
- **Background Jobs:** Process documents asynchronously
- **Connection Pooling:** Pool database connections

---

## 10. Monitoring & Observability

### 10.1 Metrics to Track

| Category | Metrics |
|----------|---------|
| Performance | API latency, page load time, generation time |
| Usage | Active users, documents processed, websites generated |
| Errors | Error rates, failed generations, API failures |
| AI | Token usage, model latency, accuracy metrics |

### 10.2 Logging Strategy

```typescript
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;
  action: string;
  userId?: string;
  workspaceId?: string;
  metadata: Record<string, unknown>;
  duration?: number;
}
```

---

## 11. Appendix

### 11.1 Glossary

| Term | Definition |
|------|------------|
| Knowledge Base | Structured repository of extracted product information |
| Persona | User archetype derived from document analysis |
| Dynamic UI | Interface that adapts based on user behavior |
| Component | Reusable UI building block |
| Layout | Arrangement of components on a page |

### 11.2 References

- Next.js Documentation: https://nextjs.org/docs
- Supabase Documentation: https://supabase.com/docs
- LangChain Documentation: https://js.langchain.com
- pgvector Documentation: https://github.com/pgvector/pgvector
