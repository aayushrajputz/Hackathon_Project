'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Library as LibraryIcon,
    Upload,
    Download,
    Trash2,
    Search,
    Grid,
    List,
    FileText,
    Loader2,
    X,
    SortAsc,
    SortDesc,
    Calendar,
    HardDrive,
    Hash,
    Eye,
    Plus,
    Share2,
    Sparkles,
    Filter
} from 'lucide-react';
import { notify } from '@/lib/notifications';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { api } from '@/lib/api';
import { downloadFile } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import ShareModal from '@/components/ui/ShareModal';
import PDFPreview from '@/components/ui/PDFPreview';
import clsx from 'clsx';

interface LibraryFile {
    id: string;
    fileName: string;
    fileUrl: string;
    size: number;
    pageCount: number;
    createdAt: string;
}

type SortField = 'createdAt' | 'name' | 'size' | 'pages';
type ViewMode = 'grid' | 'list';

export default function LibraryPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [files, setFiles] = useState<LibraryFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortField>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasFetched, setHasFetched] = useState(false);
    const { user: userFromStore } = useAuthStore();

    const [shareFile, setShareFile] = useState<LibraryFile | null>(null);
    const [previewFile, setPreviewFile] = useState<LibraryFile | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handlePreview = async (file: LibraryFile) => {
        try {
            const toastId = toast.loading('Loading preview...');
            const response = await api.get(`/library/download/${file.id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            setPreviewUrl(url);
            setPreviewFile(file);
            toast.dismiss(toastId);
        } catch (e) {
            toast.error('Failed to load preview');
        }
    };

    const closePreview = () => {
        if (previewUrl) window.URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPreviewFile(null);
    };

    const fetchLibrary = useCallback(async () => {
        setError(null);
        setIsLoading(true);

        try {
            const response = await api.get('/library/list', {
                params: { sortBy, sortOrder, search: search || undefined },
                timeout: 15000,
            });

            let data = response.data?.data;
            setFiles(Array.isArray(data) ? data : []);
            setHasFetched(true);
        } catch (err: any) {
            console.error('Library fetch error:', err);
            if (err.response?.status === 401) {
                if (!user && !authLoading) router.push('/login');
                else setError('Session expired. Please log in again.');
            } else {
                setError(err.response?.data?.error?.message || 'Failed to load library');
            }
            setFiles([]);
            setHasFetched(true);
        } finally {
            setIsLoading(false);
        }
    }, [sortBy, sortOrder, search, router, user, authLoading]);

    useEffect(() => {
        fetchLibrary();
    }, []);

    useEffect(() => {
        if (hasFetched) fetchLibrary();
    }, [sortBy, sortOrder, search]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        const userPlan = userFromStore?.plan || 'free';
        const limits = {
            student: 25 * 1024 * 1024,
            pro: 100 * 1024 * 1024,
            plus: 300 * 1024 * 1024,
            business: 1024 * 1024 * 1024,
            free: 10 * 1024 * 1024
        } as any;
        const maxFileSize = limits[userPlan] || limits.free;

        setIsUploading(true);
        let successCount = 0;

        for (const file of acceptedFiles) {
            if (file.size > maxFileSize) {
                toast.error(`${file.name} is too large. Limit is ${maxFileSize / (1024 * 1024)}MB.`, { icon: '⚠️' });
                continue;
            }

            try {
                const formData = new FormData();
                formData.append('file', file);
                await api.post('/library/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                successCount++;
            } catch (error: any) {
                toast.error(`Failed to upload ${file.name}`);
            }
        }

        if (successCount > 0) {
            toast.success(`Successfully uploaded ${successCount} file(s)`);
            fetchLibrary();
            useAuthStore.getState().syncStorage();
        }
        setIsUploading(false);
        setShowUploadModal(false);
    }, [fetchLibrary, userFromStore]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: true,
    });

    const handleDownload = async (file: LibraryFile) => {
        try {
            const response = await api.get(`/library/download/${file.id}`, { responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            downloadFile(window.URL.createObjectURL(blob), file.fileName);
            toast.success('Download started');
        } catch (error: any) {
            toast.error('Download failed');
        }
    };

    const handleDelete = async (fileId: string) => {
        try {
            await api.delete(`/library/${fileId}`);
            toast.success('File deleted');
            setFiles(prev => prev.filter(f => f.id !== fileId));
            setDeleteConfirm(null);
            useAuthStore.getState().syncStorage();
        } catch (error) {
            toast.error('Deletion failed');
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
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (authLoading && !hasFetched) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen p-4 md:p-8 overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 bg-mesh pointer-events-none opacity-20"></div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[1px] shadow-2xl">
                            <div className="w-full h-full rounded-[31px] bg-slate-950 flex items-center justify-center">
                                <LibraryIcon className="w-8 h-8 text-indigo-400" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight">Cloud <span className="text-gradient-premium">Library</span></h1>
                            <p className="text-slate-400 font-medium">Manage your professional document assets</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="btn-premium group flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        Upload Assets
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                            <Search className="w-full h-full" />
                        </div>
                        <input
                            type="text"
                            placeholder="Filter your assets..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/5 focus:border-cyan-500/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 outline-none backdrop-blur-xl transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 p-1 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl">
                        {[
                            { id: 'createdAt', icon: Calendar, label: 'Date' },
                            { id: 'name', icon: SortAsc, label: 'Name' },
                            { id: 'size', icon: HardDrive, label: 'Size' },
                            { id: 'pages', icon: Hash, label: 'Pages' },
                        ].map((s) => (
                            <button
                                key={s.id}
                                onClick={() => {
                                    if (sortBy === s.id) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                                    else { setSortBy(s.id as SortField); setSortOrder('desc'); }
                                }}
                                className={clsx(
                                    "px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all",
                                    sortBy === s.id
                                        ? "bg-white/10 text-white shadow-lg"
                                        : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                <s.icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{s.label}</span>
                                {sortBy === s.id && (
                                    sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={clsx(
                                "p-3 rounded-xl transition-all",
                                viewMode === 'grid' ? "bg-white/10 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            <Grid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={clsx(
                                "p-3 rounded-xl transition-all",
                                viewMode === 'list' ? "bg-white/10 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="py-32 flex flex-col items-center justify-center gap-6"
                        >
                            <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
                            <p className="text-slate-400 font-bold animate-pulse">Syncing Library...</p>
                        </motion.div>
                    ) : files.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="glass-card-premium py-32 text-center space-y-6"
                        >
                            <div className="w-24 h-24 mx-auto rounded-full bg-slate-800 flex items-center justify-center">
                                <FileText className="w-10 h-10 text-slate-600" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white">No Assets Found</h3>
                                <p className="text-slate-400 font-medium max-w-xs mx-auto">Your secure document vault is currently empty. Start uploading to manage your assets.</p>
                            </div>
                            <button onClick={() => setShowUploadModal(true)} className="btn-glass text-white border-white/10">
                                Upload Now
                            </button>
                        </motion.div>
                    ) : viewMode === 'grid' ? (
                        <motion.div
                            layout
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                        >
                            {files.map((file) => (
                                <motion.div
                                    key={file.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="group glass-card-premium p-4 border-white/5 hover:border-cyan-500/30 transition-all duration-500"
                                >
                                    <div className="relative aspect-[3/4] bg-slate-950 rounded-2xl mb-4 overflow-hidden flex items-center justify-center group-hover:shadow-[0_0_30px_-5px_rgba(34,211,238,0.2)] transition-all duration-500">
                                        <FileText className="w-16 h-16 text-rose-500 opacity-50 transition-transform duration-500 group-hover:scale-110" />

                                        {/* Actions Overlay */}
                                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => handlePreview(file)} className="p-3 rounded-xl bg-white/10 hover:bg-cyan-500 text-white transition-all scale-90 group-hover:scale-100">
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleDownload(file)} className="p-3 rounded-xl bg-white/10 hover:bg-emerald-500 text-white transition-all scale-90 delay-75 group-hover:scale-100">
                                                    <Download className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => setShareFile(file)} className="p-3 rounded-xl bg-white/10 hover:bg-indigo-500 text-white transition-all scale-90 delay-100 group-hover:scale-100">
                                                    <Share2 className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => setDeleteConfirm(file.id)} className="p-3 rounded-xl bg-white/10 hover:bg-rose-500 text-white transition-all scale-90 delay-150 group-hover:scale-100">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="font-bold text-white truncate text-sm" title={file.fileName}>{file.fileName}</h3>
                                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            <span>{file.pageCount} Pages</span>
                                            <span>{formatBytes(file.size)}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div layout className="glass-card-premium divide-y divide-white/5 overflow-hidden">
                            {files.map((file) => (
                                <motion.div
                                    key={file.id}
                                    layout
                                    className="flex items-center justify-between gap-4 p-4 hover:bg-white/5 transition-colors group"
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                                            <FileText className="w-6 h-6 text-rose-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-white font-bold truncate">{file.fileName}</h3>
                                            <p className="text-xs text-slate-500 flex items-center gap-2">
                                                <span>{formatDate(file.createdAt)}</span>
                                                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                                <span>{file.pageCount} Pages</span>
                                                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                                <span>{formatBytes(file.size)}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handlePreview(file)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                                            <Eye className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDownload(file)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                                            <Download className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => setDeleteConfirm(file.id)} className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 transition-all">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Upload Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                        onClick={() => !isUploading && setShowUploadModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="glass-card-premium p-8 max-w-xl w-full border-white/10 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-white">Upload Assets</h2>
                                    <p className="text-slate-400 text-sm">Securely store your PDFs in the cloud</p>
                                </div>
                                <button onClick={() => !isUploading && setShowUploadModal(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div
                                {...getRootProps()}
                                className={clsx(
                                    "dropzone-premium group bg-slate-950/40 h-[300px] flex items-center justify-center",
                                    isUploading && "opacity-50 pointer-events-none"
                                )}
                            >
                                <input {...getInputProps()} disabled={isUploading} />
                                <div className="flex flex-col items-center gap-6 group text-center">
                                    {isUploading ? (
                                        <>
                                            <div className="relative">
                                                <Loader2 className="w-16 h-16 animate-spin text-cyan-400" />
                                                <div className="absolute inset-0 blur-xl bg-cyan-400/20" />
                                            </div>
                                            <p className="text-white font-black animate-pulse">Encoding Documents...</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                                <Upload className="w-10 h-10 text-cyan-400" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-bold text-white">Drop PDFs Here</h3>
                                                <p className="text-slate-500 text-sm font-medium">Bulk upload supported • Premium Security</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass-card-premium p-8 max-w-sm w-full border-rose-500/20 shadow-2xl text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="w-8 h-8 text-rose-500" />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-2">Delete Asset?</h2>
                            <p className="text-slate-400 text-sm mb-8 font-medium">This document will be permanently purged from your cloud workspace.</p>
                            <div className="flex gap-4">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-6 py-4 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all">Cancel</button>
                                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-6 py-4 rounded-2xl bg-rose-500 text-white font-bold shadow-lg shadow-rose-500/20 hover:scale-105 transition-transform">Purge</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Preview & Share Components */}
            <AnimatePresence>
                {previewUrl && previewFile && (
                    <PDFPreview fileUrl={previewUrl} onClose={closePreview} title={previewFile.fileName} />
                )}
            </AnimatePresence>

            <ShareModal
                isOpen={!!shareFile}
                onClose={() => setShareFile(null)}
                fileId={shareFile?.id || ''}
                fileType="library"
            />
        </div>
    );
}
