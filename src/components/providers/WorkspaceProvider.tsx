'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { getSessionUser } from '@/lib/auth-user';

interface Workspace {
    id: string;
    name: string;
    role: string;
}

interface WorkspaceContextType {
    workspaceId: string | null;
    setWorkspaceId: (id: string) => void;
    workspaces: Workspace[];
    loading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const [workspaceId, setWorkspaceId] = useState<string | null>(null);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadWorkspaces() {
            const { user, error } = await getSessionUser();
            if (error || !user) {
                setWorkspaces([]);
                setWorkspaceId(null);
                setLoading(false);
                return;
            }

            // Placeholder workspace derived from Supabase auth identity.
            const defaultWorkspace = {
                id: user.id,
                name: user.email ?? 'My Workspace',
                role: 'owner'
            };

            setWorkspaces([defaultWorkspace]);
            setWorkspaceId(defaultWorkspace.id);
            setLoading(false);
        }

        loadWorkspaces();
    }, []);

    return (
        <WorkspaceContext.Provider value={{ workspaceId, setWorkspaceId, workspaces, loading }}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
}
