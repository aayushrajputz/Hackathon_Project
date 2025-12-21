'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scissors,
    Download,
    Loader2,
    CheckCircle,
    FileText,
    Upload,
    X,
    HelpCircle,
    Share2,
    ArrowRight,
    Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api, shareApi } from '@/lib/api';
import clsx from 'clsx';
import ShareModal from '@/components/ui/ShareModal';

interface SplitFile {
    fileId: string;
    url: string;
    filename: string;
    pageCount: number;
    size: number;
    range: string;
}

export default function SplitPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pageRanges, setPageRanges] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<{ files: SplitFile[]; inputPages: number } | null>(null);
    const [isSharing, setIsSharing] = useState<string | null>(null);
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
        setPageRanges('');
        setResult(null);
    };

    const handleSplit = async () => {
        if (!file) return;
        if (!pageRanges.trim()) {
            toast.error('Please enter page ranges');
            return;
        }

        setIsProcessing(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('pages', pageRanges);

            const response = await api.post('/pdf/split', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setResult(response.data.data);
            toast.success(`PDF split into ${response.data.data.files.length} files!`);
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to split PDF');
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
        { label: '1-3', desc: 'Pages 1 to 3' },
        { label: '1-3, 4-6', desc: 'Multi-range' },
        { label: '1, 3, 5', desc: 'Specific pages' },
    ];

    return (
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 overflow-hidden font-sans">
            {/* Background elements */}
            <div className="absolute inset-0 bg-mesh pointer-events-none opacity-40"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>

            <div className="relative z-10 max-w-5xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-6"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-400 via-pink-500 to-rose-500 p-[1px] shadow-2xl shadow-rose-500/20">
                            <div className="w-full h-full rounded-[23px] bg-slate-950 flex items-center justify-center">
                                <Scissors className="w-10 h-10 text-rose-400" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight">Split <span className="text-gradient-premium">PDF</span></h1>
                            <p className="text-slate-400 font-medium mt-1">Extract specific page ranges with precision</p>
                        </div>
                    </motion.div>

                    {file && !result && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleClear}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-white/5 transition-all flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Reset Tool
                        </motion.button>
                    )}
                </div>

                {!result ? (
                    <div className="grid lg:grid-cols-12 gap-8">
                        {/* Workspace */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-12"
                        >
                            <div className="glass-card-premium overflow-hidden border-white/10">
                                <div className="grid md:grid-cols-2">
                                    {/* Upload Side */}
                                    <div className="p-8 md:border-r border-white/5 bg-slate-900/40">
                                        {!file ? (
                                            <div
                                                {...getRootProps()}
                                                className="dropzone-premium group h-[300px] flex items-center justify-center border-dashed cursor-pointer"
                                            >
                                                <input {...getInputProps()} />
                                                <div className="flex flex-col items-center gap-6 text-center">
                                                    <div className="relative">
                                                        <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                                            <Upload className="w-10 h-10 text-rose-400" />
                                                        </div>
                                                        <div className="absolute inset-0 rounded-full border border-rose-500/30 animate-ping opacity-20"></div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h3 className="text-xl font-bold text-white tracking-tight">Select PDF Document</h3>
                                                        <p className="text-slate-500 font-medium text-sm">Drag and drop or browse files</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-[300px] flex flex-col items-center justify-center space-y-6">
                                                <div className="relative group">
                                                    <div className="w-24 h-24 rounded-3xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 group-hover:rotate-6 transition-transform">
                                                        <FileText className="w-12 h-12 text-rose-400" />
                                                    </div>
                                                    <button
                                                        onClick={handleClear}
                                                        className="absolute -top-2 -right-2 p-2 rounded-full bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-lg font-black text-white truncate max-w-[250px]">{file.name}</p>
                                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">{formatBytes(file.size)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Controls Side */}
                                    <div className="p-10 space-y-10">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-black text-white flex items-center gap-2">
                                                    <Zap className="w-5 h-5 text-rose-400" />
                                                    Split Configuration
                                                </h3>
                                                <div className="p-2 rounded-lg bg-white/5 border border-white/5 cursor-help group relative">
                                                    <HelpCircle className="w-4 h-4 text-slate-500" />
                                                    <div className="absolute bottom-full right-0 mb-3 w-48 p-3 rounded-xl bg-slate-900 border border-white/10 text-[10px] text-slate-400 font-medium leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                                                        Enter page numbers separated by commas or ranges using dashes (e.g. 1, 3, 5-10)
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Page Ranges</label>
                                                <input
                                                    type="text"
                                                    value={pageRanges}
                                                    onChange={(e) => setPageRanges(e.target.value)}
                                                    placeholder="e.g. 1-3, 5, 8-12"
                                                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none font-mono"
                                                />
                                            </div>

                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {rangeExamples.map((ex) => (
                                                    <button
                                                        key={ex.label}
                                                        onClick={() => setPageRanges(ex.label)}
                                                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400 hover:text-white hover:border-rose-500/30 transition-all uppercase tracking-tighter"
                                                    >
                                                        {ex.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleSplit}
                                            disabled={isProcessing || !file || !pageRanges.trim()}
                                            className={clsx(
                                                "w-full btn-premium py-5 gap-3",
                                                (isProcessing || !file || !pageRanges.trim()) && "opacity-50 grayscale cursor-not-allowed"
                                            )}
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                    <span>Processing PDF...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Scissors className="w-6 h-6" />
                                                    <span>Split Document</span>
                                                    <ArrowRight className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    /* Results View */
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8"
                    >
                        <div className="glass-card-premium p-10 text-center border-emerald-500/20">
                            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-2xl">
                                <CheckCircle className="w-10 h-10 text-emerald-400" />
                            </div>
                            <h2 className="text-3xl font-black text-white px-2">Splitting Success!</h2>
                            <p className="text-slate-400 font-medium mt-2">Generated {result.files.length} custom documents</p>

                            <div className="mt-8 flex justify-center gap-6">
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Source Pages</p>
                                    <p className="text-xl font-black text-white">{result.inputPages}</p>
                                </div>
                                <div className="w-px h-10 bg-white/10"></div>
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Calculated Files</p>
                                    <p className="text-xl font-black text-white">{result.files.length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {result.files.map((splitFile, index) => (
                                <motion.div
                                    key={splitFile.fileId}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group glass-card-premium p-5 flex items-center gap-4 hover:border-rose-500/30 transition-all border-white/5"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center border border-white/10 group-hover:bg-rose-500/10 group-hover:border-rose-500/20 transition-all">
                                        <FileText className="w-6 h-6 text-slate-400 group-hover:text-rose-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-white truncate text-sm">
                                                {splitFile.filename}
                                            </p>
                                            <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-black tracking-tighter">
                                                {splitFile.range}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{splitFile.pageCount} Pages</span>
                                            <span className="text-[10px] text-slate-700 font-black">•</span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{formatBytes(splitFile.size)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-px bg-white/5 mr-1"></div>
                                        <button
                                            onClick={() => openShare(splitFile.fileId)}
                                            className="p-3 rounded-xl border border-white/5 hover:bg-slate-800 hover:text-cyan-400 transition-all text-slate-500"
                                        >
                                            <Share2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDownload(splitFile.fileId, splitFile.filename)}
                                            className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-rose-500 hover:text-white transition-all text-rose-400"
                                        >
                                            <Download className="w-5 h-5" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="flex justify-center pt-8">
                            <button
                                onClick={handleClear}
                                className="px-8 py-3 rounded-2xl bg-slate-900 border border-white/10 text-slate-400 font-bold hover:text-white hover:border-white/20 transition-all text-sm uppercase tracking-widest"
                            >
                                Process New Document
                            </button>
                        </div>
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

function Trash2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <line x1="10" x2="10" y1="11" y2="17" />
            <line x1="14" x2="14" y1="11" y2="17" />
        </svg>
    );
}
