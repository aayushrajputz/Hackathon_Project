'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileOutput,
    Download,
    Loader2,
    CheckCircle,
    FileText,
    Upload,
    X,
    HelpCircle,
    Share2,
    ArrowRight,
    Zap,
    Columns,
    Layers,
    Scissors,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api, shareApi } from '@/lib/api';
import clsx from 'clsx';
import ShareModal from '@/components/ui/ShareModal';

const rangeExamples = [
    { value: '1-5', label: 'Batch Range' },
    { value: '1,3,5', label: 'Manual Picks' },
    { value: '1-3,7-10', label: 'Multi Segments' },
];

export default function ExtractPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState<number | null>(null);
    const [pages, setPages] = useState('');
    const [isLoadingInfo, setIsLoadingInfo] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [shareModalOpen, setShareModalOpen] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const uploadedFile = acceptedFiles[0];
            setFile(uploadedFile);
            setResult(null);
            setPages('');
            setIsLoadingInfo(true);

            try {
                const formData = new FormData();
                formData.append('file', uploadedFile);

                const response = await api.post('/pdf/info', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                setPageCount(response.data.data.pageCount);
                toast.success('Document analysis complete');
            } catch (error: any) {
                toast.error(error.response?.data?.error?.message || 'Failed to analyze PDF');
                setFile(null);
            } finally {
                setIsLoadingInfo(false);
            }
        }
    }, []);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false,
    });

    const handleClear = () => {
        setFile(null);
        setPageCount(null);
        setPages('');
        setResult(null);
    };

    const handleExtract = async () => {
        if (!file || !pages.trim()) return;

        setIsProcessing(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('pages', pages);

            const response = await api.post('/pdf/extract', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setResult(response.data.data);
            toast.success('Document extraction successful!');
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to extract document');
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
                link.download = result.filename || 'extracted.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            } catch (error) {
                toast.error('Failed to download file');
            }
        }
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // Helper to determine if a page is selected (very basic check for the UI visualization)
    const isPageSelected = (num: number) => {
        if (!pages) return false;
        const selectedParts = pages.split(',').map(p => p.trim());
        return selectedParts.some(part => {
            if (part === num.toString()) return true;
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(n => parseInt(n));
                return num >= start && num <= end;
            }
            return false;
        });
    };

    const togglePage = (num: number) => {
        const current = pages.split(',').map(p => p.trim()).filter(Boolean);
        if (current.includes(num.toString())) {
            setPages(current.filter(p => p !== num.toString()).join(', '));
        } else {
            setPages([...current, num.toString()].join(', '));
        }
    };

    return (
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 overflow-hidden font-sans">
            <div className="absolute inset-0 bg-mesh pointer-events-none opacity-20"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>

            <div className="relative z-10 max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-6"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500 p-[1px] shadow-2xl shadow-cyan-500/20">
                            <div className="w-full h-full rounded-[23px] bg-slate-950 flex items-center justify-center">
                                <FileOutput className="w-10 h-10 text-cyan-400" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight">Extract <span className="text-gradient-premium">Pages</span></h1>
                            <p className="text-slate-400 font-medium mt-1">Carve out specific content architectures from existing PDFs</p>
                        </div>
                    </motion.div>

                    {file && !result && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleClear}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-white/5 transition-all flex items-center gap-2"
                        >
                            <X className="w-4 h-4" />
                            Reset Selection
                        </motion.button>
                    )}
                </div>

                {!result ? (
                    <div className="grid lg:grid-cols-12 gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-8 flex flex-col gap-6"
                        >
                            <div className="glass-card-premium min-h-[500px] flex flex-col relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-20"></div>

                                {!file ? (
                                    <div
                                        {...getRootProps()}
                                        className="dropzone-premium group flex-1 flex items-center justify-center border-dashed cursor-pointer border-0 rounded-none"
                                    >
                                        <input {...getInputProps()} />
                                        <div className="flex flex-col items-center gap-8 text-center px-10">
                                            <div className="relative">
                                                <div className="w-28 h-28 rounded-[40px] bg-cyan-500/10 flex items-center justify-center group-hover:rotate-6 transition-transform duration-500 border border-cyan-500/20">
                                                    <Layers className="w-14 h-14 text-cyan-400" />
                                                </div>
                                                <div className="absolute -top-2 -right-2 w-10 h-10 rounded-2xl bg-slate-900 border border-cyan-500/30 flex items-center justify-center shadow-xl">
                                                    <Scissors className="w-5 h-5 text-cyan-400" />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <h3 className="text-2xl font-black text-white tracking-tight uppercase">Ingest Source Document</h3>
                                                <p className="text-slate-500 font-bold text-xs tracking-widest leading-relaxed">DRAG A PDF FILE INTO THIS TERMINAL TO BEGIN ANALYSIS</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : isLoadingInfo ? (
                                    <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                                        <div className="relative">
                                            <Loader2 className="w-16 h-16 text-cyan-500 animate-spin" />
                                            <div className="absolute inset-0 bg-cyan-500/20 blur-xl"></div>
                                        </div>
                                        <p className="text-cyan-400 font-black uppercase tracking-[0.3em] text-xs">Analyzing Architecture...</p>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col">
                                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-center">
                                                    <FileText className="w-6 h-6 text-cyan-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-white truncate max-w-[200px] md:max-w-md">{file.name}</p>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{pageCount} Pages Loaded • {formatBytes(file.size)}</p>
                                                </div>
                                            </div>
                                            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                                                <Columns className="w-4 h-4 text-cyan-400" />
                                                <span className="text-[10px] font-black text-cyan-400 uppercase">Visual Grid Active</span>
                                            </div>
                                        </div>

                                        <div className="p-8 flex-1">
                                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                                                {Array.from({ length: Math.min(pageCount || 0, 48) }, (_, i) => i + 1).map((num) => {
                                                    const selected = isPageSelected(num);
                                                    return (
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            key={num}
                                                            onClick={() => togglePage(num)}
                                                            className={clsx(
                                                                "aspect-[3/4] rounded-xl border-2 flex flex-col items-center justify-center transition-all relative group overflow-hidden shadow-lg",
                                                                selected
                                                                    ? "bg-cyan-500 border-cyan-400 text-white shadow-cyan-500/20"
                                                                    : "bg-slate-950 border-white/5 text-slate-600 hover:border-cyan-500/30 hover:text-cyan-400"
                                                            )}
                                                        >
                                                            {selected && (
                                                                <div className="absolute top-1 right-1">
                                                                    <CheckCircle className="w-3 h-3 text-white" />
                                                                </div>
                                                            )}
                                                            <span className="text-lg font-black">{num}</span>
                                                            <span className="text-[8px] font-black opacity-40 uppercase tracking-tighter">PAGE</span>

                                                            <div className={clsx(
                                                                "absolute inset-0 bg-gradient-to-br transition-opacity",
                                                                selected ? "from-white/10 to-transparent opacity-100" : "from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100"
                                                            )}></div>
                                                        </motion.button>
                                                    );
                                                })}
                                                {(pageCount || 0) > 48 && (
                                                    <div className="aspect-[3/4] rounded-xl border-2 border-white/5 bg-slate-950/50 flex items-center justify-center">
                                                        <span className="text-[10px] font-black text-slate-700 uppercase p-2 text-center">+{pageCount! - 48} more</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-4 space-y-6"
                        >
                            <div className="glass-card-premium p-8 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                                            <Scissors className="w-5 h-5 text-cyan-400" />
                                            Extraction Protocol
                                        </h3>
                                        <HelpCircle className="w-4 h-4 text-slate-600" />
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed uppercase tracking-widest">Target Parameters</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            value={pages}
                                            onChange={(e) => setPages(e.target.value)}
                                            placeholder="e.g. 1, 3, 5-8"
                                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all outline-none font-black placeholder:text-slate-800"
                                        />
                                        <div className="grid grid-cols-1 gap-2">
                                            {rangeExamples.map((ex) => (
                                                <button
                                                    key={ex.value}
                                                    onClick={() => setPages(ex.value)}
                                                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-all text-left"
                                                >
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{ex.label}</span>
                                                    <code className="text-xs font-black text-cyan-400">{ex.value}</code>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 space-y-2">
                                        <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Process Logic</p>
                                        <p className="text-[10px] text-slate-400 leading-normal">Selected pages will be compiled into a <span className="text-white font-black">fresh PDF architecture</span>, preserving all original vector data and text layers.</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleExtract}
                                    disabled={isProcessing || !file || !pages.trim()}
                                    className={clsx(
                                        "w-full btn-premium py-5 group gap-3",
                                        (isProcessing || !file || !pages.trim()) && "opacity-50 grayscale cursor-not-allowed"
                                    )}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            <span>CARVING PDF...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FileOutput className="w-6 h-6" />
                                            <span>EXECUTE EXTRACTION</span>
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="glass-card-premium p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                        <Zap className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Subatomic Speed</p>
                                        <p className="text-[10px] text-slate-500">Optimized for rapid segment slicing</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="glass-card-premium p-12 text-center space-y-12 relative overflow-hidden text-white">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-[100px] -z-10"></div>

                            <div className="relative">
                                <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-2xl animate-float">
                                    <CheckCircle className="w-12 h-12 text-emerald-400" />
                                </div>
                                <h2 className="text-5xl font-black tracking-tighter">EXTRACTION COMPLETE</h2>
                                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs mt-4">Document Segments Successfully Decoupled</p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="bg-slate-900/60 p-6 rounded-[32px] border border-white/5 space-y-2">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Input Architecture</p>
                                    <p className="text-3xl font-black text-slate-400">{result.originalPages} <span className="text-sm font-bold opacity-30 uppercase">PG</span></p>
                                </div>
                                <div className="bg-cyan-500/10 p-6 rounded-[32px] border border-cyan-500/20 space-y-2">
                                    <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Output Segments</p>
                                    <p className="text-3xl font-black text-white">{result.pageCount} <span className="text-sm font-bold opacity-30 uppercase">PG</span></p>
                                </div>
                                <div className="bg-indigo-500/10 p-6 rounded-[32px] border border-indigo-500/20 space-y-2 flex flex-col justify-center">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Parameters</p>
                                    <p className="text-[10px] font-black text-slate-400 truncate italic mt-1">{result.extractedPages}</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <button
                                    onClick={handleDownload}
                                    className="w-full btn-premium py-6 flex items-center justify-center gap-4 text-lg"
                                >
                                    <Download className="w-6 h-6 text-white" />
                                    <span>DOWNLOAD ARCHIVE</span>
                                </button>
                                <button
                                    onClick={() => setShareModalOpen(true)}
                                    className="w-full btn-glass py-6 border-white/10 hover:border-cyan-500/50 flex items-center justify-center gap-4 text-lg"
                                >
                                    <Share2 className="w-6 h-6 text-cyan-400" />
                                    <span>NETWORK SHARE</span>
                                </button>
                            </div>

                            <button
                                onClick={handleClear}
                                className="text-xs font-black text-slate-500 hover:text-white transition-colors uppercase tracking-[0.3em]"
                            >
                                COMMENCE NEW PROJECT
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            <ShareModal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                fileId={result?.fileId}
                fileType="temp"
            />
        </div>
    );
}
