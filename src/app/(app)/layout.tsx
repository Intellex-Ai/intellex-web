import { AppLayout } from '@/components/layout/AppLayout';
import { WorkspaceProvider } from '@/components/providers/WorkspaceProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { DeviceRevocationWatcher } from '@/components/auth/DeviceRevocationWatcher';
import { ToastProvider } from '@/components/ui/ToastProvider';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <WorkspaceProvider>
                <ToastProvider>
                    <DeviceRevocationWatcher />
                    <AppLayout>{children}</AppLayout>
                </ToastProvider>
            </WorkspaceProvider>
        </ThemeProvider>
    );
}
