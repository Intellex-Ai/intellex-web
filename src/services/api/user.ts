import type { ApiKeyPayload, ApiKeysResponse } from '@intellex/shared-client';

import { usersApi, withApiError } from './client';


export const UserService = {
    getApiKeys: (): Promise<ApiKeysResponse> => withApiError(() => usersApi.getApiKeysUsersApiKeysGet({})),
    saveApiKeys: (payload: ApiKeyPayload): Promise<ApiKeysResponse> =>
        withApiError(() => usersApi.saveApiKeysUsersApiKeysPost({ apiKeyPayload: payload })),
};
