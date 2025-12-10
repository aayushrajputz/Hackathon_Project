'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Hash,
    Download,
    Loader2,
    CheckCircle,
    FileText,
    Upload,
    X,
    Share2,
    Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api, shareApi } from '@/lib/api';
import { downloadFile } from '@/lib/utils';

type PagePosition = 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';

const positions: { value: PagePosition; label: string }[] = [
    { value: 'bottom-center', label: 'Bottom Center' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'top-center', label: 'Top Center' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
];

const formatOptions = [
    { value: '{n}', label: '1, 2, 3...', preview: '1' },
    { value: 'Page {n}', label: 'Page 1, Page 2...', preview: 'Page 1' },
    { value: '{n} / {total}', label: '1 / 10, 2 / 10...', preview: '1 / 10' },
    { value: 'Page {n} of {total}', label: 'Page 1 of 10...', preview: 'Page 1 of 10' },
    { value: '- {n} -', label: '- 1 -, - 2 -...', preview: '- 1 -' },
];

export default function PageNumbersPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [position, setPosition] = useState<PagePosition>('bottom-center');
    const [format, setFormat] = useState('{n}');
    const [startFrom, setStartFrom] = useState(1);
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
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false,
    });

    const handleClear = () => {
        setFile(null);
        setPosition('bottom-center');
        setFormat('{n}');
        setStartFrom(1);
        setResult(null);
        setShareUrl(null);
    };

    const handleAddPageNumbers = async () => {
        if (!file) {
            toast.error('Please upload a PDF file');
            return;
        }

        setIsProcessing(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('position', position);
            formData.append('format', format);
            formData.append('startFrom', startFrom.toString());

            const response = await api.post('/pdf/page-numbers', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setResult(response.data.data);
            toast.success('Page numbers added successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to add page numbers');
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
                link.download = result.filename || 'numbered.pdf';
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
            downloadFile(result.url, result.filename || 'numbered.pdf');
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

    const getPreviewNumber = () => {
        const preview = format
            .replace('{n}', startFrom.toString())
            .replace('{total}', '10');
        return preview;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 mb-4">
                    <Hash className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add Page Numbers</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Add page numbers to your PDF
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
                                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                                    : 'border-gray-300 dark:border-slate-600 hover:border-rose-400'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                                        <Upload className="w-8 h-8 text-rose-600" />
                                    </div>
                                    <p className="text-lg font-medium">Drag & drop a PDF file here</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                                <FileText className="w-6 h-6 text-rose-600" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{file.name}</p>
                                    <p className="text-sm text-gray-500">{formatBytes(file.size)}</p>
                                </div>
                                <button onClick={handleClear} className="p-2 hover:bg-rose-100 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </motion.div>

                    {/* Settings */}
                    {file && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6 space-y-6">

                            {/* Preview */}
                            <div className="flex justify-center py-4">
                                <div className="relative w-48 h-64 bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-lg shadow-lg">
                                    <div className={`absolute left-0 right-0 text-center text-sm font-medium text-rose-600 ${position.startsWith('top') ? 'top-2' : 'bottom-2'
                                        } ${position.endsWith('left') ? 'text-left pl-3' :
                                            position.endsWith('right') ? 'text-right pr-3' : 'text-center'
                                        }`}>
                                        {getPreviewNumber()}
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                                        <Hash className="w-12 h-12" />
                                    </div>
                                </div>
                            </div>

                            {/* Position */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Position</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {positions.map((pos) => (
                                        <button
                                            key={pos.value}
                                            onClick={() => setPosition(pos.value)}
                                            className={`p-2 text-sm rounded-lg border transition-colors ${position === pos.value
                                                ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/30'
                                                : 'border-gray-200 dark:border-slate-700 hover:border-rose-300'
                                                }`}
                                        >
                                            {pos.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Format */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Format</label>
                                <div className="space-y-2">
                                    {formatOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setFormat(opt.value)}
                                            className={`w-full p-3 text-left rounded-lg border transition-colors flex justify-between items-center ${format === opt.value
                                                ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/30'
                                                : 'border-gray-200 dark:border-slate-700 hover:border-rose-300'
                                                }`}
                                        >
                                            <span className="text-sm">{opt.label}</span>
                                            <code className="text-xs bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
                                                {opt.preview}
                                            </code>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Start From */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Start From</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={startFrom}
                                    onChange={(e) => setStartFrom(parseInt(e.target.value) || 1)}
                                    className="input-field w-32"
                                />
                            </div>

                            {/* Apply Button */}
                            <button
                                onClick={handleAddPageNumbers}
                                disabled={isProcessing}
                                className="btn-primary w-full bg-gradient-to-r from-rose-500 to-pink-600"
                            >
                                {isProcessing ? (
                                    <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Adding Page Numbers...</>
                                ) : (
                                    <><Hash className="w-5 h-5 mr-2" /> Add Page Numbers</>
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
                    <h2 className="text-2xl font-bold">Page Numbers Added!</h2>
                    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                        <p className="text-sm">
                            Format: "{result.settings?.format}" • Position: {result.settings?.position}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            {result.pageCount} pages numbered starting from {result.settings?.startFrom}
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
                        <button onClick={handleClear} className="btn-secondary">Number Another PDF</button>
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
