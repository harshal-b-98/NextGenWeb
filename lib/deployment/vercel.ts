/**
 * Vercel Deployment Service
 * Phase 3.6: Hosting & Deployment
 *
 * Handles deployment to Vercel platform using their REST API.
 */

import type {
  VercelDeploymentResponse,
  VercelProjectConfig,
  DeploymentStatus,
  DomainConfig,
  DnsRecord,
} from './types';

/**
 * Vercel API base URL
 */
const VERCEL_API_URL = 'https://api.vercel.com';

/**
 * Map Vercel state to our deployment status
 */
function mapVercelState(state: string): DeploymentStatus {
  switch (state) {
    case 'QUEUED':
      return 'pending';
    case 'BUILDING':
      return 'building';
    case 'READY':
      return 'ready';
    case 'ERROR':
      return 'error';
    case 'CANCELED':
      return 'canceled';
    default:
      return 'pending';
  }
}

/**
 * Vercel deployment service
 */
export class VercelDeploymentService {
  private token: string;
  private teamId?: string;

  constructor(token: string, teamId?: string) {
    this.token = token;
    this.teamId = teamId;
  }

  /**
   * Get authorization headers
   */
  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Build query string with optional team ID
   */
  private buildQueryString(params: Record<string, string> = {}): string {
    const allParams = { ...params };
    if (this.teamId) {
      allParams.teamId = this.teamId;
    }
    const queryString = new URLSearchParams(allParams).toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Create a new Vercel project
   */
  async createProject(config: Partial<VercelProjectConfig>): Promise<{
    id: string;
    name: string;
    accountId: string;
  }> {
    const response = await fetch(
      `${VERCEL_API_URL}/v9/projects${this.buildQueryString()}`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: config.name,
          framework: config.framework || 'nextjs',
          buildCommand: config.buildCommand || 'npm run build',
          outputDirectory: config.outputDirectory || '.next',
          installCommand: config.installCommand || 'npm install',
          devCommand: config.devCommand || 'npm run dev',
          rootDirectory: config.rootDirectory || null,
          nodeVersion: config.nodeVersion || '20.x',
          publicSource: config.publicSource ?? false,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create Vercel project');
    }

    return response.json();
  }

  /**
   * Get project by name
   */
  async getProject(nameOrId: string): Promise<{
    id: string;
    name: string;
    accountId: string;
  } | null> {
    const response = await fetch(
      `${VERCEL_API_URL}/v9/projects/${encodeURIComponent(nameOrId)}${this.buildQueryString()}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get Vercel project');
    }

    return response.json();
  }

  /**
   * Deploy files to Vercel
   */
  async deploy(
    projectName: string,
    files: Array<{ path: string; content?: string; isDirectory?: boolean }>,
    options: {
      target?: 'production' | 'preview';
      meta?: Record<string, string>;
    } = {}
  ): Promise<{
    deploymentId: string;
    url: string;
    status: DeploymentStatus;
    inspectorUrl?: string;
  }> {
    // Prepare files for deployment
    const deploymentFiles = files
      .filter(f => !f.isDirectory && f.content)
      .map(file => ({
        file: file.path,
        data: Buffer.from(file.content!).toString('base64'),
        encoding: 'base64' as const,
      }));

    // Create deployment
    const response = await fetch(
      `${VERCEL_API_URL}/v13/deployments${this.buildQueryString()}`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: projectName,
          files: deploymentFiles,
          target: options.target || 'production',
          projectSettings: {
            framework: 'nextjs',
            buildCommand: 'npm run build',
            outputDirectory: '.next',
            installCommand: 'npm install',
            devCommand: 'npm run dev',
          },
          meta: {
            ...options.meta,
            deployedBy: 'nextgenweb',
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create deployment');
    }

    const deployment: VercelDeploymentResponse = await response.json();

    return {
      deploymentId: deployment.id,
      url: `https://${deployment.url}`,
      status: mapVercelState(deployment.readyState),
      inspectorUrl: deployment.inspectorUrl,
    };
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string): Promise<{
    status: DeploymentStatus;
    url?: string;
    error?: string;
    buildLogs?: string;
  }> {
    const response = await fetch(
      `${VERCEL_API_URL}/v13/deployments/${deploymentId}${this.buildQueryString()}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get deployment status');
    }

    const deployment: VercelDeploymentResponse = await response.json();

    return {
      status: mapVercelState(deployment.readyState),
      url: deployment.readyState === 'READY' ? `https://${deployment.url}` : undefined,
      error: deployment.aliasError?.message,
    };
  }

  /**
   * Get deployment logs
   */
  async getDeploymentLogs(deploymentId: string): Promise<string> {
    const response = await fetch(
      `${VERCEL_API_URL}/v2/deployments/${deploymentId}/events${this.buildQueryString()}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      return '';
    }

    const events = await response.json();

    if (Array.isArray(events)) {
      return events
        .filter((e: { type: string }) => e.type === 'stdout' || e.type === 'stderr')
        .map((e: { payload: string; created: number }) =>
          `[${new Date(e.created).toISOString()}] ${e.payload}`
        )
        .join('\n');
    }

    return '';
  }

  /**
   * Cancel a deployment
   */
  async cancelDeployment(deploymentId: string): Promise<void> {
    const response = await fetch(
      `${VERCEL_API_URL}/v12/deployments/${deploymentId}/cancel${this.buildQueryString()}`,
      {
        method: 'PATCH',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to cancel deployment');
    }
  }

  /**
   * Add a domain to a project
   */
  async addDomain(
    projectId: string,
    domain: string
  ): Promise<{
    name: string;
    verified: boolean;
    verification?: DnsRecord[];
  }> {
    const response = await fetch(
      `${VERCEL_API_URL}/v10/projects/${projectId}/domains${this.buildQueryString()}`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ name: domain }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to add domain');
    }

    const result = await response.json();

    return {
      name: result.name,
      verified: result.verified,
      verification: result.verification?.map((v: { type: string; domain: string; value: string }) => ({
        type: v.type as DnsRecord['type'],
        name: v.domain,
        value: v.value,
      })),
    };
  }

  /**
   * Verify a domain
   */
  async verifyDomain(
    projectId: string,
    domain: string
  ): Promise<{
    verified: boolean;
    verification?: DnsRecord[];
  }> {
    const response = await fetch(
      `${VERCEL_API_URL}/v9/projects/${projectId}/domains/${domain}/verify${this.buildQueryString()}`,
      {
        method: 'POST',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to verify domain');
    }

    const result = await response.json();

    return {
      verified: result.verified,
      verification: result.verification?.map((v: { type: string; domain: string; value: string }) => ({
        type: v.type as DnsRecord['type'],
        name: v.domain,
        value: v.value,
      })),
    };
  }

  /**
   * Remove a domain from a project
   */
  async removeDomain(projectId: string, domain: string): Promise<void> {
    const response = await fetch(
      `${VERCEL_API_URL}/v9/projects/${projectId}/domains/${domain}${this.buildQueryString()}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to remove domain');
    }
  }

  /**
   * Get all deployments for a project
   */
  async listDeployments(
    projectId: string,
    options: { limit?: number; target?: 'production' | 'preview' } = {}
  ): Promise<
    Array<{
      id: string;
      url: string;
      status: DeploymentStatus;
      target: string;
      createdAt: number;
    }>
  > {
    const params: Record<string, string> = {
      projectId,
      limit: String(options.limit || 10),
    };
    if (options.target) {
      params.target = options.target;
    }

    const response = await fetch(
      `${VERCEL_API_URL}/v6/deployments${this.buildQueryString(params)}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to list deployments');
    }

    const result = await response.json();

    return result.deployments.map((d: VercelDeploymentResponse & { target?: string }) => ({
      id: d.id,
      url: `https://${d.url}`,
      status: mapVercelState(d.readyState),
      target: d.target || 'preview',
      createdAt: d.createdAt,
    }));
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<void> {
    const response = await fetch(
      `${VERCEL_API_URL}/v9/projects/${projectId}${this.buildQueryString()}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to delete project');
    }
  }
}

/**
 * Create a Vercel deployment service instance
 */
export function createVercelService(
  token: string,
  teamId?: string
): VercelDeploymentService {
  return new VercelDeploymentService(token, teamId);
}
