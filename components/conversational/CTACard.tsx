'use client';

import { motion } from 'framer-motion';
import { CTA, useJourneyStore } from '@/lib/stores/journey-store';
import { generateSection } from '@/lib/mock-ai';
import { ArrowRight, Calculator, FileText, MessageCircle, PlayCircle, Users } from 'lucide-react';

const icons = {
    exploration: FileText,
    comparison: Users,
    proof: PlayCircle,
    calculate: Calculator,
    handoff: MessageCircle,
    conversion: ArrowRight,
};

interface CTACardProps {
    cta: CTA;
}

export function CTACard({ cta }: CTACardProps) {
    const { addSection, setGenerating } = useJourneyStore();
    const Icon = icons[cta.type] || ArrowRight;

    const handleClick = async () => {
        setGenerating(true);
        try {
            const section = await generateSection(cta.intent);
            addSection(section);
        } catch (error) {
            console.error('Failed to generate section:', error);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClick}
            className="flex flex-col items-start p-6 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl text-left hover:border-[var(--color-primary)] transition-colors group w-full h-full"
        >
            <div className="p-2 bg-[var(--color-primary)]/10 rounded-lg mb-4 group-hover:bg-[var(--color-primary)]/20 transition-colors">
                <Icon className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-[var(--color-foreground)]">{cta.label}</h3>
            {cta.description && (
                <p className="text-sm text-[var(--color-muted-foreground)] mb-4">{cta.description}</p>
            )}
            <div className="mt-auto flex items-center text-sm font-medium text-[var(--color-primary)]">
                Explore <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
        </motion.button>
    );
}
