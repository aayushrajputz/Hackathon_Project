'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Droplet,
    Download,
    Loader2,
    CheckCircle,
    FileText,
    Upload,
    X,
    Type,
    Share2,
    Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api, shareApi } from '@/lib/api';
import { downloadFile } from '@/lib/utils';

type WatermarkPosition = 'center' | 'top' | 'bottom' | 'diagonal';

const positions = [
    { value: 'center', label: 'Center' },
    { value: 'top', label: 'Top' },
    { value: 'bottom', label: 'Bottom' },
    { value: 'diagonal', label: 'Diagonal' },
];

export default function WatermarkPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [text, setText] = useState('CONFIDENTIAL');
    const [position, setPosition] = useState<WatermarkPosition>('center');
    const [opacity, setOpacity] = useState(0.3);
    const [fontSize, setFontSize] = useState(48);
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
        setText('CONFIDENTIAL');
        setPosition('center');
        setOpacity(0.3);
        setResult(null);
        setShareUrl(null);
    };

    const handleWatermark = async () => {
        if (!file) {
            toast.error('Please upload a PDF file');
            return;
        }
        if (!text.trim()) {
            toast.error('Please enter watermark text');
            return;
        }

        setIsProcessing(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('text', text);
            formData.append('position', position);
            formData.append('opacity', opacity.toString());
            formData.append('fontSize', fontSize.toString());

            const response = await api.post('/pdf/watermark', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setResult(response.data.data);
            toast.success('Watermark added successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to add watermark');
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
                link.download = result.filename || 'watermarked.pdf';
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
            downloadFile(result.url, result.filename || 'watermarked.pdf');
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
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 mb-4">
                    <Droplet className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add Watermark</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Add text watermark to all pages
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
                                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                                    : 'border-gray-300 dark:border-slate-600 hover:border-teal-400'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                                        <Upload className="w-8 h-8 text-teal-600" />
                                    </div>
                                    <p className="text-lg font-medium">Drag & drop a PDF file here</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                                <FileText className="w-6 h-6 text-teal-600" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{file.name}</p>
                                    <p className="text-sm text-gray-500">{formatBytes(file.size)}</p>
                                </div>
                                <button onClick={handleClear} className="p-2 hover:bg-teal-100 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </motion.div>

                    {/* Watermark Settings */}
                    {file && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6 space-y-6">
                            {/* Text Input */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Watermark Text</label>
                                <input
                                    type="text"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Enter watermark text"
                                    className="input-field"
                                    maxLength={50}
                                />
                            </div>

                            {/* Preview */}
                            <div className="flex justify-center py-6">
                                <div className="relative w-48 h-64 bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-lg shadow-lg overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span
                                            className="text-gray-400 font-bold transform"
                                            style={{
                                                opacity: opacity,
                                                fontSize: `${Math.min(fontSize / 3, 20)}px`,
                                                transform: position === 'diagonal' ? 'rotate(-45deg)' : 'none',
                                                marginTop: position === 'top' ? '-60px' : position === 'bottom' ? '60px' : 0
                                            }}
                                        >
                                            {text || 'WATERMARK'}
                                        </span>
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                                        <Type className="w-12 h-12" />
                                    </div>
                                </div>
                            </div>

                            {/* Position */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Position</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {positions.map((pos) => (
                                        <button
                                            key={pos.value}
                                            onClick={() => setPosition(pos.value as WatermarkPosition)}
                                            className={`p-2 text-sm rounded-lg border transition-colors ${position === pos.value
                                                ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/30'
                                                : 'border-gray-200 dark:border-slate-700 hover:border-teal-300'
                                                }`}
                                        >
                                            {pos.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Opacity Slider */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Opacity: {Math.round(opacity * 100)}%
                                </label>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1"
                                    step="0.1"
                                    value={opacity}
                                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            {/* Font Size */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Font Size: {fontSize}pt</label>
                                <input
                                    type="range"
                                    min="12"
                                    max="72"
                                    step="4"
                                    value={fontSize}
                                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            {/* Apply Button */}
                            <button
                                onClick={handleWatermark}
                                disabled={isProcessing || !text.trim()}
                                className="btn-primary w-full bg-gradient-to-r from-teal-500 to-cyan-600"
                            >
                                {isProcessing ? (
                                    <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Adding Watermark...</>
                                ) : (
                                    <><Droplet className="w-5 h-5 mr-2" /> Add Watermark</>
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
                    <h2 className="text-2xl font-bold">Watermark Added!</h2>
                    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                        <p className="text-sm">
                            "{result.watermark?.text}" • {result.watermark?.position} • {Math.round(result.watermark?.opacity * 100)}% opacity
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{result.pageCount} pages</p>
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
                        <button onClick={handleClear} className="btn-secondary">Add Another</button>
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
