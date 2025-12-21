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
    Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api } from '@/lib/api';
import clsx from 'clsx';
import ShareModal from '@/components/ui/ShareModal';

const colorPresets = [
    { value: '#FFFFFF', label: 'Pure White' },
    { value: '#000000', label: 'Pure Black' },
    { value: '#FF3B30', label: 'iOS Red' },
    { value: '#007AFF', label: 'iOS Blue' },
    { value: '#34C759', label: 'iOS Green' },
    { value: '#FFCC00', label: 'iOS Yellow' },
    { value: '#AF52DE', label: 'iOS Purple' },
];

export default function DrawTextPage() {
    const [file, setFile] = useState<File | null>(null);
    const [text, setText] = useState('AUTHENTICATED');
    const [x, setX] = useState(100);
    const [y, setY] = useState(100);
    const [fontSize, setFontSize] = useState(24);
    const [color, setColor] = useState('#007AFF');
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
        setColor('#007AFF');
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
            toast.success('Text rendered successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to add text');
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
                link.download = result.filename || 'annotated_document.pdf';
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
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>

            <div className="relative z-10 max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-6"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-400 via-purple-500 to-fuchsia-500 p-[1px] shadow-2xl shadow-indigo-500/20">
                            <div className="w-full h-full rounded-[23px] bg-slate-950 flex items-center justify-center">
                                <Type className="w-10 h-10 text-indigo-400" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight">Draw <span className="text-gradient-premium">Text</span></h1>
                            <p className="text-slate-400 font-medium mt-1">Overlay high-fidelity text architectures on any PDF</p>
                        </div>
                    </motion.div>

                    {file && !result && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleClear}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-white/5 transition-all flex items-center gap-2"
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
                                                    <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                                        <Upload className="w-10 h-10 text-indigo-400" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-xl font-bold text-white tracking-tight">Load Document</h3>
                                                    <p className="text-slate-500 font-medium text-sm text-center">DRAG & DROP YOUR PDF TO COMMENCE RENDERING</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full flex-1 flex flex-col items-center justify-center space-y-12 py-10">
                                            <div className="relative group">
                                                <div className="w-48 h-64 bg-slate-950 border-2 border-white/5 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden group-hover:border-indigo-500/30 transition-all">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent"></div>

                                                    {/* Text Preview Overlay */}
                                                    <div
                                                        className="absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none overflow-hidden max-w-full px-2"
                                                        style={{
                                                            left: `${(x / 600) * 100}%`,
                                                            top: `${(y / 800) * 100}%`,
                                                            fontSize: `${fontSize / 3}px`,
                                                            color: color,
                                                            textShadow: '0 0 10px rgba(0,0,0,0.5)'
                                                        }}
                                                    >
                                                        <motion.p
                                                            animate={{ opacity: [0.7, 1, 0.7] }}
                                                            transition={{ repeat: Infinity, duration: 2 }}
                                                            className="font-black whitespace-nowrap truncate"
                                                        >
                                                            {text || 'PREVIEW'}
                                                        </motion.p>
                                                    </div>

                                                    <FileText className="w-20 h-20 text-slate-800" />
                                                </div>

                                                <div className="absolute -bottom-4 right-0 px-4 py-2 rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-2xl">
                                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Logic Engine v2</p>
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
                                                <Type className="w-5 h-5 text-indigo-400" />
                                                <h3 className="text-lg font-black text-white">Content Payload</h3>
                                            </div>
                                            <input
                                                type="text"
                                                value={text}
                                                onChange={(e) => setText(e.target.value)}
                                                placeholder="Enter text string..."
                                                className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold placeholder:text-slate-800"
                                            />
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                        <MousePointer2 className="w-3.5 h-3.5" />
                                                        X Vector
                                                    </span>
                                                    <span className="text-xs font-black text-indigo-400">{x}px</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="600"
                                                    value={x}
                                                    onChange={(e) => setX(parseInt(e.target.value))}
                                                    className="w-full hover:accent-indigo-400 accent-indigo-500 transition-all h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                        <MousePointer2 className="w-3.5 h-3.5" />
                                                        Y Vector
                                                    </span>
                                                    <span className="text-xs font-black text-indigo-400">{y}px</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="800"
                                                    value={y}
                                                    onChange={(e) => setY(parseInt(e.target.value))}
                                                    className="w-full hover:accent-indigo-400 accent-indigo-500 transition-all h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Dimension Scale</span>
                                                    <span className="text-xs font-black text-indigo-400">{fontSize}pt</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="8"
                                                    max="144"
                                                    value={fontSize}
                                                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                                                    className="w-full hover:accent-indigo-400 accent-indigo-500 transition-all h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Palette className="w-5 h-5 text-indigo-400" />
                                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Chromatic Spectrum</h3>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {colorPresets.map((c) => (
                                                    <button
                                                        key={c.value}
                                                        onClick={() => setColor(c.value)}
                                                        className={clsx(
                                                            "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                                                            color === c.value ? "border-white" : "border-white/5"
                                                        )}
                                                        style={{ backgroundColor: c.value }}
                                                        title={c.label}
                                                    />
                                                ))}
                                                <input
                                                    type="color"
                                                    value={color}
                                                    onChange={(e) => setColor(e.target.value)}
                                                    className="w-8 h-8 rounded-full cursor-pointer bg-transparent"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleDrawText}
                                        disabled={isProcessing || !file || !text.trim()}
                                        className={clsx(
                                            "w-full btn-premium py-5 group gap-3",
                                            (isProcessing || !file || !text.trim()) && "opacity-50 grayscale cursor-not-allowed"
                                        )}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                <span>Slicing Layers...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Type className="w-6 h-6" />
                                                <span>Execute Render</span>
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
                                        <Shield className="w-5 h-5 text-indigo-400" />
                                        Advanced Overlay
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        Our rendering engine uses native PDF primitives to ensure text remains selectable and searchable.
                                    </p>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Visual Hint</p>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Use <span className="text-indigo-400 font-bold">Contrast Colors</span> for documents with complex backgrounds.
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-2">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Metadata Policy</p>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Overlay will be applied to <span className="text-white font-bold">all pages</span> of your document.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center border border-white/10">
                                            <Zap className="w-6 h-6 text-yellow-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white tracking-widest">RENDERER READY</p>
                                            <p className="text-[10px] text-slate-500 font-medium">Core Stack v4.1.2</p>
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
                                <h2 className="text-4xl font-black tracking-tight text-white uppercase">Render Succeeded!</h2>
                                <p className="text-slate-400 font-medium mt-2">Custom text layers have been successfully integrated</p>
                            </div>

                            <div className="p-8 bg-slate-900 border border-white/5 shadow-2xl rounded-3xl grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Payload</p>
                                    <p className="text-xs font-black text-white truncate px-2">"{text}"</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vector</p>
                                    <p className="text-xs font-black text-white">({x}, {y})</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dimension</p>
                                    <p className="text-xs font-black text-white">{fontSize}pt</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</p>
                                    <p className="text-[10px] font-black text-emerald-400 border border-emerald-400/30 px-2 py-0.5 rounded-full inline-block">DEPLOYED</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <button
                                    onClick={handleDownload}
                                    className="w-full btn-premium py-5 flex items-center justify-center gap-3 text-white"
                                >
                                    <Download className="w-6 h-6 text-white" />
                                    <span>Download Annotated PDF</span>
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
