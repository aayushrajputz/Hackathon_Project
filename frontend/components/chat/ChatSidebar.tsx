import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatSidebarProps {
    messages: Message[];
    onSendMessage: (message: string) => Promise<void>;
    isProcessing: boolean;
}

export default function ChatSidebar({ messages, onSendMessage, isProcessing }: ChatSidebarProps) {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isProcessing]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isProcessing) return;

        const message = input;
        setInput('');

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        await onSendMessage(message);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-950/20 backdrop-blur-xl border-l border-white/5">
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-white uppercase tracking-tighter">AI Knowledge Base</h2>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Model Online</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-premium">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                            <Bot className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-white font-bold">Ask anything!</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-loose">
                                &quot;Summarize highlights&quot;<br />
                                &quot;Find key dates&quot;<br />
                                &quot;Explain formula&quot;
                            </p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={clsx(
                                "flex gap-4",
                                msg.role === 'user' ? 'flex-row-reverse' : ''
                            )}
                        >
                            <div className={clsx(
                                "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border",
                                msg.role === 'user'
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            )}>
                                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                            </div>
                            <div className={clsx(
                                "max-w-[85%] rounded-[20px] px-4 py-3 text-sm leading-relaxed",
                                msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-600/20'
                                    : 'bg-white/5 text-slate-300 rounded-tl-none border border-white/5'
                            )}>
                                {msg.content}
                            </div>
                        </motion.div>
                    ))
                )}

                {isProcessing && (
                    <div className="flex gap-4">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 animate-pulse">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-[20px] rounded-tl-none px-4 py-3 flex items-center gap-3">
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">AI is thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Overlay */}
            <div className="p-6 bg-slate-950/40 border-t border-white/5">
                <form onSubmit={handleSubmit} className="relative group">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            adjustHeight();
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        rows={1}
                        className="w-full pl-6 pr-14 py-4 bg-white/5 border border-white/5 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium text-slate-300 max-h-[120px] scrollbar-thin placeholder-slate-600"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isProcessing}
                        className="absolute right-3 bottom-3 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
