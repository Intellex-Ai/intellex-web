import { AuthApi, Configuration, ProjectsApi, ResponseError, UsersApi, type Middleware } from '@intellex/shared-client';

import { supabase } from '@/lib/supabase';
import { handleRemoteSignOut } from '@/lib/session';
import { getDeviceId } from '@/lib/device';

// Always prefer same-origin API unless explicitly overridden by env to avoid CORS / SW issues.
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || '/api').replace(/\/+$/, '') || '/api';

export class ApiError extends Error {
    status: number;
    detail?: unknown;

    constructor(message: string, status: number, detail?: unknown) {
        super(message);
        this.status = status;
        this.detail = detail;
    }
}

const getAccessToken = async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    try {
        const { data } = await supabase.auth.getSession();
        return data?.session?.access_token ?? null;
    } catch {
        return null;
    }
};

const authMiddleware: Middleware = {
    pre: async ({ url, init }) => {
        const headers = new Headers(init.headers || {});
        const token = await getAccessToken();
        if (token && !headers.has('authorization')) {
            headers.set('authorization', `Bearer ${token}`);
        }
        const deviceId = getDeviceId();
        if (deviceId && !headers.has('x-device-id')) {
            headers.set('x-device-id', deviceId);
        }
        return { url, init: { ...init, headers } };
    },
};

const configuration = new Configuration({
    basePath: API_BASE_URL,
    middleware: [authMiddleware],
});

export const authApi = new AuthApi(configuration);
export const projectsApi = new ProjectsApi(configuration);
export const usersApi = new UsersApi(configuration);

const toApiError = async (error: unknown): Promise<ApiError> => {
    if (error instanceof ApiError) {
        return error;
    }

    if (error instanceof ResponseError) {
        const { response } = error;
        const clone = response.clone();
        let detail: unknown = null;
        let message = 'Request failed';

        try {
            const data = await clone.json();
            detail = data;
            const extracted = (data as { detail?: string; message?: string }).detail || (data as { detail?: string; message?: string }).message;
            if (typeof extracted === 'string' && extracted.trim()) {
                message = extracted;
            }
        } catch {
            try {
                const text = await clone.text();
                if (text) {
                    detail = text;
                    message = text;
                }
            } catch {
                // ignore parse errors
            }
        }

        if (typeof window !== 'undefined' && (response.status === 401 || response.status === 403)) {
            const lowered = (message || '').toLowerCase();
            if (lowered.includes('signed out') || lowered.includes('revoked')) {
                void handleRemoteSignOut(message);
            }
        }

        return new ApiError(message, response.status, detail);
    }

    const fallbackMessage = error instanceof Error ? error.message : 'Unknown error';
    return new ApiError(fallbackMessage, 0, error);
};

export const withApiError = async <T>(fn: () => Promise<T>): Promise<T> => {
    try {
        return await fn();
    } catch (err) {
        throw await toApiError(err);
    }
};
