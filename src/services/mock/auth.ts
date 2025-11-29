import { User } from '@/types';

const MOCK_USER: User = {
    id: 'user-1',
    email: '',
    name: '',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    preferences: {
        theme: 'system',
    },
};

export const MockAuthService = {
    login: async (_email: string): Promise<User> => { // eslint-disable-line @typescript-eslint/no-unused-vars
        await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate network delay
        return MOCK_USER;
    },

    logout: async (): Promise<void> => {
        await new Promise((resolve) => setTimeout(resolve, 400));
    },

    getCurrentUser: async (): Promise<User | null> => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return MOCK_USER; // Always logged in for dev convenience, or toggle logic
    },
};
