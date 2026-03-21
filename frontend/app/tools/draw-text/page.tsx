'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Type,
    Download,
    Loader2,
    CheckCircle,
    FileText,
    Upload,
    X,
    Share2,
    MousePointer2,
    Palette,
    ArrowRight,
    Zap,
    Sparkles,
    Shield,
    SlidersHorizontal,
    Monitor
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api } from '@/lib/api';
import clsx from 'clsx';
import ShareModal from '@/components/ui/ShareModal';

const colorPresets = [
    { value: '#000000', label: 'Ebony' },
    { value: '#1E293B', label: 'Slate' },
    { value: '#2563EB', label: 'Action Blue' },
    { value: '#059669', label: 'Active Emerald' },
    { value: '#DC2626', label: 'Signal Red' },
    { value: '#D97706', label: 'Amber Focus' },
];

export default function DrawTextPage() {
    const [file, setFile] = useState<File | null>(null);
    const [text, setText] = useState('AUTHENTICATED');
    const [x, setX] = useState(100);
    const [y, setY] = useState(100);
    const [fontSize, setFontSize] = useState(24);
    const [color, setColor] = useState('#2563EB');
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
        setText('AUTHENTICATED');
        setX(100);
        setY(100);
        setFontSize(24);
        setColor('#2563EB');
        setResult(null);
    };

    const handleDrawText = async () => {
        if (!file || !text.trim()) return;

        setIsProcessing(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('text', text);
            formData.append('x', x.toString());
            formData.append('y', y.toString());
            formData.append('fontSize', fontSize.toString());
            formData.append('color', color);

            const response = await api.post('/pdf/draw-text', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setResult(response.data.data);
            toast.success('Text Architecture Integrated');
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Logic engine failure');
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
                link.download = result.filename || 'annotated_asset.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            } catch (error) {
                toast.error('Asset retrieval failed');
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
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-10 overflow-hidden font-sans bg-slate-50 pb-20">
            {/* Ambient Background Light */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[140px] -z-10 animate-pulse-slow"></div>

            <div className="relative z-10 max-w-[1400px] mx-auto space-y-12">
                {/* Tactical Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-8"
                    >
                        <div className="w-20 h-20 rounded-[2.5rem] bg-blue-600 shadow-xl shadow-blue-500/20 flex items-center justify-center border border-white/20">
                            <Type className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 mb-2">
                                <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest">Global Overlay Matrix</span>
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                    <Zap className="w-3.5 h-3.5" />
                                    Active
                                </div>
                            </div>
                            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Draw <span className="text-blue-600">Text</span></h1>
                            <p className="text-slate-500 font-bold mt-2 text-lg">Overlay high-fidelity text architectures on any PDF asset</p>
                        </div>
                    </motion.div>

                    {file && !result && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleClear}
                            className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 hover:bg-rose-50 border border-slate-200 bg-white transition-all flex items-center gap-3 shadow-sm"
                        >
                            <X className="w-4 h-4" />
                            Purge Buffer
                        </motion.button>
                    )}
                </div>

                {!result ? (
                    <div className="grid lg:grid-cols-12 gap-10 items-stretch">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-8 space-y-8"
                        >
                            <div className="bg-white border border-slate-200 shadow-sm rounded-[3.5rem] overflow-hidden flex flex-col xl:flex-row min-h-[600px]">
                                {/* Dropzone and Preview */}
                                <div className="p-10 xl:w-1/2 flex flex-col items-center justify-center bg-slate-50/50 border-b xl:border-b-0 xl:border-r border-slate-100">
                                    {!file ? (
                                        <div
                                            {...getRootProps()}
                                            className="group w-full h-full flex items-center justify-center border-4 border-dashed border-slate-200 rounded-[3rem] bg-white hover:bg-blue-50/50 hover:border-blue-600 cursor-pointer transition-all duration-500"
                                        >
                                            <input {...getInputProps()} />
                                            <div className="flex flex-col items-center gap-8 text-center p-12">
                                                <div className="w-24 h-24 rounded-[2.5rem] bg-blue-100 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 shadow-inner transition-all duration-700">
                                                    <Upload className="w-10 h-10 text-blue-600" />
                                                </div>
                                                <div className="space-y-3">
                                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Injection Well</h3>
                                                    <p className="text-slate-500 font-bold text-sm tracking-tight leading-relaxed max-w-[240px]">DRAG & DROP YOUR PDF TO COMMENCE RENDERING</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full flex-1 flex flex-col items-center justify-center space-y-12">
                                            <div className="relative group/preview">
                                                <div className="w-56 h-72 bg-white border border-slate-200 shadow-2xl rounded-[2.5rem] flex items-center justify-center relative overflow-hidden group-hover/preview:border-blue-400 group-hover/preview:shadow-blue-500/10 transition-all duration-700">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-white"></div>

                                                    {/* Precision Text Preview Overlay */}
                                                    <div
                                                        className="absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none overflow-hidden max-w-full px-2 z-20"
                                                        style={{
                                                            left: `${(x / 600) * 100}%`,
                                                            top: `${(y / 800) * 100}%`,
                                                            fontSize: `${fontSize / 3.5}px`,
                                                            color: color,
                                                        }}
                                                    >
                                                        <motion.p
                                                            animate={{ opacity: [0.8, 1, 0.8] }}
                                                            transition={{ repeat: Infinity, duration: 2 }}
                                                            className="font-black whitespace-nowrap truncate drop-shadow-md tracking-tight uppercase"
                                                        >
                                                            {text || 'PREVIEW'}
                                                        </motion.p>
                                                    </div>

                                                    <FileText className="w-24 h-24 text-slate-100 z-10 transition-transform group-hover/preview:scale-110 duration-700" />
                                                </div>

                                                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-30 flex items-center gap-2 group-hover/preview:-translate-y-2 transition-transform">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                    <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Logic Engine Active</p>
                                                </div>
                                            </div>
                                            <div className="text-center space-y-2">
                                                <p className="text-xl font-black text-slate-900 px-6 truncate max-w-[300px] mx-auto tracking-tight">{file.name}</p>
                                                <div className="flex items-center justify-center gap-3">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatBytes(file.size)}</span>
                                                    <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">SOURCE VERIFIED</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Controls Matrix */}
                                <div className="p-10 xl:w-1/2 flex flex-col justify-between space-y-12 bg-white">
                                    <div className="space-y-10">
                                        <div className="space-y-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                                    <Type className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <h3 className="text-xs font-black text-slate-400 tracking-widest uppercase">Payload Content</h3>
                                            </div>
                                            <div className="relative group">
                                                <input
                                                    type="text"
                                                    value={text}
                                                    onChange={(e) => setText(e.target.value)}
                                                    placeholder="Enter deployment string..."
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-8 py-5 text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-8 focus:ring-blue-500/5 transition-all outline-none font-black text-sm tracking-tight placeholder:text-slate-300 placeholder:font-bold"
                                                />
                                                <kbd className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:block text-[9px] font-black tracking-widest bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-slate-300 shadow-sm">UTF-8</kbd>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between px-1">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                            <MousePointer2 className="w-3.5 h-3.5 text-blue-500" />
                                                            X Vector
                                                        </span>
                                                        <span className="text-[11px] font-black text-blue-600">{x}px</span>
                                                    </div>
                                                    <div className="relative group px-1">
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="600"
                                                            value={x}
                                                            onChange={(e) => setX(parseInt(e.target.value))}
                                                            className="w-full accent-blue-600 h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between px-1">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                            <MousePointer2 className="w-3.5 h-3.5 text-blue-500" />
                                                            Y Vector
                                                        </span>
                                                        <span className="text-[11px] font-black text-blue-600">{y}px</span>
                                                    </div>
                                                    <div className="relative group px-1">
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="800"
                                                            value={y}
                                                            onChange={(e) => setY(parseInt(e.target.value))}
                                                            className="w-full accent-blue-600 h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-5">
                                                <div className="flex items-center justify-between px-1">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <Monitor className="w-3.5 h-3.5 text-blue-500" />
                                                        Dimension Scale
                                                    </span>
                                                    <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-xl">{fontSize}pt</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="8"
                                                    max="144"
                                                    value={fontSize}
                                                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                                                    className="w-full accent-blue-600 h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                                    <Palette className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <h3 className="text-xs font-black text-slate-400 tracking-widest uppercase">Chromatic Provision</h3>
                                            </div>
                                            <div className="flex flex-wrap gap-4 items-center bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100">
                                                {colorPresets.map((c) => (
                                                    <button
                                                        key={c.value}
                                                        onClick={() => setColor(c.value)}
                                                        className={clsx(
                                                            "w-10 h-10 rounded-2xl border-4 transition-all hover:scale-110 shadow-sm cursor-pointer",
                                                            color === c.value ? "border-white ring-4 ring-blue-600/20 scale-110" : "border-transparent"
                                                        )}
                                                        style={{ backgroundColor: c.value }}
                                                        title={c.label}
                                                    />
                                                ))}
                                                <div className="w-px h-8 bg-slate-200 mx-1"></div>
                                                <div className="relative w-10 h-10 rounded-2xl overflow-hidden border border-slate-200 bg-white hover:scale-110 transition-transform">
                                                    <input
                                                        type="color"
                                                        value={color}
                                                        onChange={(e) => setColor(e.target.value)}
                                                        className="absolute inset-0 w-full h-full cursor-pointer scale-[2.5]"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleDrawText}
                                        disabled={isProcessing || !file || !text.trim()}
                                        className={clsx(
                                            "w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 transition-all group",
                                            (isProcessing || !file || !text.trim())
                                                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                                : "bg-blue-600 text-white shadow-2xl shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-1"
                                        )}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                <span>Deploying Layers...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="w-6 h-6 group-hover:scale-125 transition-transform" />
                                                <span>Execute Matrix Render</span>
                                                <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-4 space-y-8"
                        >
                            <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 h-full flex flex-col gap-10 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] -z-10 translate-x-1/3 -translate-y-1/3"></div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                            <Shield className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <h3 className="text-xl font-black text-white tracking-tight">Security Spec</h3>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest opacity-70">
                                        Render engine v4.2.1 • Native Primality Enabled
                                    </p>
                                </div>

                                <div className="flex-1 space-y-6">
                                    <div className="p-6 rounded-[1.75rem] bg-white/5 border border-white/10 space-y-3 shadow-xl">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            High Fidelity
                                        </div>
                                        <p className="text-xs text-slate-300 leading-relaxed font-bold">
                                            Text remains vector-based and searchable after rendering. Zero pixelation at any zoom scale.
                                        </p>
                                    </div>
                                    <div className="p-6 rounded-[1.75rem] bg-blue-600/10 border border-blue-500/20 space-y-3 shadow-xl">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest">
                                            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                                            Global Override
                                        </div>
                                        <p className="text-xs text-blue-100 leading-relaxed font-bold">
                                            The specified content payload will be synchronized across every page in the document index.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-white/5">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                                            <Zap className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-1">STATION STATUS</p>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">PROVISIONED</p>
                                            </div>
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
                        className="max-w-4xl mx-auto"
                    >
                        <div className="bg-white border border-slate-200 shadow-2xl rounded-[4rem] p-16 text-center space-y-12 relative overflow-hidden">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-50 rounded-full blur-[100px] -z-10"></div>

                            <div className="space-y-6">
                                <div className="w-28 h-28 rounded-[2.5rem] bg-blue-600 shadow-2xl shadow-blue-500/20 flex items-center justify-center mx-auto mb-10 border border-white/20 animate-in zoom-in duration-1000">
                                    <CheckCircle className="w-14 h-14 text-white" />
                                </div>
                                <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-none">Matrix Render <span className="text-blue-600">Locked</span></h1>
                                <p className="text-slate-500 font-bold text-lg">Your text primitives have been successfully synthesized into the document layers.</p>
                            </div>

                            <div className="p-10 bg-slate-50 border border-slate-100 shadow-inner rounded-[2.5rem] grid grid-cols-2 md:grid-cols-4 gap-10">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payload</p>
                                    <p className="text-sm font-black text-slate-900 truncate">"{text}"</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Coordinates</p>
                                    <p className="text-[11px] font-black text-blue-600 bg-white border border-blue-50 px-4 py-1.5 rounded-xl inline-block">VECTOR {x}:{y}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Scale</p>
                                    <p className="text-[11px] font-black text-slate-900 bg-white border border-slate-200 px-4 py-1.5 rounded-xl inline-block">{fontSize}PT ARCH</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verification</p>
                                    <div className="flex items-center justify-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">DEPLOYED</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <button
                                    onClick={handleDownload}
                                    className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-500/30 hover:-translate-y-1"
                                >
                                    <Download className="w-6 h-6" />
                                    <span>Download Synchronized Asset</span>
                                </button>
                                <button
                                    onClick={() => setShareModalOpen(true)}
                                    className="w-full py-6 bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-black/10 hover:bg-black hover:-translate-y-1"
                                >
                                    <Share2 className="w-5 h-5" />
                                    <span>Sync to Global Index</span>
                                </button>
                            </div>

                            <div className="pt-6">
                                <button
                                    onClick={handleClear}
                                    className="px-8 py-3 rounded-xl text-[10px] font-black text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all uppercase tracking-[0.3em]"
                                >
                                    Initialize New Operation
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

function ShieldCheck({ className }: { className?: string }) {
    return <Shield className={className} />;
}
