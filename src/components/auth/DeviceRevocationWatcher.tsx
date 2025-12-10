'use client';

import { useEffect } from 'react';
import { DeviceService } from '@/services/api/device';
import { getDeviceId } from '@/lib/device';
import { handleRemoteSignOut } from '@/lib/session';

const POLL_INTERVAL_MS = 5_000;

export function DeviceRevocationWatcher() {
    useEffect(() => {
        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | null = null;
        let checking = false;

        const check = async () => {
            if (checking) return;
            checking = true;
            const deviceId = getDeviceId();
            if (!deviceId) return;
            try {
                const res = await DeviceService.list();
                const current = res.devices.find((d) => d.deviceId === deviceId);
                if (current?.revokedAt) {
                    await handleRemoteSignOut('This device was revoked on another session.');
                }
            } catch (err) {
                const message = err instanceof Error ? err.message.toLowerCase() : '';
                if (message.includes('revoked') || message.includes('signed out')) {
                    await handleRemoteSignOut('This device was revoked on another session.');
                }
            } finally {
                checking = false;
                if (!cancelled) {
                    timer = setTimeout(check, POLL_INTERVAL_MS);
                }
            }
        };

        const handleVisibility = () => {
            if (!document.hidden) {
                void check();
            }
        };

        void check();
        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('focus', handleVisibility);

        return () => {
            cancelled = true;
            if (timer) clearTimeout(timer);
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('focus', handleVisibility);
        };
    }, []);

    return null;
}
