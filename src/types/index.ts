import type {
    ActivityItem,
    ApiKeySummary,
    AgentThought,
    ChatMessage,
    DeviceRecord,
    DeviceUpsertRequest,
    ResearchPlan,
    ResearchPlanItem,
    ResearchProject,
    ProjectStats,
    User,
} from '@intellex/shared-client';

export type AgentRole = 'planner' | 'researcher' | 'reviewer' | 'orchestrator';

export type Agent = {
    id: string;
    name: string;
    role: AgentRole;
    avatarUrl?: string;
    description: string;
};

export type ResearchStatus = ResearchProject['status'];
export type MessageType = ChatMessage['senderType'];
export type DeviceUpsertPayload = DeviceUpsertRequest;

export type {
    ActivityItem,
    ApiKeySummary,
    AgentThought,
    ChatMessage,
    DeviceRecord,
    ResearchPlan,
    ResearchPlanItem,
    ResearchProject,
    ProjectStats,
    User,
};
