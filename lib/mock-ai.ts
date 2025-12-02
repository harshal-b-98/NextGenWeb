import { KNOWLEDGE_BASE } from './knowledge-base';
import { Section, SectionContent } from './stores/journey-store';
import { v4 as uuidv4 } from 'uuid';

export const generateSection = async (intentOrQuery: string): Promise<Section> => {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 1200));

    let intent = intentOrQuery;

    // Simple keyword matching for chat input
    const query = intentOrQuery.toLowerCase();
    if (query.includes('trade') || query.includes('spend') || query.includes('roi')) {
        intent = 'trade-spend';
    } else if (query.includes('distributor') || query.includes('sales')) {
        intent = 'role-selection'; // Fallback to role selection for broad sales queries
    } else if (query.includes('demo') || query.includes('talk') || query.includes('contact')) {
        intent = 'contact-form';
    } else if (!KNOWLEDGE_BASE[intent as keyof typeof KNOWLEDGE_BASE]) {
        // If it's not a known ID and didn't match keywords, use default
        intent = 'default';
    }

    const data = KNOWLEDGE_BASE[intent as keyof typeof KNOWLEDGE_BASE] || KNOWLEDGE_BASE['default'];

    let type: Section['type'] = 'content';
    if (intent === 'contact-form') {
        type = 'form';
    }

    return {
        id: uuidv4(),
        type,
        content: {
            headline: data.headline,
            body: 'body' in data ? (data as any).body : undefined,
            stats: 'stats' in data ? (data as any).stats : undefined,
            ctas: 'ctas' in data ? (data as any).ctas : undefined,
            formContext: 'formContext' in data ? (data as any).formContext : undefined,
        }
    };
};
