export const KNOWLEDGE_BASE = {
    'root': {
        headline: "What would you like to explore?",
        ctas: [
            { id: 'what-do-we-do', label: 'What do we do?', type: 'exploration', intent: 'value-prop' },
            { id: 'how-help', label: 'How can we help you?', type: 'exploration', intent: 'role-selection' },
            { id: 'insights', label: 'Beverage Insights', type: 'exploration', intent: 'insights' },
        ]
    },
    'role-selection': {
        headline: "We help beverage suppliers turn fragmented data into actionable commercial intelligence",
        body: "What's your biggest challenge today?",
        ctas: [
            { id: 'distributor', label: 'Distributor Performance', type: 'exploration', intent: 'distributor-perf' },
            { id: 'trade-spend', label: 'Trade Spend ROI', type: 'exploration', intent: 'trade-spend' },
            { id: 'forecast', label: 'Forecast Accuracy', type: 'exploration', intent: 'forecast' },
            { id: 'comp-intel', label: 'Competitive Intelligence', type: 'exploration', intent: 'comp-intel' },
        ]
    },
    'trade-spend': {
        headline: "Trade Spend Intelligence",
        body: `CPG suppliers spend 20-27% of revenue on trade promotions. Optimization platforms deliver 15-20% lift.
    
    BevGenie connects trade spend to actual execution and sales lift, giving you proof of what's working.`,
        stats: [
            { label: 'ROI', value: '280%' },
            { label: 'Payback', value: '3-5 months' }
        ],
        ctas: [
            { id: 'see-works', label: 'See how it works', type: 'exploration', intent: 'how-it-works' },
            { id: 'roi-calc', label: 'ROI Calculator', type: 'calculate', intent: 'roi-calc' },
            { id: 'talk-expert', label: 'Talk to an Expert', type: 'handoff', intent: 'contact-form' },
        ]
    },
    'roi-calc': {
        headline: "Industry ROI Benchmarks",
        body: `For a $100M supplier with $20M trade spend, 15% optimization = $3M unlocked value.`,
        stats: [
            { label: 'Demand Forecasting', value: '340% ROI' },
            { label: 'Trade Analytics', value: '280% ROI' }
        ],
        ctas: [
            { id: 'schedule-demo', label: 'Schedule Demo', type: 'conversion', intent: 'contact-form' }
        ]
    },
    'contact-form': {
        headline: "Schedule a Conversation",
        formContext: {
            topic: "Trade Spend ROI",
            specialistRole: "Trade Spend Specialist"
        }
    },
    // Fallback for unknown intents
    'default': {
        headline: "Let's explore that together",
        body: "BevGenie is currently focused on U.S. beverage alcohol suppliers. Let's discuss your specific needs.",
        ctas: [
            { id: 'talk-expert-default', label: 'Talk to an Expert', type: 'handoff', intent: 'contact-form' }
        ]
    }
};
