import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface RequestOptions extends RequestInit {
    workspaceId?: string;
}

export async function apiClient(endpoint: string, options: RequestOptions = {}) {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        throw new Error('Unauthorized');
    }

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        ...options.headers,
    };

    if (options.workspaceId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (headers as any)['x-workspace-id'] = options.workspaceId;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || response.statusText);
    }

    return response.json();
}
