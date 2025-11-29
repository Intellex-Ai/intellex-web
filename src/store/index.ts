import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, ResearchProject, ResearchPlan, ChatMessage } from '@/types';
import { AuthService } from '@/services/api/auth';
import { ProjectService } from '@/services/api/projects';
import { ChatService } from '@/services/api/chat';
import { ApiError } from '@/services/api/client';
import { supabase } from '@/lib/supabase';
import { API_BASE_URL } from '@/services/api/client';
import { MockResearchService } from '@/services/mock/research';

interface AppState {
    user: User | null;
    projects: ResearchProject[];
    activeProject: ResearchProject | null;
    activePlan: ResearchPlan | null;
    messages: ChatMessage[];
    isLoading: boolean;
    timezone: string;

    // Actions
    login: (email: string, password: string, name?: string, mode?: 'login' | 'signup') => Promise<void>;
    logout: () => Promise<void>;
    loadProjects: () => Promise<void>;
    createProject: (title: string, goal: string) => Promise<ResearchProject | null>;
    selectProject: (projectId: string) => Promise<void>;
    sendMessage: (content: string) => Promise<void>;
    refreshUser: () => Promise<void>;
    clearSession: () => void;
    setTimezone: (timezone: string) => void;
}

export const useStore = create<AppState>()(persist((set, get) => ({
    user: null,
    projects: [],
    activeProject: null,
    activePlan: null,
    messages: [],
    isLoading: false,
    timezone: 'UTC',

            login: async (email: string, password: string, name?: string, mode: 'login' | 'signup' = 'login') => {
                set({ isLoading: true });
                try {
                    if (!email || !password) {
                        throw new Error('Email and password are required');
                    }

                    const maybeProvision = async () => {
                        const allowProvision =
                            process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH_AUTOCONFIRM === 'true' ||
                            process.env.ENABLE_DEV_AUTH_AUTOCONFIRM === 'true';
                        if (!allowProvision) return false;
                        try {
                            const res = await fetch(`${API_BASE_URL}/auth/dev-provision`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email, password, name }),
                            });
                            if (!res.ok) {
                                const data = await res.json().catch(() => ({}));
                                // Swallow and continue; client auth may still succeed if email already confirmed.
                                console.warn('Dev provision failed', data);
                                return false;
                            }
                            return true;
                        } catch (provErr) {
                            console.warn('Dev provision error', provErr);
                            return false;
                        }
                    };

                    const signInPassword = async () => {
                        const { error } = await supabase.auth.signInWithPassword({ email, password });
                        if (error) {
                            throw error;
                        }
                    };

                    if (mode === 'signup') {
                        if (!name) {
                            throw new Error('Name is required for signup');
                        }
                        const provisioned = await maybeProvision();
                        if (provisioned) {
                            await signInPassword();
                        } else {
                            const { data, error } = await supabase.auth.signUp({
                                email,
                                password,
                                options: {
                                    data: { display_name: name },
                                },
                            });
                            if (error) {
                                throw error;
                            }
                            if (!data.session) {
                                throw new Error('Please confirm your email to activate your account.');
                            }
                        }
                    } else {
                        await signInPassword();
                    }

                    // Derive best-available display name from provided name or Supabase auth metadata.
                    let displayName = name;
                    const { data: authedUser } = await supabase.auth.getUser();
                    const metaName =
                        (authedUser?.user?.user_metadata as Record<string, unknown>)?.display_name ||
                        (authedUser?.user?.user_metadata as Record<string, unknown>)?.full_name ||
                        undefined;
                    if (!displayName) {
                        displayName = metaName as string | undefined;
                    }
                    const fallbackName = displayName || (email.includes('@') ? email.split('@')[0] : email);

                    const supabaseUserId = authedUser?.user?.id;
                    const user = await AuthService.login(email, fallbackName, supabaseUserId);
                    set({ user });
                } catch (error) {
                    console.error('Login failed', error);
                    set({ user: null });
                    if (error instanceof Error) {
                        if (error.message?.toLowerCase().includes('email not confirmed')) {
                            throw new Error('Please confirm your email (or enable dev autoconfirm) before signing in.');
                        }
                        throw error;
                    }
                    throw new Error('Authentication failed');
                } finally {
                    set({ isLoading: false });
                }
            },

            logout: async () => {
                await supabase.auth.signOut();
                set({ user: null, projects: [], activeProject: null, messages: [], activePlan: null });
            },

            clearSession: () => {
                set({ user: null, projects: [], activeProject: null, messages: [], activePlan: null });
            },

            setTimezone: (timezone: string) => {
                set({ timezone });
            },

            loadProjects: async () => {
                set({ isLoading: true });
                try {
                    const projects = await ProjectService.list();
                    set({ projects });
                } catch (error) {
                    console.warn('Failed to reach API for projects, falling back to mock data', error);
                    try {
                        const projects = await MockResearchService.getProjects();
                        set({ projects });
                    } catch (mockError) {
                        console.error('Mock fallback for projects also failed', mockError);
                    }
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

                    // Allow demo usage when API is offline.
                    try {
                        const project = await MockResearchService.createProject(title, goal);
                        const plan = await MockResearchService.getPlan(project.id);
                        set({
                            projects: [project, ...get().projects.filter((p) => p.id !== project.id)],
                            activeProject: project,
                            activePlan: plan ?? null,
                            messages: [],
                        });
                        return project;
                    } catch (mockError) {
                        console.warn('Mock fallback for project creation failed', mockError);
                        return null;
                    }
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
                    // Try mock fallback for local/demo mode when API is unreachable or missing data.
                    try {
                        const project = await MockResearchService.getProject(projectId);
                        const plan = await MockResearchService.getPlan(projectId);
                        if (project) {
                            set({ activeProject: project, messages: [], activePlan: plan || null });
                            return;
                        }
                    } catch (mockError) {
                        console.warn('Mock fallback for project failed', mockError);
                    }

                    if (error instanceof ApiError && error.status === 404) {
                        // Remove stale project reference if it no longer exists.
                        set((state) => ({
                            projects: state.projects.filter((p) => p.id !== projectId),
                            activeProject: null,
                            activePlan: null,
                            messages: [],
                        }));
                        return;
                    }
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

            refreshUser: async () => {
                const normalizeTheme = (prefs: unknown): { theme: 'system' | 'light' | 'dark' } => {
                    const theme = (prefs as { theme?: string })?.theme;
                    if (theme === 'light' || theme === 'dark' || theme === 'system') {
                        return { theme };
                    }
                    return { theme: 'system' };
                };
                try {
                    // Prime session first to avoid transient AuthSessionMissingError on reload.
                    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                    if (sessionError) {
                        console.error('Failed to get Supabase session', sessionError);
                        return;
                    }
                    if (!sessionData?.session) {
                        set({ user: null });
                        return;
                    }

                    const { data: userData, error: userError } = await supabase.auth.getUser();
                    if (userError) {
                        console.error('Failed to get Supabase user', userError);
                        return;
                    }

                    const authUser = userData?.user;
                    if (!authUser) {
                        set({ user: null });
                        return;
                    }

                    try {
                        // Prefer canonical profile via service-role proxy to include avatar.
                        const profileRes = await fetch(`/api/profile?email=${encodeURIComponent(authUser.email ?? '')}`);
                        if (profileRes.ok) {
                            const data = await profileRes.json();
                            const profile = data.user;
                            set({
                                user: {
                                    id: profile.id,
                                    email: profile.email,
                                    name: profile.name ?? profile.email ?? '',
                                    avatarUrl: profile.avatar_url ?? null,
                                    preferences: normalizeTheme(profile.preferences),
                                },
                            });
                            return;
                        }

                        // Fallback: backend auth/me (service role)
                        const latest = await AuthService.current(authUser.email || undefined);
                        set({ user: latest });
                    } catch (apiError) {
                        console.warn('Auth API current() failed, trying direct Supabase profile', apiError);

                        // Second try: direct Supabase profile (RLS must allow).
                        const { data: profiles, error: profileError } = await supabase
                            .from('users')
                            .select('id, email, name, avatar_url, preferences')
                            .eq('email', authUser.email ?? '')
                            .limit(1);
                        if (!profileError && profiles && profiles.length > 0) {
                            const profile = profiles[0];
                            set({
                                user: {
                                    id: profile.id,
                                    email: profile.email,
                                    name: profile.name ?? profile.email ?? '',
                                    avatarUrl: profile.avatar_url,
                                    preferences: normalizeTheme(profile.preferences),
                                },
                            });
                            return;
                        }

                        // Last fallback: Supabase auth metadata.
                        console.warn('Supabase profile fallback in use', profileError);
                        set({
                            user: {
                                id: authUser.id,
                                email: authUser.email ?? '',
                                name:
                                    (authUser.user_metadata as Record<string, unknown>)?.display_name as string ||
                                    authUser.email ||
                                    '',
                                avatarUrl: undefined,
                                preferences: { theme: 'system' },
                            },
                        });
                    }
                } catch (error) {
                    console.error('Failed to refresh user', error);
                }
            },
}),
{
    name: 'intellex-store',
    // Persist only long-lived data; omit transient loading flag.
    partialize: (state) => ({
        user: state.user,
        projects: state.projects,
        activeProject: state.activeProject,
        activePlan: state.activePlan,
        messages: state.messages,
        timezone: state.timezone,
    }),
}));
