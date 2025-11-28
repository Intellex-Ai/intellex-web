import { ChatMessage, ResearchPlan } from '@/types';
import { apiRequest } from './client';

export type SendMessageResult = {
    userMessage: ChatMessage;
    agentMessage: ChatMessage;
    plan?: ResearchPlan | null;
};

export const ChatService = {
    getMessages: (projectId: string) =>
        apiRequest<ChatMessage[]>(`/projects/${projectId}/messages`),

    sendMessage: (projectId: string, content: string) =>
        apiRequest<SendMessageResult>(`/projects/${projectId}/messages`, {
            method: 'POST',
            body: { content },
        }),
};
