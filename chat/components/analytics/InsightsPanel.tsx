'use client';
import { Lightbulb, TrendingUp, Clock, Target } from 'lucide-react';

interface Insight {
    type: 'growth' | 'time' | 'content' | 'general';
    title: string;
    description: string;
    value?: string;
}

interface InsightsPanelProps {
    insights: Insight[];
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
    const getIcon = (type: Insight['type']) => {
        switch (type) {
            case 'growth': return <TrendingUp className="text-rp-foam" size={20} />;
            case 'time': return <Clock className="text-rp-gold" size={20} />;
            case 'content': return <Target className="text-rp-iris" size={20} />;
            default: return <Lightbulb className="text-rp-rose" size={20} />;
        }
    };

    return (
        <div className="bg-rp-surface rounded-lg p-6 border border-rp-highlight-med">
            <h3 className="text-lg font-semibold text-rp-text mb-6 flex items-center gap-2">
                <Lightbulb className="text-rp-gold" size={20} />
                Smart Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight, idx) => (
                    <div
                        key={idx}
                        className="p-4 rounded-lg bg-rp-overlay border border-rp-highlight-low flex gap-4 items-start"
                    >
                        <div className="p-2 rounded-full bg-rp-base">
                            {getIcon(insight.type)}
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-rp-text mb-1">{insight.title}</h4>
                            <p className="text-xs text-rp-subtle leading-relaxed">{insight.description}</p>
                            {insight.value && (
                                <span className="inline-block mt-2 px-2 py-0.5 bg-rp-highlight-low rounded text-[10px] font-mono text-rp-foam italic">
                                    {insight.value}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
