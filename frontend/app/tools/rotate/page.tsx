'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RotateCw,
    Download,
    Loader2,
    CheckCircle,
    FileText,
    Upload,
    X,
    RotateCcw,
    Share2,
    ArrowRight,
    Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api } from '@/lib/api';
import clsx from 'clsx';
import ShareModal from '@/components/ui/ShareModal';

type RotationAngle = 90 | 180 | 270;

const rotationOptions: { value: RotationAngle; label: string; icon: any }[] = [
    { value: 90, label: '90° Clockwise', icon: RotateCw },
    { value: 180, label: '180° Flip', icon: RotateCcw },
    { value: 270, label: '90° Counter', icon: RotateCcw },
];

export default function RotatePDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [angle, setAngle] = useState<RotationAngle>(90);
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
        setAngle(90);
        setResult(null);
    };

    const handleRotate = async () => {
        if (!file) return;

        setIsProcessing(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('angle', angle.toString());

            const response = await api.post('/pdf/rotate', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setResult(response.data.data);
            toast.success(`PDF rotated ${angle}° successfully!`);
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to rotate PDF');
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
                link.download = result.filename || 'rotated.pdf';
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

    return (
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 overflow-hidden font-sans bg-slate-50 pb-12">
            {/* Background elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-[120px] animate-pulse-slow"></div>

            <div className="relative z-10 max-w-5xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-6"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-blue-100 border border-blue-200 shadow-sm flex items-center justify-center">
                            <RotateCw className="w-10 h-10 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Rotate <span className="text-blue-600">PDF</span></h1>
                            <p className="text-slate-600 font-medium mt-1">Adjust document orientation with precision</p>
                        </div>
                    </motion.div>

                    {file && !result && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleClear}
                            className="px-6 py-3 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 shadow-sm transition-all flex items-center gap-2 bg-white"
                        >
                            <X className="w-4 h-4" />
                            Clear Workspace
                        </motion.button>
                    )}
                </div>

                {!result ? (
                    <div className="grid lg:grid-cols-12 gap-8">
                        {/* Workspace */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-7"
                        >
                            <div className="bg-white border border-slate-200 shadow-sm rounded-[2.5rem] p-10 h-full flex flex-col items-center justify-center gap-10">
                                {!file ? (
                                    <div
                                        {...getRootProps()}
                                        className="group w-full h-[400px] flex items-center justify-center border-2 border-dashed border-slate-300 rounded-[2rem] bg-slate-50 hover:bg-blue-50/50 hover:border-blue-400 cursor-pointer transition-all"
                                    >
                                        <input {...getInputProps()} />
                                        <div className="flex flex-col items-center gap-6 text-center">
                                            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                                                <Upload className="w-12 h-12 text-blue-500" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Select PDF File</h3>
                                                <p className="text-slate-500 font-medium">Drag & drop or click to upload</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center space-y-12">
                                        <div className="relative group">
                                            {/* Preview Card */}
                                            <motion.div
                                                animate={{ rotate: angle }}
                                                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                                className="w-48 h-64 bg-white border-2 border-blue-200 rounded-[2rem] flex items-center justify-center shadow-md relative overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-blue-50/50"></div>
                                                <FileText className="w-20 h-20 text-blue-500 z-10" />
                                            </motion.div>

                                            {/* Angle Indicator */}
                                            <div className="absolute -top-4 -right-4 w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-white font-black text-sm shadow-lg z-20">
                                                {angle}°
                                            </div>
                                        </div>

                                        <div className="text-center px-4">
                                            <p className="text-xl font-black text-slate-900 truncate max-w-[300px] mx-auto">{file.name}</p>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">{formatBytes(file.size)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Controls */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-5 space-y-6"
                        >
                            <div className="bg-white border border-slate-200 shadow-sm rounded-[2.5rem] p-8 space-y-8 flex flex-col justify-center h-full">
                                <div className="space-y-2">
                                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        <RotateCw className="w-5 h-5 text-blue-600" />
                                        Rotation Parameters
                                    </h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Choose Orientation</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {rotationOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setAngle(opt.value)}
                                            className={clsx(
                                                "group relative flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 overflow-hidden text-left",
                                                angle === opt.value
                                                    ? "bg-blue-50 border-blue-200 text-slate-900 shadow-sm"
                                                    : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-slate-50"
                                            )}
                                        >
                                            <div className={clsx(
                                                "w-12 h-12 rounded-xl flex items-center justify-center transition-transform shadow-sm",
                                                angle === opt.value ? "bg-blue-600 text-white" : "bg-white border border-slate-200 group-hover:scale-110 group-hover:text-blue-500"
                                            )}>
                                                <opt.icon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 relative z-10">
                                                <p className="font-bold text-sm tracking-tight text-slate-900">{opt.label}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Application: Global</p>
                                            </div>
                                            {angle === opt.value && (
                                                <CheckCircle className="w-5 h-5 text-blue-600" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={handleRotate}
                                    disabled={isProcessing || !file}
                                    className={clsx(
                                        "w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all",
                                        (isProcessing || !file)
                                            ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                            : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:opacity-90 group"
                                    )}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            <span>Applying Rotation...</span>
                                        </>
                                    ) : (
                                        <>
                                            <RotateCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                                            <span>Rotate Document</span>
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>

                                <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm border border-blue-100">
                                        <Zap className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Instant Preview</h4>
                                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                                            The document card on the left reflects your chosen angle in real-time before processing.
                                        </p>
                                    </div>
                                </div>
                            </div>

                        </motion.div>
                    </div>
                ) : (
                    /* Final Result */
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="bg-white border border-slate-200 shadow-xl rounded-[3rem] p-12 text-center space-y-10 relative overflow-hidden text-slate-900">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-50 rounded-full blur-[80px] -z-10"></div>

                            <div className="relative">
                                <div className="w-24 h-24 rounded-3xl bg-emerald-50 flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-inner animate-float">
                                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                                </div>
                                <h2 className="text-4xl font-black tracking-tight">Rotation Complete!</h2>
                                <p className="text-slate-600 font-medium mt-3">Document persists with new orientation</p>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 shadow-sm rounded-[2rem] p-8 grid grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Angle</p>
                                    <p className="text-xl font-black text-blue-600 text-center">{result.angle}°</p>
                                </div>
                                <div className="space-y-1 text-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Pages</p>
                                    <p className="text-xl font-black text-slate-900 text-center">{result.pageCount}</p>
                                </div>
                                <div className="space-y-1 text-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Size</p>
                                    <p className="text-xl font-black text-slate-900 text-center">{formatBytes(result.size || 0)}</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <button
                                    onClick={handleDownload}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-md shadow-blue-500/20"
                                >
                                    <Download className="w-6 h-6" />
                                    <span>Download Rotated</span>
                                </button>
                                <button
                                    onClick={() => setShareModalOpen(true)}
                                    className="w-full py-4 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-sm"
                                >
                                    <Share2 className="w-5 h-5 text-blue-500" />
                                    <span>Secure Share</span>
                                </button>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <button
                                    onClick={handleClear}
                                    className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest"
                                >
                                    Rotate New Document
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
