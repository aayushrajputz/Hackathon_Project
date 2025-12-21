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
    { value: 'gold', label: 'Gold Trophy', icon: '🏆', color: 'text-yellow-400', description: 'Elite achievement mark' },
    { value: 'silver', label: 'Silver Medal', icon: '🥈', color: 'text-slate-300', description: 'Standard recognition badge' },
    { value: 'verified', label: 'Verified', icon: '✅', color: 'text-emerald-400', description: 'Official verification seal' },
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
                                <Award className="w-10 h-10 text-amber-400" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight">Add <span className="text-gradient-premium">Badge</span></h1>
                            <p className="text-slate-400 font-medium mt-1">Authenticate and celebrate document achievements</p>
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
                            Clear Workspace
                        </motion.button>
                    )}
                </div>

                {!result ? (
                    <div className="grid lg:grid-cols-12 gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-8 space-y-6"
                        >
                            <div className="glass-card-premium overflow-hidden border-white/10 flex flex-col md:flex-row">
                                <div className="p-8 md:w-1/2 flex flex-col items-center justify-center bg-slate-900/40 border-b md:border-b-0 md:border-r border-white/5">
                                    {!file ? (
                                        <div
                                            {...getRootProps()}
                                            className="dropzone-premium group w-full h-[450px] flex items-center justify-center border-dashed cursor-pointer"
                                        >
                                            <input {...getInputProps()} />
                                            <div className="flex flex-col items-center gap-6 text-center">
                                                <div className="relative">
                                                    <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                                        <Upload className="w-10 h-10 text-amber-400" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-xl font-bold text-white tracking-tight">Select Document</h3>
                                                    <p className="text-slate-500 font-medium text-sm">PDF formats supported</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full flex-1 flex flex-col items-center justify-center space-y-12 py-10">
                                            <div className="relative group">
                                                <div className="w-48 h-64 bg-slate-950 border-2 border-white/5 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden group-hover:border-amber-500/30 transition-all">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent"></div>

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

                                                    <FileText className="w-20 h-20 text-slate-800" />
                                                </div>

                                                <div className="absolute -bottom-4 right-0 px-4 py-2 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-2xl">
                                                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Live Coordinate</p>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-black text-white px-6 truncate">{file.name}</p>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-3">{formatBytes(file.size)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 md:w-1/2 flex flex-col justify-between space-y-10">
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-5 h-5 text-amber-400" />
                                                <h3 className="text-lg font-black text-white">Badge Identity</h3>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                {badgeOptions.map((opt) => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => setBadgeType(opt.value)}
                                                        className={clsx(
                                                            "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all text-center group",
                                                            badgeType === opt.value
                                                                ? "bg-amber-500/10 border-amber-500/50 text-white"
                                                                : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10"
                                                        )}
                                                    >
                                                        <span className="text-2xl group-hover:scale-110 transition-transform">{opt.icon}</span>
                                                        <span className="text-[10px] font-black uppercase tracking-tighter leading-none">{opt.label.replace(' ', '\n')}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                        <MousePointer2 className="w-3.5 h-3.5" />
                                                        X Coordinate
                                                    </span>
                                                    <span className="text-xs font-black text-amber-400">{x}px</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="600"
                                                    value={x}
                                                    onChange={(e) => setX(parseInt(e.target.value))}
                                                    className="w-full hover:accent-amber-400 accent-amber-500 transition-all h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                        <MousePointer2 className="w-3.5 h-3.5" />
                                                        Y Coordinate
                                                    </span>
                                                    <span className="text-xs font-black text-amber-400">{y}px</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="800"
                                                    value={y}
                                                    onChange={(e) => setY(parseInt(e.target.value))}
                                                    className="w-full hover:accent-amber-400 accent-amber-500 transition-all h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Dimension Scale</span>
                                                    <span className="text-xs font-black text-amber-400">{Math.round(scale * 100)}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0.5"
                                                    max="2"
                                                    step="0.1"
                                                    value={scale}
                                                    onChange={(e) => setScale(parseFloat(e.target.value))}
                                                    className="w-full hover:accent-amber-400 accent-amber-500 transition-all h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleAddBadge}
                                        disabled={isProcessing || !file}
                                        className={clsx(
                                            "w-full btn-premium py-5 group gap-3",
                                            (isProcessing || !file) && "opacity-50 grayscale cursor-not-allowed"
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
                            <div className="glass-card-premium p-8 h-full flex flex-col gap-6">
                                <div className="space-y-2">
                                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-amber-400" />
                                        Integrity Guard
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        Badges are injected as vector-based layers to ensure crisp rendering at any zoom level.
                                    </p>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Badge Usage</p>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Perfect for <span className="text-amber-400 font-bold">certificates</span>, <span className="text-amber-400 font-bold">awards</span>, or verifying sensitive document versions.
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-2">
                                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Page Policy</p>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            The badge will be applied strictly to the <span className="text-white font-bold">first page</span> of the document.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center border border-white/10">
                                            <Zap className="w-6 h-6 text-yellow-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white tracking-widest">ENGINE READY</p>
                                            <p className="text-[10px] text-slate-500 font-medium">Coordinate System v2.0</p>
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
                        <div className="glass-card-premium p-12 text-center space-y-12 relative overflow-hidden text-white">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px] -z-10"></div>

                            <div className="relative">
                                <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-2xl animate-float">
                                    <CheckCircle className="w-12 h-12 text-emerald-400" />
                                </div>
                                <h2 className="text-4xl font-black tracking-tight text-white uppercase">Authentication Successful!</h2>
                                <p className="text-slate-400 font-medium mt-2">Document mark has been permanently embedded</p>
                            </div>

                            <div className="p-8 bg-slate-900 border border-white/5 shadow-2xl rounded-3xl grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Badge</p>
                                    <p className="text-xl font-black text-white">{selectedBadge.icon}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type</p>
                                    <p className="text-xs font-black text-white capitalize">{badgeType}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Coordinates</p>
                                    <p className="text-xs font-black text-white">({x}, {y})</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Output</p>
                                    <p className="text-[10px] font-black text-emerald-400 border border-emerald-400/30 px-2 py-0.5 rounded-full inline-block">PROCESSED</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <button
                                    onClick={handleDownload}
                                    className="w-full btn-premium py-5 flex items-center justify-center gap-3 text-white"
                                >
                                    <Download className="w-6 h-6 text-white" />
                                    <span>Download Certified PDF</span>
                                </button>
                                <button
                                    onClick={() => setShareModalOpen(true)}
                                    className="w-full btn-glass py-5 border-white/10 hover:border-cyan-500/50 flex items-center justify-center gap-3 text-white"
                                >
                                    <Share2 className="w-5 h-5 text-cyan-400" />
                                    <span>Sync & Share</span>
                                </button>
                            </div>

                            <button
                                onClick={handleClear}
                                className="text-sm font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
                            >
                                Process Another Document
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
