'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileInput,
    Download,
    Loader2,
    CheckCircle,
    FileText,
    Upload,
    X,
    HelpCircle,
    Share2,
    ArrowRight,
    Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api } from '@/lib/api';
import clsx from 'clsx';
import ShareModal from '@/components/ui/ShareModal';
import SignupBanner from '@/components/tools/SignupBanner';

interface RemoveResult {
    fileId: string;
    url: string;
    filename: string;
    pageCount: number;
    originalPages: number;
    pagesRemoved: number;
    size: number;
}

export default function RemovePagesPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pagesToRemove, setPagesToRemove] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<RemoveResult | null>(null);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [activeFileId, setActiveFileId] = useState<string | null>(null);

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
        setPagesToRemove('');
        setResult(null);
    };

    const handleRemove = async () => {
        if (!file) return;
        if (!pagesToRemove.trim()) {
            toast.error('Please enter pages to remove');
            return;
        }

        setIsProcessing(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('pages', pagesToRemove);

            const response = await api.post('/pdf/remove-pages', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setResult(response.data.data);
            toast.success('Pages removed successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to remove pages');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = async (fileId: string, filename: string) => {
        try {
            const response = await api.get(`/library/download/${fileId}`, {
                responseType: 'blob',
            });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            toast.success('Download started!');
        } catch (error) {
            toast.error('Failed to download file');
        }
    };

    const openShare = (fileId: string) => {
        setActiveFileId(fileId);
        setShareModalOpen(true);
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const rangeExamples = [
        { label: '2', desc: 'Remove page 2' },
        { label: '2, 5, 8', desc: 'Remove multiple' },
        { label: '2-5', desc: 'Remove range' },
    ];

    return (
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 overflow-hidden font-sans bg-slate-50 pb-12">
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-100 rounded-full blur-[120px] animate-pulse-slow"></div>

            <div className="relative z-10 max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-6"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-200 shadow-sm flex items-center justify-center">
                            <FileInput className="w-10 h-10 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Remove <span className="text-blue-600">Pages</span></h1>
                            <p className="text-slate-600 font-medium mt-1">Delete specific pages or ranges from your PDF instantly.</p>
                        </div>
                    </motion.div>

                    {file && !result && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleClear}
                            className="px-6 py-3 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 shadow-sm hover:shadow transition-all flex items-center gap-2 bg-white"
                        >
                            <Trash2 className="w-4 h-4" />
                            Reset Tool
                        </motion.button>
                    )}
                </div>

                {!result ? (
                    <div className="grid lg:grid-cols-12 gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-12"
                        >
                            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                                <div className="grid md:grid-cols-2">
                                    <div className="p-8 md:border-r border-slate-100 bg-slate-50/50">
                                        {!file ? (
                                            <div
                                                {...getRootProps()}
                                                className="h-[400px] flex items-center justify-center border-2 border-dashed border-slate-300 rounded-[2rem] bg-white hover:bg-blue-50/50 hover:border-blue-400 cursor-pointer transition-all"
                                            >
                                                <input {...getInputProps()} />
                                                <div className="flex flex-col items-center gap-6 text-center">
                                                    <div className="relative">
                                                        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner">
                                                            <Upload className="w-12 h-12 text-blue-500" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Select PDF</h3>
                                                        <p className="text-slate-500 font-medium text-sm">Drag and drop or browse to start removing pages</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-[400px] flex flex-col items-center justify-center space-y-6">
                                                <div className="relative group">
                                                    <div className="w-32 h-32 rounded-[2.5rem] bg-white border border-slate-200 shadow-md flex items-center justify-center group-hover:rotate-6 transition-transform">
                                                        <FileText className="w-16 h-16 text-blue-500" />
                                                    </div>
                                                    <button
                                                        onClick={handleClear}
                                                        className="absolute -top-3 -right-3 p-2.5 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 shadow-md transition-colors"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <div className="text-center px-4">
                                                    <p className="text-lg font-black text-slate-900 truncate max-w-[250px] mx-auto">{file.name}</p>
                                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1.5">{formatBytes(file.size)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-10 space-y-10 flex flex-col justify-center bg-white">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                                    <Trash2 className="w-5 h-5 text-blue-600" />
                                                    Remove settings
                                                </h3>
                                                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-help group relative">
                                                    <HelpCircle className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                                                    <div className="absolute bottom-full right-0 mb-3 w-56 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white font-medium leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                                                        Enter page numbers to DELETE, separated by commas or ranges using dashes (e.g. 2, 5, 8-10)
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pages to Remove</label>
                                                <input
                                                    type="text"
                                                    value={pagesToRemove}
                                                    onChange={(e) => setPagesToRemove(e.target.value)}
                                                    placeholder="e.g. 2, 5, 8-12"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-mono placeholder-slate-400 font-bold"
                                                />
                                            </div>

                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {rangeExamples.map((ex) => (
                                                    <button
                                                        key={ex.label}
                                                        onClick={() => setPagesToRemove(ex.label)}
                                                        className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all uppercase tracking-widest shadow-sm"
                                                    >
                                                        {ex.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleRemove}
                                            disabled={isProcessing || !file || !pagesToRemove.trim()}
                                            className={clsx(
                                                "w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all",
                                                (isProcessing || !file || !pagesToRemove.trim())
                                                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                                    : "bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md shadow-rose-500/20 hover:opacity-90 group"
                                            )}
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                    <span>Processing...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 className="w-6 h-6" />
                                                    <span>Remove Pages</span>
                                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8 max-w-4xl mx-auto"
                    >
                        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl p-12 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-50 rounded-full blur-[80px] -z-10"></div>
                            <div className="w-24 h-24 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-6 shadow-inner animate-float">
                                <CheckCircle className="w-12 h-12 text-emerald-500" />
                            </div>
                            <h2 className="text-4xl font-black tracking-tight">Done!</h2>
                            <p className="text-slate-600 font-medium mt-3">Pages have been successfully removed.</p>

                            <div className="grid md:grid-cols-3 gap-6 mt-10">
                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-2 shadow-sm text-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Original</p>
                                    <p className="text-3xl font-black text-slate-700">{result.originalPages}</p>
                                </div>
                                <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100 space-y-2 shadow-sm text-center">
                                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Removed</p>
                                    <p className="text-3xl font-black text-rose-600">{result.pagesRemoved}</p>
                                </div>
                                <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 space-y-2 shadow-sm text-center">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Remaining</p>
                                    <p className="text-3xl font-black text-emerald-600">{result.pageCount}</p>
                                </div>
                            </div>

                            <div className="mt-12 flex flex-col md:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => handleDownload(result.fileId, result.filename)}
                                    className="flex-1 max-w-xs mx-auto md:mx-0 py-5 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                                >
                                    <Download className="w-6 h-6" />
                                    Download Result
                                </button>
                                <button
                                    onClick={() => openShare(result.fileId)}
                                    className="flex-1 max-w-xs mx-auto md:mx-0 py-5 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm"
                                >
                                    <Share2 className="w-6 h-6" />
                                    Share File
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-center pt-8 border-t border-slate-200">
                            <button
                                onClick={handleClear}
                                className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest"
                            >
                                Start over
                            </button>
                        </div>
                        <SignupBanner />
                    </motion.div>
                )}
            </div>

            <ShareModal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                fileId={activeFileId}
                fileType="temp"
            />
        </div>
    );
}
