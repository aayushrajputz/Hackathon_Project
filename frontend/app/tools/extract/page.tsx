'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    FileOutput,
    Download,
    Loader2,
    CheckCircle,
    FileText,
    Upload,
    X,
    HelpCircle,
    Share2,
    Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api, shareApi } from '@/lib/api';
import { downloadFile } from '@/lib/utils';

const rangeExamples = [
    { value: '1-5', label: 'Pages 1 to 5' },
    { value: '1,3,5', label: 'Pages 1, 3, and 5' },
    { value: '1-3,7-10', label: 'Pages 1-3 and 7-10' },
    { value: '1,5-8,12', label: 'Mixed selection' },
];

export default function ExtractPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState<number | null>(null);
    const [pages, setPages] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [isSharing, setIsSharing] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const uploadedFile = acceptedFiles[0];
            setFile(uploadedFile);
            setResult(null);
            setPages('');
            setIsLoading(true);

            try {
                const formData = new FormData();
                formData.append('file', uploadedFile);

                const response = await api.post('/pdf/info', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                setPageCount(response.data.data.pageCount);
            } catch (error: any) {
                toast.error(error.response?.data?.error?.message || 'Failed to load PDF');
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
        setPageCount(null);
        setPages('');
        setResult(null);
        setShareUrl(null);
    };

    const handleExtract = async () => {
        if (!file) {
            toast.error('Please upload a PDF file');
            return;
        }
        if (!pages.trim()) {
            toast.error('Please enter page numbers to extract');
            return;
        }

        setIsProcessing(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('pages', pages);

            const response = await api.post('/pdf/extract', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setResult(response.data.data);
            toast.success('Pages extracted successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to extract pages');
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
                link.download = result.filename || 'extracted.pdf';
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
            downloadFile(result.url, result.filename || 'extracted.pdf');
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

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-4">
                    <FileOutput className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Extract Pages</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Pull specific pages into a new PDF
                </p>
            </div>

            {/* Main Content */}
            {!result ? (
                <div className="space-y-6">
                    {/* Upload */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
                        {!file ? (
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragActive
                                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                                    : 'border-gray-300 dark:border-slate-600 hover:border-cyan-400'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                                        <Upload className="w-8 h-8 text-cyan-600" />
                                    </div>
                                    <p className="text-lg font-medium">Drag & drop a PDF file here</p>
                                    <p className="text-sm text-gray-500">or click to browse</p>
                                </div>
                            </div>
                        ) : isLoading ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                                <span className="ml-3">Loading PDF...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
                                <FileText className="w-6 h-6 text-cyan-600" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{file.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {pageCount} pages • {formatBytes(file.size)}
                                    </p>
                                </div>
                                <button onClick={handleClear} className="p-2 hover:bg-cyan-100 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </motion.div>

                    {/* Page Selection */}
                    {file && pageCount && !isLoading && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Pages to Extract (1-{pageCount})
                                </label>
                                <input
                                    type="text"
                                    value={pages}
                                    onChange={(e) => setPages(e.target.value)}
                                    placeholder={`e.g., 1-5, 7, 10-${pageCount}`}
                                    className="input-field"
                                />
                            </div>

                            {/* Quick Examples */}
                            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <HelpCircle className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Format Examples
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {rangeExamples.map((example) => (
                                        <button
                                            key={example.value}
                                            onClick={() => setPages(example.value)}
                                            className="flex items-center gap-2 p-2 text-left rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <code className="text-sm font-mono text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30 px-2 py-0.5 rounded">
                                                {example.value}
                                            </code>
                                            <span className="text-xs text-gray-500">{example.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Page Visualization */}
                            <div className="py-4">
                                <p className="text-sm font-medium mb-3">Available Pages</p>
                                <div className="flex flex-wrap gap-2">
                                    {Array.from({ length: Math.min(pageCount, 20) }, (_, i) => i + 1).map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => {
                                                const current = pages.split(',').map(s => s.trim()).filter(Boolean);
                                                if (current.includes(num.toString())) {
                                                    setPages(current.filter(p => p !== num.toString()).join(', '));
                                                } else {
                                                    setPages([...current, num.toString()].join(', '));
                                                }
                                            }}
                                            className={`w-10 h-10 rounded-lg border-2 text-sm font-bold transition-all ${pages.includes(num.toString())
                                                ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30'
                                                : 'border-gray-200 dark:border-slate-700 hover:border-cyan-300'
                                                }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                    {pageCount > 20 && (
                                        <div className="flex items-center px-3 text-sm text-gray-500">
                                            ...and {pageCount - 20} more
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Extract Button */}
                            <button
                                onClick={handleExtract}
                                disabled={isProcessing || !pages.trim()}
                                className="btn-primary w-full bg-gradient-to-r from-cyan-500 to-blue-600 disabled:opacity-50"
                            >
                                {isProcessing ? (
                                    <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Extracting...</>
                                ) : (
                                    <><FileOutput className="w-5 h-5 mr-2" /> Extract Pages</>
                                )}
                            </button>
                        </motion.div>
                    )}
                </div>
            ) : (
                /* Result */
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-8 text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold">Pages Extracted!</h2>
                    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <p className="text-sm text-gray-500">Original</p>
                                <p className="text-xl font-bold">{result.originalPages} pages</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-500">Extracted</p>
                                <p className="text-xl font-bold text-cyan-600">{result.pageCount} pages</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 pt-2 border-t dark:border-slate-700">
                            Pages: {result.extractedPages}
                        </p>
                    </div>
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
                        <button onClick={handleClear} className="btn-secondary">Extract More</button>
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
