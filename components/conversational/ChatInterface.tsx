'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';
import { useJourneyStore } from '@/lib/stores/journey-store';
import { generateSection } from '@/lib/mock-ai';

export function ChatInterface() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const { addSection, setGenerating } = useJourneyStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const query = input;
        setInput('');
        setIsOpen(false); // Close chat to show the generated content
        setGenerating(true);

        try {
            const section = await generateSection(query);
            addSection(section);
        } catch (error) {
            console.error('Failed to generate section:', error);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="absolute bottom-16 right-0 w-80 sm:w-96 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-4 bg-[var(--color-primary)] text-white flex justify-between items-center">
                            <h3 className="font-semibold">Ask BevGenie</h3>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-1 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 bg-[var(--color-background)]">
                            <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
                                Ask anything about our platform, or describe your challenge.
                            </p>
                            <form onSubmit={handleSubmit} className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="e.g., How do you help with trade spend?"
                                    className="w-full pl-4 pr-12 py-3 rounded-xl bg-[var(--color-secondary)] border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-[var(--color-primary)] rounded-full shadow-lg flex items-center justify-center text-white hover:bg-[var(--color-primary)]/90 transition-colors"
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            </motion.button>
        </div>
    );
}
