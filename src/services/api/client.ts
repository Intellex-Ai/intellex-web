// Always prefer same-origin API unless explicitly overridden by env to avoid CORS / SW issues.
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || '/api').replace(/\/$/, '');

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

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const url = buildUrl(path);
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    const init: RequestInit = {
        method: options.method || 'GET',
        headers,
        cache: 'no-store',
    };

    if (options.body) {
        if (options.body instanceof FormData) {
            delete (init.headers as Record<string, string>)['Content-Type'];
            init.body = options.body;
        } else if (typeof options.body === 'string') {
            init.body = options.body;
        } else {
            init.body = JSON.stringify(options.body);
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
