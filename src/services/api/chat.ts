import { ChatMessage, ResearchPlan } from '@/types';
import { api } from './client';

export type SendMessageResult = {
    userMessage: ChatMessage;
    agentMessage: ChatMessage;
    plan?: ResearchPlan | null;
};

export const ChatService = {
    getMessages: (projectId: string) => api.get<ChatMessage[]>(`/projects/${projectId}/messages`),

    sendMessage: (projectId: string, content: string) =>
        api.post<SendMessageResult>(`/projects/${projectId}/messages`, { content }),
};
