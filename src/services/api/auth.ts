import { User } from '@/types';
import { api } from './client';

export const AuthService = {
    login: (email: string, name?: string, supabaseUserId?: string) =>
        api.post<User>('/auth/login', { email, ...(name ? { name } : {}), ...(supabaseUserId ? { supabaseUserId } : {}) }),
    current: (email?: string) => api.get<User>('/auth/me', email ? { email } : undefined),
};
