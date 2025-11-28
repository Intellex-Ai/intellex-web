import { ResearchProject, ResearchPlan } from '@/types';

const MOCK_PROJECTS: ResearchProject[] = [
    {
        id: 'proj-1',
        userId: 'user-1',
        title: 'Quantum Computing Trends 2025',
        goal: 'Analyze the emerging trends in Quantum Computing for the next fiscal year.',
        status: 'active',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
        updatedAt: Date.now(),
        lastMessageAt: Date.now(),
    },
    {
        id: 'proj-2',
        userId: 'user-1',
        title: 'Sustainable Energy Storage',
        goal: 'Investigate new battery technologies for grid-scale storage.',
        status: 'completed',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
        updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    },
];

const MOCK_PLANS: Record<string, ResearchPlan> = {
    'proj-1': {
        id: 'plan-1',
        projectId: 'proj-1',
        updatedAt: Date.now(),
        items: [
            {
                id: 'item-1',
                title: 'Market Analysis',
                description: 'Analyze current market leaders and investment flows.',
                status: 'completed',
            },
            {
                id: 'item-2',
                title: 'Technology Assessment',
                description: 'Evaluate superconducting vs trapped ion qubits.',
                status: 'in-progress',
                subItems: [
                    { id: 'sub-1', title: 'IBM Roadmap', description: '', status: 'completed' },
                    { id: 'sub-2', title: 'IonQ Progress', description: '', status: 'in-progress' },
                ],
            },
        ],
    },
};

export const MockResearchService = {
    getProjects: async (): Promise<ResearchProject[]> => {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return MOCK_PROJECTS;
    },

    getProject: async (id: string): Promise<ResearchProject | undefined> => {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return MOCK_PROJECTS.find((p) => p.id === id);
    },

    createProject: async (title: string, goal: string): Promise<ResearchProject> => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const newProject: ResearchProject = {
            id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: 'user-1',
            title,
            goal,
            status: 'active',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        MOCK_PROJECTS.unshift(newProject);
        return newProject;
    },

    getPlan: async (projectId: string): Promise<ResearchPlan | null> => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return MOCK_PLANS[projectId] || null;
    },
};
