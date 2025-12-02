/**
 * Public Page Client Component
 * Phase 4.3: Dynamic Page Runtime
 *
 * Client-side component for rendering dynamic pages.
 */

'use client';

import { DynamicPageRenderer } from '@/components/runtime';
import type { RuntimePageData } from '@/lib/runtime/types';

interface PublicPageClientProps {
  pageData: RuntimePageData;
}

/**
 * Client component wrapper for dynamic page rendering
 */
export function PublicPageClient({ pageData }: PublicPageClientProps) {
  return (
    <DynamicPageRenderer
      pageData={pageData}
      autoInitTracking={true}
      onPersonaDetected={(persona) => {
        console.log('Persona detected:', persona.personaId, persona.confidence);
      }}
      onContentAdapted={(event) => {
        console.log('Content adapted:', event.toVariant, event.adaptedSections);
      }}
      onError={(error) => {
        console.error('Runtime error:', error);
      }}
    />
  );
}

export default PublicPageClient;
