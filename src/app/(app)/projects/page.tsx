'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { Plus, Search } from 'lucide-react';
import clsx from 'clsx';
import { TextScramble } from '@/components/ui/TextScramble';
import { Button } from '@/components/ui/Button';
import { CreateProjectModal } from '@/components/dashboard/CreateProjectModal';
import { ResearchProject } from '@/types';
import { ShareModal } from '@/components/projects/ShareModal';

export default function ProjectsPage() {
    const { projects, loadProjects, isLoading } = useStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'draft' | 'active' | 'completed' | 'archived'>('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<ResearchProject | null>(null);
    const [shareProject, setShareProject] = useState<ResearchProject | null>(null);

    useEffect(() => {
        if (!projects.length) {
            void loadProjects();
        }
    }, [loadProjects, projects.length]);

    const filteredProjects = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();
        return projects.filter((project) => {
            const matchesSearch =
                !normalizedQuery ||
                project.title.toLowerCase().includes(normalizedQuery) ||
                project.goal.toLowerCase().includes(normalizedQuery);
            const matchesFilter = filter === 'all' || project.status === filter;
            return matchesSearch && matchesFilter;
        });
    }, [projects, searchQuery, filter]);

    return (
        <>
            {/* Header */}
            <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                <div className="min-w-0 flex-1">
                    <h1 className="text-2xl md:text-4xl font-mono font-bold mb-2 tracking-tighter text-white uppercase truncate">
                        <TextScramble text="PROJECT_INDEX" />
                    </h1>
                    <p className="text-muted font-mono text-xs md:text-sm tracking-wide truncate">
                        // MANAGE_RESEARCH_INITIATIVES
                    </p>
                </div>

                <Button
                    leftIcon={<Plus size={18} />}
                    className="text-xs md:text-sm shrink-0"
                    onClick={() => {
                        setEditingProject(null);
                        setIsCreateModalOpen(true);
                    }}
                >
                    INITIALIZE_PROJECT
                </Button>
            </header>

            {/* Controls */}
            <div className="mb-6 md:mb-8 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                {/* Search */}
                <div className="relative w-full md:w-96 md:max-w-sm group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" size={18} />
                    <input
                        type="text"
                        placeholder="Search database..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 text-white pl-12 pr-4 py-3 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all duration-300 placeholder-white/20 font-mono text-sm"
                    />
                </div>

                {/* Filters - Dropdown on mobile, buttons on desktop */}
                <div className="flex items-center">
                    {/* Mobile: Native Select Dropdown */}
                    <div className="md:hidden w-full">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as typeof filter)}
                            className="w-full bg-black/50 border border-white/10 text-white px-4 py-3 font-mono text-sm uppercase tracking-wider appearance-none cursor-pointer focus:outline-none focus:border-primary/50"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a1a1aa'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
                        >
                            {(['all', 'draft', 'active', 'completed', 'archived'] as const).map((f) => (
                                <option key={f} value={f} className="bg-black text-white">
                                    {f.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Desktop: Button Row */}
                    <div className="hidden md:flex items-center gap-1 bg-black/50 border border-white/10 p-1">
                        {(['all', 'draft', 'active', 'completed', 'archived'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={clsx(
                                    "px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all duration-300",
                                    filter === f
                                        ? "bg-primary/10 text-primary border border-primary/20"
                                        : "text-muted-foreground hover:text-white border border-transparent"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-[280px] bg-white/5 border border-white/5 animate-pulse" />
                    ))
                ) : filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onShare={(proj) => setShareProject(proj)}
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

            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditingProject(null);
                }}
                project={editingProject}
            />

            <ShareModal
                project={shareProject}
                isOpen={Boolean(shareProject)}
                onClose={() => setShareProject(null)}
            />
        </>
    );
}
