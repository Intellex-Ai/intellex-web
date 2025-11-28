import React, { useState } from 'react';
import { AgentThought } from '@/types';
import { ChevronRight, BrainCircuit, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
        <div className="border border-white/10 rounded-sm bg-white/5 overflow-hidden mb-2 group">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-2 p-2 text-xs font-mono text-muted-foreground hover:text-primary hover:bg-white/5 transition-all duration-300"
            >
                <motion.div
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronRight className="w-3 h-3" />
                </motion.div>
                <BrainCircuit className="w-3 h-3" />
                <span className="flex-1 text-left truncate">{thought.title}</span>
                {getIcon()}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="p-3 border-t border-white/10 bg-black/20 text-sm text-muted-foreground font-mono leading-relaxed">
                            {thought.content}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
