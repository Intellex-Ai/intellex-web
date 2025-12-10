const DEVICE_KEY = 'intellex:device-id';

const safeLocalStorage = () => {
    if (typeof window === 'undefined') return null;
    try {
        return window.localStorage;
    } catch {
        return null;
    }
};

export const getDeviceId = (): string | null => {
    const storage = safeLocalStorage();
    if (!storage) return null;

    try {
        const existing = storage.getItem(DEVICE_KEY);
        if (existing) return existing;
        const fallbackId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `device-${Math.random().toString(36).slice(2, 10)}`;
        storage.setItem(DEVICE_KEY, fallbackId);
        return fallbackId;
    } catch {
        return null;
    }
};

const getUserAgentData = (): { browser?: string; platform?: string } => {
    if (typeof navigator === 'undefined') return {};
    const uaData = (navigator as unknown as { userAgentData?: { brands?: { brand: string }[]; platform?: string } }).userAgentData;
    const browser = uaData?.brands?.[0]?.brand;
    const platform = uaData?.platform;
    return { browser, platform };
};

export const collectDeviceProfile = () => {
    const deviceId = getDeviceId();
    if (!deviceId || typeof navigator === 'undefined') {
        return { deviceId };
    }

    const { browser, platform: dataPlatform } = getUserAgentData();
    const platform = navigator.platform || dataPlatform || undefined;

    return {
        deviceId,
        userAgent: navigator.userAgent,
        platform,
        browser,
        os: dataPlatform || platform,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: navigator.language,
        screen: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : undefined,
        deviceMemory: (navigator as unknown as { deviceMemory?: number }).deviceMemory,
    };
};

export const getDeviceHeaders = () => {
    const deviceId = getDeviceId();
    return deviceId ? { 'X-Device-Id': deviceId } : {};
};
