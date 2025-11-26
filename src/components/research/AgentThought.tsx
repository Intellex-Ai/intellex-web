import React, { useState } from 'react';
import { AgentThought } from '@/types';
import { ChevronDown, ChevronRight, BrainCircuit, Check, Loader2 } from 'lucide-react';

interface AgentThoughtProps {
    thought: AgentThought;
}

export const AgentThoughtItem: React.FC<AgentThoughtProps> = ({ thought }) => {
    const [isOpen, setIsOpen] = useState(false);

    const getIcon = () => {
        switch (thought.status) {
            case 'completed':
                return <Check className="w-3 h-3 text-success" />;
            case 'thinking':
                return <Loader2 className="w-3 h-3 text-primary animate-spin" />;
            default:
                return <div className="w-3 h-3 rounded-full bg-muted" />;
        }
    };

    return (
        <div className="border border-border rounded-sm bg-surface-200 overflow-hidden mb-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-2 p-2 text-xs font-mono text-muted-foreground hover:bg-surface-300 transition-colors"
            >
                {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <BrainCircuit className="w-3 h-3" />
                <span className="flex-1 text-left truncate">{thought.title}</span>
                {getIcon()}
            </button>

            {isOpen && (
                <div className="p-3 border-t border-border bg-surface-100 text-sm text-muted-foreground font-mono">
                    {thought.content}
                </div>
            )}
        </div>
    );
};
