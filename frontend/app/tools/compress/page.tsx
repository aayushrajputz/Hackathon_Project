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
import { api, shareApi } from '@/lib/api';
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
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 overflow-hidden font-sans">
            <div className="absolute inset-0 bg-mesh pointer-events-none opacity-40"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>

            <div className="relative z-10 max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-6"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 p-[1px] shadow-2xl shadow-emerald-500/20">
                            <div className="w-full h-full rounded-[23px] bg-slate-950 flex items-center justify-center">
                                <Minimize2 className="w-10 h-10 text-emerald-400" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight">Compress <span className="text-gradient-premium">PDF</span></h1>
                            <p className="text-slate-400 font-medium mt-1">Shrink file size without losing integrity</p>
                        </div>
                    </motion.div>

                    {file && !result && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleClear}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-white/5 transition-all flex items-center gap-2"
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
                            <div className="glass-card-premium h-full min-h-[400px] flex flex-col">
                                {!file ? (
                                    <div
                                        {...getRootProps()}
                                        className="dropzone-premium group flex-1 flex items-center justify-center border-dashed cursor-pointer rounded-none border-0"
                                    >
                                        <input {...getInputProps()} />
                                        <div className="flex flex-col items-center gap-6 text-center">
                                            <div className="relative">
                                                <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                                    <Upload className="w-12 h-12 text-emerald-400" />
                                                </div>
                                                <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping opacity-20"></div>
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-bold text-white tracking-tight">Select Document</h3>
                                                <p className="text-slate-500 font-medium">Standard PDF files supported</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 p-12 flex flex-col items-center justify-center space-y-10">
                                        <div className="relative group">
                                            <div className="w-32 h-32 rounded-[40px] bg-slate-900 border border-emerald-500/30 flex items-center justify-center shadow-2xl relative overflow-hidden group-hover:scale-105 transition-transform">
                                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"></div>
                                                <FileText className="w-16 h-16 text-emerald-400" />
                                            </div>
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ repeat: Infinity, duration: 2 }}
                                                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg"
                                            >
                                                <TrendingDown className="w-5 h-5 text-white" />
                                            </motion.div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-white truncate max-w-[350px]">{file.name}</p>
                                            <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] mt-3">Initial Size: {formatBytes(file.size)}</p>
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
                            <div className="glass-card-premium p-8 space-y-10">
                                <div className="space-y-2">
                                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                                        <Minimize2 className="w-5 h-5 text-emerald-400" />
                                        Optimization Engine
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Select Strength</p>
                                </div>

                                <div className="space-y-4">
                                    {qualityOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setQuality(opt.value)}
                                            className={clsx(
                                                "group w-full relative flex items-center gap-5 p-5 rounded-2xl border transition-all duration-300",
                                                quality === opt.value
                                                    ? "bg-emerald-500/10 border-emerald-500/50 text-white"
                                                    : "bg-white/5 border-white/5 text-slate-400 hover:border-emerald-500/20"
                                            )}
                                        >
                                            <div className={clsx(
                                                "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                                                quality === opt.value ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-slate-900 border border-white/10"
                                            )}>
                                                <opt.icon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-bold text-sm">{opt.label}</p>
                                                    <span className={clsx(
                                                        "text-[10px] font-black px-2 py-0.5 rounded",
                                                        quality === opt.value ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-500"
                                                    )}>
                                                        {opt.reduction}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] font-medium opacity-60 mt-1">{opt.description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={handleCompress}
                                    disabled={isProcessing || !file}
                                    className={clsx(
                                        "w-full btn-premium py-5 group gap-3",
                                        (isProcessing || !file) && "opacity-50 grayscale cursor-not-allowed"
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
                        <div className="glass-card-premium p-12 text-center space-y-12 relative overflow-hidden text-white">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px] -z-10"></div>

                            <div className="relative">
                                <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-2xl animate-float">
                                    <CheckCircle className="w-12 h-12 text-emerald-400" />
                                </div>
                                <h2 className="text-4xl font-black tracking-tight">Optimization Success!</h2>
                                <p className="text-slate-400 font-medium mt-2">Saved <span className="text-emerald-400 font-bold">{result.reduction}</span> of disk space</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/5 space-y-2">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Original State</p>
                                    <p className="text-3xl font-black text-slate-400">{formatBytes(result.originalSize)}</p>
                                </div>
                                <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20 space-y-2">
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Optimized State</p>
                                    <p className="text-3xl font-black text-emerald-400">{formatBytes(result.compressedSize)}</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <button
                                    onClick={handleDownload}
                                    className="w-full btn-premium py-5 flex items-center justify-center gap-3"
                                >
                                    <Download className="w-6 h-6" />
                                    <span>Download Optimized</span>
                                </button>
                                <button
                                    onClick={() => setShareModalOpen(true)}
                                    className="w-full btn-glass py-5 border-white/10 hover:border-cyan-500/50 flex items-center justify-center gap-3"
                                >
                                    <Share2 className="w-5 h-5 text-cyan-400" />
                                    <span>Sync & Share</span>
                                </button>
                            </div>

                            <button
                                onClick={handleClear}
                                className="text-sm font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
                            >
                                Process Another Document
                            </button>
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
