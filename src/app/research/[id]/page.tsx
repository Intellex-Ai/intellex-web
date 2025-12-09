'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/store';
import { ChatInterface } from '@/components/research/ChatInterface';
import { PlanViewer } from '@/components/research/PlanViewer';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Share2, Settings, MessageSquare, FileText } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import { ShareModal } from '@/components/projects/ShareModal';

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

    const [mobileTab, setMobileTab] = useState<'chat' | 'plan'>('chat');
    const [isShareOpen, setIsShareOpen] = useState(false);

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
        <div className="h-screen flex flex-col bg-black overflow-hidden relative">
            {/* Static Cyber Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:50px_50px] [mask-image:radial-gradient(circle_at_center,black_40%,transparent_100%)] pointer-events-none" />

            {/* Header */}
            <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-black/50 backdrop-blur-sm flex-shrink-0 relative z-10">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="p-2 h-auto">
                            <ArrowLeft size={20} />
                        </Button>
                    </Link>
                    <div className="h-6 w-px bg-white/10" />
                    <div>
                        <h1 className="font-bold text-sm tracking-tight text-white font-mono uppercase truncate max-w-[150px] md:max-w-md">{activeProject.title}</h1>
                        <div className="flex items-center gap-2 text-[10px] text-muted font-mono uppercase tracking-wider">
                            <span className={clsx("w-2 h-2 rounded-none", activeProject.status === 'completed' ? 'bg-success' : 'bg-primary')} />
                            {activeProject.status}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Mobile Tab Switcher */}
                    <div className="flex lg:hidden bg-white/5 rounded-sm p-0.5 mr-2 border border-white/10">
                        <button
                            onClick={() => setMobileTab('chat')}
                            className={clsx(
                                "p-1.5 rounded-sm transition-all",
                                mobileTab === 'chat' ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-white"
                            )}
                        >
                            <MessageSquare size={16} />
                        </button>
                        <button
                            onClick={() => setMobileTab('plan')}
                            className={clsx(
                                "p-1.5 rounded-sm transition-all",
                                mobileTab === 'plan' ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-white"
                            )}
                        >
                            <FileText size={16} />
                        </button>
                    </div>

                    <Button variant="ghost" size="sm" className="p-2 h-auto hidden sm:flex" onClick={() => setIsShareOpen(true)}>
                        <Share2 size={18} />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-2 h-auto">
                        <Settings size={18} />
                    </Button>
                </div>
            </header>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden relative z-10">
                {/* Left: Chat (Visible on mobile if tab is chat, always visible on desktop) */}
                <div className={clsx(
                    "flex-1 min-w-0 transition-all duration-300",
                    mobileTab === 'chat' ? "block" : "hidden lg:block"
                )}>
                    <ChatInterface
                        messages={messages}
                        onSendMessage={sendMessage}
                        isLoading={isLoading}
                    />
                </div>

                {/* Right: Plan (Visible on mobile if tab is plan, always visible on desktop) */}
                <div className={clsx(
                    "w-full lg:w-[400px] flex-shrink-0 border-l border-white/10 bg-black/50 backdrop-blur-sm transition-all duration-300",
                    mobileTab === 'plan' ? "block" : "hidden lg:block"
                )}>
                    <PlanViewer
                        plan={activePlan}
                        isLoading={isLoading}
                        onShare={() => setIsShareOpen(true)}
                    />
                </div>
            </div>

            <ShareModal project={activeProject} isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
        </div>
    );
}
