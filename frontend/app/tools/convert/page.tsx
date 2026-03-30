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
    Sparkles,
    Zap,
    Shield,
    History,
    FileCode,
    Cpu,
    Monitor
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
import clsx from 'clsx';

// Conversion types
type ConversionType = 'word-to-pdf' | 'pdf-to-word' | 'excel-to-pdf' | 'ppt-to-pdf' | 'odt-to-pdf';

interface ConversionCard {
    id: ConversionType;
    title: string;
    description: string;
    inputFormats: string[];
    outputFormat: string;
    icon: any;
    color: string;
}

const conversionCards: ConversionCard[] = [
    {
        id: 'word-to-pdf',
        title: 'Word to PDF',
        description: 'Convert Word documents to PDF',
        inputFormats: ['.doc', '.docx'],
        outputFormat: 'pdf',
        icon: FileText,
        color: 'bg-blue-600 shadow-blue-500/20',
    },
    {
        id: 'excel-to-pdf',
        title: 'Excel to PDF',
        description: 'Convert Excel spreadsheets to PDF',
        inputFormats: ['.xls', '.xlsx'],
        outputFormat: 'pdf',
        icon: FileSpreadsheet,
        color: 'bg-blue-600 shadow-blue-500/20',
    },
    {
        id: 'ppt-to-pdf',
        title: 'Slides to PDF',
        description: 'Convert PowerPoint slides to PDF',
        inputFormats: ['.ppt', '.pptx'],
        outputFormat: 'pdf',
        icon: Presentation,
        color: 'bg-blue-600 shadow-blue-500/20',
    },
    {
        id: 'odt-to-pdf',
        title: 'ODT to PDF',
        description: 'Convert ODT files to PDF',
        inputFormats: ['.odt'],
        outputFormat: 'pdf',
        icon: FileCode,
        color: 'bg-blue-600 shadow-blue-500/20',
    },
];

type JobStatus = 'idle' | 'uploading' | 'queued' | 'processing' | 'completed' | 'failed';

export default function ConvertPage() {
    const [selectedType, setSelectedType] = useState<ConversionType | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [status, setStatus] = useState<JobStatus>('idle');
    const [jobId, setJobId] = useState<string | null>(null);
    const [fileId, setFileId] = useState<string | null>(null);
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

        const validFiles = acceptedFiles.filter(file => {
            const ext = '.' + file.name.split('.').pop()?.toLowerCase();
            return selectedCard.inputFormats.includes(ext);
        });

        if (validFiles.length !== acceptedFiles.length) {
            toast.error(`Invalid format. Allowed: ${selectedCard.inputFormats.join(', ')}`);
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
            toast.success('Starting conversion');
        } catch (err: any) {
            setStatus('failed');
            setError(err.response?.data?.error?.message || 'Failed to start conversion');
        }
    };

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
                    if (job.fileId) {
                        setFileId(job.fileId);
                    }
                    if (selectedCard?.outputFormat === 'pdf' && job.fileId) {
                        try {
                            const dlRes = await api.get(`/library/download/${job.fileId}`, { responseType: 'blob' });
                            const url = window.URL.createObjectURL(new Blob([dlRes.data], { type: 'application/pdf' }));
                            setPreviewUrl(url);
                        } catch (e) {
                            console.error("Diagnostic: Preview failed", e);
                        }
                    }
                } else if (job.status === 'failed') {
                    setStatus('failed');
                    setError(job.error || 'Conversion failed');
                }
            } catch (err) {
                console.error('Diagnostic poll error:', err);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [jobId, status, selectedCard]);

    const handleDownload = async () => {
        const downloadId = fileId || jobId;
        if (!downloadId) return;

        try {
            const url = fileId ? `/library/download/${fileId}` : `/convert/download/${jobId}`;
            const response = await api.get(url, { responseType: 'blob' });

            const contentDisposition = response.headers['content-disposition'];
            let filename = `converted_${files[0]?.name.split('.')[0] || 'result'}.${selectedCard?.outputFormat || 'pdf'}`;

            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/);
                if (match) filename = match[1];
            }

            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (e) {
            toast.error('Failed to download file');
        }
    };

    const handleReset = () => {
        setFiles([]);
        setStatus('idle');
        setJobId(null);
        setFileId(null);
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
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-10 overflow-hidden font-sans bg-slate-50 pb-20">
            {/* Ambient Background Lights */}
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[140px] -z-10 animate-pulse-slow"></div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-16">
                <div className="text-center space-y-6 max-w-4xl mx-auto">
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-none"
                    >
                        Convert <span className="text-blue-600">Files</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-500 text-lg md:text-xl font-bold max-w-2xl mx-auto leading-relaxed"
                    >
                        Convert your documents to PDF easily.
                    </motion.p>
                </div>

                {!selectedType ? (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                    >
                        {conversionCards.map((card, idx) => (
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                key={card.id}
                                onClick={() => setSelectedType(card.id)}
                                className="group relative p-10 rounded-[3rem] bg-white border border-slate-200 shadow-sm text-slate-900 text-left overflow-hidden transition-all hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 hover:border-blue-300"
                            >
                                <div className={clsx(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center mb-10 transition-transform group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white",
                                    "bg-blue-50 text-blue-600 shadow-sm border border-blue-100"
                                )}>
                                    <card.icon className="w-8 h-8" />
                                </div>

                                <div className="space-y-3 relative z-10">
                                    <h3 className="text-2xl font-black tracking-tight">{card.title}</h3>
                                    <p className="text-sm text-slate-400 font-bold leading-relaxed">{card.description}</p>
                                </div>

                                <div className="mt-10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:border-blue-200 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                                            {card.inputFormats[0]}
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                        <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-black text-white uppercase tracking-widest shadow-xl">
                                            {card.outputFormat}
                                        </div>
                                    </div>
                                    <Zap className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-4xl mx-auto space-y-10"
                    >
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => { setSelectedType(null); handleReset(); }}
                                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-600 shadow-sm transition-all font-black text-[10px] uppercase tracking-widest group"
                            >
                                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                Go back
                            </button>
                            <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20">
                                <Zap className="w-4 h-4" />
                                {selectedCard!.title} ACTIVE
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 shadow-sm rounded-[4rem] overflow-hidden">
                            <AnimatePresence mode="wait">
                                {status === 'idle' ? (
                                    <motion.div
                                        key="idle"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="p-12 space-y-12"
                                    >
                                        <div
                                            {...getRootProps()}
                                            className={clsx(
                                                "group h-[400px] flex items-center justify-center border-4 border-dashed cursor-pointer rounded-[3.5rem] transition-all duration-500 relative overflow-hidden",
                                                isDragActive ? "border-blue-600 bg-blue-50/50" : "border-slate-100 bg-slate-50/30 hover:bg-blue-50/50 hover:border-blue-400"
                                            )}
                                        >
                                            <input {...getInputProps()} />
                                            <div className="flex flex-col items-center gap-8 text-center px-12 z-10">
                                                <div className="w-28 h-28 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-inner">
                                                    <Upload className="w-12 h-12 text-blue-600" />
                                                </div>
                                                <div className="space-y-4">
                                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Drop files here</h3>
                                                    <div className="flex items-center justify-center gap-3">
                                                        {selectedCard!.inputFormats.map(ext => (
                                                            <span key={ext} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:border-blue-200 transition-colors">{ext}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {files.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="space-y-6"
                                            >
                                                <div className="flex items-center justify-between px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                                                            <History className="w-4 h-4 text-white" />
                                                        </div>
                                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Files added ({files.length})</h3>
                                                    </div>
                                                    <button onClick={handleReset} className="text-[10px] font-black text-rose-500 hover:bg-rose-50 px-4 py-2 rounded-xl transition-all uppercase tracking-widest">Clear</button>
                                                </div>
                                                <div className="grid gap-4">
                                                    {files.map((file, idx) => (
                                                        <div key={idx} className="group flex items-center justify-between p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:border-blue-600 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                                                            <div className="flex items-center gap-6">
                                                                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                                    <FileText className="w-8 h-8" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-lg font-black text-slate-900 max-w-[500px] truncate tracking-tight">{file.name}</p>
                                                                    <div className="flex items-center gap-3 mt-1">
                                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{formatBytes(file.size)}</span>
                                                                        <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                                                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">READY</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button onClick={() => removeFile(idx)} className="p-4 rounded-2xl bg-slate-50 hover:bg-rose-50 hover:text-rose-500 text-slate-400 transition-all border border-transparent hover:border-rose-100">
                                                                <X className="w-6 h-6" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>

                                                <button
                                                    onClick={handleConvert}
                                                    className="w-full py-7 rounded-[2rem] font-black flex items-center justify-center gap-6 text-white bg-blue-600 shadow-2xl shadow-blue-500/40 hover:bg-blue-700 hover:-translate-y-1 transition-all mt-10 group"
                                                >
                                                    <RefreshCw className="w-7 h-7 group-hover:rotate-180 transition-transform duration-1000" />
                                                    <span className="text-base tracking-[0.3em] uppercase">Convert Now</span>
                                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-3 transition-transform" />
                                                </button>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ) : (status === 'uploading' || status === 'queued' || status === 'processing') ? (
                                    <motion.div
                                        key="processing"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="p-24 flex flex-col items-center justify-center space-y-12"
                                    >
                                        <div className="relative">
                                            <div className="w-40 h-40 rounded-full border-8 border-slate-50 border-t-blue-600 animate-spin"></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Zap className="w-12 h-12 text-blue-600 animate-pulse" />
                                            </div>
                                        </div>

                                        <div className="text-center space-y-10 w-full max-w-lg">
                                            <div className="space-y-4">
                                                <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
                                                    {status === 'uploading' ? 'Uploading' :
                                                        status === 'queued' ? 'Queued' : 'Converting'}
                                                </h3>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">
                                                    <span>Progress</span>
                                                    <span>{progress}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden border border-slate-50 p-1">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        className="h-full bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : status === 'completed' ? (
                                    <motion.div
                                        key="completed"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-16 space-y-16"
                                    >
                                        <div className="text-center space-y-8">
                                            <div className="w-28 h-28 rounded-[3rem] bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto shadow-inner animate-in zoom-in duration-1000">
                                                <CheckCircle className="w-14 h-14 text-emerald-500" />
                                            </div>
                                            <div className="space-y-3">
                                                <h2 className="text-6xl font-black tracking-tighter text-slate-900 uppercase leading-none">Done!</h2>
                                                <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Your conversion is complete.</p>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <button
                                                onClick={handleDownload}
                                                className="w-full py-7 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-[2.5rem] flex items-center justify-center gap-4 text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-blue-500/40 hover:-translate-y-1"
                                            >
                                                <Download className="w-7 h-7" />
                                                <span>Download Now</span>
                                            </button>
                                            <button
                                                onClick={() => setIsShareOpen(true)}
                                                className="w-full py-7 bg-slate-900 text-white font-black rounded-[2.5rem] flex items-center justify-center gap-4 text-[11px] uppercase tracking-[0.3em] transition-all shadow-xl shadow-black/10 hover:bg-black hover:-translate-y-1"
                                            >
                                                <Share2 className="w-7 h-7 text-blue-400" />
                                                <span>Share Link</span>
                                            </button>
                                        </div>

                                        <div className="flex flex-col md:flex-row items-center gap-6 justify-center">
                                            {previewUrl && (
                                                <button
                                                    onClick={() => setShowPreview(!showPreview)}
                                                    className="px-10 py-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-700 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-3"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    {showPreview ? 'Close preview' : 'Preview'}
                                                </button>
                                            )}
                                            <button
                                                onClick={handleReset}
                                                className="px-10 py-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-700 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-3"
                                            >
                                                <History className="w-4 h-4" />
                                                Start over
                                            </button>
                                        </div>

                                        {showPreview && previewUrl && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 50 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="pt-16 border-t border-slate-100 space-y-10"
                                            >
                                                <div className="flex items-center justify-between px-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                                                            <Monitor className="w-5 h-5 text-white" />
                                                        </div>
                                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Preview</h3>
                                                    </div>
                                                    <div className="flex items-center gap-5">
                                                        <button
                                                            disabled={pageNumber <= 1}
                                                            onClick={() => setPageNumber(p => p - 1)}
                                                            className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 transition-all"
                                                        >
                                                            <ChevronLeft className="w-6 h-6" />
                                                        </button>
                                                        <span className="text-[11px] font-black text-slate-900 bg-white border border-slate-200 px-6 py-2.5 rounded-2xl uppercase tracking-[0.2em] shadow-smmin-w-[120px] text-center">
                                                            Page {pageNumber} / {numPages || '...'}
                                                        </span>
                                                        <button
                                                            disabled={numPages ? pageNumber >= numPages : true}
                                                            onClick={() => setPageNumber(p => p + 1)}
                                                            className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 transition-all"
                                                        >
                                                            <ChevronRight className="w-6 h-6" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-100 rounded-[4rem] p-10 border border-slate-200 flex items-center justify-center min-h-[700px] shadow-inner relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-blue-600/5 backdrop-blur-[2px]"></div>
                                                    <div className="relative z-10 transition-transform hover:scale-[1.02] duration-700">
                                                        <Document
                                                            file={previewUrl}
                                                            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                                            loading={<Loader2 className="w-16 h-16 animate-spin text-blue-600" />}
                                                        >
                                                            <Page
                                                                pageNumber={pageNumber}
                                                                width={Math.min(window.innerWidth - 100, 700)}
                                                                renderTextLayer={false}
                                                                renderAnnotationLayer={false}
                                                                className="shadow-[0_40px_80px_rgba(0,0,0,0.15)] rounded-2xl overflow-hidden border border-white"
                                                            />
                                                        </Document>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="failed"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="p-24 text-center space-y-12"
                                    >
                                        <div className="w-28 h-28 rounded-[3rem] bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto shadow-inner">
                                            <XCircle className="w-16 h-16 text-rose-500" />
                                        </div>
                                        <div className="space-y-6">
                                            <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Conversion failed</h3>
                                            <div className="bg-rose-50 py-5 px-10 rounded-[2rem] border border-rose-100 inline-block">
                                                <p className="text-rose-600 font-black font-mono text-sm uppercase tracking-widest">ERROR: {error || 'Something went wrong'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleReset}
                                            className="px-14 py-6 rounded-[2.5rem] bg-slate-900 border border-slate-800 text-white font-black text-[11px] uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl shadow-black/10 block mx-auto mt-10 hover:-translate-y-1"
                                        >
                                            Try again
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { icon: Shield, title: 'Secure', desc: 'Protected processing' },
                                { icon: Zap, title: 'Fast', desc: 'Instant results' },
                                { icon: FileCode, title: 'Accurate', desc: 'Preserving layout' }
                            ].map((feature, i) => (
                                <div key={i} className="bg-white border border-slate-100 shadow-sm rounded-[2.5rem] p-8 flex items-center gap-6 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                                        <feature.icon className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none mb-1.5">{feature.title}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none opacity-70">{feature.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            {jobId && (
                <ShareModal
                    isOpen={isShareOpen}
                    onClose={() => setIsShareOpen(false)}
                    fileId={fileId || jobId || ""}
                    fileType={fileId ? "library" : "temp"}
                />
            )}
        </div>
    );
}

function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
