'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Loader2, Copy, CheckCircle, Sparkles, FileText, Share2, Upload, X, ArrowRight, Zap, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { aiApi } from '@/lib/api';
import clsx from 'clsx';

export default function SummarizePage() {
    const [file, setFile] = useState<File | null>(null);
    const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    const lengthOptions = [
        { value: 'short', label: 'Brief', description: '~100 words' },
        { value: 'medium', label: 'Standard', description: '~300 words' },
        { value: 'long', label: 'Deep Dive', description: '~500 words' },
    ];

    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setResult(null);
        }
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false,
    });

    const handleSummarize = async () => {
        if (!file) {
            toast.error('Please upload a PDF file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File too large. Maximum size is 10MB.');
            return;
        }

        setIsProcessing(true);
        setResult(null);

        try {
            const response = await aiApi.summarize(file, length);
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
        setFile(null);
        setResult(null);
    };

    return (
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 overflow-hidden font-sans bg-slate-50 pb-12">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-[120px] animate-pulse-slow"></div>

            <div className="relative z-10 max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-6"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-200 shadow-sm flex items-center justify-center">
                            <Brain className="w-10 h-10 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">AI <span className="text-blue-600">Analyze</span></h1>
                            <p className="text-slate-600 font-medium mt-1">Semantic extraction & smart summarization</p>
                        </div>
                    </motion.div>

                    {file && !result && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleReset}
                            className="px-6 py-3 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all flex items-center gap-2 bg-white shadow-sm"
                        >
                            <X className="w-4 h-4" />
                            Discard
                        </motion.button>
                    )}
                </div>

                {!result ? (
                    <div className="grid lg:grid-cols-12 gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-8"
                        >
                            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 space-y-8">
                                <div
                                    {...getRootProps()}
                                    className={clsx(
                                        "h-[400px] flex items-center justify-center border-2 border-dashed rounded-[2rem] transition-all cursor-pointer",
                                        file ? "bg-slate-50 border-blue-400" : "bg-white border-slate-300 hover:border-blue-500 hover:bg-blue-50/50"
                                    )}
                                >
                                    <input {...getInputProps()} />
                                    {!file ? (
                                        <div className="flex flex-col items-center gap-6 text-center">
                                            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center shadow-inner">
                                                <Upload className="w-10 h-10 text-blue-500" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Drop Source PDF</h3>
                                                <p className="text-slate-500 font-medium text-sm">Target documents up to 10MB</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-6 text-center">
                                            <div className="w-24 h-32 bg-white border border-slate-200 rounded-2xl shadow-md flex items-center justify-center relative overflow-hidden">
                                                <div className="absolute inset-x-0 top-0 h-1/2 bg-blue-100/30"></div>
                                                <FileText className="w-12 h-12 text-blue-600" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-lg font-black text-slate-900">{file.name}</p>
                                                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Awaiting Analysis</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {file && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Sparkles className="w-4 h-4 text-blue-600" />
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Detail Strategy</p>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                {lengthOptions.map((option) => (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => setLength(option.value as any)}
                                                        className={clsx(
                                                            "p-5 rounded-[1.5rem] border-2 transition-all text-left relative overflow-hidden group shadow-sm",
                                                            length === option.value
                                                                ? "border-blue-600 bg-blue-50/50 shadow-md shadow-blue-500/10"
                                                                : "border-slate-100 bg-white hover:border-blue-200"
                                                        )}
                                                    >
                                                        <p className={clsx(
                                                            "font-black text-sm mb-1 uppercase tracking-tight",
                                                            length === option.value ? "text-blue-700" : "text-slate-900"
                                                        )}>{option.label}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{option.description}</p>
                                                        {length === option.value && (
                                                            <div className="absolute top-2 right-2">
                                                                <CheckCircle className="w-4 h-4 text-blue-600" />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleSummarize}
                                            disabled={isProcessing}
                                            className="w-full py-5 rounded-2xl bg-blue-600 text-white font-black text-lg shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 group"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                    <span>Synthesizing Document...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Brain className="w-6 h-6" />
                                                    <span>Analyze & Summarize</span>
                                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-4 space-y-6"
                        >
                            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 space-y-8 shadow-sm">
                                <div className="space-y-3">
                                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-blue-600" />
                                        Neural Analysis
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        Our AI reads and understands context, extracting core semantics while ignoring noise.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Target className="w-4 h-4 text-blue-600" />
                                            <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Accuracy</p>
                                        </div>
                                        <p className="text-xs text-blue-700 font-bold">Context-aware semantic mapping</p>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Indexing</p>
                                        <p className="text-xs text-slate-600 font-medium font-bold uppercase tracking-tight">Autogenerated tags & key points</p>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-700">
                                            <FileText className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-900 tracking-widest uppercase tracking-widest">Engine ready</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Verified for PDF/A</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-10"
                    >
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden shadow-sm">
                                <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                            <Sparkles className="w-8 h-8 text-white" />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Executive Summary</h2>
                                    </div>
                                    <button
                                        onClick={handleCopy}
                                        className={clsx(
                                            "p-4 rounded-xl transition-all",
                                            copied ? "text-emerald-500 bg-emerald-50" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                        )}
                                    >
                                        {copied ? <CheckCircle className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                                    </button>
                                </div>
                                <div className="p-10 bg-white leading-relaxed text-slate-700 font-medium text-lg whitespace-pre-wrap select-text">
                                    {result.summary}
                                </div>
                            </div>

                            {result.keyPoints?.length > 0 && (
                                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-10">
                                    <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                        <Target className="w-6 h-6 text-blue-600" />
                                        Strategic Key Points
                                    </h3>
                                    <div className="grid gap-4">
                                        {result.keyPoints.map((point: string, index: number) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="flex gap-6 p-6 rounded-3xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition-all group"
                                            >
                                                <span className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-sm font-black text-blue-600 group-hover:scale-110 transition-transform shadow-sm shrink-0">
                                                    {index + 1}
                                                </span>
                                                <p className="text-slate-800 font-bold leading-relaxed">{point}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-1 space-y-8">
                            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 space-y-8 shadow-sm">
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Neural Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {result.topics?.map((topic: string, i: number) => (
                                            <span key={i} className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-[10px] font-black border border-blue-100 uppercase tracking-tight">
                                                {topic}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-slate-100">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Document Pulse</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                                            <span className="text-xs font-bold text-slate-500">Words</span>
                                            <span className="text-xs font-black text-slate-900">{result.wordCount || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                                            <span className="text-xs font-bold text-slate-500">Efficiency</span>
                                            <span className="text-xs font-black text-blue-600">Optimal</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleReset}
                                    className="w-full py-5 rounded-2xl bg-white border border-slate-200 text-slate-400 font-bold hover:text-blue-600 hover:border-blue-600 transition-all uppercase text-[10px] tracking-widest shadow-sm"
                                >
                                    Analyze New Source
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
