import { ResearchPlan, ResearchProject } from '@/types';
import { api } from './client';

export const ProjectService = {
    list: () => api.get<ResearchProject[]>('/projects'),
    get: (projectId: string) => api.get<ResearchProject>(`/projects/${projectId}`),
    create: (title: string, goal: string, userId?: string | null) =>
        api.post<ResearchProject>('/projects', { title, goal, userId }),
    getPlan: (projectId: string) => api.get<ResearchPlan>(`/projects/${projectId}/plan`),
};
