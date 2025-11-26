'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/store';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { Plus, Search } from 'lucide-react';


export default function DashboardPage() {
    const { projects, loadProjects, isLoading, user } = useStore();

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    return (
        <div className="min-h-screen bg-background p-8">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold mb-2 tracking-tight">
                        Research <span className="text-primary">Hub</span>
                    </h1>
                    <p className="text-muted-foreground">
                        Welcome back, {user?.name || 'Researcher'}. Manage your active investigations.
                    </p>
                </div>

                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            className="pl-10 pr-4 py-2 bg-surface-200 border border-border text-sm focus:outline-none focus:border-primary w-64"
                        />
                    </div>
                    <button className="flex items-center gap-2 bg-primary text-white px-6 py-2 font-medium hover:bg-primary-hover transition-colors">
                        <Plus className="w-4 h-4" />
                        New Research
                    </button>
                </div>
            </header>

            {/* Grid */}
            <main className="max-w-7xl mx-auto">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-64 bg-surface-100 animate-pulse border border-border" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}

                        {/* Empty State / Create New Card */}
                        <button className="group h-full min-h-[200px] border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-4 text-muted hover:text-primary transition-all">
                            <div className="w-12 h-12 rounded-full bg-surface-200 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <Plus className="w-6 h-6" />
                            </div>
                            <span className="font-medium">Create New Project</span>
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
