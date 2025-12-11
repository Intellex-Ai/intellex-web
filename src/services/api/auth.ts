import type { DeleteAccountRequest, LoginRequest, User } from '@intellex/shared-client';

import { authApi, withApiError } from './client';

type DeleteAccountResponse = {
    deleted: boolean;
    profileDeleted?: boolean;
    authDeleted?: boolean;
};

export const AuthService = {
    login: (email: string, name?: string, supabaseUserId?: string): Promise<User> => {
        const payload: LoginRequest = {
            email,
            ...(name ? { name } : {}),
            ...(supabaseUserId ? { supabaseUserId } : {}),
        };
        return withApiError(() => authApi.loginAuthLoginPost({ loginRequest: payload }));
    },
    current: (params?: { email?: string; userId?: string }): Promise<User> =>
        withApiError(() => authApi.currentUserAuthMeGet({ email: params?.email ?? undefined, userId: params?.userId ?? undefined })),
    deleteAccount: (payload: DeleteAccountRequest): Promise<DeleteAccountResponse> =>
        withApiError(() => authApi.deleteAccountAuthAccountDelete({ deleteAccountRequest: payload })),
};
