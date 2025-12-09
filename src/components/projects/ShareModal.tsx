import React, { useEffect, useMemo, useState } from 'react';
import { ProjectService } from '@/services/api/projects';
import { ResearchProject } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import clsx from 'clsx';
import { useToast } from '@/components/ui/ToastProvider';

type ShareEntry = {
    id: string;
    email: string;
    access: 'viewer' | 'editor';
    invitedAt: number;
};

interface ShareModalProps {
    project: ResearchProject | null;
    isOpen: boolean;
    onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ project, isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [access, setAccess] = useState<'viewer' | 'editor'>('viewer');
    const [shares, setShares] = useState<ShareEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const loadShares = async () => {
        if (!project) return;
        try {
            const res = await ProjectService.listShares(project.id);
            const data = (res as ShareEntry[]) || [];
            setShares(data);
        } catch (err) {
            console.warn('Failed to load shares', err);
            setShares([]);
        }
    };

    useEffect(() => {
        if (isOpen) {
            void loadShares();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, project?.id]);

    const handleShare = async () => {
        if (!project || !email.trim()) return;
        setIsLoading(true);
        try {
            await ProjectService.share(project.id, { email: email.trim(), access });
            setEmail('');
            setAccess('viewer');
            await loadShares();
            toast({
                variant: 'success',
                title: 'Invite Sent',
                message: `${email.trim()} now has ${access} access.`,
            });
        } catch (err) {
            console.error('Failed to share project', err);
            toast({
                variant: 'error',
                title: 'Share Failed',
                message: err instanceof Error ? err.message : 'Unable to send invite.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevoke = async (shareId: string) => {
        if (!project) return;
        setIsLoading(true);
        try {
            await ProjectService.revokeShare(project.id, shareId);
            await loadShares();
            toast({
                variant: 'info',
                title: 'Access Revoked',
                message: 'Collaborator removed from this project.',
            });
        } catch (err) {
            console.error('Failed to revoke share', err);
            toast({
                variant: 'error',
                title: 'Revoke Failed',
                message: err instanceof Error ? err.message : 'Unable to update access.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const sortedShares = useMemo(
        () => shares.slice().sort((a, b) => b.invitedAt - a.invitedAt),
        [shares]
    );

    if (!isOpen || !project) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative bg-black/90 border border-white/10 w-full max-w-xl p-6 md:p-8">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-xs font-mono text-muted uppercase tracking-wider mb-1">Share</p>
                        <h3 className="text-lg font-mono text-white uppercase">{project.title}</h3>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        Close
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-mono text-primary uppercase tracking-wider">Invite by email</label>
                        <Input
                            placeholder="analyst@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="font-mono text-sm"
                        />
                        <div className="flex items-center gap-3 text-xs text-muted font-mono">
                            <label className="flex items-center gap-1">
                                <input
                                    type="radio"
                                    name="share-access"
                                    value="viewer"
                                    checked={access === 'viewer'}
                                    onChange={() => setAccess('viewer')}
                                    className="accent-primary"
                                />
                                Viewer
                            </label>
                            <label className="flex items-center gap-1">
                                <input
                                    type="radio"
                                    name="share-access"
                                    value="editor"
                                    checked={access === 'editor'}
                                    onChange={() => setAccess('editor')}
                                    className="accent-primary"
                                />
                                Editor
                            </label>
                        </div>
                        <Button size="sm" onClick={handleShare} isLoading={isLoading}>
                            Invite
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-xs font-mono text-muted uppercase tracking-wider">Existing Access</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {sortedShares.length === 0 && (
                                <p className="text-xs text-muted font-mono">No collaborators yet.</p>
                            )}
                            {sortedShares.map((share) => (
                                <div
                                    key={share.id}
                                    className={clsx(
                                        "flex items-center justify-between border border-white/10 p-2 bg-black/50 rounded-none text-xs font-mono",
                                        share.access === 'editor' ? 'border-primary/40' : 'border-white/10'
                                    )}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-white">{share.email}</span>
                                        <span className="text-muted uppercase">{share.access}</span>
                                    </div>
                                    <Button
                                        size="xs"
                                        variant="secondary"
                                        onClick={() => handleRevoke(share.id)}
                                        disabled={isLoading}
                                    >
                                        Revoke
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
