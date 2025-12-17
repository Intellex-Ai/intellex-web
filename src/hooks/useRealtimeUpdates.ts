'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { useStore } from '@/store';
import type { ChatMessage, ResearchProject, ResearchStatus, MessageType } from '@/types';

const toTimestamp = (value: unknown): number | undefined => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const numeric = Number(value);
        if (!Number.isNaN(numeric)) return numeric;
        const parsedDate = Date.parse(value);
        return Number.isNaN(parsedDate) ? undefined : parsedDate;
    }
    return undefined;
};

const mapProjectRow = (row: Record<string, unknown>): ResearchProject | null => {
    if (!row?.id) return null;
    const id = typeof row.id === 'string' ? row.id : String(row.id);
    const userIdRaw = (row.user_id ?? row.userId) as unknown;
    const userId = typeof userIdRaw === 'string' ? userIdRaw : userIdRaw ? String(userIdRaw) : '';
    const createdAt = toTimestamp(row.created_at) ?? Date.now();
    const updatedAt = toTimestamp(row.updated_at) ?? createdAt;
    const title = typeof row.title === 'string' ? row.title : row.title ? String(row.title) : '';
    const goal = typeof row.goal === 'string' ? row.goal : row.goal ? String(row.goal) : '';
    const rawStatus = typeof row.status === 'string' ? row.status : 'draft';
    const status: ResearchStatus = (['draft', 'active', 'completed', 'archived'] as ResearchStatus[]).includes(rawStatus as ResearchStatus)
        ? (rawStatus as ResearchStatus)
        : 'draft';

    return {
        id,
        userId,
        title,
        goal,
        status,
        createdAt,
        updatedAt,
        lastMessageAt: toTimestamp(row.last_message_at),
    };
};

const mapMessageRow = (row: Record<string, unknown>): ChatMessage | null => {
    if (!row?.id || !row.project_id) return null;
    const id = typeof row.id === 'string' ? row.id : String(row.id);
    const projectId = typeof row.project_id === 'string' ? row.project_id : String(row.project_id);

    let thoughts: ChatMessage['thoughts'] = undefined;
    const rawThoughts = row.thoughts;
    if (Array.isArray(rawThoughts)) {
        thoughts = rawThoughts;
    } else if (typeof rawThoughts === 'string') {
        try {
            const parsed = JSON.parse(rawThoughts);
            if (Array.isArray(parsed)) {
                thoughts = parsed;
            }
        } catch {
            // swallow parse errors for non-JSON thoughts payloads
        }
    }

    const rawSenderType = typeof row.sender_type === 'string' ? row.sender_type : 'system';
    const senderType: MessageType = (['user', 'agent', 'system'] as MessageType[]).includes(rawSenderType as MessageType)
        ? (rawSenderType as MessageType)
        : 'system';

    const content = typeof row.content === 'string' ? row.content : row.content ? String(row.content) : '';

    return {
        id,
        projectId,
        senderId: row.sender_id ? String(row.sender_id) : '',
        senderType,
        content,
        thoughts,
        timestamp: toTimestamp(row.timestamp) ?? Date.now(),
    };
};

export const useRealtimeUpdates = () => {
    const userId = useStore((state) => state.user?.id ?? null);
    const activeProjectId = useStore((state) => state.activeProject?.id ?? null);
    const upsertProject = useStore((state) => state.realtimeProjectUpsert);
    const deleteProject = useStore((state) => state.realtimeProjectDelete);
    const upsertMessage = useStore((state) => state.realtimeMessageUpsert);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const messageFilter = useMemo(
        () => (activeProjectId ? `project_id=eq.${activeProjectId}` : null),
        [activeProjectId],
    );

    useEffect(() => {
        if (!supabaseConfigured || !userId) return;

        // Clean up any previous subscription when user changes or logs out or when the active project changes.
        if (channelRef.current) {
            void supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }

        const channelName = `realtime:user:${userId}${messageFilter ? `:project:${activeProjectId}` : ''}`;
        const channel = supabase.channel(channelName);

        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'projects', filter: `user_id=eq.${userId}` },
            (payload) => {
                if (payload.eventType === 'DELETE') {
                    const projectId = (payload.old as Record<string, unknown> | null)?.id as string | undefined;
                    if (projectId) {
                        deleteProject(projectId);
                    }
                    return;
                }

                const project = mapProjectRow((payload.new || {}) as Record<string, unknown>);
                if (project) {
                    upsertProject(project);
                }
            },
        );

        if (messageFilter) {
            // Limit message streaming to the active project to avoid full-table WAL parsing.
            channel.on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'messages', filter: messageFilter },
                (payload) => {
                    if (payload.eventType === 'DELETE') return;
                    const message = mapMessageRow((payload.new || {}) as Record<string, unknown>);
                    if (message) {
                        upsertMessage(message);
                    }
                },
            );
        }

        channel.subscribe((status) => {
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.warn('Realtime subscription issue', status);
            }
        });

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                void supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [activeProjectId, deleteProject, messageFilter, upsertMessage, upsertProject, userId]);
};
