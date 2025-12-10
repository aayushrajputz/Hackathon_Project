'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Crop,
    Download,
    Loader2,
    CheckCircle,
    FileText,
    Upload,
    X,
    Move,
    Share2,
    Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api, shareApi } from '@/lib/api';
import { downloadFile } from '@/lib/utils';

interface CropMargins {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export default function CropPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [margins, setMargins] = useState<CropMargins>({ top: 0, right: 0, bottom: 0, left: 0 });
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
        setMargins({ top: 0, right: 0, bottom: 0, left: 0 });
        setResult(null);
        setShareUrl(null);
    };

    const handleCrop = async () => {
        if (!file) {
            toast.error('Please upload a PDF file');
            return;
        }

        setIsProcessing(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('top', margins.top.toString());
            formData.append('right', margins.right.toString());
            formData.append('bottom', margins.bottom.toString());
            formData.append('left', margins.left.toString());

            const response = await api.post('/pdf/crop', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setResult(response.data.data);
            toast.success('PDF cropped successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to crop PDF');
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
                link.download = result.filename || 'cropped.pdf';
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
            downloadFile(result.url, result.filename || 'cropped.pdf');
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

    const presetCrops = [
        { name: 'No Crop', values: { top: 0, right: 0, bottom: 0, left: 0 } },
        { name: 'Trim Edges', values: { top: 20, right: 20, bottom: 20, left: 20 } },
        { name: 'Header Only', values: { top: 50, right: 0, bottom: 0, left: 0 } },
        { name: 'Footer Only', values: { top: 0, right: 0, bottom: 50, left: 0 } },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 mb-4">
                    <Crop className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Crop PDF</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Adjust page margins and visible area
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
                                    <p className="text-sm text-gray-500">or click to browse</p>
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

                    {/* Crop Settings */}
                    {file && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6 space-y-6">
                            <h3 className="font-semibold">Crop Margins (points)</h3>

                            {/* Preset Buttons */}
                            <div className="flex flex-wrap gap-2">
                                {presetCrops.map((preset) => (
                                    <button
                                        key={preset.name}
                                        onClick={() => setMargins(preset.values)}
                                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${JSON.stringify(margins) === JSON.stringify(preset.values)
                                            ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                            : 'border-gray-200 dark:border-slate-700 hover:border-amber-300'
                                            }`}
                                    >
                                        {preset.name}
                                    </button>
                                ))}
                            </div>

                            {/* Visual Crop Box */}
                            <div className="flex justify-center py-4">
                                <div className="relative w-48 h-64 bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 rounded-lg shadow-lg">
                                    {/* Crop overlay */}
                                    <div
                                        className="absolute bg-amber-500/20 border-2 border-amber-500 border-dashed"
                                        style={{
                                            top: `${Math.min(margins.top / 2, 40)}px`,
                                            right: `${Math.min(margins.right / 2, 40)}px`,
                                            bottom: `${Math.min(margins.bottom / 2, 40)}px`,
                                            left: `${Math.min(margins.left / 2, 40)}px`,
                                        }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                        <Move className="w-8 h-8" />
                                    </div>
                                </div>
                            </div>

                            {/* Margin Inputs */}
                            <div className="grid grid-cols-2 gap-4">
                                {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                                    <div key={side}>
                                        <label className="block text-sm font-medium capitalize mb-1">{side}</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="200"
                                            value={margins[side]}
                                            onChange={(e) => setMargins({ ...margins, [side]: parseFloat(e.target.value) || 0 })}
                                            className="input-field"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Crop Button */}
                            <button
                                onClick={handleCrop}
                                disabled={isProcessing}
                                className="btn-primary w-full bg-gradient-to-r from-amber-500 to-yellow-600"
                            >
                                {isProcessing ? (
                                    <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Cropping...</>
                                ) : (
                                    <><Crop className="w-5 h-5 mr-2" /> Crop PDF</>
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
                    <h2 className="text-2xl font-bold">Crop Complete!</h2>
                    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 text-sm">
                        Margins: Top {result.margins?.top}pt, Right {result.margins?.right}pt, Bottom {result.margins?.bottom}pt, Left {result.margins?.left}pt
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
                        <button onClick={handleClear} className="btn-secondary">Crop Another</button>
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
