import { User } from '@/types';
import { apiRequest } from './client';

export const AuthService = {
    login: (email: string, name?: string) => {
        const body: Record<string, unknown> = { email };
        if (name) body.name = name;
        return apiRequest<User>('/auth/login', {
            method: 'POST',
            body,
        });
    },

    current: (email?: string) => apiRequest<User>(email ? `/auth/me?email=${encodeURIComponent(email)}` : '/auth/me'),
};
