import React from 'react';
import { FileText, GitCommit, MessageSquare, Zap } from 'lucide-react';
import clsx from 'clsx';

export interface ActivityItem {
    id: string;
    type: 'project_created' | 'research_completed' | 'comment_added' | 'system_alert';
    description: string;
    timestamp: string;
    meta?: string;
}

interface ActivityFeedProps {
    activities: ActivityItem[];
}

const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
        case 'project_created': return <Zap size={14} />;
        case 'research_completed': return <FileText size={14} />;
        case 'comment_added': return <MessageSquare size={14} />;
        case 'system_alert': return <GitCommit size={14} />;
    }
};

const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
        case 'project_created': return 'text-primary bg-primary/10 border-primary/20';
        case 'research_completed': return 'text-success bg-success/10 border-success/20';
        case 'comment_added': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
        case 'system_alert': return 'text-muted-foreground bg-white/5 border-white/10';
    }
};



export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
    return (
        <div className="h-full p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2 font-mono">
                <span className="w-2 h-2 bg-primary animate-pulse shadow-[0_0_10px_rgba(255,77,0,0.8)]" />
                Live_Feed
            </h3>

            <div className="space-y-6 relative">
                {/* Vertical Line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-[1px] bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

                {activities.map((item, index) => (
                    <div
                        key={item.id}
                        className="relative pl-10 group animate-in fade-in slide-in-from-left-4 fill-mode-backwards"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        {/* Icon Node */}
                        <div className={clsx(
                            "absolute left-0 top-0 w-8 h-8 border flex items-center justify-center transition-all duration-300 z-10 bg-black",
                            getActivityColor(item.type),
                            "group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(255,77,0,0.3)] group-hover:border-primary group-hover:text-primary"
                        )}>
                            {getActivityIcon(item.type)}
                        </div>

                        {/* Content */}
                        <div className="flex flex-col">
                            <span className="text-xs font-mono text-muted-foreground mb-1">
                                {item.timestamp}
                            </span>
                            <p className="text-sm text-white font-medium">
                                {item.description}
                            </p>
                            {item.meta && (
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40 mt-1 font-mono">
                                    {item.meta}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
