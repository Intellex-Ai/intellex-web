import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, ResearchProject, ResearchPlan, ChatMessage } from '@/types';
import { AuthService } from '@/services/api/auth';
import { ProjectService } from '@/services/api/projects';
import { ChatService } from '@/services/api/chat';
import { ApiError } from '@/services/api/client';
import { supabase } from '@/lib/supabase';
import { API_BASE_URL } from '@/services/api/client';

type ProfileRow = {
    id: string;
    email: string;
    name?: string | null;
    avatar_url?: string | null;
    preferences?: unknown;
};

const SESSION_COOKIE = 'intellex_session';
const MFA_PENDING_COOKIE = 'mfa_pending';
const MFA_VERIFIED_KEY = 'intellex:mfa-verified';
const baseMfaState = {
    mfaRequired: false,
    mfaChallengeId: null as string | null,
    mfaFactorId: null as string | null,
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
const getSiteBaseUrl = () => {
    if (typeof window !== 'undefined') return window.location.origin;
    if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
    return undefined;
};
const getCookieOptions = () => {
    // Don't set explicit Domain - let browser use current host (more reliable for same-domain cookies)
    const securePart = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
    return { securePart };
};

const setSessionCookie = (isLoggedIn: boolean) => {
    if (typeof document === 'undefined') return;
    const { securePart } = getCookieOptions();
    if (isLoggedIn) {
        document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${securePart}`;
    } else {
        document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax${securePart}`;
    }
};

const setMfaPendingCookie = (pending: boolean) => {
    if (typeof document === 'undefined') return;
    const { securePart } = getCookieOptions();
    if (pending) {
        document.cookie = `${MFA_PENDING_COOKIE}=1; path=/; max-age=${60 * 60}; SameSite=Lax${securePart}`;
    } else {
        document.cookie = `${MFA_PENDING_COOKIE}=; path=/; max-age=0; SameSite=Lax${securePart}`;
    }
};

interface AppState {
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

    // Actions
    login: (email: string, password: string, name?: string, mode?: 'login' | 'signup') => Promise<boolean>;
    loginWithProvider: (provider: 'google' | 'github', redirectTo?: string) => Promise<void>;
    verifyMfa: (code: string) => Promise<void>;
    logout: () => Promise<void>;
    loadProjects: () => Promise<void>;
    createProject: (title: string, goal: string) => Promise<ResearchProject | null>;
    selectProject: (projectId: string) => Promise<void>;
    sendMessage: (content: string) => Promise<void>;
    refreshUser: () => Promise<void>;
    clearSession: () => void;
    setTimezone: (timezone: string) => void;
    setHydrated: () => void;
}

export const useStore = create<AppState>()(persist((set, get) => ({
    user: null,
    projects: [],
    activeProject: null,
    activePlan: null,
    messages: [],
    isLoading: false,
    isHydrated: false,
    ...baseMfaState,
    timezone: 'UTC',

            login: async (email: string, password: string, name?: string, mode: 'login' | 'signup' = 'login'): Promise<boolean> => {
                set({
                    isLoading: true,
                    user: null,
                    ...baseMfaState,
                });
                clearMfaVerified();
                // Always clear the auth cookies before attempting a new login to avoid stale access.
                setSessionCookie(false);
                setMfaPendingCookie(false);
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
                            await supabase.auth.signOut().catch(() => {});
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

                    if (mode === 'signup') {
                        if (!name) {
                            throw new Error('Name is required for signup');
                        }
                        const provisioned = await maybeProvision();
                        if (provisioned) {
                            await signInPassword();
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
                            await supabase.auth.signOut().catch(() => {});
                            setSessionCookie(false);
                            const shouldResend = !data.session;
                            if (shouldResend) {
                                await resendConfirmation();
                            }
                            throw new Error('Please confirm your email to activate your account. Check your inbox for the link.');
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
                    // MFA gate: if a verified TOTP factor exists, start challenge and await code.
                    const { data: factors } = await supabase.auth.mfa.listFactors();
                    const verifiedTotp = factors?.totp?.find((f) => f.status === 'verified');
                    if (verifiedTotp) {
                        const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
                            factorId: verifiedTotp.id,
                        });
                        if (challengeError || !challenge?.id) {
                            throw challengeError || new Error('Unable to start MFA challenge.');
                        }
                        // Do NOT mark app session as active until MFA completes.
                        setSessionCookie(false);
                        setMfaPendingCookie(true);
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

                    const user = await AuthService.login(email, fallbackName, supabaseUserId);
                    set({ user });
                    return true;
                } catch (error) {
                    console.error('Login failed', error);
                    set({ user: null });
                    setSessionCookie(false);
                    setMfaPendingCookie(false);
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
                    const { user, mfaRequired } = get();
                    setSessionCookie(Boolean(user) && !mfaRequired);
                    set({ isLoading: false });
                }
            },

            loginWithProvider: async (provider: 'google' | 'github', redirectPath = '/dashboard') => {
                set({ isLoading: true, mfaRequired: false, mfaChallengeId: null, mfaFactorId: null });
                clearMfaVerified();
                setSessionCookie(false);
                setMfaPendingCookie(false);
                try {
                    const baseUrl = getSiteBaseUrl();
                    const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : undefined);
                    if (!origin) {
                        throw new Error('Unable to determine redirect URL. Please try again.');
                    }

                    const redirectTo = `${origin}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`;
                    const { data, error } = await supabase.auth.signInWithOAuth({
                        provider,
                        options: {
                            redirectTo,
                            scopes: provider === 'google' ? 'email profile' : undefined,
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
                const { mfaChallengeId, mfaFactorId, user } = get();
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
                    // Clear MFA pending cookie on successful verification.
                    setMfaPendingCookie(false);
                    set({
                        mfaRequired: false,
                        mfaChallengeId: null,
                        mfaFactorId: null,
                    });
                    // After successful MFA, refresh user to hydrate the app state and cookie.
                    await get().refreshUser();
                } catch (err) {
                    throw err instanceof Error ? err : new Error('MFA verification failed');
                } finally {
                    // If user was set during refresh, keep cookie in sync.
                    const { user: refreshed } = get();
                    setSessionCookie(Boolean(refreshed || user));
                    set({ isLoading: false });
                }
            },

            logout: async () => {
                try {
                    await supabase.auth.signOut();
                } catch (err) {
                    console.warn('Supabase signOut failed', err);
                }
                setSessionCookie(false);
                setMfaPendingCookie(false);
                clearMfaVerified();
                clearAuthState(set);
            },

            clearSession: () => {
                clearAuthState(set);
            },

            setTimezone: (timezone: string) => {
                set({ timezone });
            },

            setHydrated: () => {
                set({ isHydrated: true });
            },

            loadProjects: async () => {
                set({ isLoading: true });
                try {
                    const projects = await ProjectService.list();
                    set({ projects });
                } catch (error) {
                    console.error('Failed to reach API for projects', error);
                    set({ projects: [] });
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
                const normalizePreferences = (prefs: unknown): User['preferences'] => {
                    const incoming = (prefs as User['preferences']) || { theme: 'system' };
                    const theme = incoming.theme;
                    const normalizedTheme: User['preferences']['theme'] =
                        theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'system';
                    return { ...incoming, theme: normalizedTheme };
                };
                try {
                    // Prime session first to avoid transient AuthSessionMissingError on reload, but do not set the app session cookie yet.
                    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                    if (sessionError) {
                        console.error('Failed to get Supabase session', sessionError);
                        return;
                    }
                    const hasSession = Boolean(sessionData?.session);
                    // Default to no app session cookie until we confirm MFA status.
                    setSessionCookie(false);
                    if (!hasSession) {
                        clearMfaVerified();
                        setMfaPendingCookie(false);
                        set({
                            user: null,
                            mfaRequired: false,
                            mfaChallengeId: null,
                            mfaFactorId: null,
                        });
                        return;
                    }
                    const accessToken = sessionData?.session?.access_token;

                    const { data: userData, error: userError } = await supabase.auth.getUser();
                    if (userError) {
                        console.error('Failed to get Supabase user', userError);
                        return;
                    }

                    const authUser = userData?.user;
                    if (!authUser) {
                        set({
                            user: null,
                            ...baseMfaState,
                        });
                        return;
                    }

                    // Enforce MFA even for OAuth sessions: if a verified TOTP factor exists, start a challenge and gate login.
                    const { mfaRequired, mfaChallengeId, mfaFactorId } = get();
                    const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
                    if (listError) {
                        console.error('Failed to list MFA factors', listError);
                        if (mfaRequired || mfaChallengeId) {
                            // Stay locked until we can conclusively determine MFA status.
                            setSessionCookie(false);
                            setMfaPendingCookie(true);
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
                    const alreadyVerified = readMfaVerified(accessToken);
                    const needsMfa = Boolean(verifiedTotp) && !alreadyVerified;

                    if (needsMfa) {
                        if (!verifiedTotp) {
                            setSessionCookie(false);
                            setMfaPendingCookie(true);
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
                            setSessionCookie(false);
                            setMfaPendingCookie(true);
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
                            setSessionCookie(false);
                            setMfaPendingCookie(true);
                            set({
                                user: null,
                                mfaRequired: true,
                                mfaChallengeId: null,
                                mfaFactorId: verifiedTotp.id,
                            });
                            return;
                        }
                        // Clear session cookie until MFA completes to keep middleware from granting access.
                        setSessionCookie(false);
                        setMfaPendingCookie(true);
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
                        setMfaPendingCookie(false);
                        set({
                            mfaRequired: false,
                            mfaChallengeId: null,
                            mfaFactorId: null,
                        });
                    }

                    try {
                        // Prefer canonical profile via service-role proxy to include avatar.
                        const profileRes = await fetch(`/api/profile?email=${encodeURIComponent(authUser.email ?? '')}`);
                        if (profileRes.ok) {
                            const data = await profileRes.json();
                            const profile = (data?.user as ProfileRow | null) ?? null;
                            if (profile) {
                                set({
                                    user: {
                                        id: profile.id,
                                        email: profile.email,
                                        name: profile.name ?? profile.email ?? '',
                                        avatarUrl: profile.avatar_url ?? undefined,
                                        preferences: normalizePreferences(profile.preferences),
                                    },
                                });
                                setMfaPendingCookie(false);
                                setSessionCookie(true);
                                markMfaVerified(accessToken);
                                return;
                            }
                        }

                        // Fallback: backend auth/me (service role)
                        const latest = await AuthService.current(authUser.email || undefined);
                        set({ user: latest });
                        setMfaPendingCookie(false);
                        setSessionCookie(Boolean(latest));
                        if (latest) {
                            markMfaVerified(accessToken);
                        }
                    } catch (apiError) {
                        console.warn('Auth API current() failed, trying direct Supabase profile', apiError);

                        // Second try: direct Supabase profile (RLS must allow).
                        const { data: profiles, error: profileError } = await supabase
                            .from('users')
                            .select('id, email, name, avatar_url, preferences')
                            .eq('email', authUser.email ?? '')
                            .limit(1)
                            .returns<ProfileRow[]>();
                        if (!profileError && profiles && profiles.length > 0) {
                            const profile = profiles[0];
                            set({
                                user: {
                                    id: profile.id,
                                    email: profile.email,
                                    name: profile.name ?? profile.email ?? '',
                                    avatarUrl: profile.avatar_url ?? undefined,
                                    preferences: normalizePreferences(profile.preferences),
                                },
                            });
                            setMfaPendingCookie(false);
                            setSessionCookie(true);
                            markMfaVerified(accessToken);
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
                        setMfaPendingCookie(false);
                        setSessionCookie(true);
                        markMfaVerified(accessToken);
                    }
                } catch (error) {
                    console.error('Failed to refresh user', error);
                    setSessionCookie(false);
                    setMfaPendingCookie(false);
                    set({
                        user: null,
                        ...baseMfaState,
                    });
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
    onRehydrateStorage: () => (state) => {
        // Mark store as hydrated once localStorage data is loaded
        state?.setHydrated();
    },
}));
