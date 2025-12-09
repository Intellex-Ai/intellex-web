import { ApiKeySummary } from '@/types';
import { api } from './client';

type ApiKeysResponse = {
    keys: ApiKeySummary[];
};

export const UserService = {
    getApiKeys: () => api.get<ApiKeysResponse>('/users/api-keys'),
    saveApiKeys: (payload: { openai?: string; anthropic?: string }) =>
        api.post<ApiKeysResponse>('/users/api-keys', payload),
};
