'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Loader2, Copy, CheckCircle, Sparkles, FileText, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PDFDropzone from '@/components/pdf/PDFDropzone';
import { aiApi } from '@/lib/api';
import clsx from 'clsx';

export default function SummarizePage() {
    const [files, setFiles] = useState<File[]>([]);
    const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    const lengthOptions = [
        { value: 'short', label: 'Brief', description: '~100 words' },
        { value: 'medium', label: 'Standard', description: '~300 words' },
        { value: 'long', label: 'Deep Dive', description: '~500 words' },
    ];

    const handleSummarize = async () => {
        if (files.length === 0) {
            toast.error('Please upload a PDF file');
            return;
        }

        if (files[0].size > 10 * 1024 * 1024) {
            toast.error('File too large. Maximum size is 10MB.');
            return;
        }

        setIsProcessing(true);
        setResult(null);

        try {
            const response = await aiApi.summarize(files[0], length);
            setResult(response.data.data);
            toast.success('AI Analysis Complete!');
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to analyze PDF');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCopy = () => {
        if (result) {
            const text = `${result.summary}\n\nKey Points:\n${result.keyPoints?.map((p: string) => `• ${p}`).join('\n')}`;
            navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success('Copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
    };

    return (
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 bg-mesh pointer-events-none opacity-40"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>

            <div className="relative z-10 max-w-5xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-6"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 p-[1px] shadow-2xl shadow-purple-500/20">
                            <div className="w-full h-full rounded-[23px] bg-slate-950 flex items-center justify-center">
                                <Brain className="w-10 h-10 text-indigo-400" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight">AI <span className="text-gradient-premium">Analyze</span></h1>
                            <p className="text-slate-400 font-medium mt-1">Smart summarization & key point extraction</p>
                        </div>
                    </motion.div>

                    {result && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleReset}
                            className="btn-glass text-white"
                        >
                            Analyze Another
                        </motion.button>
                    )}
                </div>

                {!result ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <div className="glass-card-premium p-8">
                            <div className="space-y-8">
                                <PDFDropzone
                                    files={files}
                                    onFilesChange={setFiles}
                                    multiple={false}
                                    maxFiles={1}
                                    disabled={isProcessing}
                                />

                                {files.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Sparkles className="w-4 h-4 text-indigo-400" />
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Detail Level</p>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                {lengthOptions.map((option) => (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => setLength(option.value as any)}
                                                        className={clsx(
                                                            "p-4 rounded-2xl border-2 transition-all text-left group relative overflow-hidden",
                                                            length === option.value
                                                                ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                                                                : "border-white/5 bg-white/5 hover:border-white/10"
                                                        )}
                                                    >
                                                        <p className={clsx(
                                                            "font-bold text-sm mb-1",
                                                            length === option.value ? "text-white" : "text-slate-400"
                                                        )}>{option.label}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium">{option.description}</p>
                                                        {length === option.value && (
                                                            <div className="absolute top-2 right-2">
                                                                <CheckCircle className="w-4 h-4 text-indigo-500" />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleSummarize}
                                            disabled={isProcessing}
                                            className={clsx(
                                                "w-full btn-premium shadow-xl py-5",
                                                isProcessing && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            {isProcessing ? (
                                                <div className="flex items-center gap-3">
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                    <span className="text-lg">AI is reading your document...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <Brain className="w-6 h-6" />
                                                    <span className="text-lg">Generate AI Insights</span>
                                                </div>
                                            )}
                                        </button>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                    >
                        <div className="lg:col-span-2 space-y-8">
                            <div className="glass-card-premium p-8">
                                <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                            <Sparkles className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white">Executive Summary</h3>
                                    </div>
                                    <button
                                        onClick={handleCopy}
                                        className="btn-glass text-xs py-2 px-4"
                                    >
                                        {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                        {copied ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <p className="text-slate-300 leading-relaxed text-lg">
                                    {result.summary}
                                </p>
                            </div>

                            {result.keyPoints?.length > 0 && (
                                <div className="glass-card-premium p-8">
                                    <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                            <Share2 className="w-5 h-5 text-purple-400" />
                                        </div>
                                        Core Key Points
                                    </h3>
                                    <ul className="grid grid-cols-1 gap-4">
                                        {result.keyPoints.map((point: string, index: number) => (
                                            <motion.li
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="flex gap-4 p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
                                            >
                                                <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-black group-hover:scale-110 transition-transform">
                                                    {index + 1}
                                                </span>
                                                <p className="text-slate-300 font-medium leading-relaxed">{point}</p>
                                            </motion.li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-1 space-y-8">
                            <div className="glass-card p-8">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Semantic Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {result.topics?.map((topic: string, i: number) => (
                                        <span key={i} className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20 uppercase">
                                            {topic}
                                        </span>
                                    ))}
                                    {(!result.topics || result.topics.length === 0) && (
                                        <p className="text-xs text-slate-500 italic">No topics extracted</p>
                                    )}
                                </div>
                            </div>

                            <div className="glass-card p-8 bg-gradient-to-br from-indigo-500/10 to-transparent">
                                <div className="flex items-center gap-3 mb-4">
                                    <FileText className="w-5 h-5 text-indigo-400" />
                                    <p className="text-xs font-bold text-white uppercase tracking-wider">Doc Stats</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                                        <span className="text-xs text-slate-500">Word Count</span>
                                        <span className="text-sm font-bold text-white">{result.wordCount?.toLocaleString() || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                                        <span className="text-xs text-slate-500">Analysis Time</span>
                                        <span className="text-sm font-bold text-white">4.2s</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleReset}
                                className="w-full py-4 text-sm font-bold text-slate-500 hover:text-white transition-colors border-2 border-white/5 rounded-2xl hover:border-white/10"
                            >
                                Start New Analysis
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
