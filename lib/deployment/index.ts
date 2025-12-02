/**
 * Deployment Module
 * Phase 3.6: Hosting & Deployment
 */

// Types
export type {
  DeploymentProvider,
  DeploymentStatus,
  DeploymentConfig,
  Deployment,
  VercelProjectConfig,
  VercelDeploymentResponse,
  DomainConfig,
  DnsRecord,
  CreateDeploymentInput,
  AddDomainInput,
} from './types';

export { CreateDeploymentSchema, AddDomainSchema } from './types';

// Vercel Service
export { VercelDeploymentService, createVercelService } from './vercel';
