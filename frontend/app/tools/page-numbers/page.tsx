'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Hash,
    Download,
    Loader2,
    CheckCircle,
    FileText,
    Upload,
    X,
    Share2,
    ArrowRight,
    Zap,
    Layout,
    Type,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api, shareApi } from '@/lib/api';
import clsx from 'clsx';
import ShareModal from '@/components/ui/ShareModal';

type PagePosition = 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';

const positions: { value: PagePosition; label: string }[] = [
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-center', label: 'Top Center' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-center', label: 'Bottom Center' },
    { value: 'bottom-right', label: 'Bottom Right' },
];

const formatOptions = [
    { value: '{n}', label: 'Sequential Numbers', preview: '1, 2, 3' },
    { value: 'Page {n}', label: 'Descriptive Prefix', preview: 'Page 1' },
    { value: '{n} / {total}', label: 'Progress Fraction', preview: '1 / 10' },
    { value: 'Page {n} of {total}', label: 'Full Context', preview: 'Page 1 of 10' },
    { value: '- {n} -', label: 'Minimalist Dash', preview: '- 1 -' },
];

export default function PageNumbersPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [position, setPosition] = useState<PagePosition>('bottom-center');
    const [format, setFormat] = useState('{n}');
    const [startFrom, setStartFrom] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [shareModalOpen, setShareModalOpen] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setResult(null);
        }
    }, []);

    const { getRootProps, getInputProps } = useDropzone({
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
    };

    const handleAddPageNumbers = async () => {
        if (!file) return;

        setIsProcessing(true);
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
            toast.success('Page numbers indexed successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to index pages');
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

    const getPreviewNumber = () => {
        return format
            .replace('{n}', startFrom.toString())
            .replace('{total}', '12');
    };

    return (
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 overflow-hidden font-sans bg-slate-50 pb-12">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-[120px] animate-pulse-slow"></div>

            <div className="relative z-10 max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-6"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-200 shadow-sm flex items-center justify-center">
                            <Hash className="w-10 h-10 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Index <span className="text-blue-600">Pages</span></h1>
                            <p className="text-slate-600 font-medium mt-1">Structure your documents with professional pagination</p>
                        </div>
                    </motion.div>

                    {file && !result && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleClear}
                            className="px-6 py-3 rounded-xl text-sm font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 shadow-sm transition-all flex items-center gap-2 bg-white"
                        >
                            <X className="w-4 h-4" />
                            Clear Workspace
                        </motion.button>
                    )}
                </div>

                {!result ? (
                    <div className="grid lg:grid-cols-12 gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-12"
                        >
                            <div className="bg-white border border-slate-200 shadow-sm rounded-[2.5rem] overflow-hidden grid md:grid-cols-2">
                                <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50">
                                    {!file ? (
                                        <div
                                            {...getRootProps()}
                                            className="group h-full min-h-[400px] flex items-center justify-center border-2 border-dashed border-slate-300 rounded-[2rem] bg-white hover:bg-blue-50/50 hover:border-blue-400 cursor-pointer transition-all"
                                        >
                                            <input {...getInputProps()} />
                                            <div className="flex flex-col items-center gap-6 text-center">
                                                <div className="relative">
                                                    <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 shadow-inner hover:shadow-md transition-all duration-500">
                                                        <Upload className="w-10 h-10 text-blue-500" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Select PDF for Indexing</h3>
                                                    <p className="text-slate-500 font-medium font-mono text-xs uppercase tracking-widest">DRAG & DROP SUPPORTED</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center space-y-12 py-10">
                                            <div className="relative group">
                                                <div className="w-56 h-72 bg-white border-2 border-slate-200 shadow-md rounded-[2.5rem] flex items-center justify-center relative overflow-hidden group-hover:border-blue-300 transition-all">
                                                    <div className="absolute inset-0 bg-blue-50/50"></div>

                                                    {/* Dynamic Pagination Preview */}
                                                    <motion.div
                                                        layout
                                                        className={clsx(
                                                            "absolute px-4 py-2 text-blue-600 font-black font-mono text-sm break-all max-w-full z-10",
                                                            position.includes('top') ? "top-4" : "bottom-4",
                                                            position.includes('left') ? "left-4" : position.includes('right') ? "right-4" : "left-1/2 -translate-x-1/2"
                                                        )}
                                                    >
                                                        {getPreviewNumber()}
                                                    </motion.div>

                                                    <FileText className="w-24 h-24 text-slate-300" />
                                                </div>

                                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-slate-900 border border-slate-700 shadow-xl z-20">
                                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest whitespace-nowrap">Layout Engine Active</p>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xl font-black text-slate-900 px-6 truncate max-w-[400px]">{file.name}</p>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-3">Source Payload: {formatBytes(file.size)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 md:p-12 flex flex-col justify-between space-y-12 bg-white">
                                    <div className="space-y-10">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Deployment Logic</h3>
                                                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 border border-blue-100">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                                    <span className="text-[10px] font-black text-blue-600 uppercase">Interactive</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                {positions.map((pos) => (
                                                    <button
                                                        key={pos.value}
                                                        onClick={() => setPosition(pos.value)}
                                                        className={clsx(
                                                            "group py-4 px-2 rounded-2xl border transition-all text-center flex flex-col items-center justify-center",
                                                            position === pos.value
                                                                ? "bg-blue-50 border-blue-300 text-slate-900 shadow-sm"
                                                                : "bg-white border-slate-200 text-slate-500 hover:border-blue-200 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        <div className={clsx(
                                                            "w-1.5 h-1.5 rounded-sm mx-auto mb-2 border transition-all",
                                                            position === pos.value ? "bg-blue-600 border-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.3)]" : "bg-slate-200 border-slate-300"
                                                        )}></div>
                                                        <span className="text-[9px] font-black uppercase tracking-tighter opacity-70 group-hover:opacity-100 leading-[1.2] whitespace-pre-line">{pos.label.replace(' ', '\n')}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Format Architecture</h3>
                                            <div className="space-y-2">
                                                {formatOptions.map((opt) => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => setFormat(opt.value)}
                                                        className={clsx(
                                                            "w-full group flex items-center justify-between p-4 rounded-2xl border transition-all",
                                                            format === opt.value
                                                                ? "bg-blue-50 border-blue-200 text-slate-900 shadow-sm"
                                                                : "bg-white border-slate-200 text-slate-500 hover:border-blue-200"
                                                        )}
                                                    >
                                                        <div className="flex flex-col items-start px-2">
                                                            <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-50 group-hover:opacity-100 transition-opacity">{opt.label}</span>
                                                            <span className="text-sm font-bold tracking-tight text-slate-900">{opt.preview}</span>
                                                        </div>
                                                        <div className={clsx(
                                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shadow-sm",
                                                            format === opt.value ? "border-blue-600 bg-blue-600" : "border-slate-200 bg-white"
                                                        )}>
                                                            {format === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="space-y-2 flex-1">
                                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Start From</h3>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={startFrom}
                                                        onChange={(e) => setStartFrom(parseInt(e.target.value) || 1)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-black text-lg"
                                                    />
                                                    <Zap className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleAddPageNumbers}
                                        disabled={isProcessing || !file}
                                        className={clsx(
                                            "w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all mt-4",
                                            (isProcessing || !file)
                                                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                                : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:opacity-90 group"
                                        )}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                <span>Compiling Indexes...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Hash className="w-6 h-6" />
                                                <span>Deploy Page Numbers</span>
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-3xl mx-auto"
                    >
                        <div className="bg-white border border-slate-200 shadow-xl rounded-[3rem] p-12 text-center space-y-12 relative overflow-hidden text-slate-900">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-50 rounded-full blur-[80px] -z-10"></div>

                            <div className="relative">
                                <div className="w-24 h-24 rounded-3xl bg-emerald-50 border border-emerald-100 shadow-inner flex items-center justify-center mx-auto mb-6 animate-float">
                                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                                </div>
                                <h2 className="text-4xl font-black tracking-tight">Indexing Finalized!</h2>
                                <p className="text-slate-600 font-medium mt-3">Professional pagination has been successfully injected</p>
                            </div>

                            <div className="p-8 bg-slate-50 border border-slate-100 shadow-sm rounded-[2.5rem] grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Layout</p>
                                    <p className="text-[10px] font-black text-blue-600 uppercase truncate px-2">{result.settings?.position || position}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pages</p>
                                    <p className="text-xl font-black text-slate-900">{result.pageCount}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Initial</p>
                                    <p className="text-xl font-black text-slate-900">{result.settings?.startFrom || startFrom}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                                    <p className="text-[10px] font-black text-emerald-600 border border-emerald-200 bg-emerald-50 px-3 py-1 rounded-full inline-block">VERIFIED</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <button
                                    onClick={handleDownload}
                                    className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-md shadow-blue-500/20"
                                >
                                    <Download className="w-6 h-6" />
                                    <span>Download Numbered PDF</span>
                                </button>
                                <button
                                    onClick={() => setShareModalOpen(true)}
                                    className="w-full py-5 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-sm"
                                >
                                    <Share2 className="w-5 h-5 text-blue-500" />
                                    <span>Sync & Share</span>
                                </button>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <button
                                    onClick={handleClear}
                                    className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest"
                                >
                                    Process Another Dataset
                                </button>
                            </div>
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
