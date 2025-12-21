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
    glow: string;
}

const conversionCards: ConversionCard[] = [
    {
        id: 'word-to-pdf',
        title: 'Word to PDF',
        description: 'Elite conversion for DOCX/DOC',
        inputFormats: ['.doc', '.docx'],
        outputFormat: 'pdf',
        icon: FileText,
        color: 'from-blue-400 to-indigo-600',
        glow: 'shadow-blue-500/20'
    },
    {
        id: 'excel-to-pdf',
        title: 'Excel to PDF',
        description: 'Precision table rendering',
        inputFormats: ['.xls', '.xlsx'],
        outputFormat: 'pdf',
        icon: FileSpreadsheet,
        color: 'from-emerald-400 to-teal-600',
        glow: 'shadow-emerald-500/20'
    },
    {
        id: 'ppt-to-pdf',
        title: 'Slides to PDF',
        description: 'Retain high-fidelity visuals',
        inputFormats: ['.ppt', '.pptx'],
        outputFormat: 'pdf',
        icon: Presentation,
        color: 'from-orange-400 to-rose-600',
        glow: 'shadow-orange-500/20'
    },
    {
        id: 'odt-to-pdf',
        title: 'ODT to PDF',
        description: 'OpenDocument standard conversion',
        inputFormats: ['.odt'],
        outputFormat: 'pdf',
        icon: File,
        color: 'from-purple-400 to-fuchsia-600',
        glow: 'shadow-purple-500/20'
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
            toast.success('Conversion pipeline initiated');
        } catch (err: any) {
            setStatus('failed');
            setError(err.response?.data?.error?.message || 'Submission failed');
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
                    if (selectedCard?.outputFormat === 'pdf') {
                        try {
                            const dlRes = await api.get(`/convert/download/${jobId}`, { responseType: 'blob' });
                            const url = window.URL.createObjectURL(new Blob([dlRes.data]));
                            setPreviewUrl(url);
                        } catch (e) {
                            console.error("Preview retrieval failed", e);
                        }
                    }
                } else if (job.status === 'failed') {
                    setStatus('failed');
                    setError(job.error || 'Pipeline failure');
                }
            } catch (err) {
                console.error('Status poll error:', err);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [jobId, status, selectedCard]);

    const handleDownload = async () => {
        if (!jobId || !previewUrl) {
            if (jobId) {
                try {
                    const response = await api.get(`/convert/download/${jobId}`, { responseType: 'blob' });
                    const contentDisposition = response.headers['content-disposition'];
                    let filename = 'converted_output';
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
                } catch (e) { toast.error('Download extraction failed'); }
            }
            return;
        }

        const link = document.createElement('a');
        link.href = previewUrl;
        link.download = `converted_${files[0]?.name.split('.')[0] || 'result'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 overflow-hidden font-sans">
            <div className="absolute inset-0 bg-mesh pointer-events-none opacity-20"></div>
            <div className="absolute top-10 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>

            <div className="relative z-10 max-w-7xl mx-auto">
                <div className="mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-4"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-white/10 backdrop-blur-md mb-4 group hover:border-blue-500/30 transition-colors">
                            <Sparkles className="w-4 h-4 text-blue-400 group-hover:animate-spin-slow" />
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Next-Gen Conversion Engine</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter">
                            Universal <span className="text-gradient-premium">Converter</span>
                        </h1>
                        <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">
                            Switch document architectures with zero data loss. Powered by our proprietary rendering stack.
                        </p>
                    </motion.div>
                </div>

                {!selectedType ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        {conversionCards.map((card, idx) => (
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                key={card.id}
                                onClick={() => setSelectedType(card.id)}
                                className={clsx(
                                    "group relative p-8 rounded-[40px] bg-slate-900/40 border border-white/5 backdrop-blur-3xl text-white text-left overflow-hidden transition-all hover:scale-[1.03] hover:border-white/20 active:scale-95",
                                    card.glow
                                )}
                            >
                                <div className={clsx(
                                    "absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 blur-[60px] group-hover:opacity-10 transition-opacity",
                                    card.color
                                )}></div>

                                <div className={clsx(
                                    "w-16 h-16 rounded-[24px] bg-gradient-to-br p-[1px] mb-8",
                                    card.color
                                )}>
                                    <div className="w-full h-full rounded-[23px] bg-slate-950 flex items-center justify-center">
                                        <card.icon className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                                    </div>
                                </div>

                                <div className="space-y-2 relative z-10">
                                    <h3 className="text-xl font-black tracking-tight">{card.title}</h3>
                                    <p className="text-sm text-slate-500 font-medium leading-normal">{card.description}</p>
                                </div>

                                <div className="mt-8 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-white transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className="px-2 py-1 rounded bg-white/5">{card.inputFormats[0]}</div>
                                        <ArrowRight className="w-3 h-3" />
                                        <div className="px-2 py-1 rounded bg-white/5">.{card.outputFormat}</div>
                                    </div>
                                    <Zap className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-yellow-400" />
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-4xl mx-auto space-y-8"
                    >
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => { setSelectedType(null); handleReset(); }}
                                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all font-bold text-sm"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Return to Matrix
                            </button>
                            <div className="px-6 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black text-xs uppercase tracking-widest">
                                {selectedCard!.title} ACTIVE
                            </div>
                        </div>

                        <div className="glass-card-premium overflow-hidden border-white/10">
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
                                                "dropzone-premium group h-80 flex items-center justify-center border-dashed cursor-pointer relative",
                                                isDragActive ? "border-blue-500/50 bg-blue-500/5" : "border-white/5"
                                            )}
                                        >
                                            <input {...getInputProps()} />
                                            <div className="flex flex-col items-center gap-6 text-center">
                                                <div className="relative">
                                                    <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <Upload className="w-10 h-10 text-blue-400" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-2xl font-black text-white tracking-tight">DROP PAYLOAD HERE</h3>
                                                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest leading-relaxed">
                                                        Accepting: {selectedCard!.inputFormats.join(', ')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {files.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="space-y-4"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Selected Archives ({files.length})</h3>
                                                    <button onClick={handleReset} className="text-xs font-bold text-rose-500 hover:underline">Discard All</button>
                                                </div>
                                                <div className="grid gap-3">
                                                    {files.map((file, idx) => (
                                                        <div key={idx} className="group flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/20 transition-all">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center border border-white/10 group-hover:border-blue-500/30 transition-colors">
                                                                    <FileText className="w-6 h-6 text-blue-400" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black text-white max-w-[400px] truncate">{file.name}</p>
                                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{formatBytes(file.size)}</p>
                                                                </div>
                                                            </div>
                                                            <button onClick={() => removeFile(idx)} className="p-2 rounded-xl bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>

                                                <button
                                                    onClick={handleConvert}
                                                    className="w-full btn-premium py-6 group gap-4 mt-8"
                                                >
                                                    <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" />
                                                    <span className="text-lg">INITIALIZE PIPELINE</span>
                                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
                                        className="p-20 flex flex-col items-center justify-center space-y-12"
                                    >
                                        <div className="relative">
                                            <div className="w-32 h-32 rounded-full border-4 border-white/5 border-t-blue-500 animate-spin"></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <RefreshCw className="w-10 h-10 text-blue-400/50 animate-pulse" />
                                            </div>
                                            <div className="absolute inset-0 bg-blue-500/10 blur-[60px] rounded-full"></div>
                                        </div>

                                        <div className="text-center space-y-8 w-full max-w-md">
                                            <div className="space-y-4">
                                                <h3 className="text-3xl font-black text-white tracking-tight uppercase">
                                                    {status === 'uploading' ? 'Ingesting Payload' :
                                                        status === 'queued' ? 'In Queue' : 'Decoupling Data'}
                                                </h3>
                                                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Network Speed: Optimized • Engine: Enterprise</p>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                    <span>Progression</span>
                                                    <span className="text-blue-400">{progress}%</span>
                                                </div>
                                                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
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
                                        className="p-12 space-y-12"
                                    >
                                        <div className="text-center space-y-6">
                                            <div className="w-24 h-24 rounded-[40px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-2xl animate-float">
                                                <CheckCircle className="w-12 h-12 text-emerald-400" />
                                            </div>
                                            <div>
                                                <h2 className="text-5xl font-black tracking-tighter text-white uppercase">MISSION SUCCESS</h2>
                                                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs mt-4">Document Architecture Converted to {selectedCard?.outputFormat}</p>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <button
                                                onClick={handleDownload}
                                                className="w-full btn-premium py-6 flex items-center justify-center gap-4 text-lg"
                                            >
                                                <Download className="w-6 h-6" />
                                                <span>EXTRACT ARCHIVE</span>
                                            </button>
                                            <button
                                                onClick={() => setIsShareOpen(true)}
                                                className="w-full btn-glass py-6 border-white/10 hover:border-blue-500/50 flex items-center justify-center gap-4 text-lg"
                                            >
                                                <Share2 className="w-6 h-6 text-blue-400" />
                                                <span>NETWORK SYNC</span>
                                            </button>
                                        </div>

                                        <div className="flex flex-col md:flex-row items-center gap-4 justify-center">
                                            {previewUrl && (
                                                <button
                                                    onClick={() => setShowPreview(!showPreview)}
                                                    className="px-8 py-3 rounded-2xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    {showPreview ? 'TERMINATE PREVIEW' : 'VISUAL VERIFICATION'}
                                                </button>
                                            )}
                                            <button
                                                onClick={handleReset}
                                                className="px-8 py-3 rounded-2xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2"
                                            >
                                                <History className="w-4 h-4" />
                                                COMMENCE NEW JOB
                                            </button>
                                        </div>

                                        {showPreview && previewUrl && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="pt-12 border-t border-white/5 space-y-8"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-xl font-black text-white tracking-tight uppercase">High-Fidelity Preview</h3>
                                                    <div className="flex items-center gap-4">
                                                        <button
                                                            disabled={pageNumber <= 1}
                                                            onClick={() => setPageNumber(p => p - 1)}
                                                            className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 disabled:opacity-30 transition-all"
                                                        >
                                                            <ChevronLeft className="w-5 h-5 text-white" />
                                                        </button>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                            Page {pageNumber} / {numPages || '...'}
                                                        </span>
                                                        <button
                                                            disabled={numPages ? pageNumber >= numPages : true}
                                                            onClick={() => setPageNumber(p => p + 1)}
                                                            className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 disabled:opacity-30 transition-all"
                                                        >
                                                            <ChevronRight className="w-5 h-5 text-white" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-950/80 rounded-[40px] p-8 border border-white/5 flex items-center justify-center min-h-[600px] shadow-inner">
                                                    <Document
                                                        file={previewUrl}
                                                        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                                        loading={<Loader2 className="w-12 h-12 animate-spin text-blue-500" />}
                                                    >
                                                        <Page
                                                            pageNumber={pageNumber}
                                                            width={Math.min(window.innerWidth - 100, 600)}
                                                            renderTextLayer={false}
                                                            renderAnnotationLayer={false}
                                                            className="shadow-[0_40px_100px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden"
                                                        />
                                                    </Document>
                                                </div>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="failed"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="p-20 text-center space-y-8"
                                    >
                                        <div className="w-24 h-24 rounded-[40px] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
                                            <XCircle className="w-12 h-12 text-rose-500" />
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="text-3xl font-black text-white uppercase tracking-tight">PIPELINE CRITICAL FAILURE</h3>
                                            <p className="text-rose-400 font-bold bg-rose-500/5 py-3 px-6 rounded-2xl border border-rose-500/10 inline-block font-mono text-sm">
                                                ERROR: {error || 'GENERIC_CONVERSION_FAULT'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleReset}
                                            className="px-12 py-5 rounded-[32px] bg-white border border-white text-slate-900 font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all"
                                        >
                                            RESTART SYSTEM
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { icon: Shield, title: 'Safe Protocols', desc: 'Secure Sandbox Extraction' },
                                { icon: Zap, title: 'Edge Processing', desc: 'Sub-second Latency conversion' },
                                { icon: FileText, title: 'Preservation', desc: 'Vector Layout Maintenance' }
                            ].map((feature, i) => (
                                <div key={i} className="glass-card-premium p-6 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center">
                                        <feature.icon className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">{feature.title}</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{feature.desc}</p>
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
                    fileId={jobId}
                    fileType="temp"
                />
            )}
        </div>
    );
}
