'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Scissors,
    Download,
    Loader2,
    CheckCircle,
    FileText,
    Upload,
    Plus,
    X,
    HelpCircle,
    Share2,
    Copy,
    Link as LinkIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api, shareApi } from '@/lib/api';
import { downloadFile } from '@/lib/utils';

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
    const [pageCount, setPageCount] = useState<number | null>(null);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [isSharing, setIsSharing] = useState<string | null>(null); // fileId of sharing file

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setResult(null);
            // Get page count would require backend call - for now we'll validate on submit
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
        },
        multiple: false,
    });

    const handleClear = () => {
        setFile(null);
        setPageRanges('');
        setResult(null);
        setPageCount(null);
        setShareUrl(null);
    };

    const handleSplit = async () => {
        if (!file) {
            toast.error('Please upload a PDF file');
            return;
        }

        if (!pageRanges.trim()) {
            toast.error('Please enter page ranges (e.g., 1-3, 4-7)');
            return;
        }

        setIsProcessing(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('pages', pageRanges);

            const response = await api.post('/pdf/split', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const data = response.data.data;
            setResult({
                files: data.files,
                inputPages: data.inputPages,
            });
            setPageCount(data.inputPages);
            toast.success(`PDF split into ${data.files.length} files!`);
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
            console.error(error);
            toast.error('Failed to download file');
        }
    };

    const handleShare = async (fileId: string) => {
        setIsSharing(fileId);
        try {
            const response = await shareApi.create(fileId, 'library', 24);
            const url = response.data.data.url;
            setShareUrl(url);
            await navigator.clipboard.writeText(url);
            toast.success('Share link copied to clipboard!');
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to create share link');
        } finally {
            setIsSharing(null);
        }
    };

    const copyShareUrl = async () => {
        if (shareUrl) {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Link copied!');
        }
    };

    const handleDownloadAll = () => {
        result?.files.forEach(file => {
            handleDownload(file.fileId, file.filename);
        });
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
        { label: '1-3, 4-6', desc: 'Two separate ranges' },
        { label: '1, 3, 5', desc: 'Individual pages' },
        { label: '1-5, 10-15', desc: 'Non-consecutive ranges' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 mb-4">
                    <Scissors className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Split PDF File
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Divide a PDF into multiple files by page ranges
                </p>
            </div>

            {/* Main Content */}
            {!result ? (
                <div className="space-y-6">
                    {/* Upload Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card p-6"
                    >
                        {!file ? (
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragActive
                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                    : 'border-gray-300 dark:border-slate-600 hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/10'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                        <Upload className="w-8 h-8 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
                                            {isDragActive ? 'Drop your PDF here' : 'Drag & drop a PDF file here'}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            or click to browse
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-purple-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-sm text-gray-500">{formatBytes(file.size)}</p>
                                </div>
                                <button
                                    onClick={handleClear}
                                    className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 text-gray-500 hover:text-purple-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </motion.div>

                    {/* Page Range Input */}
                    {file && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card p-6 space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Page Ranges
                                </label>
                                <input
                                    type="text"
                                    value={pageRanges}
                                    onChange={(e) => setPageRanges(e.target.value)}
                                    placeholder="Enter page ranges (e.g., 1-3, 4-7, 8-10)"
                                    className="input-field"
                                />
                            </div>

                            {/* Range Examples */}
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
                                            key={example.label}
                                            onClick={() => setPageRanges(example.label)}
                                            className="flex items-center gap-2 p-2 text-left rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <code className="text-sm font-mono text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                                                {example.label}
                                            </code>
                                            <span className="text-xs text-gray-500">{example.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Split Button */}
                            <button
                                onClick={handleSplit}
                                disabled={isProcessing || !pageRanges.trim()}
                                className="btn-primary w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 disabled:opacity-50"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Splitting PDF...
                                    </>
                                ) : (
                                    <>
                                        <Scissors className="w-5 h-5" />
                                        Split PDF
                                    </>
                                )}
                            </button>
                        </motion.div>
                    )}

                    {/* Instructions */}
                    {!file && (
                        <div className="card p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                                How to Split a PDF
                            </h3>
                            <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center font-medium">
                                        1
                                    </span>
                                    Upload the PDF file you want to split
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center font-medium">
                                        2
                                    </span>
                                    Enter page ranges (e.g., "1-3, 4-7" creates 2 files)
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center font-medium">
                                        3
                                    </span>
                                    Download your split PDF files
                                </li>
                            </ol>
                        </div>
                    )}
                </div>
            ) : (
                /* Result Section */
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                >
                    {/* Success Header */}
                    <div className="card p-6 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Split Complete!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Created {result.files.length} files from {result.inputPages} pages
                        </p>
                    </div>

                    {/* File List */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Output Files</h3>
                            {result.files.length > 1 && (
                                <button
                                    onClick={handleDownloadAll}
                                    className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                                >
                                    <Download className="w-4 h-4" />
                                    Download All
                                </button>
                            )}
                        </div>

                        <div className="space-y-3">
                            {result.files.map((splitFile, index) => (
                                <motion.div
                                    key={splitFile.fileId}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-white truncate">
                                            {splitFile.filename}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {splitFile.pageCount} pages • {formatBytes(splitFile.size)}
                                        </p>
                                    </div>
                                    <code className="text-sm font-mono text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                                        {splitFile.range}
                                    </code>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleShare(splitFile.fileId)}
                                            disabled={!!isSharing}
                                            className="p-2 rounded-lg bg-white dark:bg-slate-700 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors border border-gray-200 dark:border-slate-600"
                                            title="Share"
                                        >
                                            {isSharing === splitFile.fileId ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Share2 className="w-5 h-5" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleDownload(splitFile.fileId, splitFile.filename)}
                                            className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                                            title="Download"
                                        >
                                            <Download className="w-5 h-5" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Share URL Display */}
                        {shareUrl && (
                            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                                <p className="text-sm text-green-700 dark:text-green-300 mb-2 font-medium">
                                    Last created share link:
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
                    </div>

                    {/* Actions */}
                    <div className="flex justify-center">
                        <button onClick={handleClear} className="btn-secondary">
                            Split Another PDF
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
