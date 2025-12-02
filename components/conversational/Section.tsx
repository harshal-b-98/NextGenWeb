'use client';

import { motion } from 'framer-motion';
import { Section as SectionType } from '@/lib/stores/journey-store';
import { CTACard } from './CTACard';
import { Button } from '@/components/ui'; // Assuming this exists from previous analysis

interface SectionProps {
    section: SectionType;
}

export function Section({ section }: SectionProps) {
    const { content } = section;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="py-12 md:py-20 border-b border-[var(--color-border)] last:border-0"
        >
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Headline */}
                {content.headline && (
                    <h2 className="text-3xl md:text-4xl font-bold mb-8 text-[var(--color-foreground)] leading-tight">
                        {content.headline}
                    </h2>
                )}

                {/* Body Content */}
                {content.body && (
                    <div className="prose prose-lg dark:prose-invert max-w-none mb-12 text-[var(--color-muted-foreground)] whitespace-pre-line">
                        {content.body}
                    </div>
                )}

                {/* Stats Grid */}
                {content.stats && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
                        {content.stats.map((stat, idx) => (
                            <div key={idx} className="p-6 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)]">
                                <div className="text-3xl font-bold text-[var(--color-primary)] mb-1">{stat.value}</div>
                                <div className="text-sm font-medium text-[var(--color-muted-foreground)]">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Form Handling */}
                {section.type === 'form' && content.formContext && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-8 max-w-xl mx-auto shadow-2xl"
                    >
                        <h3 className="text-xl font-semibold mb-2">Schedule a Conversation</h3>
                        <p className="text-sm text-[var(--color-muted-foreground)] mb-6">
                            Based on your interest in <span className="text-[var(--color-primary)]">{content.formContext.topic}</span>,
                            we'll connect you with a {content.formContext.specialistRole}.
                        </p>
                        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input type="text" className="w-full px-4 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none" placeholder="Jane Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input type="email" className="w-full px-4 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none" placeholder="jane@company.com" />
                            </div>
                            <Button className="w-full mt-4" size="lg">Schedule Demo</Button>
                        </form>
                    </motion.div>
                )}

                {/* CTAs */}
                {content.ctas && content.ctas.length > 0 && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {content.ctas.map((cta) => (
                            <CTACard key={cta.id} cta={cta} />
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
