'use client';

import { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store';
import { DeviceService } from '@/services/api/device';
import { getDeviceId } from '@/lib/device';
import { handleRemoteSignOut } from '@/lib/session';
import { supabase } from '@/lib/supabase';

// Reduce background churn: poll infrequently, pause when hidden, and only while authenticated in app shell.
const VISIBLE_POLL_MS = 30_000;
const HIDDEN_POLL_MS = 2 * 60_000;

export function DeviceRevocationWatcher() {
    const userId = useStore((state) => state.user?.id);
    const pathname = usePathname();
    const isAppRoute = useMemo(
        () => Boolean(pathname && /^\/(dashboard|projects|research|settings|profile)/.test(pathname)),
        [pathname],
    );

    useEffect(() => {
        if (!userId || !isAppRoute) return;

        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | null = null;
        let checking = false;

        const scheduleNext = (delay: number) => {
            if (cancelled) return;
            if (timer) clearTimeout(timer);
            timer = setTimeout(check, delay);
        };

        const check = async () => {
            if (cancelled) return;
            const visible = typeof document === 'undefined' ? true : !document.hidden;
            const nextDelay = visible ? VISIBLE_POLL_MS : HIDDEN_POLL_MS;
            if (checking) {
                scheduleNext(nextDelay);
                return;
            }
            checking = true;

            try {
                const { data } = await supabase.auth.getSession();
                if (!data.session) return;

                const deviceId = getDeviceId();
                if (!deviceId) return;

                const res = await DeviceService.list();
                const current = res.devices.find((d) => d.deviceId === deviceId);
                if (current?.revokedAt) {
                    await handleRemoteSignOut('This device was revoked on another session.');
                    return;
                }
            } catch (err) {
                const message = err instanceof Error ? err.message.toLowerCase() : '';
                if (message.includes('revoked') || message.includes('signed out')) {
                    await handleRemoteSignOut('This device was revoked on another session.');
                }
            } finally {
                checking = false;
                scheduleNext(nextDelay);
            }
        };

        const handleVisibility = () => {
            scheduleNext(0);
        };

        scheduleNext(0);
        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('focus', handleVisibility);

        return () => {
            cancelled = true;
            if (timer) clearTimeout(timer);
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('focus', handleVisibility);
        };
    }, [userId, isAppRoute]);

    return null;
}
