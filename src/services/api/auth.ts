import { User } from '@/types';
import { api } from './client';

type DeleteAccountResponse = {
    deleted: boolean;
    profileDeleted?: boolean;
    authDeleted?: boolean;
};

export const AuthService = {
    login: (email: string, name?: string, supabaseUserId?: string) =>
        api.post<User>('/auth/login', { email, ...(name ? { name } : {}), ...(supabaseUserId ? { supabaseUserId } : {}) }),
    current: (params?: { email?: string; userId?: string }) => api.get<User>('/auth/me', params),
    deleteAccount: (payload: { userId?: string; email?: string; supabaseUserId?: string }) =>
        api.request<DeleteAccountResponse>('/auth/account', { method: 'DELETE', body: payload }),
};
