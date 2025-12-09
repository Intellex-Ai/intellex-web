import React from 'react';
import { ResearchProject } from '@/types';
import { ArrowRight, Clock, Activity, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface ProjectCardProps {
    project: ResearchProject;
    onEdit?: (project: ResearchProject) => void;
    onDelete?: (project: ResearchProject) => void;
    onShare?: (project: ResearchProject) => void;
}

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onDelete, onShare }) => {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <Activity className="w-3 h-3" />;
            case 'completed':
                return <CheckCircle2 className="w-3 h-3" />;
            default:
                return <Clock className="w-3 h-3" />;
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'active': return 'neutral';
            case 'completed': return 'success';
            default: return 'neutral';
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onEdit?.(project);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete?.(project);
    };

    return (
        <Link href={`/research/${project.id}`} className="block h-full">
            <Card hoverEffect spotlight className="h-full flex flex-col bg-black/50 backdrop-blur-sm p-6 md:p-8">
                <div className="flex justify-between items-start mb-6">
                    <Badge variant={getStatusVariant(project.status)} className="flex items-center gap-2">
                        {getStatusIcon(project.status)}
                        <span>{project.status}</span>
                    </Badge>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted font-mono tracking-wider uppercase">
                            {`// ${formatDate(project.updatedAt)}`}
                        </span>
                        {(onShare || onEdit || onDelete) && (
                            <div className="flex gap-1">
                                {onShare && (
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onShare(project); }}
                                        className="px-2 py-1 text-[10px] font-mono uppercase tracking-wide border border-white/10 text-white hover:border-primary/40 hover:text-primary transition-colors"
                                    >
                                        Share
                                    </button>
                                )}
                                {onEdit && (
                                    <button
                                        onClick={handleEdit}
                                        className="px-2 py-1 text-[10px] font-mono uppercase tracking-wide border border-white/10 text-white hover:border-primary/40 hover:text-primary transition-colors"
                                    >
                                        Edit
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={handleDelete}
                                        className="px-2 py-1 text-[10px] font-mono uppercase tracking-wide border border-white/10 text-error hover:border-error/60 hover:text-error transition-colors"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <h3 className="text-xl font-mono font-bold mb-3 text-white tracking-tight uppercase">
                    {project.title}
                </h3>

                <p className="text-muted text-sm line-clamp-3 mb-8 leading-relaxed font-mono flex-grow">
                    {project.goal}
                </p>

                <div className="flex items-center text-xs font-bold font-mono uppercase tracking-widest text-primary mt-auto group">
                    Open_Project <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
            </Card>
        </Link>
    );
};
