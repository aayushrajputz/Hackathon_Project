'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Globe, Clock, Link as LinkIcon, Share2 } from 'lucide-react';
import { notify } from '@/lib/notifications';
import { api } from '@/lib/api';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileId: string;
    fileType: 'temp' | 'library';
}

export default function ShareModal({ isOpen, onClose, fileId, fileType }: ShareModalProps) {
    const [expiresIn, setExpiresIn] = useState(1440); // default 24h (1440 min)
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setGeneratedUrl(null);
            setExpiresIn(1440);
        }
    }, [isOpen]);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const response = await api.post('/share', {
                fileId,
                fileType,
                expiresInMinutes: expiresIn
            });
            setGeneratedUrl(response.data.data.url);
            notify.customSuccess('Link Generated', 'Public share link created successfully.');
        } catch (err: any) {
            notify.error(err.response?.data?.error || 'Failed to generate link');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!generatedUrl) return;
        navigator.clipboard.writeText(generatedUrl);
        setCopied(true);
        notify.success('Link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    // Reset state when opening (though effect would be better, this is simple)
    // Actually, better to check if we should reset. 
    // Implementing a useEffect to reset when isOpen changes to true

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                            <Share2 className="w-5 h-5 text-blue-500" />
                            Share File
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">
                        {!generatedUrl ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Link Expiration
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[
                                            { label: '30 Min', value: 30 },
                                            { label: '1 Hour', value: 60 },
                                            { label: '7 Hours', value: 420 },
                                            { label: '24 Hours', value: 1440 },
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => setExpiresIn(option.value)}
                                                className={`py-2 px-1 rounded-xl border text-xs font-medium transition-all
                                                ${expiresIn === option.value
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <LinkIcon className="w-4 h-4" />
                                            Generate Public Link
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-center">
                                    <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Globe className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h3 className="font-bold text-green-800 dark:text-green-300">Link Ready!</h3>
                                    <p className="text-sm text-green-600 dark:text-green-400">
                                        Anyone with this link can download the file.
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        readOnly
                                        value={generatedUrl}
                                        className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm font-mono text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={handleCopy}
                                        className={`px-4 rounded-xl font-medium transition-all flex items-center gap-2
                                            ${copied ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>

                                <button
                                    onClick={() => setGeneratedUrl(null)}
                                    className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    Generate another link
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
