'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Loader2, FileText, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import PDFDropzone from '@/components/pdf/PDFDropzone';
import PDFPreview from '@/components/ui/PDFPreview';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { aiApi } from '@/lib/api';

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

    // Initial analysis to extract text
    const handleFileSelect = async (selectedFiles: File[]) => {
        if (selectedFiles.length === 0) return;

        const selectedFile = selectedFiles[0];

        // Validate size (max 10MB)
        if (selectedFile.size > 10 * 1024 * 1024) {
            toast.error('File too large. Maximum size is 10MB.');
            return;
        }

        setFile(selectedFile);
        setIsProcessing(true);

        try {
            // We use the OCR endpoint to get the text initially
            const response = await aiApi.ocr(selectedFile);
            const text = response.data.data.text;

            if (!text || text.length < 50) {
                toast.error('Could not extract enough text from this PDF.');
                setFile(null);
                return;
            }

            setTextContext(text);
            setMessages([
                {
                    role: 'assistant',
                    content: `I've analyzed **${selectedFile.name}**. What would you like to know?`
                }
            ]);
            toast.success('PDF ready for chat!');
        } catch (error: any) {
            console.error(error);
            toast.error('Failed to analyze PDF. Please try again.');
            setFile(null);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSendMessage = async (content: string) => {
        // Add user message immediately
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
            console.error(error);
            toast.error('Failed to get answer.');
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: 'Sorry, I encountered an error answering that. Please try again.' }
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
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 mb-4">
                        <MessageSquare className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Chat with PDF
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Upload a document and ask questions about it
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-6"
                >
                    <PDFDropzone
                        files={[]}
                        onFilesChange={handleFileSelect}
                        multiple={false}
                        maxFiles={1}
                    />
                </motion.div>
            </div>
        );
    }

    if (isProcessing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-indigo-100 dark:border-indigo-900/30 animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Analyzing Document...</h2>
                <p className="text-gray-500 max-w-md">
                    Extracting text and preparing knowledge base. This may take a few seconds.
                </p>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-120px)] -mt-4 -mx-4 sm:-mx-8 flex flex-col md:flex-row bg-gray-50 dark:bg-slate-900 overflow-hidden border-t border-gray-200 dark:border-slate-800">
            {/* Left: PDF Preview */}
            <div className="flex-1 flex flex-col min-w-0 bg-gray-100 dark:bg-slate-900/50 relative border-r border-gray-200 dark:border-slate-800">
                <div className="p-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <button
                            onClick={handleReset}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-500"
                            title="Upload new file"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600 shrink-0">
                            <FileText className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-sm truncate">{file?.name}</span>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden relative">
                    {/* We pass the file directly to PDFPreview */}
                    <PDFPreview file={file} mode="embedded" />
                </div>
            </div>

            {/* Right: Chat Sidebar */}
            <div className="w-full md:w-[400px] lg:w-[450px] flex-shrink-0 z-20 shadow-xl md:shadow-none">
                <ChatSidebar
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isProcessing={isChatProcessing}
                />
            </div>
        </div>
    );
}
