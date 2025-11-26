import { ChatMessage } from '@/types';

const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
    'proj-1': [
        {
            id: 'msg-1',
            projectId: 'proj-1',
            senderId: 'user-1',
            senderType: 'user',
            content: 'I need to understand the current state of Quantum Computing.',
            timestamp: Date.now() - 100000,
        },
        {
            id: 'msg-2',
            projectId: 'proj-1',
            senderId: 'agent-planner',
            senderType: 'agent',
            content: 'I can help with that. I will start by analyzing the market landscape and then dive into specific technologies. Does that sound good?',
            timestamp: Date.now() - 90000,
            thoughts: [
                {
                    id: 'th-1',
                    title: 'Analyzing Request',
                    content: 'User wants a broad overview. I should break this down into Market and Tech.',
                    status: 'completed',
                    timestamp: Date.now() - 95000,
                },
            ],
        },
    ],
};

export const MockChatService = {
    getMessages: async (projectId: string): Promise<ChatMessage[]> => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return MOCK_MESSAGES[projectId] || [];
    },

    sendMessage: async (projectId: string, content: string): Promise<ChatMessage> => {
        await new Promise((resolve) => setTimeout(resolve, 300));

        const userMsg: ChatMessage = {
            id: `msg-${Date.now()}`,
            projectId,
            senderId: 'user-1',
            senderType: 'user',
            content,
            timestamp: Date.now(),
        };

        if (!MOCK_MESSAGES[projectId]) {
            MOCK_MESSAGES[projectId] = [];
        }
        MOCK_MESSAGES[projectId].push(userMsg);

        return userMsg;
    },

    // Simulate an agent response stream (simplified as a promise for now)
    simulateAgentResponse: async (projectId: string): Promise<ChatMessage> => {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Thinking time

        const agentMsg: ChatMessage = {
            id: `msg-${Date.now()}`,
            projectId,
            senderId: 'agent-researcher',
            senderType: 'agent',
            content: 'I have found several key reports from 2024. IBM and Google are leading in qubit count, but error correction remains the main hurdle.',
            timestamp: Date.now(),
            thoughts: [
                {
                    id: `th-${Date.now()}`,
                    title: 'Searching Knowledge Base',
                    content: 'Querying for "Quantum Computing State 2025"... Found 15 relevant articles.',
                    status: 'completed',
                    timestamp: Date.now(),
                },
            ],
        };

        MOCK_MESSAGES[projectId].push(agentMsg);
        return agentMsg;
    },
};
