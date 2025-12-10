// Always prefer same-origin API unless explicitly overridden by env to avoid CORS / SW issues.
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || '/api').replace(/\/$/, '');

import { supabase } from '@/lib/supabase';
import { handleRemoteSignOut } from '@/lib/session';
import { getDeviceHeaders } from '@/lib/device';

export class ApiError extends Error {
    status: number;
    detail?: unknown;

    constructor(message: string, status: number, detail?: unknown) {
        super(message);
        this.status = status;
        this.detail = detail;
    }
}

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
    body?: Record<string, unknown> | string | FormData | null;
};

const buildUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

const getAccessToken = async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    try {
        const { data } = await supabase.auth.getSession();
        return data?.session?.access_token ?? null;
    } catch {
        return null;
    }
};

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const url = buildUrl(path);
    const { body, headers: incomingHeaders, method, ...rest } = options;
    const headers: HeadersInit = {
        ...(incomingHeaders || {}),
    };

    Object.assign(headers, getDeviceHeaders());

    const accessToken = await getAccessToken();
    if (accessToken && !(headers as Record<string, string>)['Authorization']) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }

    const hasBody = body !== undefined && body !== null;
    const shouldSetJson =
        hasBody &&
        !(body instanceof FormData) &&
        !(typeof body === 'string') &&
        !(headers as Record<string, string>)['Content-Type'];
    if (shouldSetJson) {
        (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    const init: RequestInit = {
        cache: 'no-store',
        ...rest,
        method: method || 'GET',
        headers,
    };

    if (hasBody) {
        if (body instanceof FormData) {
            delete (init.headers as Record<string, string>)['Content-Type'];
            init.body = body;
        } else if (typeof body === 'string') {
            init.body = body;
        } else {
            init.body = JSON.stringify(body);
        }
    }

    let response: Response;
    try {
        response = await fetch(url, init);
    } catch (networkError) {
        throw new ApiError('Unable to reach API. Is the backend running and the base URL correct?', 0, networkError);
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    let data: unknown = null;

    try {
        data = isJson ? await response.json() : await response.text();
    } catch {
        // Fall through with null data if body is empty or unparsable.
    }

    if (!response.ok) {
        const detailMessage =
            typeof data === 'object' && data !== null
                ? (data as { detail?: string; message?: string }).detail ||
                (data as { detail?: string; message?: string }).message
                : undefined;
        const message =
            (typeof data === 'string' && data.trim().length > 0 && data) ||
            detailMessage ||
            response.statusText ||
            'Request failed';

        if (typeof window !== 'undefined' && (response.status === 401 || response.status === 403)) {
            const lowered = (message || '').toLowerCase();
            if (lowered.includes('signed out') || lowered.includes('revoked')) {
                void handleRemoteSignOut(message);
            }
        }
        throw new ApiError(message, response.status, data);
    }

    return data as T;
}

const withQuery = (path: string, params?: Record<string, string | number | undefined | null>) => {
    if (!params) return path;
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) searchParams.append(key, String(val));
    });
    const query = searchParams.toString();
    return query ? `${path}?${query}` : path;
};

export const api = {
    request,
    get: <T>(path: string, params?: Record<string, string | number | undefined | null>) =>
        request<T>(withQuery(path, params), { method: 'GET' }),
    post: <T>(path: string, body?: ApiRequestOptions['body']) => request<T>(path, { method: 'POST', body }),
    put: <T>(path: string, body?: ApiRequestOptions['body']) => request<T>(path, { method: 'PUT', body }),
    del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// Backwards compatibility
export const apiRequest = request;
