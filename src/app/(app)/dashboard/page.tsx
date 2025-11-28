'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/store';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { TextScramble } from '@/components/ui/TextScramble';
import { Button } from '@/components/ui/Button';
import { CreateProjectModal } from '@/components/dashboard/CreateProjectModal';
import { useState } from 'react';

// Mock Data (Replace with API calls later)
const MOCK_STATS = [
    { label: 'Active Projects', value: '07', icon: Plus, trend: { value: 12, isPositive: true } },
    { label: 'Total Research', value: '142', icon: Plus, trend: { value: 8, isPositive: true } },
    { label: 'System Load', value: '24%', icon: Plus, trend: { value: 2, isPositive: false } },
];

const MOCK_ACTIVITY = [
    { id: '1', type: 'project_created' as const, description: 'New project "Alpha Protocol" initialized', timestamp: '2m ago', meta: 'User: Admin' },
    { id: '2', type: 'research_completed' as const, description: 'Analysis complete for "Market Trends"', timestamp: '15m ago' },
    { id: '3', type: 'system_alert' as const, description: 'System update scheduled', timestamp: '1h ago', meta: 'v2.4.0' },
];

export default function DashboardPage() {
    const { user, projects, loadProjects } = useStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    const recentProjects = projects.slice(0, 2);

    return (
        <div className="min-h-screen bg-black animate-in fade-in duration-700 relative overflow-hidden">
            {/* Static Cyber Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:50px_50px] [mask-image:radial-gradient(circle_at_center,black_40%,transparent_100%)] pointer-events-none" />

            <div className="relative z-10 p-2 md:p-8">
                {/* Header */}
                <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                    <div>
                        <h1 className="text-2xl md:text-4xl font-mono font-bold mb-2 tracking-tighter text-white uppercase">
                            <TextScramble text="MISSION_CONTROL" />
                        </h1>
                        <p className="text-muted font-mono text-xs md:text-sm tracking-wide">
                            {`// WELCOME_BACK, ${user?.name?.split(' ')[0].toUpperCase() || 'OPERATIVE'}`}
                        </p>
                    </div>

                    <div className="flex gap-3 md:gap-4 flex-wrap">
                        <Link href="/projects">
                            <Button variant="secondary" size="md" className="text-xs md:text-sm">
                                VIEW_ALL
                            </Button>
                        </Link>
                        <Button
                            leftIcon={<Plus size={16} />}
                            className="text-xs md:text-sm"
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            NEW_RESEARCH
                        </Button>
                    </div>
                </header>

                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                    {MOCK_STATS.map((stat, i) => (
                        <StatsCard key={i} {...stat} delay={i * 100} />
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                    {/* Left Column: Recent Projects */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <h2 className="text-lg font-bold text-white uppercase tracking-wide flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-none" />
                                Recent_Projects
                            </h2>
                            <Link href="/projects" className="text-xs font-mono text-primary hover:underline uppercase tracking-wider">
                                View_Index
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {recentProjects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}

                            {/* View All Card */}
                            <Link href="/projects" className="group h-full min-h-[250px] border border-dashed border-white/20 hover:border-primary bg-black/40 hover:bg-primary/5 flex flex-col items-center justify-center gap-4 text-muted hover:text-primary transition-all duration-300 relative overflow-hidden">
                                <div className="p-4 rounded-full bg-white/5 group-hover:bg-primary/10 transition-colors duration-300">
                                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                                <span className="font-mono text-sm uppercase tracking-wider">Access_Full_Database</span>
                            </Link>
                        </div>
                    </div>

                    {/* Right Column: Activity Feed */}
                    <div className="lg:col-span-1">
                        <ActivityFeed activities={MOCK_ACTIVITY} />
                    </div>
                </div>
            </div>


            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div >
    );
}
