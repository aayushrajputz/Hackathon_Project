'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FileText,
    Download,
    Lock,
    Loader2,
    AlertTriangle,
    Clock,
    Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { downloadFile } from '@/lib/utils';
import { useParams } from 'next/navigation';

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
            // Get download URL
            const params = new URLSearchParams();
            if (password) params.set('password', password);

            const response = await api.get(`/share/${code}/url?${params.toString()}`);

            // Trigger download
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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full text-center shadow-xl"
                >
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Link Not Available</h1>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <a
                        href="/"
                        className="btn-primary inline-flex"
                    >
                        Go to Homepage
                    </a>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full shadow-xl"
            >
                {/* File Preview */}
                <div className="text-center mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold mb-1 truncate" title={info?.fileName}>
                        {info?.fileName}
                    </h1>
                    <p className="text-gray-500">{formatBytes(info?.fileSize || 0)}</p>
                </div>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-500">
                    <Shield className="w-4 h-4" />
                    <span>Secure file share</span>
                    {info?.passwordRequired && (
                        <>
                            <span>•</span>
                            <Lock className="w-4 h-4" />
                            <span>Password protected</span>
                        </>
                    )}
                </div>

                {/* Password Input */}
                {info?.passwordRequired && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                            Enter Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter the password"
                                className="input-field pl-10 w-full"
                                onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
                            />
                        </div>
                    </div>
                )}

                {/* Download Button */}
                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="btn-primary w-full bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-lg"
                >
                    {isDownloading ? (
                        <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Preparing...</>
                    ) : (
                        <><Download className="w-5 h-5 mr-2" /> Download</>
                    )}
                </button>

                {/* Expiry Info */}
                <div className="mt-6 text-center text-sm text-gray-400">
                    <div className="flex items-center justify-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Expires: {formatDate(info?.expiresAt || '')}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t dark:border-slate-700 text-center">
                    <p className="text-xs text-gray-400">
                        Shared via <a href="/" className="text-primary-500 hover:underline">BrainyPDF</a>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
