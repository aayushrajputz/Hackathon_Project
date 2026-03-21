'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    ArrowRight,
    Zap,
    Maximize,
    Minimize,
    Settings,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api, shareApi } from '@/lib/api';
import clsx from 'clsx';
import ShareModal from '@/components/ui/ShareModal';

interface CropMargins {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export default function CropPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [margins, setMargins] = useState<CropMargins>({ top: 10, right: 10, bottom: 10, left: 10 });
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
        setMargins({ top: 10, right: 10, bottom: 10, left: 10 });
        setResult(null);
    };

    const handleCrop = async () => {
        if (!file) return;

        setIsProcessing(true);
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
            toast.success('Document cropped successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to crop document');
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

    const presetCrops = [
        { name: 'Full Canvas', values: { top: 0, right: 0, bottom: 0, left: 0 } },
        { name: 'Standard Margin', values: { top: 20, right: 20, bottom: 20, left: 20 } },
        { name: 'Cinema Wide', values: { top: 60, right: 0, bottom: 60, left: 0 } },
        { name: 'Book Gutter', values: { top: 0, right: 30, bottom: 0, left: 30 } },
    ];

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
                            <Crop className="w-10 h-10 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Precision <span className="text-blue-600">Crop</span></h1>
                            <p className="text-slate-600 font-medium mt-1">Refine document canvas and visibility bounds</p>
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
                            Reset Selection
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
                                            className="group h-full min-h-[400px] flex items-center justify-center border-2 border-dashed border-slate-300 rounded-[2rem] bg-white hover:bg-blue-50/50 hover:border-blue-300 cursor-pointer transition-all"
                                        >
                                            <input {...getInputProps()} />
                                            <div className="flex flex-col items-center gap-6 text-center">
                                                <div className="relative">
                                                    <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 shadow-inner hover:shadow-md transition-all duration-500">
                                                        <Upload className="w-10 h-10 text-blue-500" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Import Source PDF</h3>
                                                    <p className="text-slate-500 font-medium font-mono text-xs tracking-widest leading-loose">READY FOR PRECISION SLICING</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center space-y-12 py-10">
                                            <div className="relative group">
                                                <div className="w-56 h-72 bg-white border-2 border-slate-200 shadow-md rounded-[2.5rem] flex items-center justify-center relative overflow-hidden group-hover:border-blue-300 transition-all">
                                                    <div className="absolute inset-0 bg-blue-50/50"></div>

                                                    {/* Real-time Crop Overlay */}
                                                    <motion.div
                                                        layout
                                                        className="absolute border-2 border-blue-500 border-dashed bg-blue-500/10 shadow-sm"
                                                        style={{
                                                            top: `${Math.min(margins.top / 2, 80)}px`,
                                                            right: `${Math.min(margins.right / 2, 80)}px`,
                                                            bottom: `${Math.min(margins.bottom / 2, 80)}px`,
                                                            left: `${Math.min(margins.left / 2, 80)}px`,
                                                        }}
                                                    />

                                                    <FileText className="w-24 h-24 text-slate-300 z-10" />
                                                </div>

                                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-slate-900 border border-slate-700 shadow-xl flex items-center gap-2 z-20">
                                                    <Move className="w-3 h-3 text-blue-400" />
                                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest whitespace-nowrap">Interactive Bounds</p>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xl font-black text-slate-900 px-6 truncate max-w-[400px]">{file.name}</p>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-3">{formatBytes(file.size)} ARCHIVE</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 md:p-12 flex flex-col justify-between space-y-12 bg-white">
                                    <div className="space-y-10">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Presets Configurations</h3>
                                                <Settings className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {presetCrops.map((preset) => (
                                                    <button
                                                        key={preset.name}
                                                        onClick={() => setMargins(preset.values)}
                                                        className={clsx(
                                                            "px-4 py-3 rounded-2xl border shadow-sm transition-all text-xs font-black uppercase tracking-tight",
                                                            JSON.stringify(margins) === JSON.stringify(preset.values)
                                                                ? "bg-blue-50 border-blue-200 text-slate-900 shadow-blue-500/10"
                                                                : "bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        {preset.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Manual Vectors (PT)</h3>
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                                {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                                                    <div key={side} className="space-y-2">
                                                        <div className="flex items-center justify-between px-1">
                                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{side}</label>
                                                            <span className="text-[10px] font-black text-blue-600">{margins[side]}</span>
                                                        </div>
                                                        <div className="relative group">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="200"
                                                                value={margins[side]}
                                                                onChange={(e) => setMargins({ ...margins, [side]: parseFloat(e.target.value) || 0 })}
                                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-black text-lg"
                                                            />
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {side === 'top' || side === 'bottom' ? <Minimize className="w-4 h-4 text-slate-400 rotate-90" /> : <Minimize className="w-4 h-4 text-slate-400" />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCrop}
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
                                                <span>Recalculating Bounds...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Crop className="w-6 h-6 border-2 border-white/20 rounded p-1" />
                                                <span>Execute Crop Protocol</span>
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
                                <h2 className="text-4xl font-black tracking-tight text-slate-900">CROP SUCCESSFUL</h2>
                                <p className="text-slate-500 font-bold mt-3 uppercase tracking-widest text-[10px]">Document Canvas Reconfigured</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {(['top', 'right', 'bottom', 'left'] as const).map(side => (
                                    <div key={side} className="bg-slate-50 border border-slate-100 p-4 rounded-3xl shadow-sm">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{side}</p>
                                        <p className="text-xl font-black text-slate-900">{result.margins?.[side] || margins[side]}<span className="text-[10px] opacity-50 ml-1">PT</span></p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <button
                                    onClick={handleDownload}
                                    className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-md shadow-blue-500/20"
                                >
                                    <Download className="w-6 h-6" />
                                    <span>Download Result</span>
                                </button>
                                <button
                                    onClick={() => setShareModalOpen(true)}
                                    className="w-full py-5 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-sm"
                                >
                                    <Share2 className="w-5 h-5 text-blue-500" />
                                    <span>Encrypted Share</span>
                                </button>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <button
                                    onClick={handleClear}
                                    className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest"
                                >
                                    Process New Matrix
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
