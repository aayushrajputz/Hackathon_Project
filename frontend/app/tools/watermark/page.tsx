'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Droplet,
    Download,
    Loader2,
    CheckCircle,
    FileText,
    Upload,
    X,
    Type,
    Share2,
    ArrowRight,
    Zap,
    Layout,
    Maximize,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api, shareApi } from '@/lib/api';
import clsx from 'clsx';
import ShareModal from '@/components/ui/ShareModal';

type WatermarkPosition = 'center' | 'top' | 'bottom' | 'diagonal';

const positions: { value: WatermarkPosition; label: string; icon: any }[] = [
    { value: 'center', label: 'Absolute Center', icon: Layout },
    { value: 'top', label: 'Header Top', icon: Layout },
    { value: 'bottom', label: 'Footer Bottom', icon: Layout },
    { value: 'diagonal', label: 'Cross Diagonal', icon: Maximize },
];

export default function WatermarkPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [text, setText] = useState('CONFIDENTIAL');
    const [position, setPosition] = useState<WatermarkPosition>('center');
    const [opacity, setOpacity] = useState(0.3);
    const [fontSize, setFontSize] = useState(48);
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
        setText('CONFIDENTIAL');
        setPosition('center');
        setOpacity(0.3);
        setResult(null);
    };

    const handleWatermark = async () => {
        if (!file) return;
        if (!text.trim()) {
            toast.error('Please enter watermark text');
            return;
        }

        setIsProcessing(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('text', text);
            formData.append('position', position);
            formData.append('opacity', opacity.toString());
            formData.append('fontSize', fontSize.toString());

            const response = await api.post('/pdf/watermark', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setResult(response.data.data);
            toast.success('Watermark applied successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to apply watermark');
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
                link.download = result.filename || 'watermarked.pdf';
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
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 overflow-hidden font-sans">
            <div className="absolute inset-0 bg-mesh pointer-events-none opacity-20"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>

            <div className="relative z-10 max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-6"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-500 p-[1px] shadow-2xl shadow-teal-500/20">
                            <div className="w-full h-full rounded-[23px] bg-slate-950 flex items-center justify-center">
                                <Droplet className="w-10 h-10 text-teal-400" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight">Watermark <span className="text-gradient-premium">PDF</span></h1>
                            <p className="text-slate-400 font-medium mt-1">Protect your documents with identity layers</p>
                        </div>
                    </motion.div>

                    {file && !result && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleClear}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 border border-white/5 transition-all flex items-center gap-2"
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
                                            className="dropzone-premium group w-full h-[400px] flex items-center justify-center border-dashed cursor-pointer"
                                        >
                                            <input {...getInputProps()} />
                                            <div className="flex flex-col items-center gap-6 text-center">
                                                <div className="relative">
                                                    <div className="w-20 h-20 rounded-full bg-teal-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                                        <Upload className="w-10 h-10 text-teal-400" />
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
                                                <div className="w-48 h-64 bg-slate-950 border-2 border-white/5 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden group-hover:border-teal-500/30 transition-all">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-transparent"></div>

                                                    {/* Real-time Watermark Preview Overlay */}
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden p-4">
                                                        <motion.div
                                                            animate={{
                                                                rotate: position === 'diagonal' ? -45 : 0,
                                                                scale: 1 + (fontSize - 48) / 100
                                                            }}
                                                            className={clsx(
                                                                "font-black text-center whitespace-nowrap text-teal-400/50 break-all",
                                                                position === 'top' && "absolute top-4",
                                                                position === 'bottom' && "absolute bottom-4"
                                                            )}
                                                            style={{
                                                                opacity: opacity,
                                                                fontSize: `${Math.min(fontSize / 3, 24)}px`
                                                            }}
                                                        >
                                                            {text || 'WATERMARK'}
                                                        </motion.div>
                                                    </div>

                                                    <FileText className="w-20 h-20 text-slate-800" />
                                                </div>

                                                <div className="absolute -bottom-4 right-0 px-4 py-2 rounded-2xl bg-slate-900 border border-teal-500/30 shadow-2xl">
                                                    <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Live Preview</p>
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
                                                <Type className="w-5 h-5 text-teal-400" />
                                                <h3 className="text-lg font-black text-white">Identity Text</h3>
                                            </div>
                                            <input
                                                type="text"
                                                value={text}
                                                onChange={(e) => setText(e.target.value)}
                                                placeholder="Enter watermark content..."
                                                className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none font-bold placeholder:text-slate-700"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Placement Strategy</h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {positions.map((pos) => (
                                                    <button
                                                        key={pos.value}
                                                        onClick={() => setPosition(pos.value)}
                                                        className={clsx(
                                                            "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all text-center",
                                                            position === pos.value
                                                                ? "bg-teal-500/10 border-teal-500/50 text-white"
                                                                : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10"
                                                        )}
                                                    >
                                                        <pos.icon className={clsx("w-5 h-5", position === pos.value ? "text-teal-400" : "text-slate-600")} />
                                                        <span className="text-[10px] font-black uppercase tracking-tighter">{pos.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Layer Opacity</span>
                                                    <span className="text-xs font-black text-teal-400">{Math.round(opacity * 100)}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0.1"
                                                    max="0.8"
                                                    step="0.1"
                                                    value={opacity}
                                                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                                    className="w-full hover:accent-teal-400 accent-teal-500 transition-all h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Dimension Scale</span>
                                                    <span className="text-xs font-black text-teal-400">{fontSize}pt</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="12"
                                                    max="72"
                                                    step="4"
                                                    value={fontSize}
                                                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                                                    className="w-full hover:accent-teal-400 accent-teal-500 transition-all h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleWatermark}
                                        disabled={isProcessing || !file || !text.trim()}
                                        className={clsx(
                                            "w-full btn-premium py-5 group gap-3",
                                            (isProcessing || !file || !text.trim()) && "opacity-50 grayscale cursor-not-allowed"
                                        )}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                <span>Embedding Watermark...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Droplet className="w-6 h-6" />
                                                <span>Apply to All Pages</span>
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
                                        <Zap className="w-5 h-5 text-teal-400" />
                                        Advanced Security
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        Our watermarking engine uses non-destructive embedding that respects PDF layering.
                                    </p>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pro Tip</p>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Use <span className="text-teal-400">Diagonal</span> placement for maximum coverage against screenshots.
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/10 space-y-2">
                                        <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Quality Assurance</p>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            The watermark will be applied to <span className="text-white font-bold">every page</span> of your document.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center border border-white/10">
                                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white tracking-widest">ENGINE READY</p>
                                            <p className="text-[10px] text-slate-500 font-medium">Verified for Production</p>
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
                                <h2 className="text-4xl font-black tracking-tight">Watermark Applied!</h2>
                                <p className="text-slate-400 font-medium mt-2">Your document identity is now protected</p>
                            </div>

                            <div className="p-8 bg-slate-900 border border-white/5 shadow-2xl rounded-3xl grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Text</p>
                                    <p className="text-sm font-black text-white truncate px-2">{result.watermark?.text || text}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Position</p>
                                    <p className="text-sm font-black text-white capitalize">{result.watermark?.position || position}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pages</p>
                                    <p className="text-sm font-black text-white">{result.pageCount}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Modified</p>
                                    <p className="text-sm font-black text-teal-400">SUCCESS</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <button
                                    onClick={handleDownload}
                                    className="w-full btn-premium py-5 flex items-center justify-center gap-3"
                                >
                                    <Download className="w-6 h-6" />
                                    <span>Download Protected PDF</span>
                                </button>
                                <button
                                    onClick={() => setShareModalOpen(true)}
                                    className="w-full btn-glass py-5 border-white/10 hover:border-cyan-500/50 flex items-center justify-center gap-3"
                                >
                                    <Share2 className="w-5 h-5 text-cyan-400" />
                                    <span>Secure & Share</span>
                                </button>
                            </div>

                            <button
                                onClick={handleClear}
                                className="text-sm font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
                            >
                                Watermark New Document
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
