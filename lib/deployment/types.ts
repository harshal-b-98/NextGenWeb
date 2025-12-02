/**
 * Deployment Types
 * Phase 3.6: Hosting & Deployment
 *
 * Types for deployment providers and configurations.
 */

import { z } from 'zod';

/**
 * Supported deployment providers
 */
export type DeploymentProvider = 'vercel' | 'netlify' | 'custom';

/**
 * Deployment status
 */
export type DeploymentStatus =
  | 'pending'
  | 'building'
  | 'deploying'
  | 'ready'
  | 'error'
  | 'canceled';

/**
 * Deployment configuration
 */
export interface DeploymentConfig {
  provider: DeploymentProvider;
  projectName: string;
  teamId?: string;
  framework?: string;
  buildCommand?: string;
  outputDirectory?: string;
  installCommand?: string;
  nodeVersion?: string;
  environmentVariables?: Record<string, string>;
}

/**
 * Deployment record
 */
export interface Deployment {
  id: string;
  websiteId: string;
  provider: DeploymentProvider;
  status: DeploymentStatus;
  url?: string;
  previewUrl?: string;
  productionUrl?: string;
  deploymentId?: string;
  projectId?: string;
  buildLogs?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/**
 * Vercel project configuration
 */
export interface VercelProjectConfig {
  name: string;
  framework: string;
  buildCommand: string;
  outputDirectory: string;
  installCommand: string;
  devCommand: string;
  rootDirectory: string;
  nodeVersion: string;
  publicSource: boolean;
}

/**
 * Vercel deployment response
 */
export interface VercelDeploymentResponse {
  id: string;
  url: string;
  name: string;
  meta: Record<string, string>;
  state: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  readyState: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  createdAt: number;
  buildingAt?: number;
  ready?: number;
  target?: 'production' | 'preview';
  alias?: string[];
  aliasError?: { code: string; message: string };
  aliasAssigned: boolean;
  inspectorUrl?: string;
}

/**
 * Domain configuration
 */
export interface DomainConfig {
  id: string;
  websiteId: string;
  domain: string;
  verified: boolean;
  verificationRecords?: DnsRecord[];
  sslStatus: 'pending' | 'active' | 'error';
  createdAt: string;
  updatedAt: string;
}

/**
 * DNS record for domain verification
 */
export interface DnsRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT';
  name: string;
  value: string;
  ttl?: number;
}

/**
 * Deployment creation input
 */
export const CreateDeploymentSchema = z.object({
  websiteId: z.string().uuid(),
  provider: z.enum(['vercel', 'netlify', 'custom']).default('vercel'),
  config: z.object({
    projectName: z.string().optional(),
    teamId: z.string().optional(),
    environmentVariables: z.record(z.string(), z.string()).optional(),
  }).optional(),
});

export type CreateDeploymentInput = z.infer<typeof CreateDeploymentSchema>;

/**
 * Domain addition input
 */
export const AddDomainSchema = z.object({
  websiteId: z.string().uuid(),
  domain: z.string().regex(/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i, 'Invalid domain format'),
});

export type AddDomainInput = z.infer<typeof AddDomainSchema>;
