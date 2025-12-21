'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Award,
    Download,
    Loader2,
    CheckCircle,
    FileText,
    Upload,
    X,
    Share2,
    Copy,
    MousePointer2,
    Trophy,
    Medal,
    BadgeCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api, shareApi } from '@/lib/api';
import { downloadFile } from '@/lib/utils';

const badgeTypes = [
    { value: 'gold', label: 'Gold Trophy', icon: '🏆', color: 'from-yellow-400 to-amber-500' },
    { value: 'silver', label: 'Silver Medal', icon: '🥈', color: 'from-gray-300 to-slate-400' },
    { value: 'verified', label: 'Verified', icon: '✅', color: 'from-green-400 to-emerald-500' },
];

export default function AddBadgePage() {
    const [file, setFile] = useState<File | null>(null);
    const [badgeType, setBadgeType] = useState('gold');
    const [x, setX] = useState(50);
    const [y, setY] = useState(50);
    const [scale, setScale] = useState(1.0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [isSharing, setIsSharing] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setResult(null);
            setShareUrl(null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false,
    });

    const handleClear = () => {
        setFile(null);
        setBadgeType('gold');
        setX(50);
        setY(50);
        setScale(1.0);
        setResult(null);
        setShareUrl(null);
    };

    const handleAddBadge = async () => {
        if (!file) {
            toast.error('Please upload a PDF file');
            return;
        }

        setIsProcessing(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', badgeType);
            formData.append('x', x.toString());
            formData.append('y', y.toString());
            formData.append('scale', scale.toString());

            const response = await api.post('/pdf/add-badge', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setResult(response.data.data || response.data);
            toast.success('Badge added successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to add badge');
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
                link.download = 'badged_document.pdf';
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
            downloadFile(result.url, 'badged_document.pdf');
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

    const selectedBadge = badgeTypes.find(b => b.value === badgeType) || badgeTypes[0];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mb-4">
                    <Award className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add Badge to PDF</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Add achievement badges, verification marks, or trophies to your documents
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
                                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                    : 'border-gray-300 dark:border-slate-600 hover:border-amber-400'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                        <Upload className="w-8 h-8 text-amber-600" />
                                    </div>
                                    <p className="text-lg font-medium">Drag & drop a PDF file here</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                                <FileText className="w-6 h-6 text-amber-600" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{file.name}</p>
                                    <p className="text-sm text-gray-500">{formatBytes(file.size)}</p>
                                </div>
                                <button onClick={handleClear} className="p-2 hover:bg-amber-100 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </motion.div>

                    {/* Badge Settings */}
                    {file && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6 space-y-6">
                            {/* Badge Type Selection */}
                            <div>
                                <label className="block text-sm font-medium mb-3">Select Badge Type</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {badgeTypes.map((badge) => (
                                        <button
                                            key={badge.value}
                                            onClick={() => setBadgeType(badge.value)}
                                            className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${badgeType === badge.value
                                                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 scale-105'
                                                : 'border-gray-200 dark:border-slate-700 hover:border-amber-300'
                                                }`}
                                        >
                                            <span className="text-4xl">{badge.icon}</span>
                                            <span className="text-sm font-medium">{badge.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Preview Canvas */}
                            <div className="flex justify-center py-4">
                                <div className="relative w-64 h-80 bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-lg shadow-lg overflow-hidden">
                                    {/* Grid */}
                                    <div className="absolute inset-0 opacity-10">
                                        <div className="w-full h-full" style={{
                                            backgroundImage: 'linear-gradient(to right, #ccc 1px, transparent 1px), linear-gradient(to bottom, #ccc 1px, transparent 1px)',
                                            backgroundSize: '20px 20px'
                                        }}></div>
                                    </div>
                                    {/* Badge Preview */}
                                    <div
                                        className="absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2"
                                        style={{
                                            left: `${(x / 600) * 100}%`,
                                            top: `${(y / 800) * 100}%`,
                                            fontSize: `${24 * scale}px`
                                        }}
                                    >
                                        {selectedBadge.icon}
                                    </div>
                                    {/* Document placeholder */}
                                    <div className="absolute inset-4 flex items-center justify-center text-gray-200 dark:text-slate-600">
                                        <FileText className="w-16 h-16" />
                                    </div>
                                </div>
                            </div>

                            {/* Position Controls */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        <MousePointer2 className="w-4 h-4 inline mr-1" /> X Position: {x}
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="600"
                                        value={x}
                                        onChange={(e) => setX(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Y Position: {y}</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="800"
                                        value={y}
                                        onChange={(e) => setY(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                    />
                                </div>
                            </div>

                            {/* Scale */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Badge Size: {Math.round(scale * 100)}%</label>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2"
                                    step="0.1"
                                    value={scale}
                                    onChange={(e) => setScale(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                            </div>

                            {/* Apply Button */}
                            <button
                                onClick={handleAddBadge}
                                disabled={isProcessing}
                                className="btn-primary w-full bg-gradient-to-r from-amber-400 to-orange-500"
                            >
                                {isProcessing ? (
                                    <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Adding Badge...</>
                                ) : (
                                    <><Award className="w-5 h-5 mr-2" /> Add Badge to PDF</>
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
                    <h2 className="text-2xl font-bold">Badge Added!</h2>
                    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                        <p className="text-4xl mb-2">{selectedBadge.icon}</p>
                        <p className="text-sm text-gray-500">{selectedBadge.label} • Position: ({x}, {y})</p>
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
                        <button onClick={handleClear} className="btn-secondary">Add Another Badge</button>
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
