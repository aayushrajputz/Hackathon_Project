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
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 overflow-hidden font-sans">
            <div className="absolute inset-0 bg-mesh pointer-events-none opacity-20"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>

            <div className="relative z-10 max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-6"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-500 p-[1px] shadow-2xl shadow-amber-500/20">
                            <div className="w-full h-full rounded-[23px] bg-slate-950 flex items-center justify-center">
                                <Crop className="w-10 h-10 text-amber-400" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight">Precision <span className="text-gradient-premium">Crop</span></h1>
                            <p className="text-slate-400 font-medium mt-1">Refine document canvas and visibility bounds</p>
                        </div>
                    </motion.div>

                    {file && !result && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleClear}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-white/5 transition-all flex items-center gap-2"
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
                            <div className="glass-card-premium overflow-hidden border-white/10 grid md:grid-cols-2">
                                <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/5 bg-slate-900/40">
                                    {!file ? (
                                        <div
                                            {...getRootProps()}
                                            className="dropzone-premium group h-full min-h-[400px] flex items-center justify-center border-dashed cursor-pointer"
                                        >
                                            <input {...getInputProps()} />
                                            <div className="flex flex-col items-center gap-6 text-center">
                                                <div className="relative">
                                                    <div className="w-24 h-24 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                                        <Upload className="w-10 h-10 text-amber-400" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-2xl font-bold text-white tracking-tight uppercase">Import Source PDF</h3>
                                                    <p className="text-slate-500 font-medium font-mono text-xs tracking-widest leading-loose">READY FOR PRECISION SLICING</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center space-y-12 py-10">
                                            <div className="relative group">
                                                <div className="w-56 h-72 bg-slate-950 border-2 border-white/5 rounded-[40px] flex items-center justify-center shadow-2xl relative overflow-hidden group-hover:border-amber-500/30 transition-all">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent"></div>

                                                    {/* Real-time Crop Overlay */}
                                                    <motion.div
                                                        layout
                                                        className="absolute border-2 border-amber-500 border-dashed bg-amber-500/10"
                                                        style={{
                                                            top: `${Math.min(margins.top / 2, 80)}px`,
                                                            right: `${Math.min(margins.right / 2, 80)}px`,
                                                            bottom: `${Math.min(margins.bottom / 2, 80)}px`,
                                                            left: `${Math.min(margins.left / 2, 80)}px`,
                                                        }}
                                                    />

                                                    <FileText className="w-24 h-24 text-slate-800" />
                                                </div>

                                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-slate-900 border border-amber-500/30 shadow-2xl flex items-center gap-2">
                                                    <Move className="w-3 h-3 text-amber-400" />
                                                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest whitespace-nowrap">Interactive Bounds</p>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xl font-black text-white px-6 truncate max-w-[400px]">{file.name}</p>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-3">{formatBytes(file.size)} ARCHIVE</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 md:p-12 flex flex-col justify-between space-y-12">
                                    <div className="space-y-10">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Presets Configurations</h3>
                                                <Settings className="w-4 h-4 text-slate-700" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {presetCrops.map((preset) => (
                                                    <button
                                                        key={preset.name}
                                                        onClick={() => setMargins(preset.values)}
                                                        className={clsx(
                                                            "px-4 py-3 rounded-2xl border transition-all text-xs font-black uppercase tracking-tight",
                                                            JSON.stringify(margins) === JSON.stringify(preset.values)
                                                                ? "bg-amber-500/10 border-amber-500/50 text-white"
                                                                : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10"
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
                                                            <span className="text-[10px] font-black text-amber-400">{margins[side]}</span>
                                                        </div>
                                                        <div className="relative group">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="200"
                                                                value={margins[side]}
                                                                onChange={(e) => setMargins({ ...margins, [side]: parseFloat(e.target.value) || 0 })}
                                                                className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all outline-none font-black text-lg"
                                                            />
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {side === 'top' || side === 'bottom' ? <Minimize className="w-4 h-4 text-slate-600 rotate-90" /> : <Minimize className="w-4 h-4 text-slate-600" />}
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
                                            "w-full btn-premium py-5 group gap-3 mt-4",
                                            (isProcessing || !file) && "opacity-50 grayscale cursor-not-allowed"
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
                        <div className="glass-card-premium p-12 text-center space-y-12 relative overflow-hidden text-white">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-[100px] -z-10"></div>

                            <div className="relative">
                                <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-2xl animate-float">
                                    <CheckCircle className="w-12 h-12 text-emerald-400" />
                                </div>
                                <h2 className="text-4xl font-black tracking-tight">CROP SUCCESSFUL</h2>
                                <p className="text-slate-400 font-medium mt-2 uppercase tracking-widest text-[10px]">Document Canvas Reconfigured</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {(['top', 'right', 'bottom', 'left'] as const).map(side => (
                                    <div key={side} className="bg-slate-900 border border-white/5 p-4 rounded-3xl">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{side}</p>
                                        <p className="text-xl font-black text-white">{result.margins?.[side] || margins[side]}<span className="text-[10px] opacity-30">PT</span></p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <button
                                    onClick={handleDownload}
                                    className="w-full btn-premium py-5 flex items-center justify-center gap-3"
                                >
                                    <Download className="w-6 h-6" />
                                    <span>Download Result</span>
                                </button>
                                <button
                                    onClick={() => setShareModalOpen(true)}
                                    className="w-full btn-glass py-5 border-white/10 hover:border-cyan-500/50 flex items-center justify-center gap-3"
                                >
                                    <Share2 className="w-5 h-5 text-cyan-400" />
                                    <span>Encrypted Share</span>
                                </button>
                            </div>

                            <button
                                onClick={handleClear}
                                className="text-sm font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
                            >
                                Process New Matrix
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
