export type User = {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    preferences: {
        theme: 'light' | 'dark' | 'system';
        title?: string;
        organization?: string;
        location?: string;
        bio?: string;
    };
};

export type AgentRole = 'planner' | 'researcher' | 'reviewer' | 'orchestrator';

export type Agent = {
    id: string;
    name: string;
    role: AgentRole;
    avatarUrl?: string;
    description: string;
};

export type MessageType = 'user' | 'agent' | 'system';

export type AgentThought = {
    id: string;
    title: string;
    content: string; // Markdown supported
    status: 'pending' | 'thinking' | 'completed';
    timestamp: number;
};

export type ChatMessage = {
    id: string;
    projectId: string;
    senderId: string;
    senderType: MessageType;
    content: string; // Markdown supported
    thoughts?: AgentThought[]; // For agent messages showing reasoning
    timestamp: number;
};

export type ResearchStatus = 'draft' | 'active' | 'completed' | 'archived';

export type ResearchProject = {
    id: string;
    userId: string;
    title: string;
    goal: string;
    status: ResearchStatus;
    createdAt: number;
    updatedAt: number;
    lastMessageAt?: number;
};

export type ResearchPlanItem = {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed';
    subItems?: ResearchPlanItem[];
};

export type ResearchPlan = {
    id: string;
    projectId: string;
    items: ResearchPlanItem[];
    updatedAt: number;
};

export type ProjectStats = {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    updatedLastDay: number;
};

export type ActivityItem = {
    id: string;
    type: 'project_created' | 'project_updated' | 'research_completed' | 'comment_added' | 'system_alert';
    description: string;
    timestamp: number | string;
    meta?: string;
};

export type ApiKeySummary = {
    provider: 'openai' | 'anthropic' | string;
    last4: string;
    storedAt: number;
};

export type DeviceRecord = {
    id: string;
    userId: string;
    deviceId: string;
    userAgent?: string | null;
    platform?: string | null;
    browser?: string | null;
    os?: string | null;
    timezone?: string | null;
    locale?: string | null;
    screen?: string | null;
    deviceMemory?: number | null;
    city?: string | null;
    region?: string | null;
    ip?: string | null;
    label?: string | null;
    isTrusted?: boolean;
    firstSeenAt: number;
    lastSeenAt: number;
    lastLoginAt?: number | null;
    revokedAt?: number | null;
};

export type DeviceUpsertPayload = {
    deviceId: string;
    userAgent?: string;
    platform?: string;
    browser?: string;
    os?: string;
    timezone?: string;
    locale?: string;
    screen?: string;
    deviceMemory?: number;
    city?: string;
    region?: string;
    ip?: string;
    label?: string;
    isTrusted?: boolean;
    login?: boolean;
    refreshToken?: string;
};
