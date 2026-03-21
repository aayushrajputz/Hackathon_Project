'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Award,
    Download,
    Loader2,
    CheckCircle,
    FileText,
    Upload,
    X,
    Share2,
    MousePointer2,
    ArrowRight,
    Zap,
    Sparkles,
    Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api } from '@/lib/api';
import clsx from 'clsx';
import ShareModal from '@/components/ui/ShareModal';

type BadgeType = 'gold' | 'silver' | 'verified';

const badgeOptions: { value: BadgeType; label: string; icon: string; color: string; description: string }[] = [
    { value: 'gold', label: 'Gold Trophy', icon: '🏆', color: 'text-yellow-600', description: 'Elite achievement mark' },
    { value: 'silver', label: 'Silver Medal', icon: '🥈', color: 'text-slate-500', description: 'Standard recognition badge' },
    { value: 'verified', label: 'Verified', icon: '✅', color: 'text-emerald-600', description: 'Official verification seal' },
];

export default function AddBadgePage() {
    const [file, setFile] = useState<File | null>(null);
    const [badgeType, setBadgeType] = useState<BadgeType>('gold');
    const [x, setX] = useState(50);
    const [y, setY] = useState(50);
    const [scale, setScale] = useState(1.0);
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
        setBadgeType('gold');
        setX(50);
        setY(50);
        setScale(1.0);
        setResult(null);
    };

    const handleAddBadge = async () => {
        if (!file) return;

        setIsProcessing(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', badgeType);
            formData.append('x', x.toString());
            formData.append('y', y.toString());
            formData.append('scale', scale.toString());

            const response = await api.post('/pdf/add-badge', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setResult(response.data.data);
            toast.success('Badge embedded successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to add badge');
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
                link.download = result.filename || 'badged_document.pdf';
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

    const selectedBadge = badgeOptions.find(b => b.value === badgeType)!;

    return (
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 overflow-hidden font-sans bg-slate-50 pb-12">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-100 rounded-full blur-[120px] animate-pulse-slow"></div>

            <div className="relative z-10 max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-6"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 shadow-sm flex items-center justify-center">
                            <Award className="w-10 h-10 text-amber-500" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Add <span className="text-amber-500">Badge</span></h1>
                            <p className="text-slate-600 font-medium mt-1">Authenticate and celebrate document achievements</p>
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
                            className="lg:col-span-8 space-y-6 flex flex-col"
                        >
                            <div className="bg-white border border-slate-200 shadow-sm rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row h-full">
                                <div className="p-8 md:w-1/2 flex flex-col items-center justify-center bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100">
                                    {!file ? (
                                        <div
                                            {...getRootProps()}
                                            className="group w-full h-[450px] flex items-center justify-center border-2 border-dashed border-slate-300 rounded-[2rem] bg-white hover:bg-amber-50/50 hover:border-amber-300 cursor-pointer transition-all"
                                        >
                                            <input {...getInputProps()} />
                                            <div className="flex flex-col items-center gap-6 text-center">
                                                <div className="w-24 h-24 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                                                    <Upload className="w-12 h-12 text-amber-400" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Select Document</h3>
                                                    <p className="text-slate-500 font-medium">PDF formats supported</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full flex-1 flex flex-col items-center justify-center space-y-12 py-10">
                                            <div className="relative group">
                                                <div className="w-48 h-64 bg-white border-2 border-slate-200 rounded-[2rem] shadow-md flex items-center justify-center relative overflow-hidden group-hover:border-amber-300 transition-all">
                                                    <div className="absolute inset-0 bg-amber-50/50"></div>

                                                    {/* Badge Preview Overlay */}
                                                    <div
                                                        className="absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                                        style={{
                                                            left: `${(x / 600) * 100}%`,
                                                            top: `${(y / 800) * 100}%`,
                                                            fontSize: `${24 * scale}px`
                                                        }}
                                                    >
                                                        <motion.span
                                                            animate={{ scale: [1, 1.1, 1] }}
                                                            transition={{ repeat: Infinity, duration: 2 }}
                                                        >
                                                            {selectedBadge.icon}
                                                        </motion.span>
                                                    </div>

                                                    <FileText className="w-20 h-20 text-slate-300 z-10" />
                                                </div>

                                                <div className="absolute -bottom-4 right-0 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl z-20">
                                                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Live Coordinate</p>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-black text-slate-900 px-6 truncate max-w-[200px] mx-auto">{file.name}</p>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">{formatBytes(file.size)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 md:w-1/2 flex flex-col justify-between space-y-10 bg-white">
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-5 h-5 text-amber-500" />
                                                <h3 className="text-lg font-black text-slate-900">Badge Identity</h3>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                {badgeOptions.map((opt) => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => setBadgeType(opt.value)}
                                                        className={clsx(
                                                            "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all text-center group shadow-sm",
                                                            badgeType === opt.value
                                                                ? "bg-amber-50 border-amber-200 text-slate-900 shadow-amber-500/10"
                                                                : "bg-white border-slate-200 text-slate-500 hover:border-amber-300 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        <span className="text-2xl group-hover:scale-110 transition-transform">{opt.icon}</span>
                                                        <span className={clsx("text-[10px] font-black uppercase tracking-widest mt-1", badgeType === opt.value ? "text-amber-700" : "text-slate-400")}>{opt.label.replace(' ', '\n')}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                                        <MousePointer2 className="w-3.5 h-3.5 text-blue-500" />
                                                        X Coordinate
                                                    </span>
                                                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{x}px</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="600"
                                                    value={x}
                                                    onChange={(e) => setX(parseInt(e.target.value))}
                                                    className="w-full hover:accent-blue-500 accent-blue-600 transition-all h-2 bg-slate-200 rounded-full appearance-none cursor-pointer"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                                        <MousePointer2 className="w-3.5 h-3.5 text-blue-500" />
                                                        Y Coordinate
                                                    </span>
                                                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{y}px</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="800"
                                                    value={y}
                                                    onChange={(e) => setY(parseInt(e.target.value))}
                                                    className="w-full hover:accent-blue-500 accent-blue-600 transition-all h-2 bg-slate-200 rounded-full appearance-none cursor-pointer"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Dimension Scale</span>
                                                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{Math.round(scale * 100)}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0.5"
                                                    max="2"
                                                    step="0.1"
                                                    value={scale}
                                                    onChange={(e) => setScale(parseFloat(e.target.value))}
                                                    className="w-full hover:accent-indigo-500 accent-indigo-600 transition-all h-2 bg-slate-200 rounded-full appearance-none cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleAddBadge}
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
                                                <span>Embedding Mark...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Award className="w-6 h-6" />
                                                <span>Add Badge to PDF</span>
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-4"
                        >
                            <div className="bg-white border border-slate-200 shadow-sm rounded-[2.5rem] p-8 h-full flex flex-col gap-8">
                                <div className="space-y-2">
                                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-emerald-500" />
                                        Integrity Guard
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        Badges are injected as vector-based layers to ensure crisp rendering at any zoom level.
                                    </p>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 shadow-sm">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Badge Usage</p>
                                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                            Perfect for <span className="text-amber-600 font-bold">certificates</span>, <span className="text-amber-600 font-bold">awards</span>, or verifying sensitive document versions.
                                        </p>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 space-y-2 shadow-sm">
                                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Page Policy</p>
                                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                            The badge will be applied strictly to the <span className="text-slate-900 font-black">first page</span> of the document.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
                                            <Zap className="w-6 h-6 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-900 tracking-widest uppercase">ENGINE READY</p>
                                            <p className="text-[10px] text-slate-500 font-medium tracking-widest mt-0.5">Coordinate System v2.0</p>
                                        </div>
                                    </div>
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
                                <div className="w-24 h-24 rounded-3xl bg-emerald-50 flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-inner animate-float">
                                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                                </div>
                                <h2 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Authentication Successful!</h2>
                                <p className="text-slate-600 font-medium mt-3">Document mark has been permanently embedded</p>
                            </div>

                            <div className="p-8 bg-slate-50 border border-slate-100 shadow-sm rounded-[2rem] grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Badge</p>
                                    <p className="text-2xl font-black text-slate-900">{selectedBadge.icon}</p>
                                </div>
                                <div className="space-y-2 flex flex-col justify-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</p>
                                    <p className="text-xs font-black text-slate-700 capitalize">{badgeType}</p>
                                </div>
                                <div className="space-y-2 flex flex-col justify-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Coordinates</p>
                                    <p className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block mx-auto">({x}, {y})</p>
                                </div>
                                <div className="space-y-2 flex flex-col justify-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Output</p>
                                    <p className="text-[10px] font-black text-emerald-600 border border-emerald-200 bg-emerald-50 px-3 py-1 rounded-full inline-block mx-auto">PROCESSED</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <button
                                    onClick={handleDownload}
                                    className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-md shadow-blue-500/20"
                                >
                                    <Download className="w-6 h-6" />
                                    <span>Download Certified PDF</span>
                                </button>
                                <button
                                    onClick={() => setShareModalOpen(true)}
                                    className="w-full py-5 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-sm"
                                >
                                    <Share2 className="w-5 h-5" />
                                    <span>Sync & Share</span>
                                </button>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <button
                                    onClick={handleClear}
                                    className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest"
                                >
                                    Process Another Document
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
