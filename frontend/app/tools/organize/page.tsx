'use client';

import { useState, useCallback } from 'react';
import { motion, Reorder } from 'framer-motion';
import {
    Layers,
    Download,
    Loader2,
    CheckCircle,
    FileText,
    Upload,
    X,
    Trash2,
    RotateCcw,
    Save,
    Share2,
    Copy,
    Sparkles,
    ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api, shareApi } from '@/lib/api';
import { downloadFile } from '@/lib/utils';
import clsx from 'clsx';
import ShareModal from '@/components/ui/ShareModal';

interface PageItem {
    id: string;
    pageNumber: number;
    selected: boolean;
}

export default function OrganizePDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pages, setPages] = useState<PageItem[]>([]);
    const [originalPageCount, setOriginalPageCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [mode, setMode] = useState<'reorder' | 'remove'>('reorder');
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const uploadedFile = acceptedFiles[0];
            setFile(uploadedFile);
            setResult(null);
            setIsLoading(true);

            try {
                const formData = new FormData();
                formData.append('file', uploadedFile);

                const response = await api.post('/pdf/info', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                const pageCount = response.data.data.pageCount;
                setOriginalPageCount(pageCount);

                const initialPages: PageItem[] = Array.from({ length: pageCount }, (_, i) => ({
                    id: `page-${i + 1}`,
                    pageNumber: i + 1,
                    selected: false,
                }));
                setPages(initialPages);
            } catch (error: any) {
                toast.error(error.response?.data?.error?.message || 'Failed to load PDF info');
                setFile(null);
            } finally {
                setIsLoading(false);
            }
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false,
    });

    const handleClear = () => {
        setFile(null);
        setPages([]);
        setOriginalPageCount(0);
        setResult(null);
        setShareUrl(null);
    };

    const resetOrder = () => {
        const resetPages: PageItem[] = Array.from({ length: originalPageCount }, (_, i) => ({
            id: `page-${i + 1}`,
            pageNumber: i + 1,
            selected: false,
        }));
        setPages(resetPages);
    };

    const togglePageSelection = (id: string) => {
        setPages(prev => prev.map(p =>
            p.id === id ? { ...p, selected: !p.selected } : p
        ));
    };

    const handleApply = async () => {
        if (!file) return;
        setIsProcessing(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            if (mode === 'reorder') {
                const newOrder = pages.map(p => p.pageNumber).join(',');
                formData.append('order', newOrder);

                const response = await api.post('/pdf/organize', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                setResult(response.data.data);
                toast.success('Pages reordered successfully!');
            } else {
                const selectedPages = pages.filter(p => p.selected);
                if (selectedPages.length === 0) {
                    toast.error('Select pages to remove');
                    setIsProcessing(false);
                    return;
                }
                if (selectedPages.length === pages.length) {
                    toast.error('Cannot remove all pages');
                    setIsProcessing(false);
                    return;
                }

                const pagesToRemove = selectedPages.map(p => p.pageNumber).join(',');
                formData.append('pages', pagesToRemove);

                const response = await api.post('/pdf/remove-pages', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                setResult(response.data.data);
                toast.success(`Removed ${selectedPages.length} page(s)!`);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Operation failed');
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
                link.download = result.filename || 'organized.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
                toast.success('Download started!');
            } catch (error) {
                console.error(error);
                toast.error('Failed to download file');
            }
        } else if (result?.url) {
            downloadFile(result.url, result.filename || 'organized.pdf');
        }
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const hasChanges = () => {
        if (mode === 'remove') {
            return pages.some(p => p.selected);
        }
        return pages.some((p, i) => p.pageNumber !== i + 1);
    };

    return (
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 overflow-hidden bg-slate-50 pb-12">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-[120px] animate-pulse-slow"></div>

            <div className="relative z-10 max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-6"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-200 shadow-sm flex items-center justify-center">
                            <Layers className="w-10 h-10 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Organize <span className="text-blue-600">PDF</span></h1>
                            <p className="text-slate-600 font-medium mt-1">Professional layout & page management</p>
                        </div>
                    </motion.div>

                    {file && !result && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-2xl shadow-sm"
                        >
                            <button
                                onClick={() => setMode('reorder')}
                                className={clsx(
                                    "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                                    mode === 'reorder'
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                )}
                            >
                                Reorder
                            </button>
                            <button
                                onClick={() => setMode('remove')}
                                className={clsx(
                                    "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                                    mode === 'remove'
                                        ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                )}
                            >
                                Remove
                            </button>
                        </motion.div>
                    )}
                </div>

                {!result ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full"
                    >
                        {!file ? (
                            <div
                                {...getRootProps()}
                                className="group bg-white h-[400px] flex items-center justify-center border-2 border-dashed border-slate-300 rounded-[2.5rem] hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer shadow-sm"
                            >
                                <input {...getInputProps()} />
                                <div className="flex flex-col items-center gap-6 text-center">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 shadow-inner hover:shadow-md transition-all duration-500">
                                            <Upload className="w-10 h-10 text-blue-500" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Drop your PDF here</h3>
                                        <p className="text-slate-500 font-medium">Click to browse your files</p>
                                    </div>
                                </div>
                            </div>
                        ) : isLoading ? (
                            <div className="bg-white border border-slate-200 shadow-sm rounded-[2.5rem] p-24 flex flex-col items-center justify-center gap-6">
                                <div className="relative">
                                    <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
                                </div>
                                <p className="text-slate-600 font-bold animate-pulse">Analyzing Document structure...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="bg-white border border-slate-200 shadow-sm rounded-[2rem] p-6">
                                        <div className="flex items-start justify-between mb-8">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active File</p>
                                                <h3 className="text-slate-900 font-bold truncate max-w-[150px]">{file.name}</h3>
                                            </div>
                                            <button onClick={handleClear} className="w-8 h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="space-y-4 mb-8">
                                            <div className="flex justify-between items-center px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                <span className="text-slate-500 text-sm font-medium">Total Pages</span>
                                                <span className="text-slate-900 font-black">{originalPageCount}</span>
                                            </div>
                                            <div className="flex justify-between items-center px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                <span className="text-slate-500 text-sm font-medium">File Size</span>
                                                <span className="text-slate-900 font-black">{formatBytes(file.size)}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleApply}
                                            disabled={isProcessing || !hasChanges()}
                                            className={clsx(
                                                "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all",
                                                (isProcessing || !hasChanges())
                                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                                    : "bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700"
                                            )}
                                        >
                                            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                            {isProcessing ? "Processing..." : "Publish Changes"}
                                        </button>

                                        <button
                                            onClick={resetOrder}
                                            className="w-full mt-4 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            Reset Workspace
                                        </button>
                                    </div>

                                    <div className="bg-white border border-slate-200 shadow-sm rounded-[2rem] p-6 border-blue-100">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                                <Sparkles className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Pro Tip</p>
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                            {mode === 'reorder'
                                                ? "Drag and drop thumbnails to redefine the sequence of your document."
                                                : "Click any thumbnail to designate it for removal from the final output."}
                                        </p>
                                    </div>
                                </div>

                                <div className="lg:col-span-3">
                                    <div className="bg-white border border-slate-200 shadow-sm rounded-[2.5rem] p-8 h-full bg-slate-50/30">
                                        {mode === 'reorder' ? (
                                            <Reorder.Group
                                                axis="x"
                                                values={pages}
                                                onReorder={setPages}
                                                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6"
                                            >
                                                {pages.map((page, index) => (
                                                    <Reorder.Item
                                                        key={page.id}
                                                        value={page}
                                                        className="group"
                                                    >
                                                        <motion.div
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            className={clsx(
                                                                "relative aspect-[3/4] bg-white rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all cursor-grab active:cursor-grabbing shadow-sm",
                                                                page.pageNumber !== index + 1
                                                                    ? "border-blue-400 shadow-blue-500/10 shadow-md"
                                                                    : "border-slate-100 hover:border-blue-200 hover:shadow-md"
                                                            )}
                                                        >
                                                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-50 text-[10px] font-bold text-slate-400 border border-slate-100">
                                                                #{index + 1}
                                                            </div>
                                                            <FileText className={clsx(
                                                                "w-10 h-10",
                                                                page.pageNumber !== index + 1 ? "text-blue-500" : "text-slate-300"
                                                            )} />
                                                            <span className="text-lg font-black text-slate-900">{page.pageNumber}</span>
                                                            {page.pageNumber !== index + 1 && (
                                                                <div className="absolute -bottom-3 px-3 py-1 rounded-full bg-blue-600 text-[10px] font-black text-white shadow-xl">
                                                                    Moved
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    </Reorder.Item>
                                                ))}
                                            </Reorder.Group>
                                        ) : (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
                                                {pages.map((page) => (
                                                    <motion.button
                                                        key={page.id}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => togglePageSelection(page.id)}
                                                        className={clsx(
                                                            "relative aspect-[3/4] bg-white rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all shadow-sm",
                                                            page.selected
                                                                ? "border-rose-500 shadow-rose-500/20 shadow-md"
                                                                : "border-slate-100 hover:border-blue-200 hover:shadow-md"
                                                        )}
                                                    >
                                                        {page.selected ? (
                                                            <>
                                                                <Trash2 className="w-10 h-10 text-rose-500" />
                                                                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Delete</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FileText className="w-10 h-10 text-slate-300" />
                                                                <span className="text-lg font-black text-slate-900">{page.pageNumber}</span>
                                                            </>
                                                        )}
                                                        {page.selected && (
                                                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-sm">
                                                                <X className="w-4 h-4" />
                                                            </div>
                                                        )}
                                                    </motion.button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-3xl mx-auto"
                    >
                        <div className="bg-white border border-slate-200 shadow-xl rounded-[3rem] p-12 text-center space-y-10 relative overflow-hidden">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-50 rounded-full blur-[80px] -z-10"></div>

                            <div className="relative">
                                <div className="w-24 h-24 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-6 shadow-inner animate-float">
                                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                                </div>
                                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Project Complete!</h2>
                                <p className="text-slate-600 font-medium text-lg mt-2">Your optimized PDF is ready for deployment</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                <div className="text-center p-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Original</p>
                                    <p className="text-lg font-bold text-slate-700">{result.originalPages} Pages</p>
                                </div>
                                <div className="text-center p-4 border-l border-slate-200">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Final Output</p>
                                    <p className="text-xl font-black text-blue-600">{result.pageCount} Pages</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                                <button onClick={handleDownload} className="w-full sm:w-auto py-5 px-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-md shadow-blue-500/20 group">
                                    <Download className="w-5 h-5 group-hover:animate-bounce" />
                                    <span>Instant Download</span>
                                </button>
                                <button
                                    onClick={() => setShareModalOpen(true)}
                                    className="w-full sm:w-auto py-5 px-10 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-sm"
                                >
                                    <Share2 className="w-5 h-5 text-blue-500" />
                                    <span>Sync & Share</span>
                                </button>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <button onClick={handleClear} className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest">
                                    Process New Task
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

