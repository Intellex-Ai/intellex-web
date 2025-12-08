'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Target, Type, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useStore } from '@/store';
import { useRouter } from 'next/navigation';
import { ResearchProject } from '@/types';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project?: ResearchProject | null;
}

export function CreateProjectModal({ isOpen, onClose, project }: CreateProjectModalProps) {
    const isEdit = Boolean(project);
    const [title, setTitle] = useState(project?.title || '');
    const [goal, setGoal] = useState(project?.goal || '');
    const [status, setStatus] = useState<ResearchProject['status']>(project?.status || 'active');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { createProject, updateProject, deleteProject, selectProject } = useStore();
    const router = useRouter();
    const statusOptions: ResearchProject['status'][] = useMemo(() => ['draft', 'active', 'completed', 'archived'], []);

    useEffect(() => {
        if (project) {
            setTitle(project.title);
            setGoal(project.goal);
            setStatus(project.status);
        } else {
            setTitle('');
            setGoal('');
            setStatus('active');
        }
        setError(null);
    }, [project, isOpen]);

    const handleCreate = async () => {
        if (!title.trim() || !goal.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const project = await createProject(title, goal);
            setTitle('');
            setGoal('');
            const newProjectId = project?.id || useStore.getState().activeProject?.id;
            if (newProjectId) {
                router.push(`/research/${newProjectId}`);
            }
            onClose();
        } catch (e) {
            console.error(e);
            const message = e instanceof Error ? e.message : 'Failed to create project.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!project) return;
        if (!title.trim() || !goal.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const updated = await updateProject(project.id, { title, goal, status });
            if (updated?.id) {
                await selectProject(updated.id);
                onClose();
                return;
            }
            setError('Failed to update project.');
        } catch (e) {
            console.error(e);
            const message = e instanceof Error ? e.message : 'Failed to update project.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!project) return;
        const confirmed = window.confirm('Delete this project? This will remove its messages and plan.');
        if (!confirmed) return;
        setIsLoading(true);
        setError(null);
        try {
            const deleted = await deleteProject(project.id);
            if (deleted) {
                if (useStore.getState().activeProject?.id === project.id) {
                    router.push('/projects');
                }
                onClose();
                return;
            }
            setError('Failed to delete project. Please try again.');
        } catch (e) {
            console.error(e);
            setError('Failed to delete project. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const submitDisabled = !title.trim() || !goal.trim();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50 px-4"
                    >
                        <div className="bg-black border border-white/10 shadow-[0_0_50px_-10px_rgba(255,77,0,0.1)] relative overflow-hidden">
                            {/* Decorative Top Line */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                            <div className="p-6 md:p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-xl font-mono font-bold text-white uppercase tracking-tighter flex items-center gap-2">
                                            <span className="w-2 h-2 bg-primary animate-pulse" />
                                            {isEdit ? 'Edit_Project' : 'Initialize_Project'}
                                        </h2>
                                        <p className="text-xs text-muted font-mono mt-1 uppercase tracking-wide">
                                            {isEdit ? '// Update_scope_or_status' : '// Define_Research_Parameters'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-muted hover:text-white transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <Input
                                        label="Project Designation"
                                        placeholder="e.g. QUANTUM_LEAP_V2"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        leftIcon={<Type size={16} />}
                                        autoFocus
                                    />

                                    <div className="space-y-2">
                                        <label className="text-xs font-mono text-muted uppercase tracking-wider flex items-center gap-2">
                                            <Target size={14} />
                                            Research_Objective
                                        </label>
                                        <textarea
                                            value={goal}
                                            onChange={(e) => setGoal(e.target.value)}
                                            placeholder="Describe the primary objective of this intelligence gathering operation..."
                                            className="w-full h-32 bg-white/5 border border-white/10 text-white p-4 font-mono text-sm focus:outline-none focus:border-primary/50 focus:bg-black transition-all resize-none placeholder:text-white/20"
                                        />
                                    </div>

                                    {error && (
                                        <p className="text-error text-xs font-mono uppercase tracking-wider">
                                            {error}
                                        </p>
                                    )}

                                    {isEdit && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-mono text-muted uppercase tracking-wider flex items-center gap-2">
                                                <ShieldAlert size={14} />
                                                Project_Status
                                            </label>
                                            <select
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value as ResearchProject['status'])}
                                                className="w-full bg-white/5 border border-white/10 text-white p-3 font-mono text-sm focus:outline-none focus:border-primary/50 focus:bg-black transition-all"
                                            >
                                                {statusOptions.map((option) => (
                                                    <option key={option} value={option} className="bg-black text-white">
                                                        {option.toUpperCase()}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="pt-4 flex gap-3">
                                        <Button
                                            variant="ghost"
                                            className="flex-1 border border-white/10 hover:bg-white/5"
                                            onClick={onClose}
                                            disabled={isLoading}
                                        >
                                            ABORT
                                        </Button>
                                        {isEdit ? (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    className="border border-error/40 text-error hover:bg-error/10"
                                                    onClick={handleDelete}
                                                    isLoading={isLoading}
                                                >
                                                    DELETE
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    className="flex-1"
                                                    onClick={handleUpdate}
                                                    isLoading={isLoading}
                                                    disabled={submitDisabled}
                                                >
                                                    SAVE <ArrowRight size={16} className="ml-2" />
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                variant="primary"
                                                className="flex-1"
                                                onClick={handleCreate}
                                                isLoading={isLoading}
                                                disabled={submitDisabled}
                                            >
                                                INITIALIZE <ArrowRight size={16} className="ml-2" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Decorative Corner */}
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/20" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/20" />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
