'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Loader2, FileText, ChevronLeft, Sparkles, Brain } from 'lucide-react';
import toast from 'react-hot-toast';
import PDFDropzone from '@/components/pdf/PDFDropzone';
import PDFPreview from '@/components/ui/PDFPreview';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { aiApi } from '@/lib/api';
import clsx from 'clsx';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatPage() {
    const [file, setFile] = useState<File | null>(null);
    const [textContext, setTextContext] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isChatProcessing, setIsChatProcessing] = useState(false);

    const handleFileSelect = async (selectedFiles: File[]) => {
        if (selectedFiles.length === 0) return;

        const selectedFile = selectedFiles[0];

        if (selectedFile.size > 10 * 1024 * 1024) {
            toast.error('File too large (Max 10MB)');
            return;
        }

        setFile(selectedFile);
        setIsProcessing(true);

        try {
            const response = await aiApi.ocr(selectedFile);
            const text = response.data.data.text;

            if (!text || text.length < 50) {
                toast.error('Insufficient text content in PDF');
                setFile(null);
                return;
            }

            setTextContext(text);
            setMessages([
                {
                    role: 'assistant',
                    content: `I've mapped the contents of **${selectedFile.name}**. I'm ready to answer any questions about the data.`
                }
            ]);
            toast.success('Knowledge Base Ready!');
        } catch (error: any) {
            toast.error('Analysis failed');
            setFile(null);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSendMessage = async (content: string) => {
        const newMessages = [...messages, { role: 'user', content } as Message];
        setMessages(newMessages);
        setIsChatProcessing(true);

        try {
            const response = await aiApi.chat(textContext, content, messages);

            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: response.data.data.answer }
            ]);
        } catch (error: any) {
            toast.error('Network Error');
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: 'Sorry, I lost connectivity to the AI engine. Please retry.' }
            ]);
        } finally {
            setIsChatProcessing(false);
        }
    };

    const handleReset = () => {
        setMessages([]);
        setFile(null);
        setTextContext('');
    };

    if (!file && !isProcessing) {
        return (
            <div className="relative min-h-[calc(100vh-10rem)] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-xl w-full"
                >
                    <div className="glass-card-premium p-10 space-y-8">
                        <div className="text-center space-y-4">
                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-400 to-blue-500 p-[1px] mx-auto shadow-2xl shadow-indigo-500/20">
                                <div className="w-full h-full rounded-[23px] bg-slate-950 flex items-center justify-center">
                                    <MessageSquare className="w-12 h-12 text-indigo-400" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-white tracking-tight">AI <span className="text-gradient-premium">Dialog</span></h1>
                                <p className="text-slate-400 font-medium mt-2">Transform static PDF into an interactive companion</p>
                            </div>
                        </div>

                        <PDFDropzone
                            files={[]}
                            onFilesChange={handleFileSelect}
                            multiple={false}
                            maxFiles={1}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                                <Sparkles className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Semantic Context</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                                <Brain className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Neural Logic</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (isProcessing) {
        return (
            <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center space-y-8"
                >
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Brain className="w-12 h-12 text-indigo-400 animate-pulse" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-black text-white tracking-tight italic">BUILDING CONTEXT...</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Vectorizing document nodes</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-8rem)] -mx-6 md:-mx-8 overflow-hidden rounded-3xl border border-white/5 bg-slate-950/50 flex shadow-2xl">
            {/* Left: Enhanced PDF Preview */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                <div className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between backdrop-blur-xl z-20">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleReset}
                            className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-red-500" />
                            </div>
                            <span className="font-bold text-slate-200 truncate max-w-[200px]">{file?.name}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden bg-slate-950">
                    <PDFPreview file={file} mode="embedded" />
                </div>
            </div>

            {/* Right: AI Sidebar */}
            <div className="w-[450px] shrink-0 xl:w-[500px]">
                <ChatSidebar
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isProcessing={isChatProcessing}
                />
            </div>
        </div>
    );
}
