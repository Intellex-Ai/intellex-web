'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ActivityFeed, ActivityItem } from '@/components/dashboard/ActivityFeed';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { Plus, ArrowRight, Folder, CheckCircle2, Activity as ActivityIcon } from 'lucide-react';
import Link from 'next/link';
import { TextScramble } from '@/components/ui/TextScramble';
import { Button } from '@/components/ui/Button';
import { CreateProjectModal } from '@/components/dashboard/CreateProjectModal';

export default function DashboardPage() {
    const { user, projects, loadProjects, refreshUser } = useStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        refreshUser();
        loadProjects();
    }, [loadProjects, refreshUser]);

    const recentProjects = projects.slice(0, 2);

    // Capture a stable render timestamp without tripping purity rule.
    const [nowTs] = useState(() => Date.now());

    const { stats } = useMemo(() => {
        const activeProjects = projects.filter((p) => p.status === 'active').length;
        const completedProjects = projects.filter((p) => p.status === 'completed').length;
        const updatedLastDay = projects.filter((p) => nowTs - p.updatedAt < 24 * 60 * 60 * 1000).length;

        const statsData = [
            { label: 'Active Projects', value: activeProjects, icon: Folder, trend: { value: activeProjects, isPositive: true } },
            { label: 'Completed Research', value: completedProjects, icon: CheckCircle2, trend: { value: completedProjects, isPositive: true } },
            { label: 'Updates (24h)', value: updatedLastDay, icon: ActivityIcon, trend: { value: updatedLastDay, isPositive: updatedLastDay >= 0 } },
        ];

        return { stats: statsData };
    }, [projects, nowTs]);

    const activities: ActivityItem[] = useMemo(() => {
        return projects
            .map((project) => {
                const isCompleted = project.status === 'completed';
                const sortKey = project.updatedAt || project.createdAt || nowTs;
                const timestamp = new Date(sortKey);
                return {
                    id: project.id,
                    type: isCompleted ? 'research_completed' : 'project_created',
                    description: isCompleted
                        ? `Research completed: "${project.title}"`
                        : `Project updated: "${project.title}"`,
                    timestamp: timestamp.toLocaleString(),
                    meta: `Last updated ${timestamp.toLocaleDateString()}`,
                    sortKey,
                };
            })
            .sort((a, b) => b.sortKey - a.sortKey)
            .slice(0, 6)
            .map(({ sortKey, ...rest }) => ({ ...rest }));
    }, [projects, nowTs]);

    return (
        <div className="min-h-screen bg-black animate-in fade-in duration-700 relative overflow-hidden">
            {/* Static Cyber Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:50px_50px] [mask-image:radial-gradient(circle_at_center,black_40%,transparent_100%)] pointer-events-none" />

            <div className="relative z-10 p-2 md:p-8">
                {/* Header */}
                <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 relative">
                    <div>
                        <h1 className="text-2xl md:text-4xl font-mono font-bold mb-2 tracking-tighter text-white uppercase">
                            <TextScramble text="MISSION_CONTROL" />
                        </h1>
                        <p className="text-muted font-mono text-xs md:text-sm tracking-wide">
                            {user?.name ? `// WELCOME_BACK, ${user.name.split(' ')[0].toUpperCase()}` : '// WELCOME_BACK'}
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-3">
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
                    {stats.map((stat, i) => (
                        <StatsCard
                            key={stat.label}
                            label={stat.label}
                            value={String(stat.value).padStart(2, '0')}
                            icon={stat.icon}
                            trend={stat.trend}
                            delay={i * 100}
                        />
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
                        <ActivityFeed activities={activities} />
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
