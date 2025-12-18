import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, ResearchProject, ResearchPlan, ChatMessage } from '@/types';
import { AuthService } from '@/services/api/auth';
import { ProjectService } from '@/services/api/projects';
import { ChatService } from '@/services/api/chat';
import { ApiError } from '@/services/api/client';
import { DeviceService } from '@/services/api/device';
import { supabase } from '@/lib/supabase';
import { API_BASE_URL } from '@/services/api/client';
import { getSiteUrl } from '@/lib/site-url';
import { syncSessionCookies } from '@/lib/cookies';
import { extractAuthProfile } from '@/lib/auth-metadata';
import { getSessionUser } from '@/lib/auth-user';
import { fetchMfaFactors, clearMfaFactorCache } from '@/lib/mfa';
import { ActivityItem, ProjectStats } from '@/types';

type ProfileRow = {
    id: string;
    email: string;
    name?: string | null;
    avatar_url?: string | null;
    preferences?: unknown;
};

const MFA_VERIFIED_KEY = 'intellex:mfa-verified';
const STORE_KEY = 'intellex-store';
const baseMfaState = {
    mfaRequired: false,
    mfaChallengeId: null as string | null,
    mfaFactorId: null as string | null,
};

const getDeviceTimezone = (): string | null => {
    if (typeof window === 'undefined' || typeof Intl === 'undefined') return null;
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return typeof tz === 'string' && tz.trim() ? tz : null;
    } catch {
        return null;
    }
};

const normalizeTimezone = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    const tz = value.trim();
    if (!tz) return null;
    try {
        if (typeof Intl !== 'undefined') {
            // Validate IANA timezone if possible; ignore in non-Intl environments.
            new Intl.DateTimeFormat('en-US', { timeZone: tz }).format();
        }
        return tz;
    } catch {
        return null;
    }
};

const resolveTimezonePreference = (existing: string | undefined, prefs?: unknown): string => {
    const prefTz =
        prefs && typeof prefs === 'object'
            ? normalizeTimezone((prefs as Record<string, unknown>).timezone)
            : null;
    if (prefTz) return prefTz;

    const existingTz = normalizeTimezone(existing);
    if (existingTz && existingTz !== 'UTC') return existingTz;

    return getDeviceTimezone() || existingTz || 'UTC';
};

const clearAuthState = (set: (partial: Partial<AppState>) => void) => {
    set({
        user: null,
        projects: [],
        activeProject: null,
        messages: [],
        activePlan: null,
        ...baseMfaState,
    });
};

const clearClientSession = (set: (partial: Partial<AppState>) => void) => {
    void syncSessionCookies({ accessToken: null, mfaPending: false });
    clearMfaVerified();
    clearMfaFactorCache();
    clearPersistedStore();
    clearAuthState(set);
};

const readMfaVerified = (token?: string) => {
    if (typeof window === 'undefined' || !token) return false;
    try {
        const raw = window.localStorage.getItem(MFA_VERIFIED_KEY);
        if (!raw) return false;
        const parsed = JSON.parse(raw) as Record<string, number>;
        return Boolean(parsed[token]);
    } catch {
        return false;
    }
};

const markMfaVerified = (token?: string) => {
    if (typeof window === 'undefined' || !token) return;
    try {
        const raw = window.localStorage.getItem(MFA_VERIFIED_KEY);
        const parsed = raw ? (JSON.parse(raw) as Record<string, number>) : {};
        parsed[token] = Date.now();
        window.localStorage.setItem(MFA_VERIFIED_KEY, JSON.stringify(parsed));
    } catch {
        // non-blocking
    }
};

const clearMfaVerified = () => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.removeItem(MFA_VERIFIED_KEY);
    } catch {
        // non-blocking
    }
};
const clearPersistedStore = () => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.removeItem(`zustand-persist:${STORE_KEY}`);
    } catch {
        // non-blocking
    }
};
const getSiteBaseUrl = () => {
    return getSiteUrl();
};

const syncCookiesFromSession = async (mfaPending = false) => {
    try {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token ?? null;
        await syncSessionCookies({ accessToken: token, mfaPending });
    } catch {
        await syncSessionCookies({ accessToken: null, mfaPending });
    }
};

export interface AppState {
    user: User | null;
    projects: ResearchProject[];
    activeProject: ResearchProject | null;
    activePlan: ResearchPlan | null;
    messages: ChatMessage[];
    isLoading: boolean;
    isHydrated: boolean;
    mfaRequired: boolean;
    mfaChallengeId: string | null;
    mfaFactorId: string | null;
    timezone: string;
    projectStats: ProjectStats | null;
    activityFeed: ActivityItem[];

    // Actions
    login: (email: string, password: string, name?: string, mode?: 'login' | 'signup') => Promise<boolean>;
    loginWithProvider: (provider: 'google' | 'github', redirectTo?: string) => Promise<void>;
    verifyMfa: (code: string) => Promise<void>;
    logout: () => Promise<void>;
    loadProjects: () => Promise<void>;
    loadProjectStats: () => Promise<void>;
    loadActivityFeed: (limit?: number) => Promise<void>;
    createProject: (title: string, goal: string) => Promise<ResearchProject | null>;
    updateProject: (projectId: string, payload: { title?: string; goal?: string; status?: ResearchProject['status'] }) => Promise<ResearchProject | null>;
    deleteProject: (projectId: string) => Promise<boolean>;
    selectProject: (projectId: string) => Promise<void>;
    sendMessage: (content: string) => Promise<void>;
    refreshUser: () => Promise<void>;
    clearSession: () => void;
    setTimezone: (timezone: string) => void;
    setHydrated: () => void;
    realtimeProjectUpsert: (project: ResearchProject) => void;
    realtimeProjectDelete: (projectId: string) => void;
    realtimeMessageUpsert: (message: ChatMessage) => void;
}

export const useStore = create<AppState>()(persist((set, get) => {
    const ensureBackendUser = async (): Promise<User> => {
        const { user } = get();
        const { user: authUser, error } = await getSessionUser();
        if (error || !authUser) {
            throw new Error('Supabase session is required to manage projects.');
        }

        const authProfile = extractAuthProfile(authUser);
        const email = authUser.email || user?.email;
        if (!email) {
            throw new Error('Supabase user email is required.');
        }

        const name = user?.name || authProfile?.name || (email ? email.split('@')[0] : 'Intellex User');
        const apiUser = await AuthService.login(email, name, authUser.id);
        const mergedUser: User = {
            ...apiUser,
            avatarUrl: apiUser.avatarUrl || authProfile?.avatarUrl || user?.avatarUrl,
        };
        set({ user: mergedUser });
        return mergedUser;
    };

    const touchDevice = async (login = false) => {
        try {
            const { data } = await supabase.auth.getSession();
            const refreshToken = data?.session?.refresh_token ?? undefined;
            await DeviceService.register({ login, refreshToken });
        } catch (err) {
            console.warn('Device registration failed', err);
        }
    };

    return {
        user: null,
        projects: [],
        activeProject: null,
        activePlan: null,
        messages: [],
        isLoading: false,
        isHydrated: false,
        ...baseMfaState,
        timezone: 'UTC',
        projectStats: null,
        activityFeed: [],

            login: async (email: string, password: string, name?: string, mode: 'login' | 'signup' = 'login'): Promise<boolean> => {
                set({
                    isLoading: true,
                    user: null,
                    ...baseMfaState,
                });
                clearMfaVerified();
                // Always clear the auth cookies before attempting a new login to avoid stale access.
                await syncSessionCookies({ accessToken: null, mfaPending: false });
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
                        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                        if (error) {
                            throw error;
                        }

                        const confirmed =
                            Boolean(data.session?.user?.email_confirmed_at) ||
                            Boolean((data.session?.user as { confirmed_at?: string | null } | null)?.confirmed_at);
                        if (!confirmed) {
                            const baseUrl = getSiteBaseUrl();
                            const redirectTo = baseUrl
                                ? `${baseUrl}/auth/email-verified?email=${encodeURIComponent(email)}`
                                : undefined;
                            await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
                            await supabase.auth
                                .resend({
                                    type: 'signup',
                                    email,
                                    options: {
                                        emailRedirectTo: redirectTo,
                                    },
                                })
                                .catch(() => {});
                            throw new Error('Email not confirmed. We just re-sent a verification link.');
                        }
                        return data.user ?? data.session?.user ?? null;
                    };

                    const resendConfirmation = async () => {
                        const baseUrl = getSiteBaseUrl();
                        const redirectTo = baseUrl 
                            ? `${baseUrl}/auth/email-verified?email=${encodeURIComponent(email)}` 
                            : undefined;
                        await supabase.auth.resend({
                            type: 'signup',
                            email,
                            options: {
                                emailRedirectTo: redirectTo,
                            },
                        });
                    };

                    type SignInUser = Awaited<ReturnType<typeof signInPassword>>;
                    let loginUser: SignInUser = null;

                    if (mode === 'signup') {
                        if (!name) {
                            throw new Error('Name is required for signup');
                        }
                        const provisioned = await maybeProvision();
                        if (provisioned) {
                            loginUser = await signInPassword();
                        } else {
                            const baseUrl = getSiteBaseUrl();
                            const redirectTo = baseUrl
                                ? `${baseUrl}/auth/email-verified?email=${encodeURIComponent(email)}`
                                : undefined;
                            const { data, error } = await supabase.auth.signUp({
                                email,
                                password,
                                options: {
                                    data: { display_name: name },
                                    emailRedirectTo: redirectTo,
                                },
                            });
                            if (error) {
                                if (error.message?.toLowerCase().includes('already registered')) {
                                    await resendConfirmation();
                                    throw new Error('Email already registered. Verification link re-sent if not confirmed.');
                                }
                                throw error;
                            }
                            // Always force verification before login; do not keep any session alive here.
                            await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
                            await syncSessionCookies({ accessToken: null, mfaPending: false });
                            const shouldResend = !data.session;
                            if (shouldResend) {
                                await resendConfirmation();
                            }
                            throw new Error('Please confirm your email to activate your account. Check your inbox for the link.');
                        }
                    } else {
                        loginUser = await signInPassword();
                    }

                    // Derive best-available display name from provided name or Supabase auth metadata.
                    let displayName = name;
                    const { user: authedUser, error: authUserError } = loginUser
                        ? { user: loginUser, error: null }
                        : await getSessionUser();
                    if (authUserError || !authedUser) {
                        throw new Error('Supabase session is required to continue login.');
                    }
                    const authProfile = extractAuthProfile(authedUser);
                    if (!displayName) {
                        displayName = authProfile.name;
                    }
                    const fallbackName = displayName || (email.includes('@') ? email.split('@')[0] : email);

                    const supabaseUserId = authedUser.id;
                    // MFA gate: if a verified TOTP factor exists, start challenge and await code.
                    const { data: factors, error: factorError } = await fetchMfaFactors({ userId: supabaseUserId || undefined });
                    if (factorError) {
                        console.warn('Failed to load MFA factors', factorError);
                    }
                    const verifiedTotp = factors?.totp?.find((f) => f.status === 'verified');
                    if (verifiedTotp) {
                        const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
                            factorId: verifiedTotp.id,
                        });
                        if (challengeError || !challenge?.id) {
                            throw challengeError || new Error('Unable to start MFA challenge.');
                        }
                        // Do NOT mark app session as active until MFA completes.
                        await syncCookiesFromSession(true);
                        set({
                            mfaRequired: true,
                            mfaChallengeId: challenge.id,
                            mfaFactorId: verifiedTotp.id,
                            isLoading: false,
                            // Keep user unset until MFA completes to avoid setting the auth cookie.
                            user: null,
                        });
                        return false;
                    }

                    // Clear any revoked flag for this device before provisioning user.
                    await touchDevice(true);
                    const user = await AuthService.login(email, fallbackName, supabaseUserId);
                    const timezone = resolveTimezonePreference(get().timezone, user.preferences);
                    set({ user, timezone });
                    await syncCookiesFromSession(false);
                    void touchDevice(false);
                    return true;
                } catch (error) {
                    console.error('Login failed', error);
                    set({ user: null });
                    await syncSessionCookies({ accessToken: null, mfaPending: false });
                    if (error instanceof Error) {
                        if (error.message?.toLowerCase().includes('email not confirmed')) {
                            const baseUrl = getSiteBaseUrl();
                            const redirectTo = baseUrl
                                ? `${baseUrl}/auth/email-verified?email=${encodeURIComponent(email)}`
                                : undefined;
                            await supabase.auth.resend({
                                type: 'signup',
                                email,
                                options: {
                                    emailRedirectTo: redirectTo,
                                },
                            }).catch(() => {});
                            throw new Error('Email not confirmed. We just re-sent a verification link.');
                        }
                        throw error;
                    }
                    throw new Error('Authentication failed');
                } finally {
                    const { mfaRequired } = get();
                    await syncCookiesFromSession(Boolean(mfaRequired));
                    set({ isLoading: false });
                }
            },

            loginWithProvider: async (provider: 'google' | 'github', redirectPath = '/dashboard') => {
                set({ isLoading: true, mfaRequired: false, mfaChallengeId: null, mfaFactorId: null });
                clearMfaVerified();
                await syncSessionCookies({ accessToken: null, mfaPending: false });
                try {
                    const baseUrl = getSiteBaseUrl();
                    const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : undefined);
                    if (!origin) {
                        throw new Error('Unable to determine redirect URL. Please try again.');
                    }

                    // For Google, use direct OAuth through our domain to show our app name on consent screen
                    if (provider === 'google') {
                        const googleAuthUrl = `${origin}/api/auth/google?redirect=${encodeURIComponent(redirectPath)}`;
                        window.location.assign(googleAuthUrl);
                        return;
                    }

                    // For other providers (GitHub), continue using Supabase OAuth
                    const redirectTo = `${origin}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`;
                    const { data, error } = await supabase.auth.signInWithOAuth({
                        provider,
                        options: {
                            redirectTo,
                        },
                    });
                    if (error) {
                        throw new Error(error.message ?? 'Unable to start social sign-in.');
                    }
                    // Some environments return a URL instead of auto-redirecting; honor it.
                    if (data?.url) {
                        window.location.assign(data.url);
                    }
                } catch (err) {
                    set({ isLoading: false });
                    throw err instanceof Error ? err : new Error('Unable to start social sign-in.');
                }
            },

            verifyMfa: async (code: string) => {
                const { mfaChallengeId, mfaFactorId } = get();
                if (!mfaChallengeId || !mfaFactorId) {
                    throw new Error('No MFA challenge in progress.');
                }
                set({ isLoading: true });
                try {
                    const { error: verifyError } = await supabase.auth.mfa.verify({
                        factorId: mfaFactorId,
                        challengeId: mfaChallengeId,
                        code,
                    });
                    if (verifyError) {
                        throw new Error(verifyError.message ?? 'MFA verification failed');
                    }
                    const { data: refreshedSession } = await supabase.auth.getSession();
                    const accessToken = refreshedSession?.session?.access_token;
                    // Mark this access token as fully verified before refreshing the user snapshot.
                    markMfaVerified(accessToken);
                    set({
                        mfaRequired: false,
                        mfaChallengeId: null,
                        mfaFactorId: null,
                    });
                    // After successful MFA, refresh user to hydrate the app state and cookie.
                    await get().refreshUser();
                    await syncCookiesFromSession(false);
                } catch (err) {
                    throw err instanceof Error ? err : new Error('MFA verification failed');
                } finally {
                    set({ isLoading: false });
                }
            },

            logout: async () => {
                try {
                    try {
                        await DeviceService.revoke({ scope: 'single' });
                    } catch (err) {
                        console.warn('Device revoke failed', err);
                    }
                    await supabase.auth.signOut({ scope: 'local' });
                } catch (err) {
                    console.warn('Supabase signOut failed', err);
                }
                clearClientSession(set);
            },

            clearSession: () => {
                clearClientSession(set);
            },

            setTimezone: (timezone: string) => {
                set({ timezone });
            },

            setHydrated: () => {
                set({ isHydrated: true });
            },

            realtimeProjectUpsert: (project: ResearchProject) => {
                set((state) => {
                    const exists = state.projects.some((p) => p.id === project.id);
                    const projects = exists
                        ? state.projects.map((p) => (p.id === project.id ? { ...p, ...project } : p))
                        : [project, ...state.projects];

                    const activeProject =
                        state.activeProject?.id === project.id
                            ? { ...state.activeProject, ...project }
                            : state.activeProject;

                    return { projects, activeProject };
                });
            },

            realtimeProjectDelete: (projectId: string) => {
                set((state) => {
                    const projects = state.projects.filter((p) => p.id !== projectId);
                    const isActive = state.activeProject?.id === projectId;
                    return {
                        projects,
                        activeProject: isActive ? null : state.activeProject,
                        activePlan: isActive ? null : state.activePlan,
                        messages: isActive ? [] : state.messages,
                    };
                });
            },

            realtimeMessageUpsert: (message: ChatMessage) => {
                set((state) => {
                    const updatedProjects = state.projects.map((project) =>
                        project.id === message.projectId
                            ? {
                                ...project,
                                lastMessageAt: message.timestamp ?? project.lastMessageAt,
                                updatedAt: message.timestamp ? Math.max(project.updatedAt, message.timestamp) : project.updatedAt,
                            }
                            : project
                    );

                    const isActiveProject = state.activeProject?.id === message.projectId;
                    const messages = isActiveProject
                        ? (() => {
                            const existingIndex = state.messages.findIndex((m) => m.id === message.id);
                            if (existingIndex >= 0) {
                                const cloned = [...state.messages];
                                cloned[existingIndex] = { ...cloned[existingIndex], ...message };
                                return cloned;
                            }
                            const merged = [...state.messages, message];
                            return merged.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                        })()
                        : state.messages;

                    const activeProject = isActiveProject
                        ? {
                            ...state.activeProject!,
                            lastMessageAt: message.timestamp ?? state.activeProject?.lastMessageAt,
                            updatedAt: message.timestamp
                                ? Math.max(state.activeProject?.updatedAt ?? 0, message.timestamp)
                                : state.activeProject?.updatedAt ?? 0,
                        }
                        : state.activeProject;

                    return {
                        projects: updatedProjects,
                        messages,
                        activeProject,
                    };
                });
            },

            loadProjects: async () => {
                set({ isLoading: true });
                try {
                    const apiUser = await ensureBackendUser();
                    const projects = await ProjectService.list(apiUser.id);
                    set({ projects });
                } catch (error) {
                    console.error('Failed to reach API for projects', error);
                    set({ projects: [] });
                } finally {
                    set({ isLoading: false });
                }
            },

            loadProjectStats: async () => {
                try {
                    const apiUser = await ensureBackendUser();
                    const stats = await ProjectService.stats(apiUser.id);
                    set({ projectStats: stats });
                } catch (error) {
                    console.error('Failed to load project stats', error);
                    set({ projectStats: null });
                }
            },

            loadActivityFeed: async (limit = 10) => {
                try {
                    const apiUser = await ensureBackendUser();
                    const activity = await ProjectService.activity(apiUser.id, limit);
                    set({ activityFeed: activity });
                } catch (error) {
                    console.error('Failed to load activity feed', error);
                    set({ activityFeed: [] });
                }
            },

            createProject: async (title: string, goal: string) => {
                set({ isLoading: true });
                try {
                    const ensuredUser = await ensureBackendUser();
                    const project = await ProjectService.create(title, goal, ensuredUser.id);
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
                    throw error instanceof Error ? error : new Error('Failed to create project');
                } finally {
                    set({ isLoading: false });
                }
            },

            updateProject: async (projectId: string, payload: { title?: string; goal?: string; status?: ResearchProject['status'] }) => {
                set({ isLoading: true });
                try {
                    const updated = await ProjectService.update(projectId, payload);
                    set((state) => ({
                        projects: state.projects.map((p) => (p.id === projectId ? { ...p, ...updated } : p)),
                        activeProject:
                            state.activeProject && state.activeProject.id === projectId
                                ? { ...state.activeProject, ...updated }
                                : state.activeProject,
                    }));
                    return updated;
                } catch (error) {
                    console.error('Failed to update project', error);
                    return null;
                } finally {
                    set({ isLoading: false });
                }
            },

            deleteProject: async (projectId: string) => {
                set({ isLoading: true });
                try {
                    await ProjectService.delete(projectId);
                    set((state) => {
                        const remaining = state.projects.filter((p) => p.id !== projectId);
                        const isActive = state.activeProject?.id === projectId;
                        return {
                            projects: remaining,
                            activeProject: isActive ? null : state.activeProject,
                            activePlan: isActive ? null : state.activePlan,
                            messages: isActive ? [] : state.messages,
                        };
                    });
                    return true;
                } catch (error) {
                    console.error('Failed to delete project', error);
                    return false;
                } finally {
                    set({ isLoading: false });
                }
            },

            selectProject: async (projectId: string) => {
                set({ isLoading: true, activeProject: null, messages: [], activePlan: null });
                try {
                    const project = await ProjectService.get(projectId);
                    let messages: ChatMessage[] = [];
                    let plan: ResearchPlan | null = null;

                    try {
                        messages = await ChatService.getMessages(projectId);
                    } catch (msgErr) {
                        console.error('Failed to load messages', msgErr);
                        messages = [];
                    }

                    try {
                        plan = await ProjectService.getPlan(projectId);
                    } catch (planErr) {
                        console.error('Failed to load plan', planErr);
                        plan = null;
                    }

                    set({ activeProject: project, messages, activePlan: plan });
                } catch (error) {
                    if (error instanceof ApiError && error.status === 404) {
                        set((state) => ({
                            projects: state.projects.filter((p) => p.id !== projectId),
                            activeProject: null,
                            activePlan: null,
                            messages: [],
                        }));
                        return;
                    }
                    set({ activeProject: null, messages: [], activePlan: null });
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
                    const lastTimestamp = agentMessage?.timestamp ?? userMessage.timestamp;
                    set((state) => {
                        const updatedProjects = state.projects.map((project) =>
                            project.id === activeProject.id
                                ? { ...project, lastMessageAt: lastTimestamp, updatedAt: lastTimestamp }
                                : project
                        );

                        return {
                            projects: updatedProjects,
                            activeProject: state.activeProject
                                ? { ...state.activeProject, lastMessageAt: lastTimestamp, updatedAt: lastTimestamp }
                                : null,
                            messages: agentMessage
                                ? [...state.messages, userMessage, agentMessage]
                                : [...state.messages, userMessage],
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
                const normalizePreferences = (prefs: unknown): User['preferences'] => {
                    const incoming = (prefs as User['preferences']) || { theme: 'system' };
                    const theme = incoming.theme;
                    const normalizedTheme: User['preferences']['theme'] =
                        theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'system';
                    return { ...incoming, theme: normalizedTheme };
                };
                let accessToken: string | null = null;
                try {
                    // Prime session first to avoid transient AuthSessionMissingError on reload, but do not set the app session cookie yet.
                    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                    if (sessionError) {
                        console.error('Failed to get Supabase session', sessionError);
                        await syncSessionCookies({ accessToken: null, mfaPending: false });
                        return;
                    }
                    accessToken = sessionData?.session?.access_token ?? null;
                    const hasSession = Boolean(sessionData?.session);
                    if (!hasSession) {
                        clearMfaVerified();
                        await syncSessionCookies({ accessToken: null, mfaPending: false });
                        set({
                            user: null,
                            mfaRequired: false,
                            mfaChallengeId: null,
                            mfaFactorId: null,
                        });
                        return;
                    }

                    let authUser = sessionData?.session?.user ?? null;
                    if (!authUser) {
                        const { user: sessionUser, error: authUserError } = await getSessionUser();
                        if (authUserError) {
                            console.error('Failed to get Supabase user', authUserError);
                            await syncSessionCookies({ accessToken: null, mfaPending: false });
                            return;
                        }
                        authUser = sessionUser;
                    }
                    if (!authUser) {
                        set({
                            user: null,
                            ...baseMfaState,
                        });
                        await syncSessionCookies({ accessToken: null, mfaPending: false });
                        return;
                    }

                    const authProfile = extractAuthProfile(authUser);

                    // Enforce MFA even for OAuth sessions: if a verified TOTP factor exists, start a challenge and gate login.
                    const { mfaRequired, mfaChallengeId, mfaFactorId } = get();
                    const { data: factors, error: factorError } = await fetchMfaFactors({ userId: authUser.id });
                    if (factorError) {
                        console.error('Failed to list MFA factors', factorError);
                        if (mfaRequired || mfaChallengeId) {
                            // Stay locked until we can conclusively determine MFA status.
                            await syncSessionCookies({ accessToken, mfaPending: true });
                            set({
                                user: null,
                                mfaRequired: true,
                                mfaChallengeId,
                                mfaFactorId,
                            });
                            return;
                        }
                    }

                    const verifiedTotp = factors?.totp?.find((f) => f.status === 'verified');
                    const alreadyVerified = readMfaVerified(accessToken || undefined);
                    const needsMfa = Boolean(verifiedTotp) && !alreadyVerified;

                    if (needsMfa) {
                        if (!verifiedTotp) {
                            await syncSessionCookies({ accessToken, mfaPending: true });
                            set({
                                user: null,
                                mfaRequired: true,
                                mfaChallengeId: null,
                                mfaFactorId: null,
                            });
                            return;
                        }
                        // If we already have a challenge in progress for this factor, keep the gate up.
                        if (mfaRequired && mfaChallengeId && mfaFactorId === verifiedTotp?.id) {
                            await syncSessionCookies({ accessToken, mfaPending: true });
                            set({
                                user: null,
                                mfaRequired: true,
                                mfaChallengeId,
                                mfaFactorId,
                            });
                            return;
                        }

                        const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
                            factorId: verifiedTotp.id,
                        });
                        if (challengeError || !challenge?.id) {
                            console.error('Unable to start MFA challenge', challengeError);
                            await syncSessionCookies({ accessToken, mfaPending: true });
                            set({
                                user: null,
                                mfaRequired: true,
                                mfaChallengeId: null,
                                mfaFactorId: verifiedTotp.id,
                            });
                            return;
                        }
                        // Clear session cookie until MFA completes to keep middleware from granting access.
                        await syncSessionCookies({ accessToken, mfaPending: true });
                        set({
                            ...baseMfaState,
                            mfaRequired: true,
                            mfaChallengeId: challenge.id,
                            mfaFactorId: verifiedTotp.id,
                            user: null,
                        });
                        return;
                    }

                    // If MFA was previously required but the token is now verified, clear the gate flags.
                    if ((mfaRequired || mfaChallengeId || mfaFactorId) && alreadyVerified) {
                        set({
                            mfaRequired: false,
                            mfaChallengeId: null,
                            mfaFactorId: null,
                        });
                    }

                    let profileErrorNote: unknown = null;

                    // Prefer canonical profile via service-role proxy to include avatar.
                    try {
                        const profileRes = accessToken
                            ? await fetch('/api/profile', {
                                headers: { authorization: `Bearer ${accessToken}` },
                            })
                            : null;
                        if (profileRes?.ok) {
                            const data = await profileRes.json();
                            const profile = (data?.user as ProfileRow | null) ?? null;
                            if (profile) {
                                const safeName = profile.name || authProfile.name || '';
                                const safeAvatar = profile.avatar_url ?? authProfile.avatarUrl ?? undefined;
                                const preferences = normalizePreferences(profile.preferences);
                                const timezone = resolveTimezonePreference(get().timezone, preferences);
                                set({
                                    user: {
                                        id: profile.id,
                                        email: profile.email || authProfile.email || authUser.email || '',
                                        name: safeName,
                                        avatarUrl: safeAvatar,
                                        preferences,
                                    },
                                    timezone,
                                });
                                await syncSessionCookies({ accessToken, mfaPending: false });
                                markMfaVerified(accessToken || undefined);
                                void touchDevice(false);
                                return;
                            }
                        }
                    } catch (apiError) {
                        profileErrorNote = apiError;
                        console.warn('Profile API failed, falling back to Supabase', apiError);
                    }

                    // Second try: direct Supabase profile (RLS must allow).
                    try {
                        const { data: profiles, error: profileError } = await supabase
                            .from('users')
                            .select('id, email, name, avatar_url, preferences')
                            .eq('email', authUser.email ?? '')
                            .limit(1)
                            .returns<ProfileRow[]>();
                        if (!profileError && profiles && profiles.length > 0) {
                            const profile = profiles[0];
                            if (profile.id !== authUser.id) {
                                throw new Error('Auth/profile mismatch');
                            }
                            const preferences = normalizePreferences(profile.preferences);
                            const timezone = resolveTimezonePreference(get().timezone, preferences);
                            set({
                                user: {
                                    id: profile.id,
                                    email: profile.email,
                                    name: profile.name || authProfile.name || '',
                                    avatarUrl: profile.avatar_url ?? authProfile.avatarUrl ?? undefined,
                                    preferences,
                                },
                                timezone,
                            });
                            await syncSessionCookies({ accessToken, mfaPending: false });
                            markMfaVerified(accessToken || undefined);
                            void touchDevice(false);
                            return;
                        }
                        // If RLS blocked or no profile yet, fall through to metadata fallback.
                        profileErrorNote = profileErrorNote || profileError || 'no-profile-row';
                    } catch (fallbackError) {
                        profileErrorNote = profileErrorNote || fallbackError;
                        console.warn('Supabase profile query failed', fallbackError);
                    }

                    // Last fallback: Supabase auth metadata.
                    if (profileErrorNote) {
                        console.warn('Supabase profile fallback in use', profileErrorNote);
                    }
                    const preferences = { theme: 'system' };
                    const timezone = resolveTimezonePreference(get().timezone, preferences);
                    set({
                        user: {
                            id: authUser.id,
                            email: authProfile.email || authUser.email || '',
                            name: authProfile.name || '',
                            avatarUrl: authProfile.avatarUrl,
                            preferences,
                        },
                        timezone,
                    });
                    await syncSessionCookies({ accessToken, mfaPending: false });
                    markMfaVerified(accessToken || undefined);
                    void touchDevice(false);
                } catch (error) {
                    console.error('Failed to refresh user', error);
                    await syncSessionCookies({ accessToken: null, mfaPending: false });
                    set({
                        user: null,
                        ...baseMfaState,
                    });
                }
            },
    };
}, {
    name: STORE_KEY,
    version: 2,
    // Persist only lightweight, long-lived data. Avoid caching projects/messages in localStorage to reduce payload and stale state.
    partialize: (state) => ({
        user: state.user
            ? {
                ...state.user,
                preferences: state.user.preferences ?? { theme: 'system' },
            }
            : null,
        timezone: state.timezone,
    }),
    migrate: (persistedState, version): { user: User | null; timezone: string } => {
        const deviceTimezone = getDeviceTimezone() || 'UTC';
        if (version < 2) {
            const legacy = persistedState as Partial<AppState>;
            return {
                user: legacy.user ?? null,
                timezone: legacy.timezone ?? deviceTimezone,
            };
        }
        const current = persistedState as { user?: User | null; timezone?: string };
        return {
            user: current.user ?? null,
            timezone: current.timezone ?? deviceTimezone,
        };
    },
    onRehydrateStorage: () => (state) => {
        // Mark store as hydrated once localStorage data is loaded
        state?.setHydrated();
    },
}));
