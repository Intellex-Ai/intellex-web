'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/store';
import { ChatInterface } from '@/components/research/ChatInterface';
import { PlanViewer } from '@/components/research/PlanViewer';
import { ArrowLeft, Share2, Settings } from 'lucide-react';
import Link from 'next/link';

export default function ResearchPage() {
    const params = useParams();
    const {
        activeProject,
        activePlan,
        messages,
        selectProject,
        sendMessage,
        isLoading
    } = useStore();

    useEffect(() => {
        if (params.id) {
            selectProject(params.id as string);
        }
    }, [params.id, selectProject]);

    if (!activeProject && isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-background text-primary">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="font-mono text-sm tracking-widest uppercase">Initializing Workspace...</span>
                </div>
            </div>
        );
    }

    if (!activeProject) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
                    <Link href="/dashboard" className="text-primary hover:underline">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden">
            {/* Header */}
            <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-surface-100 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-surface-200 rounded-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="h-6 w-px bg-border" />
                    <div>
                        <h1 className="font-bold text-sm tracking-tight">{activeProject.title}</h1>
                        <div className="flex items-center gap-2 text-[10px] text-muted uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-success" />
                            {activeProject.status}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-surface-200 text-muted-foreground hover:text-primary transition-colors">
                        <Share2 size={18} />
                    </button>
                    <button className="p-2 hover:bg-surface-200 text-muted-foreground hover:text-foreground transition-colors">
                        <Settings size={18} />
                    </button>
                </div>
            </header>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Chat (60%) */}
                <div className="flex-1 min-w-0">
                    <ChatInterface
                        messages={messages}
                        onSendMessage={sendMessage}
                        isLoading={isLoading}
                    />
                </div>

                {/* Right: Plan (40%) */}
                <div className="w-[400px] flex-shrink-0 border-l border-border bg-surface-50 hidden lg:block">
                    <PlanViewer plan={activePlan} isLoading={isLoading} />
                </div>
            </div>
        </div>
    );
}
