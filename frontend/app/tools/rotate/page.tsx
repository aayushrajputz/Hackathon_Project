'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    RotateCw,
    Download,
    Loader2,
    CheckCircle,
    FileText,
    Upload,
    X,
    RotateCcw,
    Share2,
    Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api, shareApi } from '@/lib/api';
import { downloadFile } from '@/lib/utils';

type RotationAngle = 90 | 180 | 270;

const rotationOptions: { value: RotationAngle; label: string; icon: string }[] = [
    { value: 90, label: '90° Clockwise', icon: '↻' },
    { value: 180, label: '180° Flip', icon: '↕' },
    { value: 270, label: '90° Counter-clockwise', icon: '↺' },
];

export default function RotatePDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [angle, setAngle] = useState<RotationAngle>(90);
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
        setAngle(90);
        setResult(null);
        setShareUrl(null);
    };

    const handleRotate = async () => {
        if (!file) {
            toast.error('Please upload a PDF file');
            return;
        }

        setIsProcessing(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('angle', angle.toString());

            const response = await api.post('/pdf/rotate', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setResult(response.data.data);
            toast.success(`PDF rotated ${angle}° successfully!`);
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to rotate PDF');
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
                link.download = result.filename || 'rotated.pdf';
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
            downloadFile(result.url, result.filename || 'rotated.pdf');
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
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 mb-4">
                    <RotateCw className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Rotate PDF Pages
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Rotate all pages by 90°, 180°, or 270°
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
                                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                    : 'border-gray-300 dark:border-slate-600 hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-900/10'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                        <Upload className="w-8 h-8 text-orange-600" />
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
                            <div className="flex items-center gap-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                                <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-orange-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-sm text-gray-500">{formatBytes(file.size)}</p>
                                </div>
                                <button
                                    onClick={handleClear}
                                    className="p-2 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 text-gray-500 hover:text-orange-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </motion.div>

                    {/* Rotation Options */}
                    {file && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card p-6 space-y-4"
                        >
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Select Rotation Angle
                            </label>

                            <div className="grid grid-cols-3 gap-3">
                                {rotationOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setAngle(option.value)}
                                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${angle === option.value
                                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                            : 'border-gray-200 dark:border-slate-700 hover:border-orange-300'
                                            }`}
                                    >
                                        <span className="text-3xl">{option.icon}</span>
                                        <span className="text-sm font-medium">{option.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Preview Animation */}
                            <div className="flex justify-center py-4">
                                <div className="relative">
                                    <div
                                        className="w-24 h-32 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-lg border-2 border-orange-300 dark:border-orange-700 flex items-center justify-center transition-transform duration-500"
                                        style={{ transform: `rotate(${angle}deg)` }}
                                    >
                                        <FileText className="w-8 h-8 text-orange-500" />
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">
                                        {angle}°
                                    </div>
                                </div>
                            </div>

                            {/* Rotate Button */}
                            <button
                                onClick={handleRotate}
                                disabled={isProcessing}
                                className="btn-primary w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Rotating PDF...
                                    </>
                                ) : (
                                    <>
                                        <RotateCw className="w-5 h-5" />
                                        Rotate {angle}°
                                    </>
                                )}
                            </button>
                        </motion.div>
                    )}

                    {/* Instructions */}
                    {!file && (
                        <div className="card p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                                How to Rotate a PDF
                            </h3>
                            <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center font-medium">
                                        1
                                    </span>
                                    Upload your PDF file
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center font-medium">
                                        2
                                    </span>
                                    Select rotation angle (90°, 180°, or 270°)
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center font-medium">
                                        3
                                    </span>
                                    Click "Rotate" and download your rotated PDF
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
                            Rotation Complete!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            All pages rotated {result.angle}°
                        </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-6 space-y-3">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-sm text-gray-500">Rotation</p>
                                <p className="text-xl font-bold text-orange-600">{result.angle}°</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Pages</p>
                                <p className="text-xl font-bold text-orange-600">{result.pageCount}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">File Size</p>
                                <p className="text-xl font-bold text-orange-600">{formatBytes(result.size || 0)}</p>
                            </div>
                        </div>
                        {result.processingMs && (
                            <p className="text-xs text-gray-400">
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
                            Download Rotated PDF
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
                            Rotate Another PDF
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
