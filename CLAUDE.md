# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NextGenWeb is an AI-powered dynamic marketing website builder that generates complete marketing websites from uploaded documents. It uses AI agents to extract knowledge, detect personas, and create personalized, adaptive websites with a Supabase-backed multi-tenant CMS.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint (eslint-config-next with TypeScript)
npm run test     # Run Vitest unit tests (when configured)
npm run e2e      # Run Playwright E2E tests (when configured)
npm run storybook # Launch Storybook component explorer (when configured)
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+, React 18, TypeScript |
| Styling | Tailwind CSS v4, Framer Motion |
| State | Zustand |
| Backend | Next.js API Routes, tRPC (optional) |
| Database | Supabase (PostgreSQL + pgvector) |
| Auth | Supabase Auth (Email, OAuth, Magic Link) |
| Storage | Supabase Storage |
| Cache | Redis/Upstash |
| AI/LLM | LangChain → OpenAI/Anthropic (with fallback chain) |
| Embeddings | OpenAI text-embedding-3-small |
| Document Processing | pdf-parse, mammoth, xlsx, tesseract.js |
| Testing | Vitest (unit), Playwright (E2E), Zod (validation) |
| Components | Storybook, Chromatic (visual regression) |
| Monitoring | Sentry (errors), PostHog (analytics) |

## Architecture

```
app/
├── (auth)/              # Auth routes (login, signup, magic-link)
├── (dashboard)/         # Protected dashboard routes
│   ├── workspaces/
│   │   └── [workspaceId]/
│   │       ├── documents/
│   │       ├── knowledge-base/
│   │       ├── websites/
│   │       ├── branding/
│   │       └── analytics/
├── api/                 # API routes
│   ├── documents/
│   ├── knowledge/
│   ├── generate/
│   └── webhooks/
├── layout.tsx
├── page.tsx
└── globals.css

components/
├── ui/                  # Base UI components (buttons, inputs, etc.)
├── marketing/           # Marketing components (heroes, features, CTAs)
├── forms/               # Form components
└── admin/               # Admin-specific components

lib/
├── supabase/           # Supabase client and utilities
├── ai/                 # AI agent implementations
│   ├── agents/         # Individual agents
│   ├── supervisor.ts   # Orchestrator
│   └── prompts/        # Prompt templates
├── db/                 # Database queries and types
└── utils/              # Shared utilities

types/                  # TypeScript type definitions
```

**Path Alias**: Use `@/*` for imports from project root

## Development Phases

### Phase 1: Foundation (Weeks 1-10)
- **1.1** Infrastructure & Multi-Tenant Architecture (3 weeks)
- **1.2** Document Ingestion Pipeline (3 weeks)
- **1.3** Component Library Foundation - 25-30 components (4 weeks)

### Phase 2: Knowledge Engine (Weeks 11-18)
- **2.1** Semantic Knowledge Base with pgvector (4 weeks)
- **2.2** Persona Modeling System (2 weeks)
- **2.3** Brand & Theme Engine (2 weeks)

### Phase 3: Dynamic Generation (Weeks 19-30)
- **3.1** Layout Generation Agent (4 weeks)
- **3.2** Storyline & Narrative Agent (2 weeks)
- **3.3** Content Generation & Mapping (3 weeks)
- **3.4** Full Page Generation Pipeline (3 weeks)

### Phase 4: Intelligence & Interactivity (Weeks 31-40)
- **4.1** Interactive Elements System (3 weeks)
- **4.2** Runtime Persona Detection (3 weeks)
- **4.3** Dynamic Page Runtime (2 weeks)
- **4.4** Conversion & Lead Tools (2 weeks)

### Phase 5: Admin & Preview (Parallel)
- **5.1** Admin Dashboard (ongoing)
- **5.2** Preview System (3 weeks)
- **5.3** Export & Deployment (2 weeks)

## AI Agent Architecture

```
                    SUPERVISOR AGENT
                          │
       ┌──────────────────┼──────────────────┐
       ▼                  ▼                  ▼
   INGESTION          KNOWLEDGE          GENERATION
   ├─ Document        ├─ Extraction      ├─ Layout
   ├─ OCR             ├─ Persona         ├─ Content
   └─ Chunking        └─ Graph           ├─ Storyline
                                         ├─ Branding
                                         └─ Interaction
```

**Fallback Chain**: Claude Sonnet → GPT-4 → GPT-3.5 Turbo

## Database Schema (Core)

```
workspaces
├── users (via workspace_members)
├── documents
├── knowledge_base_items
├── knowledge_embeddings (pgvector)
├── personas
├── websites
│   ├── pages
│   ├── page_versions
│   └── brand_configs
├── lead_captures
└── analytics_events
```

All tables use Row-Level Security (RLS) for multi-tenant isolation.

## Key Conventions

### Code Style
- Use TypeScript strict mode
- Prefer named exports over default exports
- Use Zod for runtime validation
- Components: PascalCase, utilities: camelCase

### Component Development
- All marketing components need AI metadata for selection
- Follow 8px spacing grid
- WCAG 2.1 AA accessibility compliance
- Mobile-first responsive design
- Document in Storybook

### AI Agent Development
- Agents extend BaseAgent class
- Use structured output schemas (Zod)
- Implement retry with exponential backoff
- Log token usage for cost tracking
- Handle rate limits gracefully

### API Routes
- Use tRPC for type-safe APIs when possible
- Validate all inputs with Zod
- Return consistent error shapes
- Rate limit AI-heavy endpoints

### Testing
- Unit tests for utilities and hooks
- Component tests with Testing Library
- E2E tests for critical user flows
- Validate AI outputs against schemas

## Security Checklist

- [ ] RLS policies on all tenant tables
- [ ] Input sanitization for document uploads
- [ ] Rate limiting on AI endpoints
- [ ] CSP headers configured
- [ ] Environment variables never exposed to client
- [ ] GDPR: data export/deletion utilities

## Performance Targets

| Metric | Target |
|--------|--------|
| KB generation | < 5 minutes |
| Page generation | < 30 seconds |
| Lighthouse score | 90+ |
| Content swap | < 200ms |
| Persona detection | > 70% accuracy |

## Product Documentation

Detailed docs in `.docs/`:
- Product Requirements Document (PRD)
- Technical Architecture Document
- AI Agent System Design
- Component Library Specification
- Database Schema Design
- Product Roadmap

## Jira Integration

Project: **NEX** - https://twenty20systems.atlassian.net/jira/software/projects/NEX/boards/366

Epics align with development phases. Use Jira issue keys in commit messages.

## GitHub Repository

**Repo:** https://github.com/harshal-b-98/NextGenWeb.git

## Session Guidelines for Claude

### Ticket Alignment Review

Before starting work on any ticket, Claude should verify alignment with the product vision:

1. **Review the ticket scope** - Does it match the phase objectives?
2. **Check dependencies** - Are prerequisite tickets completed?
3. **Validate technical approach** - Does it follow the architecture in this document?
4. **Assess complexity** - Is the ticket appropriately sized?

**If misalignment is detected:**
- Flag the issue to the user
- Suggest modifications to the ticket
- Propose alternative approaches that better fit the product vision

### End-of-Session Suggestions

At the end of each coding session, Claude should provide:

#### 1. Progress Summary
- Tickets completed (with Jira keys)
- Code changes made
- Tests added/updated

#### 2. Next Steps Recommendations
- Suggested next tickets to work on
- Any blockers or dependencies to resolve
- Technical debt identified

#### 3. Product Vision Alignment Check
- Are we on track with the phase objectives?
- Any scope creep detected?
- Recommendations for ticket refinement

#### 4. Code Quality Notes
- Areas needing refactoring
- Missing tests or documentation
- Performance considerations

### Product Vision Reminder

**Core Value Proposition:** NextGenWeb generates complete, personalized marketing websites from uploaded documents using AI agents.

**Key Differentiators:**
1. **Document-to-Website**: Upload docs → AI extracts knowledge → generates site
2. **Persona-Aware**: Detects visitor personas and adapts content in real-time
3. **Multi-Tenant SaaS**: Workspace isolation with RLS
4. **Component Intelligence**: AI selects optimal components based on content

**Success Metrics:**
- Knowledge base generation < 5 minutes
- Page generation < 30 seconds
- Content swap < 200ms
- Persona detection > 70% accuracy

When reviewing tickets, ensure they contribute to these differentiators and metrics.
