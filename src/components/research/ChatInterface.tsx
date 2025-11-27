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
        <div className="flex flex-col h-full bg-black relative overflow-hidden">
            {/* Static Cyber Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:50px_50px] [mask-image:radial-gradient(circle_at_center,black_40%,transparent_100%)] pointer-events-none" />

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 custom-scrollbar relative z-10 pb-32">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 animate-in fade-in duration-1000">
                        <div className="w-16 h-16 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center mb-6 shadow-[0_0_30px_-5px_rgba(255,77,0,0.2)]">
                            <Bot className="w-8 h-8 text-primary" />
                        </div>
                        <p className="font-mono text-sm tracking-widest uppercase text-primary/60">System Ready</p>
                        <p className="mt-2 text-sm">Initialize research sequence...</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-4 md:gap-6 ${msg.senderType === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-4 duration-500`}
                    >
                        {/* Avatar */}
                        <div className={`
              w-8 h-8 md:w-10 md:h-10 rounded-sm flex items-center justify-center flex-shrink-0 border
              ${msg.senderType === 'agent'
                                ? 'bg-black border-primary/30 text-primary shadow-[0_0_15px_-3px_rgba(255,77,0,0.3)]'
                                : 'bg-white/5 border-white/10 text-white'}
            `}>
                            {msg.senderType === 'agent' ? <Bot size={18} /> : <UserIcon size={18} />}
                        </div>

                        {/* Content */}
                        <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${msg.senderType === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`text-[10px] font-bold font-mono uppercase tracking-widest ${msg.senderType === 'agent' ? 'text-primary' : 'text-white/60'}`}>
                                    {msg.senderId}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {/* Agent Thoughts */}
                            {msg.thoughts && msg.thoughts.length > 0 && (
                                <div className="w-full mb-4 pl-4 border-l border-primary/20">
                                    {msg.thoughts.map(thought => (
                                        <AgentThoughtItem key={thought.id} thought={thought} />
                                    ))}
                                </div>
                            )}

                            {/* Message Bubble */}
                            <div className={`
                                p-4 md:p-6 rounded-sm text-sm leading-relaxed backdrop-blur-sm
                                ${msg.senderType === 'user'
                                    ? 'bg-white/5 border border-white/10 text-white'
                                    : 'bg-transparent border-l-2 border-primary pl-6'}
                            `}>
                                <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            code({ node: _node, inline, className: _className, children, ...props }: any) {
                                                return !inline ? (
                                                    <div className="bg-black/50 p-4 rounded-sm border border-white/10 my-4 overflow-x-auto font-mono text-xs shadow-inner">
                                                        <code {...props}>{children}</code>
                                                    </div>
                                                ) : (
                                                    <code className="bg-white/10 px-1.5 py-0.5 rounded-sm text-primary font-mono text-xs" {...props}>
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

                {/* Typing Indicator */}
                {isLoading && (
                    <div className="flex gap-4 md:gap-6 animate-in fade-in duration-300">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-sm flex items-center justify-center flex-shrink-0 border bg-black border-primary/30 text-primary shadow-[0_0_15px_-3px_rgba(255,77,0,0.3)]">
                            <Bot size={18} />
                        </div>
                        <div className="flex items-center gap-1 h-10">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-20">
                <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto group">
                    <div className="absolute inset-0 bg-primary/5 blur-xl rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter research query..."
                        className="w-full bg-black/60 backdrop-blur-xl border border-white/10 text-white p-4 md:p-5 pr-14 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all duration-300 placeholder-white/20 font-mono text-sm shadow-2xl rounded-sm"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110"
                    >
                        <Send size={20} className="drop-shadow-[0_0_5px_rgba(255,77,0,0.5)]" />
                    </button>

                    {/* Corner Accents for Input */}
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-white/10 group-focus-within:border-primary transition-colors duration-300" />
                    <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-white/10 group-focus-within:border-primary transition-colors duration-300" />
                </form>
            </div>
        </div>
    );
};
