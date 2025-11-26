import React from 'react';
import { ResearchPlan, ResearchPlanItem } from '@/types';
import { CheckCircle2, Circle, Loader2, FileText } from 'lucide-react';

interface PlanViewerProps {
    plan: ResearchPlan | null;
    isLoading?: boolean;
}

export const PlanViewer: React.FC<PlanViewerProps> = ({ plan, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full text-muted">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Loading plan...</span>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted p-8 text-center opacity-50">
                <FileText className="w-12 h-12 mb-4" />
                <p>No research plan generated yet.</p>
                <p className="text-xs mt-2">Start chatting to generate a plan.</p>
            </div>
        );
    }

    const renderItem = (item: ResearchPlanItem, depth = 0) => {
        const getIcon = () => {
            switch (item.status) {
                case 'completed':
                    return <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-1" />;
                case 'in-progress':
                    return <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0 mt-1" />;
                default:
                    return <Circle className="w-4 h-4 text-muted flex-shrink-0 mt-1" />;
            }
        };

        return (
            <div key={item.id} className={`mb-4 ${depth > 0 ? 'ml-6 border-l border-border pl-4' : ''}`}>
                <div className="flex items-start gap-3">
                    {getIcon()}
                    <div>
                        <h4 className={`text-sm font-medium ${item.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {item.title}
                        </h4>
                        {item.description && (
                            <p className="text-xs text-muted mt-1 leading-relaxed">
                                {item.description}
                            </p>
                        )}
                    </div>
                </div>

                {item.subItems && item.subItems.length > 0 && (
                    <div className="mt-3">
                        {item.subItems.map(sub => renderItem(sub, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full overflow-y-auto p-6 bg-surface-100 border-l border-border">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Research Plan
                </h2>
                <span className="text-xs font-mono text-muted">
                    Updated {new Date(plan.updatedAt).toLocaleTimeString()}
                </span>
            </div>

            <div className="space-y-2">
                {plan.items.map(item => renderItem(item))}
            </div>
        </div>
    );
};
