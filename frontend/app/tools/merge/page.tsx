'use client';

import { useState, useCallback } from 'react';
import { motion, Reorder } from 'framer-motion';
import {
    Merge,
    Download,
    Loader2,
    CheckCircle,
    FileText,
    GripVertical,
    X,
    Upload,
    Trash2,
    ArrowRight,
    Share2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api } from '@/lib/api';
import clsx from 'clsx';
import ShareModal from '@/components/ui/ShareModal';

interface FileWithId {
    id: string;
    file: File;
}

export default function MergePDFPage() {
    const [files, setFiles] = useState<FileWithId[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [shareModalOpen, setShareModalOpen] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles = acceptedFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file
        }));
        setFiles(prev => [...prev, ...newFiles]);
        setResult(null);
    }, []);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
        },
        multiple: true,
    });

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const clearAll = () => {
        setFiles([]);
        setResult(null);
    };

    const handleMerge = async () => {
        if (files.length < 2) {
            toast.error('Please upload at least 2 PDF files');
            return;
        }

        setIsProcessing(true);
        setResult(null);

        try {
            const formData = new FormData();
            files.forEach(({ file }) => formData.append('files', file));

            const response = await api.post('/pdf/merge', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setResult(response.data.data);
            toast.success('PDFs merged successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to merge PDFs');
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
                link.download = result.filename || 'merged.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
                toast.success('Download started!');
            } catch (error) {
                console.error(error);
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
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 bg-mesh pointer-events-none opacity-40"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>

            <div className="relative z-10 max-w-5xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-6"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 p-[1px] shadow-2xl shadow-indigo-500/20">
                            <div className="w-full h-full rounded-[23px] bg-slate-950 flex items-center justify-center">
                                <Merge className="w-10 h-10 text-blue-400" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight">Merge <span className="text-gradient-premium">PDF</span></h1>
                            <p className="text-slate-400 font-medium mt-1">Combine multiple documents seamlessly</p>
                        </div>
                    </motion.div>

                    {files.length > 0 && !result && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={clearAll}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear Workspace
                        </motion.button>
                    )}
                </div>

                {!result ? (
                    <div className="grid lg:grid-cols-12 gap-8 items-start">
                        {/* Workspace / Dropzone */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-8 space-y-6"
                        >
                            <div
                                {...getRootProps()}
                                className={clsx(
                                    "dropzone-premium group bg-slate-900/20 backdrop-blur-sm",
                                    files.length > 0 ? "p-8" : "h-[400px] flex items-center justify-center"
                                )}
                            >
                                <input {...getInputProps()} />
                                {files.length === 0 ? (
                                    <div className="flex flex-col items-center gap-6 group text-center">
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 mx-auto">
                                                <Upload className="w-12 h-12 text-blue-400" />
                                            </div>
                                            <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-ping opacity-20"></div>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-bold text-white">Drop your PDFs here</h3>
                                            <p className="text-slate-400 font-medium">Click to browse your files (min 2)</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-4 py-8 border-2 border-dashed border-white/5 rounded-2xl hover:border-blue-500/50 transition-colors cursor-pointer group">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Upload className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-300">Add More Documents</span>
                                    </div>
                                )}
                            </div>

                            {/* File List */}
                            {files.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <span>Order & Layout</span>
                                        <span>Drag to adjust</span>
                                    </div>
                                    <Reorder.Group
                                        axis="y"
                                        values={files}
                                        onReorder={setFiles}
                                        className="space-y-3"
                                    >
                                        {files.map((item, index) => (
                                            <Reorder.Item
                                                key={item.id}
                                                value={item}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="group flex items-center gap-4 p-4 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl hover:border-blue-500/30 hover:bg-slate-800/60 transition-all cursor-grab active:cursor-grabbing shadow-xl"
                                            >
                                                <div className="flex flex-col items-center gap-1 text-slate-600 group-hover:text-blue-400 transition-colors">
                                                    <GripVertical className="w-5 h-5" />
                                                </div>
                                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                                    <FileText className="w-6 h-6 text-blue-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-white truncate text-sm">
                                                        {item.file.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-medium">{formatBytes(item.file.size)}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs font-black text-slate-700 group-hover:text-blue-500/50 transition-colors">#{index + 1}</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeFile(item.id);
                                                        }}
                                                        className="p-2.5 rounded-xl hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-all"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </Reorder.Item>
                                        ))}
                                    </Reorder.Group>
                                </div>
                            )}
                        </motion.div>

                        {/* Configuration Sidebar */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-4"
                        >
                            <div className="glass-card-premium p-8 sticky top-24 space-y-8">
                                <div className="space-y-2">
                                    <h3 className="text-lg font-black text-white">Merge Configuration</h3>
                                    <p className="text-xs text-slate-500 font-medium">Configure document output</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                                            <span className="text-slate-500">Selected Files</span>
                                            <span className="text-white">{files.length} Documents</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                                            <span className="text-slate-500">Total Size</span>
                                            <span className="text-white">
                                                {formatBytes(files.reduce((acc, f) => acc + f.file.size, 0))}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                            Files will be merged in the <span className="text-white font-bold">exact order</span> shown in the workspace.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleMerge}
                                    disabled={isProcessing || files.length < 2}
                                    className={clsx(
                                        "w-full btn-premium py-5 group gap-3",
                                        (isProcessing || files.length < 2) && "opacity-50 grayscale cursor-not-allowed"
                                    )}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Merge className="w-6 h-6" />
                                            <span>Merge Documents</span>
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>

                                {files.length === 1 && (
                                    <p className="text-center text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                                        Add at least 2 files
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    /* Project Complete View */
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="glass-card-premium p-12 text-center space-y-10 relative overflow-hidden">
                            {/* Success burst effect */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px] -z-10"></div>

                            <div className="relative">
                                <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-2xl animate-float">
                                    <CheckCircle className="w-12 h-12 text-emerald-400" />
                                </div>
                                <h2 className="text-4xl font-black text-white tracking-tight">Merge Complete!</h2>
                                <p className="text-slate-400 font-medium mt-2">Your documents have been unified successfully</p>
                            </div>

                            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-8 grid grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Files</p>
                                    <p className="text-xl font-black text-white text-center">{result.inputFiles}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Pages</p>
                                    <p className="text-xl font-black text-white text-center">{result.pageCount}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Size</p>
                                    <p className="text-xl font-black text-white text-center">{formatBytes(result.size || 0)}</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <button
                                    onClick={handleDownload}
                                    className="w-full btn-premium py-5 flex items-center justify-center gap-3"
                                >
                                    <Download className="w-6 h-6" />
                                    <span>Download PDF</span>
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
                                onClick={clearAll}
                                className="text-sm font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
                            >
                                Start New Project
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
