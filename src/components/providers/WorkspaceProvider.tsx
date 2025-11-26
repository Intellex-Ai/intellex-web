'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // In a real app, you'd fetch this from your backend or Supabase table
            // For now, we'll mock a default workspace for the user
            const defaultWorkspace = {
                id: 'default-workspace', // This should be a real UUID in production
                name: 'My Workspace',
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
