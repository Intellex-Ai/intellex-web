'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { Plus, Search } from 'lucide-react';
import clsx from 'clsx';
import { TextScramble } from '@/components/ui/TextScramble';
import { Button } from '@/components/ui/Button';
import { CreateProjectModal } from '@/components/dashboard/CreateProjectModal';
import { ResearchProject } from '@/types';

export default function ProjectsPage() {
    const { projects, loadProjects, isLoading } = useStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'draft' | 'active' | 'completed' | 'archived'>('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<ResearchProject | null>(null);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.goal.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || project.status === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="min-h-screen bg-black animate-in fade-in duration-700 relative overflow-hidden">
            {/* Static Cyber Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:50px_50px] [mask-image:radial-gradient(circle_at_center,black_40%,transparent_100%)] pointer-events-none" />

            <div className="relative z-10 p-2 md:p-8">
                {/* Header */}
                <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                    <div>
                        <h1 className="text-2xl md:text-4xl font-mono font-bold mb-2 tracking-tighter text-white uppercase">
                            <TextScramble text="PROJECT_INDEX" />
                        </h1>
                        <p className="text-muted font-mono text-xs md:text-sm tracking-wide">
                            {`// MANAGE_RESEARCH_INITIATIVES`}
                        </p>
                    </div>

                    <Button
                        leftIcon={<Plus size={18} />}
                        className="text-xs md:text-sm w-full md:w-auto"
                        onClick={() => {
                            setEditingProject(null);
                            setIsCreateModalOpen(true);
                        }}
                    >
                        INITIALIZE_PROJECT
                    </Button>
                </header>

                {/* Controls */}
                <div className="mb-6 md:mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                    {/* Search */}
                    <div className="relative w-full md:w-96 group">
                        <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" size={18} />
                        <input
                            type="text"
                            placeholder="Search database..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 text-white pl-12 pr-4 py-3 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all duration-300 placeholder-white/20 font-mono text-sm"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2 bg-black/50 border border-white/10 p-1 w-full md:w-auto overflow-x-auto">
                        {(['all', 'draft', 'active', 'completed', 'archived'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={clsx(
                                    "px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all duration-300 flex-1 md:flex-none whitespace-nowrap",
                                    filter === f
                                        ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_-3px_rgba(255,77,0,0.3)]"
                                        : "text-muted-foreground hover:text-white"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {isLoading ? (
                        // Loading Skeletons
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-[280px] bg-white/5 border border-white/5 animate-pulse" />
                        ))
                    ) : filteredProjects.length > 0 ? (
                        filteredProjects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onEdit={(proj) => {
                                    setEditingProject(proj);
                                    setIsCreateModalOpen(true);
                                }}
                                onDelete={(proj) => {
                                    setEditingProject(proj);
                                    setIsCreateModalOpen(true);
                                }}
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center border border-dashed border-white/10 bg-white/5">
                            <p className="text-muted-foreground font-mono mb-4">No projects found matching criteria.</p>
                            <button
                                onClick={() => { setSearchQuery(''); setFilter('all'); }}
                                className="text-primary hover:underline font-mono text-sm uppercase tracking-wider"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>


            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditingProject(null);
                }}
                project={editingProject}
            />
        </div >
    );
}
