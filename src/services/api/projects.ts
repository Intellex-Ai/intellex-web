import { ResearchPlan, ResearchProject } from '@/types';
import { api } from './client';

export const ProjectService = {
    list: (userId: string) => api.get<ResearchProject[]>('/projects', { userId }),
    get: (projectId: string) => api.get<ResearchProject>(`/projects/${projectId}`),
    create: (title: string, goal: string, userId: string) =>
        api.post<ResearchProject>('/projects', { title, goal, userId }),
    update: (projectId: string, payload: { title?: string; goal?: string; status?: ResearchProject['status'] }) =>
        api.request<ResearchProject>(`/projects/${projectId}`, { method: 'PATCH', body: payload }),
    delete: (projectId: string) => api.request<void>(`/projects/${projectId}`, { method: 'DELETE' }),
    getPlan: (projectId: string) => api.get<ResearchPlan>(`/projects/${projectId}/plan`),
};
