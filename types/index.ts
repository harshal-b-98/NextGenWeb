/**
 * Central export for all types
 */

// Database types
export * from './database';

// Auth types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Session {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}

// Component AI Metadata types (for component selection)
export interface ComponentMetadata {
  id: string;
  name: string;
  category: ComponentCategory;
  variant: string;
  description: string;
  suitableFor: ContentType[];
  requiredSlots: ComponentSlot[];
  optionalSlots: ComponentSlot[];
  minContentLength?: number;
  maxContentLength?: number;
  supportedPersonas?: string[];
  conversionGoal?: ConversionGoal;
  tags: string[];
}

export type ComponentCategory =
  | 'hero'
  | 'features'
  | 'testimonials'
  | 'cta'
  | 'pricing'
  | 'faq'
  | 'contact'
  | 'footer'
  | 'navigation'
  | 'content'
  | 'gallery'
  | 'stats';

export type ContentType =
  | 'product'
  | 'service'
  | 'company'
  | 'personal'
  | 'portfolio'
  | 'landing'
  | 'blog'
  | 'documentation';

export interface ComponentSlot {
  name: string;
  type: 'text' | 'image' | 'link' | 'list' | 'form' | 'video';
  required: boolean;
  maxLength?: number;
  validation?: string;
}

export type ConversionGoal =
  | 'lead-capture'
  | 'signup'
  | 'purchase'
  | 'demo-request'
  | 'download'
  | 'contact'
  | 'awareness';

// Brand configuration types
export interface BrandConfig {
  colors: BrandColors;
  typography: BrandTypography;
  logo?: BrandLogo;
  voice: BrandVoice;
}

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface BrandTypography {
  fontFamily: {
    heading: string;
    body: string;
    mono: string;
  };
  fontSizes: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
  };
}

export interface BrandLogo {
  light: string;
  dark?: string;
  icon?: string;
  width?: number;
  height?: number;
}

export interface BrandVoice {
  tone: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'playful';
  formality: 'formal' | 'neutral' | 'informal';
  personality: string[];
}

// Generation types
export interface GenerationJob {
  id: string;
  websiteId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  steps: GenerationStep[];
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface GenerationStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

// Visitor/Persona detection types
export interface VisitorSession {
  id: string;
  websiteId: string;
  detectedPersonaId?: string;
  personaConfidence: number;
  behaviorSignals: BehaviorSignal[];
  pageViews: PageView[];
  startedAt: string;
  lastActivityAt: string;
}

export interface BehaviorSignal {
  type: string;
  value: number;
  timestamp: string;
}

export interface PageView {
  pageId: string;
  path: string;
  timeOnPage: number;
  scrollDepth: number;
  interactions: number;
  timestamp: string;
}
