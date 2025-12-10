'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api, shareApi } from '@/lib/api'; // We'll assume shareApi is added
import { Download, FileText, AlertCircle, Clock } from 'lucide-react';
import { notify } from '@/lib/notifications';
import { motion } from 'framer-motion';

export default function SharedFilePage() {
    const params = useParams();
    const code = params.code as string;

    const [loading, setLoading] = useState(true);
    const [fileData, setFileData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchShare = async () => {
            try {
                const response = await shareApi.get(code); // Using the new API
                setFileData(response.data.data);
            } catch (err: any) {
                setError(err.response?.data?.error || 'Link invalid or expired');
            } finally {
                setLoading(false);
            }
        };

        if (code) fetchShare();
    }, [code]);

    const handleDownload = () => {
        if (!fileData?.url) return;

        try {
            const link = document.createElement('a');
            link.href = fileData.url;
            link.download = fileData.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            notify.success('Download started');
        } catch (err) {
            console.error('Download failed', err);
            notify.error('Download failed. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Link Unavailable</h1>
                    <p className="text-gray-500 dark:text-gray-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl mix-blend-multiply filter opacity-70" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl mix-blend-multiply filter opacity-70" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 relative z-10 border border-white/20"
            >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3 transform hover:rotate-6 transition-all">
                    <FileText className="w-10 h-10 text-white" />
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 break-all">
                        {fileData.filename}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 text-sm">
                        <Clock className="w-4 h-4" />
                        Expires on {new Date(fileData.expiresAt).toLocaleDateString()}
                    </p>
                </div>

                <button
                    onClick={handleDownload}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3"
                >
                    <Download className="w-5 h-5" />
                    Download File
                </button>

                <p className="text-center mt-6 text-xs text-gray-400">
                    Trusted & Secure File Sharing via BrainyPDF
                </p>
            </motion.div>
        </div>
    );
}
