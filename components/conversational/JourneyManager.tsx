'use client';

import { useEffect, useRef } from 'react';
import { useJourneyStore } from '@/lib/stores/journey-store';
import { Section } from './Section';
import { KNOWLEDGE_BASE } from '@/lib/knowledge-base';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';

export function JourneyManager() {
    const { sections, addSection, isGenerating, resetJourney } = useJourneyStore();
    const bottomRef = useRef<HTMLDivElement>(null);

    // Initialize journey on mount
    useEffect(() => {
        resetJourney();
        const rootData = KNOWLEDGE_BASE['root'];
        addSection({
            id: uuidv4(),
            type: 'landing',
            content: {
                headline: rootData.headline,
                ctas: rootData.ctas as any,
            }
        });
    }, [addSection, resetJourney]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [sections, isGenerating]);

    return (
        <div className="min-h-screen bg-[var(--color-background)] pb-32">
            <div className="flex flex-col">
                {sections.map((section) => (
                    <Section key={section.id} section={section} />
                ))}
            </div>

            {/* Loading Indicator */}
            <AnimatePresence>
                {isGenerating && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="container mx-auto px-4 py-8 flex justify-center"
                    >
                        <div className="flex items-center space-x-2 text-[var(--color-primary)]">
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div ref={bottomRef} />
        </div>
    );
}
