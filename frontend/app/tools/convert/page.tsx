'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    FileSpreadsheet,
    Presentation,
    Upload,
    Download,
    Loader2,
    CheckCircle,
    XCircle,
    ArrowRight,
    File,
    X,
    RefreshCw,
    Share2,
    Eye,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import ShareModal from '@/components/ui/ShareModal';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api } from '@/lib/api';

// Conversion types
type ConversionType = 'word-to-pdf' | 'pdf-to-word' | 'excel-to-pdf' | 'ppt-to-pdf' | 'odt-to-pdf';

interface ConversionCard {
    id: ConversionType;
    title: string;
    description: string;
    inputFormats: string[];
    outputFormat: string;
    icon: React.ReactNode;
    color: string;
}

const conversionCards: ConversionCard[] = [
    {
        id: 'word-to-pdf',
        title: 'Word to PDF',
        description: 'Convert DOC, DOCX to PDF',
        inputFormats: ['.doc', '.docx'],
        outputFormat: 'pdf',
        icon: <FileText className="w-8 h-8" />,
        color: 'from-blue-500 to-blue-600'
    },

    {
        id: 'excel-to-pdf',
        title: 'Excel to PDF',
        description: 'Convert XLS, XLSX to PDF',
        inputFormats: ['.xls', '.xlsx'],
        outputFormat: 'pdf',
        icon: <FileSpreadsheet className="w-8 h-8" />,
        color: 'from-emerald-500 to-emerald-600'
    },
    {
        id: 'ppt-to-pdf',
        title: 'PowerPoint to PDF',
        description: 'Convert PPT, PPTX to PDF',
        inputFormats: ['.ppt', '.pptx'],
        outputFormat: 'pdf',
        icon: <Presentation className="w-8 h-8" />,
        color: 'from-orange-500 to-orange-600'
    },
    {
        id: 'odt-to-pdf',
        title: 'ODT to PDF',
        description: 'Convert OpenDocument to PDF',
        inputFormats: ['.odt'],
        outputFormat: 'pdf',
        icon: <File className="w-8 h-8" />,
        color: 'from-purple-500 to-purple-600'
    }
];

type JobStatus = 'idle' | 'uploading' | 'queued' | 'processing' | 'completed' | 'failed';

export default function ConvertPage() {
    const [selectedType, setSelectedType] = useState<ConversionType | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [status, setStatus] = useState<JobStatus>('idle');
    const [jobId, setJobId] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const selectedCard = conversionCards.find(c => c.id === selectedType);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (!selectedCard) return;

        // Filter by allowed extensions
        const validFiles = acceptedFiles.filter(file => {
            const ext = '.' + file.name.split('.').pop()?.toLowerCase();
            return selectedCard.inputFormats.includes(ext);
        });

        if (validFiles.length !== acceptedFiles.length) {
            toast.error(`Some files were skipped. Allowed: ${selectedCard.inputFormats.join(', ')}`);
        }

        setFiles(prev => [...prev, ...validFiles]);
        setError(null);
    }, [selectedCard]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: selectedCard ? Object.fromEntries(
            selectedCard.inputFormats.map(ext => [
                ext === '.pdf' ? 'application/pdf' :
                    ext === '.doc' ? 'application/msword' :
                        ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                            ext === '.xls' ? 'application/vnd.ms-excel' :
                                ext === '.xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                                    ext === '.ppt' ? 'application/vnd.ms-powerpoint' :
                                        ext === '.pptx' ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation' :
                                            ext === '.odt' ? 'application/vnd.oasis.opendocument.text' : '',
                [ext]
            ])
        ) : {},
        disabled: !selectedCard || status !== 'idle'
    });

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleConvert = async () => {
        if (!selectedCard || files.length === 0) return;

        setStatus('uploading');
        setError(null);
        setProgress(0);

        try {
            const formData = new FormData();
            files.forEach(file => formData.append('files', file));
            formData.append('outputFormat', selectedCard.outputFormat);

            const response = await api.post('/convert', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const { jobId: newJobId } = response.data.data;
            setJobId(newJobId);
            setStatus('queued');

            toast.success('Conversion started!');
        } catch (err: any) {
            setStatus('failed');
            setError(err.response?.data?.error?.message || 'Failed to start conversion');
            toast.error('Conversion failed');
        }
    };

    // Poll for job status
    useEffect(() => {
        if (!jobId || status === 'completed' || status === 'failed' || status === 'idle') return;

        const interval = setInterval(async () => {
            try {
                const response = await api.get(`/convert/status/${jobId}`);
                const job = response.data.data;

                setProgress(job.progress);

                if (job.status === 'processing') {
                    setStatus('processing');
                } else if (job.status === 'completed') {
                    setStatus('completed');
                    toast.success('Conversion completed!');

                    // Auto-fetch blob for preview if it's a PDF output
                    if (selectedCard?.outputFormat === 'pdf') {
                        try {
                            const dlRes = await api.get(`/convert/download/${newJobId || jobId}`, { responseType: 'blob' });
                            const url = window.URL.createObjectURL(new Blob([dlRes.data]));
                            setPreviewUrl(url);
                        } catch (e) {
                            console.error("Failed to fetch preview", e);
                        }
                    }
                } else if (job.status === 'failed') {
                    setStatus('failed');
                    setError(job.error || 'Conversion failed');
                    toast.error('Conversion failed');
                }
            } catch (err) {
                console.error('Status poll error:', err);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [jobId, status]);

    const handleDownload = async () => {
        if (!jobId) return;

        try {
            const response = await api.get(`/convert/download/${jobId}`, {
                responseType: 'blob'
            });

            // Get filename from Content-Disposition header
            const contentDisposition = response.headers['content-disposition'];
            let filename = 'converted_file';
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/);
                if (match) filename = match[1];
            }

            // Create blob URL and download
            const blob = new Blob([response.data]);
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            toast.success('Download started!');
        } catch (err: any) {
            toast.error('Download failed');
        }
    };

    const handleReset = () => {
        setFiles([]);
        setStatus('idle');
        setJobId(null);
        setProgress(0);
        setPreviewUrl(null);
        setShowPreview(false);
        setPageNumber(1);
        setError(null);
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-white mb-3">
                        Document Converter
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Convert documents between formats instantly
                    </p>
                </div>

                {/* Step 1: Select Conversion Type */}
                {!selectedType && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h2 className="text-xl font-semibold text-white mb-6">
                            Select Conversion Type
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {conversionCards.map((card) => (
                                <motion.button
                                    key={card.id}
                                    onClick={() => setSelectedType(card.id)}
                                    className={`p-6 rounded-2xl bg-gradient-to-br ${card.color} text-white 
                                        text-left transition-all hover:scale-105 hover:shadow-xl`}
                                    whileHover={{ y: -5 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="flex items-center gap-4 mb-3">
                                        {card.icon}
                                        <div>
                                            <h3 className="font-bold text-lg">{card.title}</h3>
                                            <p className="text-sm opacity-90">{card.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm opacity-80">
                                        <span>{card.inputFormats.join(', ')}</span>
                                        <ArrowRight className="w-4 h-4" />
                                        <span>.{card.outputFormat}</span>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Upload Files */}
                {selectedType && selectedCard && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Back button */}
                        <button
                            onClick={() => { setSelectedType(null); handleReset(); }}
                            className="text-gray-400 hover:text-white flex items-center gap-2"
                        >
                            ← Back to conversions
                        </button>

                        {/* Selected conversion header */}
                        <div className={`p-6 rounded-2xl bg-gradient-to-br ${selectedCard.color} text-white`}>
                            <div className="flex items-center gap-4">
                                {selectedCard.icon}
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedCard.title}</h2>
                                    <p className="opacity-90">
                                        Upload {selectedCard.inputFormats.join(' or ')} files
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Upload Zone */}
                        {status === 'idle' && (
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
                                    transition-all ${isDragActive
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'}`}
                            >
                                <input {...getInputProps()} />
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-300 mb-2">
                                    {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                                </p>
                                <p className="text-gray-500 text-sm">
                                    or click to browse • Max 50MB per file
                                </p>
                            </div>
                        )}

                        {/* File List */}
                        {files.length > 0 && status === 'idle' && (
                            <div className="bg-gray-800/50 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-white font-medium">
                                        Files ({files.length})
                                    </h3>
                                    <button
                                        onClick={handleReset}
                                        className="text-gray-400 hover:text-white text-sm"
                                    >
                                        Clear all
                                    </button>
                                </div>
                                {files.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <p className="text-white text-sm truncate max-w-[300px]">
                                                    {file.name}
                                                </p>
                                                <p className="text-gray-500 text-xs">
                                                    {formatBytes(file.size)}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeFile(index)}
                                            className="text-gray-400 hover:text-red-400"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Convert Button */}
                        {files.length > 0 && status === 'idle' && (
                            <button
                                onClick={handleConvert}
                                className={`w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r ${selectedCard.color}
                                    hover:opacity-90 transition-all flex items-center justify-center gap-2`}
                            >
                                <RefreshCw className="w-5 h-5" />
                                Convert {files.length} file{files.length > 1 ? 's' : ''}
                            </button>
                        )}

                        {/* Progress */}
                        {(status === 'uploading' || status === 'queued' || status === 'processing') && (
                            <div className="bg-gray-800/50 rounded-xl p-6 text-center">
                                <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                                <h3 className="text-white font-medium mb-2">
                                    {status === 'uploading' ? 'Uploading...' :
                                        status === 'queued' ? 'Queued...' : 'Converting...'}
                                </h3>
                                <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                                    <div
                                        className={`bg-gradient-to-r ${selectedCard.color} h-2 rounded-full transition-all`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-gray-400 text-sm">{progress}% complete</p>
                            </div>
                        )}

                        {/* Success */}
                        {status === 'completed' && (
                            <div className="bg-gray-800/50 rounded-xl p-6 text-center">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-white font-bold text-xl mb-2">
                                    Conversion Complete!
                                </h3>
                                <p className="text-gray-400 mb-6">
                                    Your files are ready to download
                                </p>
                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={handleDownload}
                                        className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl 
                                            font-bold flex items-center gap-2 transition-all"
                                    >
                                        <Download className="w-5 h-5" />
                                        Download
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl 
                                            font-medium transition-all"
                                    >
                                        Convert More
                                    </button>
                                    <button
                                        onClick={() => setIsShareOpen(true)}
                                        className="px-6 py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl 
                                            font-medium transition-all flex items-center gap-2"
                                    >
                                        <Share2 className="w-5 h-5" />
                                        Share
                                    </button>
                                    {previewUrl && (
                                        <button
                                            onClick={() => setShowPreview(!showPreview)}
                                            className="px-6 py-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-xl 
                                                font-medium transition-all flex items-center gap-2"
                                        >
                                            <Eye className="w-5 h-5" />
                                            {showPreview ? 'Hide Preview' : 'Preview'}
                                        </button>
                                    )}
                                </div>

                                {/* Visual Comparison Preview */}
                                {showPreview && previewUrl && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-8 border-t border-gray-700 pt-8"
                                    >
                                        <h3 className="text-white font-bold text-xl mb-6">Visual Verification</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Original (if supported) - Simplified placeholder for now */}
                                            <div className="bg-gray-900 rounded-xl p-4 border border-gray-700 min-h-[400px] flex flex-col items-center justify-center">
                                                <div className="text-gray-500 mb-2">Original File</div>
                                                <FileText className="w-16 h-16 text-gray-600 mb-4" />
                                                <p className="text-sm text-gray-500 max-w-xs text-center">
                                                    Original file preview not supported in browser.
                                                    Please verify using the converted result.
                                                </p>
                                            </div>

                                            {/* Converted PDF */}
                                            <div className="bg-gray-900 rounded-xl p-4 border border-gray-700 min-h-[400px] flex flex-col relative overflow-hidden">
                                                <div className="text-gray-500 mb-2 text-center">Converted Result (PDF)</div>
                                                <div className="flex-1 flex items-center justify-center bg-gray-800 rounded-lg overflow-auto max-h-[500px]">
                                                    <Document
                                                        file={previewUrl}
                                                        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                                        loading={<Loader2 className="w-8 h-8 animate-spin text-blue-500" />}
                                                        error={<div className="text-red-400 text-sm">Failed to load preview</div>}
                                                    >
                                                        <Page
                                                            pageNumber={pageNumber}
                                                            width={350}
                                                            renderTextLayer={false}
                                                            renderAnnotationLayer={false}
                                                        />
                                                    </Document>
                                                </div>
                                                {numPages && numPages > 1 && (
                                                    <div className="flex justify-center items-center gap-4 mt-4">
                                                        <button
                                                            disabled={pageNumber <= 1}
                                                            onClick={() => setPageNumber(p => p - 1)}
                                                            className="p-2 bg-gray-800 rounded-full disabled:opacity-50 hover:bg-gray-700"
                                                        >
                                                            <ChevronLeft className="w-4 h-4 text-white" />
                                                        </button>
                                                        <span className="text-white text-sm">
                                                            Page {pageNumber} of {numPages}
                                                        </span>
                                                        <button
                                                            disabled={pageNumber >= numPages}
                                                            onClick={() => setPageNumber(p => p + 1)}
                                                            className="p-2 bg-gray-800 rounded-full disabled:opacity-50 hover:bg-gray-700"
                                                        >
                                                            <ChevronRight className="w-4 h-4 text-white" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {/* Error */}
                        {status === 'failed' && (
                            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
                                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                                <h3 className="text-white font-bold text-xl mb-2">
                                    Conversion Failed
                                </h3>
                                <p className="text-red-400 mb-6">
                                    {error || 'An error occurred during conversion'}
                                </p>
                                <button
                                    onClick={handleReset}
                                    className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl 
                                        font-medium transition-all"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Share Modal */}
            {jobId && (
                <ShareModal
                    isOpen={isShareOpen}
                    onClose={() => setIsShareOpen(false)}
                    fileId={jobId}
                    fileType="temp"
                />
            )}
        </div>
    );
}
