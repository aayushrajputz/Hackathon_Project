'use client';

import { useState, useCallback } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
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
    Zap,
    Shield,
    Database,
    ZapIcon,
    ArrowUpRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api } from '@/lib/api';
import clsx from 'clsx';
import ShareModal from '@/components/ui/ShareModal';
import SignupBanner from '@/components/tools/SignupBanner';

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

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
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
            toast.error('Minimum requirement: 2 PDF files');
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
            toast.success('PDFs Merged Successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Merging failed');
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
                link.download = result.filename || 'merged_asset.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            } catch (error) {
                toast.error('Asset extraction error');
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
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-10 overflow-hidden font-sans bg-slate-50 pb-20">
            {/* Ambient Background Lights */}
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[140px] -z-10 animate-pulse-slow"></div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-16">
                {/* Tactical Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-8"
                    >
                        <div className="w-20 h-20 rounded-[2.5rem] bg-blue-600 shadow-xl shadow-blue-500/20 flex items-center justify-center border border-white/20">
                            <Merge className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 mb-2">
                                <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest">Fast & Secure</span>
                            </div>
                            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Merge <span className="text-blue-600">PDF</span></h1>
                            <p className="text-slate-500 font-bold mt-2 text-lg">Combine multiple documents into one in seconds.</p>
                        </div>
                    </motion.div>

                    {files.length > 0 && !result && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={clearAll}
                            className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 hover:bg-rose-50 border border-slate-200 bg-white transition-all flex items-center gap-3 shadow-sm"
                        >
                            <Trash2 className="w-4 h-4" />
                            Purge Workspace
                        </motion.button>
                    )}
                </div>

                {!result ? (
                    <div className="grid lg:grid-cols-12 gap-10 items-stretch">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-8 space-y-8"
                        >
                            <div
                                {...getRootProps()}
                                className={clsx(
                                    "border-4 border-dashed rounded-[3.5rem] bg-white transition-all cursor-pointer shadow-sm relative overflow-hidden group/drop",
                                    files.length > 0 ? "border-slate-100 p-10 bg-slate-50/50" : "h-[450px] flex items-center justify-center border-slate-100 hover:border-blue-600 hover:bg-blue-50/50"
                                )}
                            >
                                <input {...getInputProps()} />
                                {files.length === 0 ? (
                                    <div className="flex flex-col items-center gap-8 text-center px-12 z-10">
                                        <div className="w-24 h-24 rounded-[2.5rem] bg-blue-100 flex items-center justify-center group-hover/drop:scale-110 group-hover/drop:rotate-6 transition-all duration-700 shadow-inner">
                                            <Upload className="w-10 h-10 text-blue-600" />
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Add Files</h3>
                                            <p className="text-slate-400 font-bold text-[10px] uppercase leading-relaxed tracking-widest">Drag and drop PDFs to start merging</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6 group-hover/drop:opacity-80 transition-opacity">
                                        <div className="w-16 h-16 rounded-[1.25rem] bg-white border border-slate-200 shadow-md flex items-center justify-center mb-4">
                                            <Upload className="w-7 h-7 text-blue-600" />
                                        </div>
                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Synch Additional Assets</span>
                                    </div>
                                )}
                            </div>

                            {files.length > 0 && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest shadow-xl">
                                                Active Layer Stack
                                            </div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Drag to reorder sequence</span>
                                        </div>
                                    </div>

                                    <Reorder.Group
                                        axis="y"
                                        values={files}
                                        onReorder={setFiles}
                                        className="space-y-4"
                                    >
                                        {files.map((item, index) => (
                                            <Reorder.Item
                                                key={item.id}
                                                value={item}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="group flex items-center gap-6 p-6 bg-white border border-slate-200 rounded-[2.5rem] hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-500/5 transition-all cursor-grab active:cursor-grabbing shadow-sm"
                                            >
                                                <div className="flex flex-col items-center text-slate-200 group-hover:text-blue-400 transition-colors">
                                                    <GripVertical className="w-6 h-6" />
                                                </div>
                                                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                    <FileText className="w-8 h-8" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-lg font-black text-slate-900 truncate tracking-tight">
                                                        {item.file.name}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{formatBytes(item.file.size)}</span>
                                                        <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">SOURCE_OK</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-500 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all">
                                                        STACK_{index + 1}
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeFile(item.id);
                                                        }}
                                                        className="p-3.5 rounded-2xl border border-transparent bg-slate-50 hover:bg-rose-50 hover:border-rose-100 text-slate-400 hover:text-rose-600 transition-all"
                                                    >
                                                        <X className="w-6 h-6" />
                                                    </button>
                                                </div>
                                            </Reorder.Item>
                                        ))}
                                    </Reorder.Group>
                                </div>
                            )}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-4"
                        >
                            <div className="bg-slate-900 border border-slate-800 rounded-[3.5rem] p-10 h-full flex flex-col gap-12 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2"></div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                            <Database className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <h3 className="text-2xl font-black text-white tracking-tight leading-none uppercase">Merge Options</h3>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Secure processing enabled</p>
                                </div>

                                <div className="flex-1 space-y-8">
                                    <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 space-y-4">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-slate-500">Linked Assets</span>
                                            <span className="text-blue-400 font-black">{files.length} NODES</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-slate-500">Payload Size</span>
                                            <span className="text-blue-400 font-black">
                                                {formatBytes(files.reduce((acc, f) => acc + f.file.size, 0))}
                                            </span>
                                        </div>
                                        <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Verified Integrity Layer</span>
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-[2rem] bg-blue-600/10 border border-blue-500/20 flex items-start gap-4">
                                        <Zap className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-blue-100 leading-relaxed font-bold uppercase tracking-tight">
                                            Files will be merged in the <span className="text-white">exact order</span> they appear in your list.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <button
                                        onClick={handleMerge}
                                        disabled={isProcessing || files.length < 2}
                                        className={clsx(
                                            "w-full py-7 rounded-[2rem] font-black flex items-center justify-center gap-4 transition-all group shadow-2xl",
                                            (isProcessing || files.length < 2)
                                                ? "bg-white/5 text-slate-600 cursor-not-allowed border border-white/5"
                                                : "bg-blue-600 text-white shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-1"
                                        )}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin text-white" />
                                                <span className="text-xs uppercase tracking-widest">Merging...</span>
                                            </>
                                        ) : (
                                            <>
                                                <ZapIcon className="w-6 h-6 group-hover:scale-125 transition-transform" />
                                                <span className="text-xs uppercase tracking-widest">Merge PDFs</span>
                                                <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                            </>
                                        )}
                                    </button>

                                    {files.length === 1 && (
                                        <p className="text-center text-[10px] text-rose-500 font-black uppercase tracking-[0.3em] animate-pulse">
                                            Add Min. 2 Nodes
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="bg-white rounded-[4rem] border border-slate-200 shadow-2xl p-16 text-center space-y-12 relative overflow-hidden">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-50 rounded-full blur-[100px] -z-10"></div>

                            <div className="space-y-6">
                                <div className="w-32 h-32 rounded-[3.5rem] bg-blue-600 shadow-2xl shadow-blue-500/30 flex items-center justify-center mx-auto mb-10 border border-white/20 animate-in zoom-in duration-1000">
                                    <CheckCircle className="w-16 h-16 text-white" />
                                </div>
                                <h1 className="text-6xl font-black tracking-tighter text-slate-900 leading-none">Files <span className="text-blue-600">Combined</span></h1>
                                <p className="text-slate-500 font-bold text-lg max-w-sm mx-auto leading-relaxed">Your documents have been merged into a single PDF.</p>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-[3rem] p-10 grid grid-cols-3 gap-8 shadow-inner">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nodes Unified</p>
                                    <p className="text-3xl font-black text-slate-900 text-center uppercase tracking-tighter">{result.inputFiles} FILES</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Layer Count</p>
                                    <p className="text-3xl font-black text-blue-600 text-center uppercase tracking-tighter">{result.pageCount} PGS</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Asset Size</p>
                                    <p className="text-3xl font-black text-slate-900 text-center uppercase tracking-tighter">{formatBytes(result.size || 0)}</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <button
                                    onClick={handleDownload}
                                    className="w-full py-7 bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-4 transition-all shadow-2xl shadow-blue-500/40 hover:-translate-y-1"
                                >
                                    <Download className="w-7 h-7" />
                                    <span>Download Merged PDF</span>
                                </button>
                                <button
                                    onClick={() => setShareModalOpen(true)}
                                    className="w-full py-7 bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-4 transition-all shadow-xl shadow-black/10 hover:bg-black hover:-translate-y-1"
                                >
                                    <Share2 className="w-6 h-6 text-blue-400" />
                                    <span>Share Link</span>
                                </button>
                            </div>

                            <div className="pt-8 border-t border-slate-100">
                                <button
                                    onClick={clearAll}
                                    className="px-10 py-4 rounded-xl text-[10px] font-black text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all uppercase tracking-[0.4em]"
                                >
                                    Initialize New Sequence
                                </button>
                            </div>
                        </div>
                        <SignupBanner />
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

function ShieldCheck({ className }: { className?: string }) {
    return <Shield className={className} />;
}
