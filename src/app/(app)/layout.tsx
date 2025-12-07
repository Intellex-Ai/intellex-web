import { AppLayout } from '@/components/layout/AppLayout';
import { WorkspaceProvider } from '@/components/providers/WorkspaceProvider';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <WorkspaceProvider>
            <AppLayout>{children}</AppLayout>
        </WorkspaceProvider>
    );
}
