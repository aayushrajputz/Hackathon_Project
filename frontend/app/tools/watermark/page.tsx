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
                            <Droplet className="w-10 h-10 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Watermark <span className="text-blue-600">PDF</span></h1>
                            <p className="text-slate-600 font-medium mt-1">Protect your documents with identity layers</p>
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
                            className="lg:col-span-8 space-y-6"
                        >
                            <div className="bg-white border border-slate-200 shadow-sm rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-sm">
                                <div className="p-8 md:w-1/2 flex flex-col items-center justify-center bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100">
                                    {!file ? (
                                        <div
                                            {...getRootProps()}
                                            className="group w-full h-[400px] flex items-center justify-center border-2 border-dashed border-slate-300 rounded-[2rem] bg-white hover:bg-blue-50/50 hover:border-blue-400 transition-all cursor-pointer shadow-sm"
                                        >
                                            <input {...getInputProps()} />
                                            <div className="flex flex-col items-center gap-6 text-center">
                                                <div className="relative">
                                                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner">
                                                        <Upload className="w-10 h-10 text-blue-500" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Select Document</h3>
                                                    <p className="text-slate-500 font-medium text-sm">PDF formats supported</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full flex-1 flex flex-col items-center justify-center space-y-12 py-10">
                                            <div className="relative group">
                                                <div className="w-48 h-64 bg-white border-2 border-slate-200 shadow-md rounded-[2.5rem] flex items-center justify-center relative overflow-hidden group-hover:border-blue-300 transition-all">
                                                    <div className="absolute inset-0 bg-blue-50/30"></div>

                                                    {/* Real-time Watermark Preview Overlay */}
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden p-4">
                                                        <motion.div
                                                            animate={{
                                                                rotate: position === 'diagonal' ? -45 : 0,
                                                                scale: 1 + (fontSize - 48) / 100
                                                            }}
                                                            className={clsx(
                                                                "font-black text-center whitespace-nowrap text-blue-600/40 break-all",
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

                                                    <FileText className="w-20 h-20 text-slate-200" />
                                                </div>

                                                <div className="absolute -bottom-4 right-0 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl z-20">
                                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">Live Preview</p>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-black text-slate-900 px-6 truncate max-w-[200px]">{file.name}</p>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-3">{formatBytes(file.size)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 md:w-1/2 flex flex-col justify-between space-y-10 bg-white">
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Type className="w-5 h-5 text-blue-600" />
                                                <h3 className="text-lg font-black text-slate-900">Identity Text</h3>
                                            </div>
                                            <input
                                                type="text"
                                                value={text}
                                                onChange={(e) => setText(e.target.value)}
                                                placeholder="Enter watermark content..."
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold placeholder:text-slate-400"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Placement Strategy</h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {positions.map((pos) => (
                                                    <button
                                                        key={pos.value}
                                                        onClick={() => setPosition(pos.value)}
                                                        className={clsx(
                                                            "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all text-center",
                                                            position === pos.value
                                                                ? "bg-blue-50 border-blue-300 text-slate-900 shadow-sm"
                                                                : "bg-white border-slate-200 text-slate-500 hover:border-blue-200 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        <pos.icon className={clsx("w-5 h-5", position === pos.value ? "text-blue-600" : "text-slate-400")} />
                                                        <span className="text-[10px] font-black uppercase tracking-tighter opacity-70 group-hover:opacity-100">{pos.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Layer Opacity</span>
                                                    <span className="text-xs font-black text-blue-600">{Math.round(opacity * 100)}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0.1"
                                                    max="0.8"
                                                    step="0.1"
                                                    value={opacity}
                                                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                                    className="w-full accent-blue-600 transition-all h-2 bg-slate-100 rounded-full appearance-none cursor-pointer"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Dimension Scale</span>
                                                    <span className="text-xs font-black text-blue-600">{fontSize}pt</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="12"
                                                    max="72"
                                                    step="4"
                                                    value={fontSize}
                                                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                                                    className="w-full accent-blue-600 transition-all h-2 bg-slate-100 rounded-full appearance-none cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleWatermark}
                                        disabled={isProcessing || !file || !text.trim()}
                                        className={clsx(
                                            "w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all",
                                            (isProcessing || !file || !text.trim())
                                                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                                : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:opacity-90 group"
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
                            <div className="bg-white border border-slate-200 shadow-sm rounded-[2.5rem] p-8 h-full flex flex-col gap-8 shadow-sm">
                                <div className="space-y-3">
                                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-blue-600" />
                                        Advanced Security
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        Our watermarking engine uses non-destructive embedding that respects PDF layering.
                                    </p>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="p-5 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pro Tip</p>
                                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                            Use <span className="text-blue-600 font-bold">Diagonal</span> placement for maximum coverage against screenshots.
                                        </p>
                                    </div>
                                    <div className="p-5 rounded-[2rem] bg-blue-50 border border-blue-100 space-y-3">
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Quality Assurance</p>
                                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                            The watermark will be applied to <span className="text-slate-900 font-bold">every page</span> of your document.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center border border-slate-700 shadow-xl">
                                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-900 tracking-widest">ENGINE READY</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Verified for Production</p>
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
                                <div className="w-24 h-24 rounded-3xl bg-emerald-50 border border-emerald-100 shadow-inner flex items-center justify-center mx-auto mb-6 animate-float">
                                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                                </div>
                                <h2 className="text-4xl font-black tracking-tight">Watermark Applied!</h2>
                                <p className="text-slate-600 font-medium mt-3">Your document identity is now protected</p>
                            </div>

                            <div className="p-8 bg-slate-50 border border-slate-100 shadow-sm rounded-3xl grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Text</p>
                                    <p className="text-sm font-black text-slate-900 truncate px-2">{result.watermark?.text || text}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position</p>
                                    <p className="text-sm font-black text-slate-900 capitalize">{result.watermark?.position || position}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pages</p>
                                    <p className="text-sm font-black text-slate-900">{result.pageCount}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Modified</p>
                                    <p className="text-[10px] font-black text-blue-600 border border-blue-200 bg-blue-50 px-2 py-0.5 rounded-full inline-block">SUCCESS</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <button
                                    onClick={handleDownload}
                                    className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-md shadow-blue-500/20"
                                >
                                    <Download className="w-6 h-6" />
                                    <span>Download Protected PDF</span>
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
                                    Watermark New Document
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
