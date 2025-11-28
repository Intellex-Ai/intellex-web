import { User } from '@/types';
import { apiRequest } from './client';

export const AuthService = {
    login: (email: string, name?: string) =>
        apiRequest<User>('/auth/login', {
            method: 'POST',
            body: { email, name },
        }),

    current: () => apiRequest<User>('/auth/me'),
};
