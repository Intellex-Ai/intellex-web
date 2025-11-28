import React from 'react';
import { ResearchPlan, ResearchPlanItem } from '@/types';
import { CheckCircle2, Circle, Loader2, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PlanViewerProps {
    plan: ResearchPlan | null;
    isLoading?: boolean;
}

export const PlanViewer: React.FC<PlanViewerProps> = ({ plan, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full text-muted">
                <Loader2 className="w-6 h-6 animate-spin mr-2 text-primary" />
                <span className="font-mono text-sm animate-pulse">Loading plan...</span>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted p-8 text-center opacity-50">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 opacity-50" />
                </div>
                <p className="font-mono text-sm uppercase tracking-widest">No Plan Generated</p>
                <p className="text-xs mt-2 text-muted-foreground">Start chatting to initialize research...</p>
            </div>
        );
    }

    const renderItem = (item: ResearchPlanItem, depth = 0) => {
        const getIcon = () => {
            switch (item.status) {
                case 'completed':
                    return <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />;
                case 'in-progress':
                    return <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0 mt-0.5" />;
                default:
                    return <Circle className="w-4 h-4 text-muted flex-shrink-0 mt-0.5" />;
            }
        };

        return (
            <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: depth * 0.1 }}
                className={`mb-4 ${depth > 0 ? 'ml-6 pl-4 border-l border-white/10 relative' : ''}`}
            >
                {depth > 0 && (
                    <div className="absolute left-0 top-3 w-4 h-px bg-white/10 -ml-4" />
                )}

                <div className={`
                    group p-3 rounded-sm border border-transparent hover:border-white/10 hover:bg-white/5 transition-all duration-300
                    ${item.status === 'in-progress' ? 'bg-primary/5 border-primary/20' : ''}
                `}>
                    <div className="flex items-start gap-3">
                        {getIcon()}
                        <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-medium truncate ${item.status === 'completed' ? 'text-muted-foreground line-through decoration-white/20' : 'text-foreground'}`}>
                                {item.title}
                            </h4>
                            {item.description && (
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                                    {item.description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {item.subItems && item.subItems.length > 0 && (
                    <div className="mt-2">
                        {item.subItems.map(sub => renderItem(sub, depth + 1))}
                    </div>
                )}
            </motion.div>
        );
    };

    return (
        <div className="h-full overflow-y-auto p-6 bg-black/50 border-l border-white/10 custom-scrollbar">
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-black/80 backdrop-blur-sm py-2 z-10 border-b border-white/10">
                <h2 className="text-lg font-bold tracking-tight flex items-center gap-2 text-white uppercase font-mono">
                    <FileText className="w-5 h-5 text-primary" />
                    Research_Plan
                </h2>
                <span className="text-[10px] font-mono text-muted-foreground bg-white/5 px-2 py-1 rounded-sm border border-white/5">
                    UPDATED: {new Date(plan.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            <div className="space-y-1 pb-20">
                <AnimatePresence>
                    {plan.items.map(item => renderItem(item))}
                </AnimatePresence>
            </div>
        </div>
    );
};
