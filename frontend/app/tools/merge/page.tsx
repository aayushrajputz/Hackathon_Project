'use client';

import { useState, useCallback } from 'react';
import { motion, Reorder } from 'framer-motion';
import {
    Merge,
    Download,
    Loader2,
    CheckCircle,
    FileText,
    GripVertical,
    X,
    Upload,
    Trash2,
    ArrowRight,
    Share2,
    Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api, shareApi } from '@/lib/api';

interface FileWithId {
    id: string;
    file: File;
}

import ShareModal from '@/components/ui/ShareModal';

export default function MergePDFPage() {
    const [files, setFiles] = useState<FileWithId[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [shareModalOpen, setShareModalOpen] = useState(false); // New state

    // ... (rest of the code same as before until handleShare) ...

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles = acceptedFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file
        }));
        setFiles(prev => [...prev, ...newFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
        },
        multiple: true,
    });

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const clearAll = () => {
        setFiles([]);
        setResult(null);
    };

    const handleMerge = async () => {
        if (files.length < 2) {
            toast.error('Please upload at least 2 PDF files');
            return;
        }

        setIsProcessing(true);
        setResult(null);

        try {
            const formData = new FormData();
            files.forEach(({ file }) => formData.append('files', file));

            const response = await api.post('/pdf/merge', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setResult(response.data.data);
            toast.success('PDFs merged successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to merge PDFs');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = async () => {
        if (result?.fileId) {
            try {
                // Fetch as blob from backend proxy to avoid CORS
                const response = await api.get(`/library/download/${result.fileId}`, {
                    responseType: 'blob',
                });
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const blobUrl = window.URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = result.filename || 'merged.pdf';
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
            // Fallback
            const link = document.createElement('a');
            link.href = result.url;
            link.download = result.filename || 'merged.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
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
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4">
                    <Merge className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Merge PDF Files
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Combine multiple PDF files into a single document
                </p>
            </div>

            {/* Main Content */}
            {!result ? (
                <div className="space-y-6">
                    {/* Dropzone */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card p-6"
                    >
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragActive
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-300 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                                }`}
                        >
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Upload className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
                                        {isDragActive ? 'Drop your PDFs here' : 'Drag & drop PDF files here'}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        or click to browse (minimum 2 files)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* File List with Reorder */}
                    {files.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold">
                                    Files to Merge ({files.length})
                                </h2>
                                <button
                                    onClick={clearAll}
                                    className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear All
                                </button>
                            </div>

                            <p className="text-sm text-gray-500 mb-4">
                                Drag files to reorder them before merging
                            </p>

                            <Reorder.Group
                                axis="y"
                                values={files}
                                onReorder={setFiles}
                                className="space-y-2"
                            >
                                {files.map((item, index) => (
                                    <Reorder.Item
                                        key={item.id}
                                        value={item}
                                        className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                                    >
                                        <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                                                {item.file.name}
                                            </p>
                                            <p className="text-xs text-gray-500">{formatBytes(item.file.size)}</p>
                                        </div>
                                        <span className="text-sm text-gray-400 font-medium">
                                            #{index + 1}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFile(item.id);
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>

                            {/* Merge Button */}
                            {files.length >= 2 && (
                                <div className="mt-6 flex gap-4">
                                    <button
                                        onClick={handleMerge}
                                        disabled={isProcessing}
                                        className="btn-primary flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Merging {files.length} files...
                                            </>
                                        ) : (
                                            <>
                                                <Merge className="w-5 h-5" />
                                                Merge {files.length} PDF Files
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {files.length === 1 && (
                                <p className="mt-4 text-center text-amber-600 dark:text-amber-400 text-sm">
                                    ⚠️ Please add at least one more file to merge
                                </p>
                            )}
                        </motion.div>
                    )}

                    {/* Instructions */}
                    {files.length === 0 && (
                        <div className="card p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                                How to Merge PDFs
                            </h3>
                            <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-medium">
                                        1
                                    </span>
                                    Upload 2 or more PDF files using drag & drop
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-medium">
                                        2
                                    </span>
                                    Drag files to arrange them in your preferred order
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-medium">
                                        3
                                    </span>
                                    Click "Merge" and download your combined PDF
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
                            Merge Complete!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            {files.length} PDFs combined into one document
                        </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-6 space-y-3">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-sm text-gray-500">Files Merged</p>
                                <p className="text-xl font-bold text-blue-600">{result.inputFiles}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Pages</p>
                                <p className="text-xl font-bold text-blue-600">{result.pageCount}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">File Size</p>
                                <p className="text-xl font-bold text-blue-600">{formatBytes(result.size || 0)}</p>
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
                            Download Merged PDF
                        </button>
                        <button
                            onClick={() => setShareModalOpen(true)}
                            className="btn-secondary flex items-center justify-center gap-2"
                        >
                            <Share2 className="w-5 h-5" />
                            Share
                        </button>
                        <button onClick={clearAll} className="btn-secondary">
                            Merge More Files
                        </button>
                    </div>

                    <ShareModal
                        isOpen={shareModalOpen}
                        onClose={() => setShareModalOpen(false)}
                        fileId={result.fileId}
                        fileType="temp"
                    />
                </motion.div>
            )}
        </div>
    );
}
