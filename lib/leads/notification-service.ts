/**
 * Lead Notification Service
 * Phase 4.4: Conversion & Lead Tools
 *
 * Service for sending notifications when leads are captured.
 */

import type {
  LeadCapture,
  NotificationConfig,
  NotificationResult,
  NotificationChannel,
  EmailNotificationConfig,
  SlackNotificationConfig,
  WebhookNotificationConfig,
  HighValueCriteria,
} from './types';

/**
 * Lead Notification Service
 *
 * Handles sending notifications via email, Slack, and webhooks
 * when new leads are captured.
 */
export class NotificationService {
  /**
   * Send notifications for a new lead
   */
  async notifyLeadCapture(
    lead: LeadCapture,
    config: NotificationConfig
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    // Check if we should notify
    if (!config.notifyOnSubmit) {
      // Check if high value notification is enabled
      if (config.notifyOnHighValue && config.highValueThreshold) {
        if (!this.isHighValueLead(lead, config.highValueThreshold)) {
          return results;
        }
      } else {
        return results;
      }
    }

    // Send notifications to all configured channels
    for (const channel of config.channels) {
      const result = await this.sendNotification(channel, lead, config);
      results.push(result);
    }

    return results;
  }

  /**
   * Send notification via specific channel
   */
  private async sendNotification(
    channel: NotificationChannel,
    lead: LeadCapture,
    config: NotificationConfig
  ): Promise<NotificationResult> {
    try {
      switch (channel) {
        case 'email':
          return await this.sendEmailNotification(lead, config.email!);
        case 'slack':
          return await this.sendSlackNotification(lead, config.slack!);
        case 'webhook':
          return await this.sendWebhookNotification(lead, config.webhook!);
        default:
          return {
            channel,
            success: false,
            error: `Unknown channel: ${channel}`,
          };
      }
    } catch (error) {
      return {
        channel,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    lead: LeadCapture,
    config: EmailNotificationConfig
  ): Promise<NotificationResult> {
    try {
      const subject = config.subject || `New Lead: ${lead.email}`;
      const html = this.buildEmailTemplate(lead, config);

      // In production, integrate with email service (SendGrid, Resend, etc.)
      // For now, log the notification
      console.log('Email notification:', {
        to: config.recipients,
        subject,
        html: html.substring(0, 200) + '...',
      });

      // Example integration with fetch to email API
      if (process.env.EMAIL_API_URL) {
        const response = await fetch(process.env.EMAIL_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
          },
          body: JSON.stringify({
            to: config.recipients,
            subject,
            html,
          }),
        });

        if (!response.ok) {
          throw new Error(`Email API error: ${response.status}`);
        }

        const data = await response.json();
        return {
          channel: 'email',
          success: true,
          messageId: data.id,
        };
      }

      // Return success for development (no actual email sent)
      return {
        channel: 'email',
        success: true,
        messageId: `dev-${Date.now()}`,
      };
    } catch (error) {
      return {
        channel: 'email',
        success: false,
        error: error instanceof Error ? error.message : 'Email send failed',
      };
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(
    lead: LeadCapture,
    config: SlackNotificationConfig
  ): Promise<NotificationResult> {
    try {
      const blocks = this.buildSlackBlocks(lead, config);
      const text = `New lead from ${lead.email}`;

      const payload: Record<string, unknown> = {
        text,
        blocks,
      };

      if (config.channel) {
        payload.channel = config.channel;
      }

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Slack webhook error: ${response.status}`);
      }

      return {
        channel: 'slack',
        success: true,
      };
    } catch (error) {
      return {
        channel: 'slack',
        success: false,
        error: error instanceof Error ? error.message : 'Slack send failed',
      };
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(
    lead: LeadCapture,
    config: WebhookNotificationConfig
  ): Promise<NotificationResult> {
    let attempts = 0;
    const maxAttempts = config.retryOnFailure ? (config.maxRetries || 3) : 1;

    while (attempts < maxAttempts) {
      try {
        const payload = config.includeAllData
          ? lead
          : {
              email: lead.email,
              name: lead.name,
              company: lead.company,
              source: lead.source,
              createdAt: lead.createdAt,
            };

        const response = await fetch(config.url, {
          method: config.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...config.headers,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Webhook error: ${response.status}`);
        }

        return {
          channel: 'webhook',
          success: true,
        };
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          return {
            channel: 'webhook',
            success: false,
            error: error instanceof Error ? error.message : 'Webhook failed',
          };
        }
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
      }
    }

    return {
      channel: 'webhook',
      success: false,
      error: 'Max retries exceeded',
    };
  }

  /**
   * Check if lead matches high value criteria
   */
  private isHighValueLead(
    lead: LeadCapture,
    criteria: HighValueCriteria
  ): boolean {
    if (criteria.hasCompany && !lead.company) {
      return false;
    }

    if (criteria.hasPhone && !lead.phone) {
      return false;
    }

    if (criteria.matchesPersonas?.length) {
      if (!lead.personaId || !criteria.matchesPersonas.includes(lead.personaId)) {
        return false;
      }
    }

    // Check custom conditions
    if (criteria.customConditions) {
      for (const [key, value] of Object.entries(criteria.customConditions)) {
        const leadData = lead.data as Record<string, unknown>;
        if (leadData[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Build email HTML template
   */
  private buildEmailTemplate(
    lead: LeadCapture,
    config: EmailNotificationConfig
  ): string {
    const template = config.template || 'default';

    if (template === 'minimal') {
      return `
        <p>New lead captured:</p>
        <ul>
          <li><strong>Email:</strong> ${lead.email}</li>
          ${lead.name ? `<li><strong>Name:</strong> ${lead.name}</li>` : ''}
        </ul>
      `;
    }

    // Default/detailed template
    let html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Lead Captured</h2>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${lead.email}</td>
          </tr>
    `;

    if (lead.name) {
      html += `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Name</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${lead.name}</td>
          </tr>
      `;
    }

    if (lead.phone) {
      html += `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Phone</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${lead.phone}</td>
          </tr>
      `;
    }

    if (lead.company) {
      html += `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Company</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${lead.company}</td>
          </tr>
      `;
    }

    if (lead.source) {
      html += `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Source</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${lead.source}</td>
          </tr>
      `;
    }

    // Add form data if configured
    if (config.includeFormData && lead.formData) {
      for (const [key, value] of Object.entries(lead.formData)) {
        if (typeof value === 'string' || typeof value === 'number') {
          html += `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${this.formatFieldName(key)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${value}</td>
          </tr>
          `;
        }
      }
    }

    html += `
        </table>

        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          Captured at: ${new Date(lead.createdAt).toLocaleString()}
        </p>
      </div>
    `;

    return html;
  }

  /**
   * Build Slack message blocks
   */
  private buildSlackBlocks(
    lead: LeadCapture,
    config: SlackNotificationConfig
  ): unknown[] {
    const blocks: unknown[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'New Lead Captured',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Email:*\n${lead.email}`,
          },
          {
            type: 'mrkdwn',
            text: `*Name:*\n${lead.name || 'Not provided'}`,
          },
        ],
      },
    ];

    if (lead.company || lead.phone) {
      blocks.push({
        type: 'section',
        fields: [
          ...(lead.company
            ? [{ type: 'mrkdwn', text: `*Company:*\n${lead.company}` }]
            : []),
          ...(lead.phone
            ? [{ type: 'mrkdwn', text: `*Phone:*\n${lead.phone}` }]
            : []),
        ],
      });
    }

    if (config.includeFormData && lead.formData) {
      const formFields = Object.entries(lead.formData)
        .filter(([_, value]) => typeof value === 'string' || typeof value === 'number')
        .slice(0, 10)
        .map(([key, value]) => ({
          type: 'mrkdwn',
          text: `*${this.formatFieldName(key)}:*\n${value}`,
        }));

      if (formFields.length > 0) {
        blocks.push({
          type: 'section',
          fields: formFields.slice(0, 10),
        });
      }
    }

    // Add mention users if configured
    if (config.mentionUsers?.length) {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `cc: ${config.mentionUsers.map((u) => `<@${u}>`).join(' ')}`,
          },
        ],
      });
    }

    return blocks;
  }

  /**
   * Format field name for display
   */
  private formatFieldName(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase())
      .trim();
  }
}

/**
 * Create notification service instance
 */
export function createNotificationService(): NotificationService {
  return new NotificationService();
}
