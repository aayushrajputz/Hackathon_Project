'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Share2,
    Link,
    Copy,
    Check,
    Lock,
    Unlock,
    Clock,
    BarChart3,
    Trash2,
    Eye,
    FileText,
    Loader2,
    Plus,
    ExternalLink,
    Users,
    MousePointerClick
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface ShareLink {
    id: string;
    shortCode: string;
    shareLink: string;
    fileName: string;
    fileSize: number;
    hasPassword: boolean;
    expiresAt: string;
    createdAt: string;
    isExpired: boolean;
    totalClicks: number;
    uniqueVisitors: number;
    firstOpenedAt?: string;
    lastOpenedAt?: string;
}

interface LibraryFile {
    id: string;
    fileName: string;
    size: number;
    pageCount: number;
}

export default function SharePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [shares, setShares] = useState<ShareLink[]>([]);
    const [libraryFiles, setLibraryFiles] = useState<LibraryFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAnalyticsModal, setShowAnalyticsModal] = useState<ShareLink | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Create modal state
    const [selectedFileId, setSelectedFileId] = useState('');
    const [password, setPassword] = useState('');
    const [expiryHours, setExpiryHours] = useState(24);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user) {
            fetchShares();
            fetchLibraryFiles();
        }
    }, [user, authLoading, router]);

    const fetchShares = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/share/my');
            setShares(response.data.data || []);
        } catch (error) {
            toast.error('Failed to load share links');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchLibraryFiles = async () => {
        try {
            const response = await api.get('/library/list');
            setLibraryFiles(response.data.data || []);
        } catch (error) {
            // Silent fail - user might not have any files
        }
    };

    const handleCreate = async () => {
        if (!selectedFileId) {
            toast.error('Please select a file');
            return;
        }

        setIsCreating(true);
        try {
            const response = await api.post('/share/create', {
                fileId: selectedFileId,
                password: password || undefined,
                expiryHours,
            });

            toast.success('Share link created!');
            setShowCreateModal(false);
            setSelectedFileId('');
            setPassword('');
            setExpiryHours(24);
            fetchShares();
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to create share link');
        } finally {
            setIsCreating(false);
        }
    };

    const handleCopy = async (link: string, id: string) => {
        try {
            await navigator.clipboard.writeText(link);
            setCopiedId(id);
            toast.success('Link copied!');
            setTimeout(() => setCopiedId(null), 2000);
        } catch (error) {
            toast.error('Failed to copy');
        }
    };

    const handleDelete = async (code: string) => {
        try {
            await api.delete(`/share/${code}`);
            toast.success('Share link deleted');
            setShares(prev => prev.filter(s => s.shortCode !== code));
        } catch (error) {
            toast.error('Failed to delete');
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
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTimeRemaining = (expiresAt: string): string => {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diff = expiry.getTime() - now.getTime();

        if (diff <= 0) return 'Expired';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}d remaining`;
        }
        return `${hours}h ${minutes}m remaining`;
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <Share2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Share Links</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {shares.filter(s => !s.isExpired).length} active links
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600"
                >
                    <Plus className="w-5 h-5" />
                    Create Share Link
                </button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : shares.length === 0 ? (
                <div className="card p-12 text-center">
                    <Share2 className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No share links yet</h3>
                    <p className="text-gray-500 mb-6">Create secure share links for your PDFs</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <Link className="w-5 h-5" />
                        Create your first link
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {shares.map((share) => (
                        <motion.div
                            key={share.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`card p-4 ${share.isExpired ? 'opacity-60' : ''}`}
                        >
                            <div className="flex items-center gap-4 flex-wrap">
                                {/* File icon & name */}
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-red-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium truncate">{share.fileName}</h3>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                                        <span className="flex items-center gap-1">
                                            {share.hasPassword ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                            {share.hasPassword ? 'Protected' : 'Public'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {share.isExpired ? 'Expired' : getTimeRemaining(share.expiresAt)}
                                        </span>
                                        <span>{formatBytes(share.fileSize)}</span>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="text-center">
                                        <p className="font-semibold text-gray-900 dark:text-white">{share.totalClicks}</p>
                                        <p className="text-xs text-gray-500">clicks</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-semibold text-gray-900 dark:text-white">{share.uniqueVisitors}</p>
                                        <p className="text-xs text-gray-500">visitors</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleCopy(share.shareLink, share.id)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                                        title="Copy link"
                                    >
                                        {copiedId === share.id ? (
                                            <Check className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <Copy className="w-5 h-5" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => window.open(share.shareLink, '_blank')}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                                        title="Open link"
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setShowAnalyticsModal(share)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                                        title="View analytics"
                                    >
                                        <BarChart3 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(share.shortCode)}
                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Link preview */}
                            <div className="mt-3 p-2 bg-gray-50 dark:bg-slate-800 rounded-lg flex items-center gap-2">
                                <Link className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <code className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                    {share.shareLink}
                                </code>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => !isCreating && setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-bold mb-4">Create Share Link</h2>

                            {/* File Select */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Select File</label>
                                <select
                                    value={selectedFileId}
                                    onChange={(e) => setSelectedFileId(e.target.value)}
                                    className="input-field w-full"
                                >
                                    <option value="">Choose a file...</option>
                                    {libraryFiles.map((file) => (
                                        <option key={file.id} value={file.id}>
                                            {file.fileName} ({formatBytes(file.size)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Password */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">
                                    Password (optional)
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Leave empty for public link"
                                    className="input-field w-full"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Protected with SHA-256 encryption
                                </p>
                            </div>

                            {/* Expiry */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">Expires In</label>
                                <select
                                    value={expiryHours}
                                    onChange={(e) => setExpiryHours(Number(e.target.value))}
                                    className="input-field w-full"
                                >
                                    <option value={1}>1 hour</option>
                                    <option value={6}>6 hours</option>
                                    <option value={24}>24 hours</option>
                                    <option value={48}>2 days</option>
                                    <option value={168}>7 days</option>
                                </select>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    disabled={isCreating}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={isCreating || !selectedFileId}
                                    className="btn-primary flex-1 bg-gradient-to-r from-emerald-500 to-teal-600"
                                >
                                    {isCreating ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        'Create Link'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Analytics Modal */}
            <AnimatePresence>
                {showAnalyticsModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowAnalyticsModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <BarChart3 className="w-6 h-6 text-emerald-500" />
                                <h2 className="text-xl font-bold">Link Analytics</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                                    <p className="text-sm text-gray-500 mb-1">File</p>
                                    <p className="font-medium truncate">{showAnalyticsModal.fileName}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 text-center">
                                        <MousePointerClick className="w-6 h-6 mx-auto text-emerald-500 mb-2" />
                                        <p className="text-2xl font-bold">{showAnalyticsModal.totalClicks}</p>
                                        <p className="text-sm text-gray-500">Total Clicks</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 text-center">
                                        <Users className="w-6 h-6 mx-auto text-blue-500 mb-2" />
                                        <p className="text-2xl font-bold">{showAnalyticsModal.uniqueVisitors}</p>
                                        <p className="text-sm text-gray-500">Unique Visitors</p>
                                    </div>
                                </div>

                                {showAnalyticsModal.firstOpenedAt && (
                                    <div className="text-sm text-gray-500">
                                        <p>First opened: {formatDate(showAnalyticsModal.firstOpenedAt)}</p>
                                        {showAnalyticsModal.lastOpenedAt && (
                                            <p>Last opened: {formatDate(showAnalyticsModal.lastOpenedAt)}</p>
                                        )}
                                    </div>
                                )}

                                <div className="text-xs text-gray-400 text-center">
                                    Anonymous tracking • No personal data collected
                                </div>
                            </div>

                            <button
                                onClick={() => setShowAnalyticsModal(null)}
                                className="btn-secondary w-full mt-6"
                            >
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
