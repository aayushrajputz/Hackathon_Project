'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api, shareApi } from '@/lib/api';
import { Download, FileText, AlertTriangle, Clock, Shield, CheckCircle, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export default function SharedFilePage() {
    const params = useParams();
    const code = params.code as string;

    const [loading, setLoading] = useState(true);
    const [fileData, setFileData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        const fetchShare = async () => {
            try {
                const response = await shareApi.get(code);
                setFileData(response.data.data);
            } catch (err: any) {
                setError(err.response?.data?.error || 'Link invalid or expired');
            } finally {
                setLoading(false);
            }
        };

        if (code) fetchShare();
    }, [code]);

    const handleDownload = async () => {
        if (!fileData?.url) return;
        setIsDownloading(true);

        try {
            const link = document.createElement('a');
            link.href = fileData.url;
            link.download = fileData.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Download initialized');
        } catch (err) {
            toast.error('Download failed. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 font-sans">
                <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-white/5 flex items-center justify-center shadow-2xl">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 font-sans p-6 overflow-hidden relative">
                <div className="absolute inset-0 bg-mesh opacity-40 pointer-events-none"></div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card-premium p-12 max-w-md w-full text-center relative z-10"
                >
                    <div className="w-24 h-24 rounded-3xl bg-rose-500/10 flex items-center justify-center mx-auto mb-8 border border-rose-500/20 shadow-2xl">
                        <AlertTriangle className="w-12 h-12 text-rose-500" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-3 uppercase tracking-tighter">Access Denied</h1>
                    <p className="text-slate-500 font-medium mb-10 leading-relaxed uppercase tracking-widest text-[10px]">{error}</p>
                    <a href="/" className="btn-premium w-full flex items-center justify-center gap-3 py-4 group">
                        <span>BinaryPDF Home</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </a>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 font-sans p-6 overflow-hidden relative">
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-mesh opacity-30"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[150px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 max-w-xl w-full"
            >
                <div className="flex justify-center mb-12">
                    <div className="flex items-center gap-3 bg-slate-900/50 backdrop-blur-xl border border-white/5 px-6 py-3 rounded-2xl shadow-2xl">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-white uppercase tracking-tighter">Binary<span className="text-blue-400">PDF</span></span>
                    </div>
                </div>

                <div className="glass-card-premium overflow-hidden border-white/10 shadow-2xl shadow-blue-500/5">
                    <div className="p-10 space-y-10">
                        <div className="text-center space-y-6">
                            <div className="relative inline-block group">
                                <div className="w-32 h-44 bg-slate-950 border-2 border-white/5 rounded-[32px] flex items-center justify-center shadow-2xl relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent"></div>
                                    <FileText className="w-16 h-16 text-slate-800" />
                                    <div className="absolute -bottom-1 -right-1 w-12 h-12 bg-slate-900 rounded-tl-2xl border-t border-l border-white/5 flex items-center justify-center">
                                        <Zap className="w-4 h-4 text-blue-400" />
                                    </div>
                                </div>
                                <div className="absolute -top-4 -right-4 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md flex items-center gap-2 shadow-2xl">
                                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Public Link</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-2xl font-black text-white px-2 tracking-tight line-clamp-2">
                                    {fileData.filename}
                                </h1>
                                <div className="flex items-center justify-center gap-3">
                                    <div className="flex items-center gap-2 text-slate-500 group">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Exp: {new Date(fileData.expiresAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <button
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className={clsx(
                                    "w-full btn-premium py-6 group gap-4 shadow-2xl",
                                    isDownloading && "opacity-50 grayscale cursor-not-allowed"
                                )}
                            >
                                {isDownloading ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span>Allocating Stream...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-6 h-6" />
                                        <span className="text-lg uppercase">Fetch Object</span>
                                        <Zap className="w-5 h-5 group-hover:translate-x-1 group-hover:scale-110 transition-all text-blue-400" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-950/50 border-t border-white/5 p-6 text-center">
                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">
                            SECURELY ROUTED VIA <span className="text-slate-500">BinaryPDF</span>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
