import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/types';
import { AgentThoughtItem } from './AgentThought';
import { Send, Bot, User as UserIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatInterfaceProps {
    messages: ChatMessage[];
    onSendMessage: (content: string) => void;
    isLoading?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
    messages,
    onSendMessage,
    isLoading = false
}) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(input);
            setInput('');
        }
    };

    return (
        <div className="flex flex-col h-full bg-background border-r border-border">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-muted opacity-50">
                        <Bot className="w-12 h-12 mb-4" />
                        <p>Start your research by asking a question...</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-4 ${msg.senderType === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        {/* Avatar */}
                        <div className={`
              w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0
              ${msg.senderType === 'agent' ? 'bg-primary text-black' : 'bg-surface-300 text-foreground'}
            `}>
                            {msg.senderType === 'agent' ? <Bot size={18} /> : <UserIcon size={18} />}
                        </div>

                        {/* Content */}
                        <div className={`flex flex-col max-w-[80%] ${msg.senderType === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    {msg.senderId}
                                </span>
                                <span className="text-[10px] text-muted">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {/* Agent Thoughts */}
                            {msg.thoughts && msg.thoughts.length > 0 && (
                                <div className="w-full mb-2">
                                    {msg.thoughts.map(thought => (
                                        <AgentThoughtItem key={thought.id} thought={thought} />
                                    ))}
                                </div>
                            )}

                            {/* Message Bubble */}
                            <div className={`
                p-4 rounded-sm text-sm leading-relaxed
                ${msg.senderType === 'user'
                                    ? 'bg-surface-300 border border-border'
                                    : 'bg-transparent'}
              `}>
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            code({ node, inline, className, children, ...props }: any) {
                                                return !inline ? (
                                                    <div className="bg-[#111] p-3 rounded-sm border border-border my-2 overflow-x-auto font-mono text-xs">
                                                        <code {...props}>{children}</code>
                                                    </div>
                                                ) : (
                                                    <code className="bg-surface-300 px-1 py-0.5 rounded-sm text-primary" {...props}>
                                                        {children}
                                                    </code>
                                                )
                                            }
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-surface-100">
                <form onSubmit={handleSubmit} className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask the research agent..."
                        className="w-full bg-surface-200 border border-border text-foreground p-4 pr-12 focus:outline-none focus:border-primary transition-colors placeholder-muted"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-primary hover:text-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};
