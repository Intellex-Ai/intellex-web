import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, ResearchProject, ResearchPlan, ChatMessage } from '@/types';
import { MockAuthService } from '@/services/mock/auth';
import { MockResearchService } from '@/services/mock/research';
import { MockChatService } from '@/services/mock/chat';

interface AppState {
    user: User | null;
    projects: ResearchProject[];
    activeProject: ResearchProject | null;
    activePlan: ResearchPlan | null;
    messages: ChatMessage[];
    isLoading: boolean;

    // Actions
    login: () => Promise<void>;
    logout: () => Promise<void>;
    loadProjects: () => Promise<void>;
    createProject: (goal: string) => Promise<void>;
    selectProject: (projectId: string) => Promise<void>;
    sendMessage: (content: string) => Promise<void>;
}

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            user: null,
            projects: [],
            activeProject: null,
            activePlan: null,
            messages: [],
            isLoading: false,

            login: async () => {
                set({ isLoading: true });
                try {
                    const user = await MockAuthService.login('demo@intellex.ai');
                    set({ user });
                } finally {
                    set({ isLoading: false });
                }
            },

            logout: async () => {
                await MockAuthService.logout();
                set({ user: null, activeProject: null, messages: [] });
            },

            loadProjects: async () => {
                set({ isLoading: true });
                try {
                    const projects = await MockResearchService.getProjects();
                    set({ projects });
                } finally {
                    set({ isLoading: false });
                }
            },

            createProject: async (goal: string) => {
                set({ isLoading: true });
                try {
                    const project = await MockResearchService.createProject(goal);
                    set({
                        projects: [project, ...get().projects],
                        activeProject: project,
                        messages: []
                    });
                } finally {
                    set({ isLoading: false });
                }
            },

            selectProject: async (projectId: string) => {
                set({ isLoading: true, activeProject: null, messages: [], activePlan: null });
                try {
                    const project = await MockResearchService.getProject(projectId);
                    if (project) {
                        const [messages, plan] = await Promise.all([
                            MockChatService.getMessages(projectId),
                            MockResearchService.getPlan(projectId)
                        ]);
                        set({ activeProject: project, messages, activePlan: plan });
                    }
                } finally {
                    set({ isLoading: false });
                }
            },

            sendMessage: async (content: string) => {
                const { activeProject } = get();
                if (!activeProject) return;

                // Optimistic update or wait for server? Mock service is fast enough.
                const userMsg = await MockChatService.sendMessage(activeProject.id, content);
                set((state) => ({ messages: [...state.messages, userMsg] }));

                // Simulate agent response
                const agentMsg = await MockChatService.simulateAgentResponse(activeProject.id);
                set((state) => ({ messages: [...state.messages, agentMsg] }));
            },
        }),
        {
            name: 'intellex-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ user: state.user }), // Only persist user session
        }
    )
);
