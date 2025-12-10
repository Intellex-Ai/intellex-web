import { DeviceRecord, DeviceUpsertPayload } from '@/types';
import { api } from './client';
import { collectDeviceProfile } from '@/lib/device';

type DeviceListResponse = {
    devices: DeviceRecord[];
};

export const DeviceService = {
    list: () => api.get<DeviceListResponse>('/auth/devices'),
    register: async (payload?: Partial<DeviceUpsertPayload>) => {
        const profile = collectDeviceProfile();
        if (!profile.deviceId) return null;

        const body: DeviceUpsertPayload = {
            ...profile,
            ...payload,
            deviceId: profile.deviceId,
            login: Boolean(payload?.login),
        };

        return api.post<DeviceRecord>('/auth/devices', body);
    },
    revoke: (payload: { scope: 'single' | 'others' | 'all'; deviceId?: string }) =>
        api.post<{ revoked: number }>('/auth/devices/revoke', payload),
};
