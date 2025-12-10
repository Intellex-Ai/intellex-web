import { AppLayout } from '@/components/layout/AppLayout';
import { WorkspaceProvider } from '@/components/providers/WorkspaceProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <WorkspaceProvider>
                <AppLayout>{children}</AppLayout>
            </WorkspaceProvider>
        </ThemeProvider>
    );
}
