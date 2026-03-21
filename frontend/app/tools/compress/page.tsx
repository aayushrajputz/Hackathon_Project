'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Minimize2,
    Download,
    Loader2,
    CheckCircle,
    FileText,
    Upload,
    X,
    Zap,
    TrendingDown,
    Share2,
    ArrowRight,
    Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api } from '@/lib/api';
import clsx from 'clsx';
import ShareModal from '@/components/ui/ShareModal';

type QualityLevel = 'low' | 'medium' | 'high';

const qualityOptions: { value: QualityLevel; label: string; description: string; reduction: string; icon: any }[] = [
    { value: 'high', label: 'Pro Quality', description: 'Maximum detail, light compression', reduction: '10-20%', icon: Sparkles },
    { value: 'medium', label: 'Balanced', description: 'Recommended for most users', reduction: '30-50%', icon: Minimize2 },
    { value: 'low', label: 'Turbo Saver', description: 'Smallest size, standard quality', reduction: '50-80%', icon: Zap },
];

export default function CompressPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [quality, setQuality] = useState<QualityLevel>('medium');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [shareModalOpen, setShareModalOpen] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setResult(null);
        }
    }, []);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false,
    });

    const handleClear = () => {
        setFile(null);
        setQuality('medium');
        setResult(null);
    };

    const handleCompress = async () => {
        if (!file) return;

        setIsProcessing(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('quality', quality);

            const response = await api.post('/pdf/compress', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setResult(response.data.data);
            toast.success('PDF compressed successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to compress PDF');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = async () => {
        if (result?.fileId) {
            try {
                const response = await api.get(`/library/download/${result.fileId}`, {
                    responseType: 'blob',
                });
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const blobUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = result.filename || 'compressed.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            } catch (error) {
                toast.error('Failed to download file');
            }
        }
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 overflow-hidden font-sans bg-slate-50 pb-12">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100/50 rounded-full blur-[120px] animate-pulse-slow"></div>

            <div className="relative z-10 max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-6"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-blue-100 border border-blue-200 shadow-sm flex items-center justify-center">
                            <Minimize2 className="w-10 h-10 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Compress <span className="text-blue-600">PDF</span></h1>
                            <p className="text-slate-600 font-medium mt-1">Shrink file size without losing integrity</p>
                        </div>
                    </motion.div>

                    {file && !result && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleClear}
                            className="px-6 py-3 rounded-xl text-sm font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 shadow-sm transition-all flex items-center gap-2 bg-white"
                        >
                            <X className="w-4 h-4" />
                            Clear Workspace
                        </motion.button>
                    )}
                </div>

                {!result ? (
                    <div className="grid lg:grid-cols-12 gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-7"
                        >
                            <div className="bg-white border border-slate-200 shadow-sm rounded-[2.5rem] overflow-hidden h-full min-h-[400px] flex flex-col">
                                {!file ? (
                                    <div
                                        {...getRootProps()}
                                        className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-300 m-6 rounded-[2rem] bg-slate-50 hover:bg-blue-50/50 hover:border-blue-400 cursor-pointer transition-all"
                                    >
                                        <input {...getInputProps()} />
                                        <div className="flex flex-col items-center gap-6 text-center">
                                            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center shadow-inner hover:scale-110 transition-transform duration-500">
                                                <Upload className="w-12 h-12 text-blue-500" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Select Document</h3>
                                                <p className="text-slate-500 font-medium">Standard PDF files supported</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 p-12 flex flex-col items-center justify-center space-y-10 bg-slate-50/50 m-6 rounded-[2rem] border border-slate-100">
                                        <div className="relative group">
                                            <div className="w-32 h-32 rounded-[2.5rem] bg-white border border-slate-200 flex items-center justify-center shadow-md relative overflow-hidden group-hover:scale-105 transition-transform">
                                                <FileText className="w-16 h-16 text-blue-500" />
                                            </div>
                                            <motion.div
                                                animate={{ scale: [1, 1.1, 1] }}
                                                transition={{ repeat: Infinity, duration: 2 }}
                                                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg border-2 border-white"
                                            >
                                                <TrendingDown className="w-5 h-5 text-white" />
                                            </motion.div>
                                        </div>
                                        <div className="text-center px-4">
                                            <p className="text-2xl font-black text-slate-900 truncate max-w-[350px] mx-auto">{file.name}</p>
                                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-3">Initial Size: {formatBytes(file.size)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-5 space-y-6"
                        >
                            <div className="bg-white border border-slate-200 shadow-sm rounded-[2.5rem] p-8 space-y-8">
                                <div className="space-y-2">
                                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        <Minimize2 className="w-5 h-5 text-blue-600" />
                                        Optimization Engine
                                    </h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Select Strength</p>
                                </div>

                                <div className="space-y-4">
                                    {qualityOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setQuality(opt.value)}
                                            className={clsx(
                                                "group w-full relative flex items-center gap-5 p-5 rounded-2xl border transition-all duration-300",
                                                quality === opt.value
                                                    ? "bg-blue-50 border-blue-200 text-slate-900 shadow-sm"
                                                    : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-slate-50"
                                            )}
                                        >
                                            <div className={clsx(
                                                "w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm",
                                                quality === opt.value ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
                                            )}>
                                                <opt.icon className={clsx("w-6 h-6", quality === opt.value ? "text-white" : "text-slate-400 group-hover:text-blue-500")} />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-bold text-sm text-slate-900">{opt.label}</p>
                                                    <span className={clsx(
                                                        "text-[10px] font-black px-2.5 py-1 rounded-md tracking-widest uppercase",
                                                        quality === opt.value ? "bg-blue-200 text-blue-800" : "bg-slate-100 text-slate-500"
                                                    )}>
                                                        {opt.reduction}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] font-medium text-slate-500 mt-1">{opt.description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={handleCompress}
                                    disabled={isProcessing || !file}
                                    className={clsx(
                                        "w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all",
                                        (isProcessing || !file)
                                            ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                            : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:opacity-90 group"
                                    )}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            <span>Optimizing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Minimize2 className="w-6 h-6" />
                                            <span>Compress Document</span>
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-3xl mx-auto"
                    >
                        <div className="bg-white border border-slate-200 shadow-xl rounded-[3rem] p-12 text-center space-y-12 relative overflow-hidden text-slate-900">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-50 rounded-full blur-[80px] -z-10"></div>

                            <div className="relative">
                                <div className="w-24 h-24 rounded-3xl bg-emerald-50 flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-inner animate-float">
                                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                                </div>
                                <h2 className="text-4xl font-black tracking-tight">Optimization Success!</h2>
                                <p className="text-slate-600 font-medium mt-3">Saved <span className="text-emerald-600 font-bold">{result.reduction}</span> of disk space</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-2 shadow-sm">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Original State</p>
                                    <p className="text-3xl font-black text-slate-700">{formatBytes(result.originalSize)}</p>
                                </div>
                                <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 space-y-2 shadow-sm">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Optimized State</p>
                                    <p className="text-3xl font-black text-emerald-600">{formatBytes(result.compressedSize)}</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <button
                                    onClick={handleDownload}
                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-md shadow-emerald-500/20"
                                >
                                    <Download className="w-6 h-6" />
                                    <span>Download Optimized</span>
                                </button>
                                <button
                                    onClick={() => setShareModalOpen(true)}
                                    className="w-full py-4 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-sm"
                                >
                                    <Share2 className="w-5 h-5" />
                                    <span>Sync & Share</span>
                                </button>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <button
                                    onClick={handleClear}
                                    className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest"
                                >
                                    Process Another Document
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            <ShareModal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                fileId={result?.fileId}
                fileType="temp"
            />
        </div>
    );
}
