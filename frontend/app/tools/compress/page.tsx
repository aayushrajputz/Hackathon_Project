'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
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
    Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api, shareApi } from '@/lib/api';
import { downloadFile } from '@/lib/utils';

type QualityLevel = 'low' | 'medium' | 'high';

const qualityOptions: { value: QualityLevel; label: string; description: string; reduction: string }[] = [
    { value: 'high', label: 'Light', description: 'Minimal compression, best quality', reduction: '10-20%' },
    { value: 'medium', label: 'Balanced', description: 'Good compression, good quality', reduction: '30-50%' },
    { value: 'low', label: 'Maximum', description: 'Maximum compression, lower quality', reduction: '50-70%' },
];

export default function CompressPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [quality, setQuality] = useState<QualityLevel>('medium');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [isSharing, setIsSharing] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setResult(null);
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
        setQuality('medium');
        setResult(null);
        setShareUrl(null);
    };

    const handleCompress = async () => {
        if (!file) {
            toast.error('Please upload a PDF file');
            return;
        }

        setIsProcessing(true);
        setResult(null);

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
                toast.success('Download started!');
            } catch (error) {
                console.error(error);
                toast.error('Failed to download file');
            }
        } else if (result?.url) {
            downloadFile(result.url, result.filename || 'compressed.pdf');
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
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 mb-4">
                    <Minimize2 className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Compress PDF
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Reduce file size while maintaining quality
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
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                    : 'border-gray-300 dark:border-slate-600 hover:border-green-400 hover:bg-green-50/50 dark:hover:bg-green-900/10'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <Upload className="w-8 h-8 text-green-600" />
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
                            <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-sm text-gray-500">{formatBytes(file.size)}</p>
                                </div>
                                <button
                                    onClick={handleClear}
                                    className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-gray-500 hover:text-green-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </motion.div>

                    {/* Compression Level */}
                    {file && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card p-6 space-y-4"
                        >
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Compression Level
                            </label>

                            <div className="space-y-3">
                                {qualityOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setQuality(option.value)}
                                        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left ${quality === option.value
                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                            : 'border-gray-200 dark:border-slate-700 hover:border-green-300'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${quality === option.value
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-100 dark:bg-slate-800 text-gray-600'
                                            }`}>
                                            {option.value === 'high' && <TrendingDown className="w-5 h-5" />}
                                            {option.value === 'medium' && <Minimize2 className="w-5 h-5" />}
                                            {option.value === 'low' && <Zap className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 dark:text-white">{option.label}</p>
                                            <p className="text-sm text-gray-500">{option.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-sm font-medium ${quality === option.value ? 'text-green-600' : 'text-gray-400'
                                                }`}>
                                                ~{option.reduction}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Size Preview */}
                            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Original size</span>
                                    </div>
                                    <span className="font-medium">{formatBytes(file.size)}</span>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-2">
                                        <Minimize2 className="w-5 h-5 text-green-500" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Estimated size</span>
                                    </div>
                                    <span className="font-medium text-green-600">
                                        ~{formatBytes(
                                            quality === 'high' ? file.size * 0.85 :
                                                quality === 'medium' ? file.size * 0.6 :
                                                    file.size * 0.4
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Compress Button */}
                            <button
                                onClick={handleCompress}
                                disabled={isProcessing}
                                className="btn-primary w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Compressing PDF...
                                    </>
                                ) : (
                                    <>
                                        <Minimize2 className="w-5 h-5" />
                                        Compress PDF
                                    </>
                                )}
                            </button>
                        </motion.div>
                    )}

                    {/* Instructions */}
                    {!file && (
                        <div className="card p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                                How to Compress a PDF
                            </h3>
                            <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center font-medium">
                                        1
                                    </span>
                                    Upload your PDF file
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center font-medium">
                                        2
                                    </span>
                                    Choose your compression level (Light/Balanced/Maximum)
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center font-medium">
                                        3
                                    </span>
                                    Click "Compress" and download your smaller PDF
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
                    className="card p-8 text-center space-y-6"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Compression Complete!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            File size reduced by {result.reduction}
                        </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-6 space-y-4">
                        {/* Size Comparison */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 text-center p-4 bg-white dark:bg-slate-700 rounded-xl">
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Before</p>
                                <p className="text-xl font-bold text-gray-600">{formatBytes(result.originalSize)}</p>
                            </div>
                            <div className="flex-shrink-0">
                                <TrendingDown className="w-6 h-6 text-green-500" />
                            </div>
                            <div className="flex-1 text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">After</p>
                                <p className="text-xl font-bold text-green-600">{formatBytes(result.compressedSize)}</p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t border-gray-200 dark:border-slate-600">
                            <div>
                                <p className="text-sm text-gray-500">Reduction</p>
                                <p className="text-lg font-bold text-green-600">{result.reduction}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Pages</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{result.pageCount}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Quality</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">{result.quality}</p>
                            </div>
                        </div>

                        {result.processingMs && (
                            <p className="text-xs text-gray-400 text-center">
                                Processed in {result.processingMs}ms
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={handleDownload}
                            className="btn-primary flex items-center justify-center gap-2"
                        >
                            <Download className="w-5 h-5" />
                            Download Compressed PDF
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
                        <button onClick={handleClear} className="btn-secondary">
                            Compress Another PDF
                        </button>
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
