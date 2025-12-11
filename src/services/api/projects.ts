import type {
    ActivityItem,
    ProjectStats,
    ResearchPlan,
    ResearchProject,
} from '@/types';
import type {
    CreateProjectRequest,
    ShareProjectRequest,
    UpdateProjectRequest,
} from '@intellex/shared-client';

import { projectsApi, withApiError } from './client';

export const ProjectService = {
    list: (userId: string): Promise<ResearchProject[]> =>
        withApiError(() => projectsApi.listProjectsProjectsGet({ userId })),
    get: (projectId: string): Promise<ResearchProject> =>
        withApiError(() => projectsApi.getProjectProjectsProjectIdGet({ projectId })),
    create: (title: string, goal: string, userId: string): Promise<ResearchProject> => {
        const payload: CreateProjectRequest = { title, goal, userId };
        return withApiError(() => projectsApi.createProjectProjectsPost({ createProjectRequest: payload }));
    },
    update: (
        projectId: string,
        payload: { title?: string; goal?: string; status?: ResearchProject['status'] },
    ): Promise<ResearchProject> => {
        const request: UpdateProjectRequest = { ...payload };
        return withApiError(() => projectsApi.updateProjectProjectsProjectIdPatch({ projectId, updateProjectRequest: request }));
    },
    delete: (projectId: string): Promise<void> =>
        withApiError(() => projectsApi.deleteProjectProjectsProjectIdDelete({ projectId })),
    getPlan: (projectId: string): Promise<ResearchPlan> =>
        withApiError(() => projectsApi.getPlanProjectsProjectIdPlanGet({ projectId })),
    stats: (userId: string): Promise<ProjectStats> =>
        withApiError(() => projectsApi.projectStatsProjectsStatsGet({ userId })),
    activity: (userId: string, limit = 10): Promise<ActivityItem[]> =>
        withApiError(() => projectsApi.recentActivityProjectsActivityGet({ userId, limit })),
    listShares: (projectId: string) =>
        withApiError(() => projectsApi.listProjectSharesProjectsProjectIdSharesGet({ projectId })),
    share: (projectId: string, payload: { email: string; access?: 'viewer' | 'editor' }) => {
        const request: ShareProjectRequest = { email: payload.email, access: payload.access };
        return withApiError(() => projectsApi.shareProjectProjectsProjectIdSharesPost({ projectId, shareProjectRequest: request }));
    },
    revokeShare: (projectId: string, shareId: string) =>
        withApiError(() => projectsApi.revokeProjectShareProjectsProjectIdSharesShareIdDelete({ projectId, shareId })),
};
