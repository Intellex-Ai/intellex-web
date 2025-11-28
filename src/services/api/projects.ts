import { ResearchPlan, ResearchProject } from '@/types';
import { apiRequest } from './client';

export const ProjectService = {
    list: () => apiRequest<ResearchProject[]>('/projects'),
    get: (projectId: string) => apiRequest<ResearchProject>(`/projects/${projectId}`),
    create: (title: string, goal: string, userId?: string | null) =>
        apiRequest<ResearchProject>('/projects', {
            method: 'POST',
            body: { title, goal, userId },
        }),
    getPlan: (projectId: string) => apiRequest<ResearchPlan>(`/projects/${projectId}/plan`),
};
