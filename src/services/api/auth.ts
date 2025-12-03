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
    current: (email?: string) => api.get<User>('/auth/me', email ? { email } : undefined),
    deleteAccount: (payload: { userId?: string; email?: string; supabaseUserId?: string }) =>
        api.request<DeleteAccountResponse>('/auth/account', { method: 'DELETE', body: payload }),
};
