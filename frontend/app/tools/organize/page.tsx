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
    GripVertical,
    RotateCcw,
    Save,
    Share2,
    Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api, shareApi } from '@/lib/api';
import { downloadFile } from '@/lib/utils';

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

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const uploadedFile = acceptedFiles[0];
            setFile(uploadedFile);
            setResult(null);
            setIsLoading(true);

            try {
                // Get PDF info to know page count
                const formData = new FormData();
                formData.append('file', uploadedFile);

                const response = await api.post('/pdf/info', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                const pageCount = response.data.data.pageCount;
                setOriginalPageCount(pageCount);

                // Initialize pages
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
                // Send new page order
                const newOrder = pages.map(p => p.pageNumber).join(',');
                formData.append('order', newOrder);

                const response = await api.post('/pdf/reorder', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                setResult(response.data.data);
                toast.success('Pages reordered successfully!');
            } else {
                // Remove selected pages
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

                const response = await api.post('/pdf/remove', formData, {
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

    const handleShare = async () => {
        if (!result?.fileId) {
            toast.error('No file to share');
            return;
        }

        setIsSharing(true);
        try {
            const response = await shareApi.create(result.fileId, 'library', 24);
            const url = response.data.data.url;
            setShareUrl(url);
            await navigator.clipboard.writeText(url);
            toast.success('Share link copied to clipboard!');
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to create share link');
        } finally {
            setIsSharing(false);
        }
    };

    const copyShareUrl = async () => {
        if (shareUrl) {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Link copied!');
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
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 mb-4">
                    <Layers className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Organize PDF</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Reorder or remove pages from your PDF
                </p>
            </div>

            {/* Main Content */}
            {!result ? (
                <div className="space-y-6">
                    {/* Upload */}
                    {!file ? (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragActive
                                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                                    : 'border-gray-300 dark:border-slate-600 hover:border-violet-400'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                        <Upload className="w-8 h-8 text-violet-600" />
                                    </div>
                                    <p className="text-lg font-medium">Drag & drop a PDF file here</p>
                                    <p className="text-sm text-gray-500">or click to browse</p>
                                </div>
                            </div>
                        </motion.div>
                    ) : isLoading ? (
                        <div className="card p-12 text-center">
                            <Loader2 className="w-12 h-12 animate-spin mx-auto text-violet-500" />
                            <p className="mt-4 text-gray-600">Loading PDF...</p>
                        </div>
                    ) : (
                        <>
                            {/* File Info & Mode Toggle */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-6 h-6 text-violet-600" />
                                        <div>
                                            <p className="font-medium truncate max-w-xs">{file.name}</p>
                                            <p className="text-sm text-gray-500">{originalPageCount} pages • {formatBytes(file.size)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setMode('reorder')}
                                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${mode === 'reorder'
                                                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400'
                                                }`}
                                        >
                                            Reorder
                                        </button>
                                        <button
                                            onClick={() => setMode('remove')}
                                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${mode === 'remove'
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400'
                                                }`}
                                        >
                                            Remove Pages
                                        </button>
                                        <button
                                            onClick={handleClear}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Page Grid */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold">
                                        {mode === 'reorder' ? 'Drag pages to reorder' : 'Select pages to remove'}
                                    </h3>
                                    <button
                                        onClick={resetOrder}
                                        className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        Reset
                                    </button>
                                </div>

                                {mode === 'reorder' ? (
                                    <Reorder.Group
                                        axis="x"
                                        values={pages}
                                        onReorder={setPages}
                                        className="flex flex-wrap gap-4"
                                    >
                                        {pages.map((page, index) => (
                                            <Reorder.Item
                                                key={page.id}
                                                value={page}
                                                className="cursor-grab active:cursor-grabbing"
                                            >
                                                <div
                                                    className={`w-20 h-28 rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all hover:shadow-lg ${page.pageNumber !== index + 1
                                                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                                                        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                                                        }`}
                                                >
                                                    <GripVertical className="w-4 h-4 text-gray-400" />
                                                    <FileText className="w-6 h-6 text-gray-400" />
                                                    <span className="text-sm font-bold">{page.pageNumber}</span>
                                                    {page.pageNumber !== index + 1 && (
                                                        <span className="text-xs text-violet-600">→ {index + 1}</span>
                                                    )}
                                                </div>
                                            </Reorder.Item>
                                        ))}
                                    </Reorder.Group>
                                ) : (
                                    <div className="flex flex-wrap gap-4">
                                        {pages.map((page) => (
                                            <button
                                                key={page.id}
                                                onClick={() => togglePageSelection(page.id)}
                                                className={`w-20 h-28 rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all hover:shadow-lg ${page.selected
                                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                                    : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                                                    }`}
                                            >
                                                {page.selected && (
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                )}
                                                <FileText className={`w-6 h-6 ${page.selected ? 'text-red-400' : 'text-gray-400'}`} />
                                                <span className={`text-sm font-bold ${page.selected ? 'text-red-600' : ''}`}>
                                                    {page.pageNumber}
                                                </span>
                                                {page.selected && (
                                                    <span className="text-xs text-red-500">Remove</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Summary */}
                                <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                                    {mode === 'reorder' ? (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            New order: {pages.map(p => p.pageNumber).join(', ')}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {pages.filter(p => p.selected).length} page(s) selected for removal
                                        </p>
                                    )}
                                </div>

                                {/* Apply Button */}
                                <button
                                    onClick={handleApply}
                                    disabled={isProcessing || !hasChanges()}
                                    className={`btn-primary w-full mt-4 ${mode === 'remove'
                                        ? 'bg-gradient-to-r from-red-500 to-rose-600'
                                        : 'bg-gradient-to-r from-violet-500 to-purple-600'
                                        } disabled:opacity-50`}
                                >
                                    {isProcessing ? (
                                        <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Processing...</>
                                    ) : mode === 'reorder' ? (
                                        <><Save className="w-5 h-5 mr-2" /> Apply New Order</>
                                    ) : (
                                        <><Trash2 className="w-5 h-5 mr-2" /> Remove Selected Pages</>
                                    )}
                                </button>
                            </motion.div>
                        </>
                    )}
                </div>
            ) : (
                /* Result */
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-8 text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold">
                        {result.pagesRemoved !== undefined ? 'Pages Removed!' : 'Pages Reordered!'}
                    </h2>
                    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Original</p>
                            <p className="text-xl font-bold">{result.originalPages} pages</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Result</p>
                            <p className="text-xl font-bold text-violet-600">{result.pageCount} pages</p>
                        </div>
                    </div>
                    {result.pagesRemoved !== undefined && (
                        <p className="text-sm text-gray-500">
                            Removed {result.pagesRemoved} page(s): {result.removedPages}
                        </p>
                    )}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button onClick={handleDownload} className="btn-primary flex items-center justify-center gap-2">
                            <Download className="w-5 h-5" /> Download
                        </button>
                        <button
                            onClick={handleShare}
                            disabled={isSharing}
                            className="btn-secondary flex items-center justify-center gap-2"
                        >
                            {isSharing ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Share2 className="w-5 h-5" />
                            )}
                            {isSharing ? 'Creating Link...' : 'Share'}
                        </button>
                        <button onClick={handleClear} className="btn-secondary">Organize Another</button>
                    </div>

                    {/* Share URL Display */}
                    {shareUrl && (
                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                            <p className="text-sm text-green-700 dark:text-green-300 mb-2 font-medium">
                                Share link created!
                            </p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={shareUrl}
                                    readOnly
                                    className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-lg truncate"
                                />
                                <button
                                    onClick={copyShareUrl}
                                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
