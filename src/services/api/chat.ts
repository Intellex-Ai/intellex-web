import type { SendMessageResponse } from '@intellex/shared-client';

import { projectsApi, withApiError } from './client';

export type SendMessageResult = SendMessageResponse;

export const ChatService = {
    getMessages: (projectId: string) =>
        withApiError(() => projectsApi.getMessagesProjectsProjectIdMessagesGet({ projectId })),
    sendMessage: (projectId: string, content: string) =>
        withApiError(() =>
            projectsApi.sendMessageProjectsProjectIdMessagesPost({
                projectId,
                createMessageRequest: { content },
            })
        ),
};
