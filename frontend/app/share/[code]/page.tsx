'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Download,
    Lock,
    Loader2,
    AlertTriangle,
    Clock,
    Shield,
    CheckCircle,
    ArrowRight,
    Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { downloadFile } from '@/lib/utils';
import { useParams } from 'next/navigation';
import clsx from 'clsx';
import Image from 'next/image';

interface ShareInfo {
    fileName: string;
    fileSize: number;
    passwordRequired: boolean;
    expiresAt: string;
    createdAt: string;
}

export default function ShareDownloadPage() {
    const params = useParams();
    const code = params.code as string;

    const [info, setInfo] = useState<ShareInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        fetchInfo();
    }, [code]);

    const fetchInfo = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/share/${code}/info`);
            setInfo(response.data.data);
        } catch (error: any) {
            const message = error.response?.data?.error?.message || 'Link not found';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!info) return;

        if (info.passwordRequired && !password) {
            toast.error('Please enter the password');
            return;
        }

        setIsDownloading(true);
        try {
            const params = new URLSearchParams();
            if (password) params.set('password', password);

            const response = await api.get(`/share/${code}/url?${params.toString()}`);
            downloadFile(response.data.data.downloadUrl, info?.fileName || 'download.pdf');
            toast.success('Download started!');
        } catch (error: any) {
            const message = error.response?.data?.error?.message || 'Download failed';
            toast.error(message);
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

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 font-sans">
                <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-white/5 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-white font-black tracking-widest uppercase text-xs">Decrypting Signal</p>
                        <p className="text-slate-500 font-medium text-[10px] animate-pulse">Establishing Secure Route...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[100vh] flex items-center justify-center bg-slate-950 font-sans p-6 overflow-hidden relative">
                <div className="absolute inset-0 bg-mesh opacity-40 pointer-events-none"></div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card-premium p-12 max-w-md w-full text-center relative z-10"
                >
                    <div className="w-24 h-24 rounded-3xl bg-rose-500/10 flex items-center justify-center mx-auto mb-8 border border-rose-500/20">
                        <AlertTriangle className="w-12 h-12 text-rose-500" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-3">Link Terminanted</h1>
                    <p className="text-slate-500 font-medium mb-10 leading-relaxed uppercase tracking-widest text-[10px]">{error}</p>

                    <a
                        href="/"
                        className="btn-premium w-full flex items-center justify-center gap-3 py-4 group"
                    >
                        <span>Return to Base</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </a>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 font-sans p-6 overflow-hidden relative">
            {/* Immersive Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-mesh opacity-30"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[150px]"></div>
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-slate-950 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-slate-950 to-transparent"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 max-w-xl w-full"
            >
                {/* Branding Header */}
                <div className="flex justify-center mb-12">
                    <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-3 bg-slate-900/50 backdrop-blur-xl border border-white/5 px-6 py-3 rounded-2xl shadow-2xl">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-white uppercase tracking-tighter">Binary<span className="text-cyan-400">PDF</span></span>
                    </motion.div>
                </div>

                <div className="glass-card-premium overflow-hidden border-white/10 shadow-2xl shadow-cyan-500/5">
                    <div className="p-10 space-y-10">
                        {/* File Intelligence */}
                        <div className="text-center space-y-6">
                            <div className="relative inline-block group">
                                <div className="w-32 h-44 bg-slate-950 border-2 border-white/5 rounded-[32px] flex items-center justify-center shadow-2xl relative overflow-hidden group-hover:border-cyan-500/30 transition-all duration-500">
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent"></div>
                                    <FileText className="w-16 h-16 text-slate-800" />
                                    <div className="absolute -bottom-1 -right-1 w-12 h-12 bg-slate-900 rounded-tl-2xl border-t border-l border-white/5 flex items-center justify-center">
                                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                            <Zap className="w-4 h-4 text-cyan-400" />
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -top-4 -right-4 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md flex items-center gap-2 shadow-2xl">
                                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Verified Link</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-2xl font-black text-white px-2 tracking-tight line-clamp-2" title={info?.fileName}>
                                    {info?.fileName}
                                </h1>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formatBytes(info?.fileSize || 0)}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-800"></span>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Secure Cloud Object</span>
                                </div>
                            </div>
                        </div>

                        {/* Security Matrix */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                                <Shield className="w-5 h-5 text-cyan-400" />
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol</p>
                                    <p className="text-xs font-bold text-white truncate">SHA-256 AES</p>
                                </div>
                            </div>
                            <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                                <Clock className="w-5 h-5 text-amber-400" />
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Expiration</p>
                                    <p className="text-xs font-bold text-white truncate">{formatDate(info?.expiresAt || '')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Interaction Layer */}
                        <div className="space-y-6">
                            {info?.passwordRequired && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Identity Verification</label>
                                        <Lock className="w-3 h-3 text-slate-700" />
                                    </div>
                                    <div className="relative group">
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter access code..."
                                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all outline-none font-black text-lg"
                                            onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className={clsx(
                                    "w-full btn-premium py-6 group gap-4 shadow-2xl",
                                    isDownloading && "opacity-50 grayscale cursor-wait"
                                )}
                            >
                                {isDownloading ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span>Allocating Buffer...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-6 h-6" />
                                        <span className="text-lg uppercase">Initialize Download</span>
                                        <Zap className="w-5 h-5 group-hover:translate-x-1 group-hover:scale-110 transition-all text-cyan-400" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-950/50 border-t border-white/5 p-6 text-center">
                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">
                            Processed via <span className="text-slate-500 group-hover:text-cyan-400 transition-colors">BinaryPDF Architecture</span>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
