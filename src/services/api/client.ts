const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

export class ApiError extends Error {
    status: number;
    detail?: unknown;

    constructor(message: string, status: number, detail?: unknown) {
        super(message);
        this.status = status;
        this.detail = detail;
    }
}

type ApiRequestOptions = RequestInit & {
    body?: Record<string, unknown> | string | FormData;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
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

    const response = await fetch(url, init);
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
        const message = (data && (data.detail || data.message)) || 'Request failed';
        throw new ApiError(message, response.status, data);
    }

    return data as T;
}

export { API_BASE_URL };
