'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Loader2, FileText, ChevronLeft, Sparkles, Brain, Zap, ShieldCheck, Database, Layout, SearchCode, MessageCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
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

    const onDrop = async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        const selectedFile = acceptedFiles[0];

        if (selectedFile.size > 10 * 1024 * 1024) {
            toast.error('File too large (Max 10MB Heritage Buffer)');
            return;
        }

        setFile(selectedFile);
        setIsProcessing(true);

        try {
            const response = await aiApi.ocr(selectedFile);
            const text = response.data.data.text;

            if (!text || text.length < 50) {
                toast.error('Insufficient data extracted for neural mapping');
                setFile(null);
                return;
            }

            setTextContext(text);
            setMessages([
                {
                    role: 'assistant',
                    content: `Document **${selectedFile.name}** has been uploaded. I'm ready to answer your questions about it.`
                }
            ]);
            toast.success('Document ready for chat');
        } catch (error: any) {
            toast.error('Deep scan failed');
            setFile(null);
        } finally {
            setIsProcessing(false);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false,
    });

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
            toast.error('Connection lost');
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: 'Lost contact with the AI. Please try sending your message again.' }
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
            <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-10 overflow-hidden bg-slate-50 font-sans flex items-center justify-center">
                {/* Ambient Background Light */}
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[140px] -z-10 animate-pulse-slow"></div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-4xl w-full"
                >
                    <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm p-16 space-y-12 text-center">
                        <div className="space-y-6">
                            <div className="w-24 h-24 rounded-[3rem] bg-blue-600 shadow-2xl shadow-blue-500/20 flex items-center justify-center mx-auto border border-white/20 animate-float">
                                <MessageCircle className="w-12 h-12 text-white" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none uppercase">Chat with <span className="text-blue-600">PDF</span></h1>
                                <p className="text-slate-500 font-bold text-lg max-w-md mx-auto leading-relaxed mt-2">Ask questions and get answers from your documents instantly.</p>
                            </div>
                        </div>

                        <div
                            {...getRootProps()}
                            className={clsx(
                                "border-4 border-dashed rounded-[3.5rem] transition-all cursor-pointer h-[350px] flex items-center justify-center bg-slate-50/50 group/drop",
                                isDragActive ? "border-blue-600 bg-blue-50/50" : "border-slate-100 hover:border-blue-400 hover:bg-blue-50/50"
                            )}
                        >
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center gap-8 text-center px-10">
                                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center shadow-inner group-hover/drop:scale-110 transition-transform duration-700">
                                    <Database className="w-9 h-9 text-blue-600" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">Upload PDF</h3>
                                    <p className="text-slate-400 font-bold text-[10px] uppercase leading-relaxed tracking-tighter">Drop your PDF here to start chatting</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                            <div className="p-5 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-2">
                                <Sparkles className="w-5 h-5 text-blue-600 mx-auto" />
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Smart Context</p>
                            </div>
                            <div className="p-5 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-2">
                                <Brain className="w-5 h-5 text-blue-600 mx-auto" />
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Processing</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (isProcessing) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 p-10">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center space-y-12 max-w-lg"
                >
                    <div className="relative">
                        <div className="w-40 h-40 rounded-full border-[8px] border-slate-100 border-t-blue-600 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Brain className="w-14 h-14 text-blue-600 animate-pulse" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Reading File</h2>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Preparing your document for chat...</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-8rem)] -mx-6 md:-mx-8 overflow-hidden rounded-[3rem] border border-slate-200 bg-white flex shadow-2xl">
            {/* Left: Enhanced PDF Preview */}
            <div className="flex-1 flex flex-col min-w-0 relative border-r border-slate-200">
                <div className="p-6 border-b border-slate-100 bg-white flex items-center justify-between z-20">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={handleReset}
                            className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <span className="text-sm font-black text-slate-900 truncate max-w-[200px] tracking-tight">{file?.name}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ready to chat</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="px-5 py-2 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest shadow-xl">
                            Secure Chat
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden bg-slate-50/50 relative">
                    <PDFPreview file={file} mode="embedded" />
                    {/* Darker shadow on the right to separate from chat */}
                    <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/5 pointer-events-none"></div>
                </div>
            </div>

            {/* Right: AI Sidebar */}
            <div className="w-[450px] shrink-0 xl:w-[550px] bg-white relative">
                <div className="absolute inset-0 bg-blue-50/10 pointer-events-none"></div>
                <ChatSidebar
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isProcessing={isChatProcessing}
                />
            </div>
        </div>
    );
}
