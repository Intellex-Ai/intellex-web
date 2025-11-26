import React from 'react';
import { ResearchProject } from '@/types';
import { ArrowRight, Clock, Activity, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface ProjectCardProps {
    project: ResearchProject;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <Activity className="w-4 h-4 text-primary" />;
            case 'completed':
                return <CheckCircle2 className="w-4 h-4 text-success" />;
            default:
                return <Clock className="w-4 h-4 text-muted" />;
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <Link href={`/research/${project.id}`} className="block group">
            <div className="bg-black/90 backdrop-blur-[10px] border-2 border-border p-6 h-full transition-all duration-300 hover:border-primary hover:-translate-y-[2px] relative overflow-hidden">
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none" />

                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                        {getStatusIcon(project.status)}
                        <span>{project.status}</span>
                    </div>
                    <span className="text-xs text-muted font-mono">
                        {formatDate(project.updatedAt)}
                    </span>
                </div>

                <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                    {project.title}
                </h3>

                <p className="text-muted-foreground text-sm line-clamp-2 mb-6">
                    {project.goal}
                </p>

                <div className="flex items-center text-sm font-medium text-primary opacity-0 transform -translate-x-[10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    Open Project <ArrowRight className="w-4 h-4 ml-2" />
                </div>
            </div>
        </Link>
    );
};
