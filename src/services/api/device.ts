import type {
    DeviceDeleteResponse,
    DeviceListResponse,
    DeviceRecord,
    DeviceRevokeRequest,
    DeviceRevokeResponse,
    DeviceUpsertRequest,
} from '@intellex/shared-client';

import { authApi, withApiError } from './client';
import { collectDeviceProfile } from '@/lib/device';

export const DeviceService = {
    list: (): Promise<DeviceListResponse> => withApiError(() => authApi.listDevicesAuthDevicesGet({})),
    register: async (payload?: Partial<DeviceUpsertRequest>): Promise<DeviceRecord | null> => {
        const profile = collectDeviceProfile();
        if (!profile.deviceId) return null;

        const body: DeviceUpsertRequest = {
            ...profile,
            ...payload,
            deviceId: profile.deviceId,
            login: Boolean(payload?.login),
        };

        return withApiError(() => authApi.upsertDeviceAuthDevicesPost({ deviceUpsertRequest: body }));
    },
    revoke: (payload: DeviceRevokeRequest): Promise<DeviceRevokeResponse> =>
        withApiError(() => authApi.revokeDevicesAuthDevicesRevokePost({ deviceRevokeRequest: payload })),
    remove: (deviceId: string): Promise<DeviceDeleteResponse> =>
        withApiError(() => authApi.deleteDeviceAuthDevicesDeviceIdDelete({ deviceId })),
};
