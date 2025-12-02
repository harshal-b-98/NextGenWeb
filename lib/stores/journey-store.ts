import { create } from 'zustand';

export type CTAType = 'exploration' | 'comparison' | 'proof' | 'calculate' | 'handoff' | 'conversion';

export interface CTA {
  id: string;
  label: string;
  type: CTAType;
  intent: string; // The intent string to trigger the next generation
  description?: string; // For the card UI
  icon?: string; // Icon name
}

export interface SectionContent {
  headline?: string;
  body?: string; // HTML or Markdown string
  stats?: { label: string; value: string }[];
  ctas?: CTA[];
  formContext?: {
    topic: string;
    specialistRole: string;
  };
}

export interface Section {
  id: string;
  type: 'landing' | 'content' | 'form';
  content: SectionContent;
}

interface JourneyState {
  sections: Section[];
  isGenerating: boolean;
  addSection: (section: Section) => void;
  setGenerating: (isGenerating: boolean) => void;
  resetJourney: () => void;
}

export const useJourneyStore = create<JourneyState>((set) => ({
  sections: [],
  isGenerating: false,
  addSection: (section) =>
    set((state) => ({ sections: [...state.sections, section] })),
  setGenerating: (isGenerating) => set({ isGenerating }),
  resetJourney: () => set({ sections: [] }),
}));
