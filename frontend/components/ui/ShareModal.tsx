import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Globe, Clock, Link as LinkIcon, Share2, Zap, Lock } from 'lucide-react';
import { notify } from '@/lib/notifications';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileId: string;
    fileType: 'temp' | 'library';
}

export default function ShareModal({ isOpen, onClose, fileId, fileType }: ShareModalProps) {
    const { user } = useAuthStore();
    const router = useRouter();
    const [expiresIn, setExpiresIn] = useState(1440); // default 24h (1440 min)
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const isFree = !user || user.plan === 'free';

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setGeneratedUrl(null);
            setExpiresIn(1440);
        }
    }, [isOpen]);

    const handleGenerate = async () => {
        if (isFree) return;
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

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                            <Share2 className="w-5 h-5 text-blue-500" />
                            Share File
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-8">
                        {isFree ? (
                            <div className="text-center space-y-6">
                                <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto relative">
                                    <Lock className="w-10 h-10 text-blue-500" />
                                    <div className="absolute -top-2 -right-2 bg-gradient-to-tr from-blue-600 to-indigo-600 text-[10px] font-black px-2 py-1 rounded-lg text-white shadow-lg uppercase tracking-wider animate-bounce">
                                        Pro
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Public Sharing Restricted</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                        Public links are only available for **Plus 4+ models** (Student, Pro, Business). Level up your plan to share files globally.
                                    </p>
                                </div>
                                <div className="pt-4 space-y-3">
                                    <button
                                        onClick={() => { onClose(); router.push('/pricing'); }}
                                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Zap className="w-4 h-4 fill-white" />
                                        Upgrade Now
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="w-full py-3 text-slate-500 dark:text-slate-400 text-xs font-semibold hover:text-slate-700 transition-colors"
                                    >
                                        Maybe Later
                                    </button>
                                </div>
                            </div>
                        ) : !generatedUrl ? (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 ml-1">
                                        Link Expiration
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: '30 Minutes', value: 30 },
                                            { label: '1 Hour', value: 60 },
                                            { label: '24 Hours', value: 1440 },
                                            { label: '7 Days', value: 10080 },
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => setExpiresIn(option.value)}
                                                className={`py-3 px-4 rounded-2xl border text-xs font-bold transition-all
                                                ${expiresIn === option.value
                                                        ? 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20'
                                                        : 'border-slate-100 dark:border-slate-800 hover:border-blue-300 text-slate-500'
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
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <LinkIcon className="w-4 h-4" />
                                            Generate Secure Link
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl text-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full"></div>
                                    <div className="relative z-10">
                                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Globe className="w-8 h-8 text-emerald-500" />
                                        </div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">Secure Link Ready!</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                            Private link generated. Expires in {expiresIn >= 1440 ? `${expiresIn / 1440} day(s)` : `${expiresIn} mins`}.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        readOnly
                                        value={generatedUrl}
                                        className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-300 focus:outline-none"
                                    />
                                    <button
                                        onClick={handleCopy}
                                        className={`px-5 rounded-2xl font-bold transition-all flex items-center gap-2
                                            ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>

                                <button
                                    onClick={() => setGeneratedUrl(null)}
                                    className="w-full py-2 text-xs text-slate-500 dark:text-slate-500 font-bold hover:text-blue-500 transition-colors"
                                >
                                    Create Different Link
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

