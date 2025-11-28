import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, ResearchProject, ResearchPlan, ChatMessage } from '@/types';
import { AuthService } from '@/services/api/auth';
import { ProjectService } from '@/services/api/projects';
import { ChatService } from '@/services/api/chat';

interface AppState {
    user: User | null;
    projects: ResearchProject[];
    activeProject: ResearchProject | null;
    activePlan: ResearchPlan | null;
    messages: ChatMessage[];
    isLoading: boolean;

    // Actions
    login: (email?: string, name?: string) => Promise<void>;
    logout: () => Promise<void>;
    loadProjects: () => Promise<void>;
    createProject: (title: string, goal: string) => Promise<ResearchProject | null>;
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

            login: async (email = 'demo@intellex.ai', name = 'Demo Researcher') => {
                set({ isLoading: true });
                try {
                    const user = await AuthService.login(email, name);
                    set({ user });
                } catch (error) {
                    console.error('Login failed', error);
                } finally {
                    set({ isLoading: false });
                }
            },

            logout: async () => {
                set({ user: null, projects: [], activeProject: null, messages: [], activePlan: null });
            },

            loadProjects: async () => {
                set({ isLoading: true });
                try {
                    const projects = await ProjectService.list();
                    set({ projects });
                } catch (error) {
                    console.error('Failed to load projects', error);
                } finally {
                    set({ isLoading: false });
                }
            },

            createProject: async (title: string, goal: string) => {
                set({ isLoading: true });
                try {
                    const { user } = get();
                    const project = await ProjectService.create(title, goal, user?.id);
                    const [messages, plan] = await Promise.all([
                        ChatService.getMessages(project.id),
                        ProjectService.getPlan(project.id).catch(() => null)
                    ]);
                    set({
                        projects: [project, ...get().projects.filter(p => p.id !== project.id)],
                        activeProject: project,
                        activePlan: plan,
                        messages
                    });
                    return project;
                } catch (error) {
                    console.error('Failed to create project', error);
                    return null;
                } finally {
                    set({ isLoading: false });
                }
            },

            selectProject: async (projectId: string) => {
                set({ isLoading: true, activeProject: null, messages: [], activePlan: null });
                try {
                    const project = await ProjectService.get(projectId);
                    const [messages, plan] = await Promise.all([
                        ChatService.getMessages(projectId),
                        ProjectService.getPlan(projectId).catch(() => null)
                    ]);
                    set({ activeProject: project, messages, activePlan: plan });
                } catch (error) {
                    console.error('Failed to load project', error);
                } finally {
                    set({ isLoading: false });
                }
            },

            sendMessage: async (content: string) => {
                const { activeProject } = get();
                if (!activeProject) return;

                set({ isLoading: true });
                try {
                    const { userMessage, agentMessage, plan } = await ChatService.sendMessage(activeProject.id, content);
                    set((state) => {
                        const updatedProjects = state.projects.map((project) =>
                            project.id === activeProject.id
                                ? { ...project, lastMessageAt: agentMessage.timestamp, updatedAt: agentMessage.timestamp }
                                : project
                        );

                        return {
                            projects: updatedProjects,
                            activeProject: state.activeProject
                                ? { ...state.activeProject, lastMessageAt: agentMessage.timestamp, updatedAt: agentMessage.timestamp }
                                : null,
                            messages: [...state.messages, userMessage, agentMessage],
                            activePlan: plan ?? state.activePlan,
                        };
                    });
                } catch (error) {
                    console.error('Failed to send message', error);
                } finally {
                    set({ isLoading: false });
                }
            },
        }),
        {
            name: 'intellex-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ user: state.user }), // Only persist user session
        }
    )
);
