'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Library,
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


    // New Features State
    const [shareFile, setShareFile] = useState<LibraryFile | null>(null);
    const [previewFile, setPreviewFile] = useState<LibraryFile | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Fetch blob for preview
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

    // Clean up preview URL
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
            if (Array.isArray(data)) {
                setFiles(data);
            } else {
                setFiles([]);
            }
            setHasFetched(true);
        } catch (err: any) {
            console.error('Library fetch error:', err);

            if (err.response?.status === 401) {
                if (!user && !authLoading) {
                    router.push('/login');
                } else {
                    setError('Session expired. Please log in again.');
                }
            } else if (err.code === 'ECONNABORTED') {
                setError('Request timed out. Please try refreshing.');
                toast.error('Request timed out');
            } else {
                const message = err.response?.data?.error?.message || 'Failed to load library';
                setError(message);
                toast.error(message);
            }
            setFiles([]);
            setHasFetched(true);
        } finally {
            setIsLoading(false);
        }
    }, [sortBy, sortOrder, search, router, user, authLoading]);

    // Initial fetch - run once on mount
    useEffect(() => {
        fetchLibrary();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Refetch when sort/search changes
    useEffect(() => {
        if (hasFetched) {
            fetchLibrary();
        }
    }, [sortBy, sortOrder, search]); // eslint-disable-line react-hooks/exhaustive-deps

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        // Plan-based size check
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
                toast.error(`${file.name} is too large. Your plan limit is ${maxFileSize / (1024 * 1024)}MB.`, {
                    duration: 5000,
                    icon: '⚠️'
                });
                continue;
            }

            try {
                const formData = new FormData();
                formData.append('file', file);

                await api.post('/library/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                successCount++;
                notify.uploadSuccess(file.name);
            } catch (error: any) {
                notify.uploadError(file.name);
            }
        }

        if (successCount > 0) {
            fetchLibrary();
            import('@/lib/store').then(({ useAuthStore }) => useAuthStore.getState().syncStorage());
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
            // Use backend proxy download
            const response = await api.get(`/library/download/${file.id}`, {
                responseType: 'blob',
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = file.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            notify.customSuccess('Download Started', `Downloading ${file.fileName}...`);
        } catch (error: any) {
            console.error('Download error:', error);
            notify.error(error.response?.data?.error?.message || 'Failed to download file');
        }
    };

    const handleDelete = async (fileId: string) => {
        try {
            await api.delete(`/library/${fileId}`);
            notify.customSuccess('File Deleted', 'File has been permanently deleted.');
            setFiles(prev => prev.filter(f => f.id !== fileId));
            setDeleteConfirm(null);
            // Sync storage after delete
            import('@/lib/store').then(({ useAuthStore }) => useAuthStore.getState().syncStorage());
        } catch (error) {
            notify.error('Failed to delete file');
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
        });
    };

    const toggleSort = (field: SortField) => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    if (authLoading && !hasFetched) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Library className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Library</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{files.length} PDFs</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Upload PDF
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4 flex-wrap">
                {/* Search */}
                <div className="relative flex-1 min-w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-field pl-10 w-full"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    )}
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
                    <button
                        onClick={() => toggleSort('createdAt')}
                        className={`p-2 rounded-lg transition-colors ${sortBy === 'createdAt' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}
                        title="Sort by date"
                    >
                        <Calendar className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => toggleSort('name')}
                        className={`p-2 rounded-lg transition-colors ${sortBy === 'name' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}
                        title="Sort by name"
                    >
                        <SortAsc className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => toggleSort('size')}
                        className={`p-2 rounded-lg transition-colors ${sortBy === 'size' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}
                        title="Sort by size"
                    >
                        <HardDrive className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => toggleSort('pages')}
                        className={`p-2 rounded-lg transition-colors ${sortBy === 'pages' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}
                        title="Sort by pages"
                    >
                        <Hash className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-300 dark:bg-slate-600" />
                    <button
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="p-2 rounded-lg"
                        title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    >
                        {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                    </button>
                </div>

                {/* View Mode */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}
                    >
                        <Grid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            {error ? (
                <div className="card p-12 text-center">
                    <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                        <X className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Failed to load library</h3>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={() => fetchLibrary()}
                        className="btn-primary"
                    >
                        Try Again
                    </button>
                </div>
            ) : isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : files.length === 0 ? (
                <div className="card p-12 text-center">
                    <Library className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Your library is empty</h3>
                    <p className="text-gray-500 mb-6">Upload PDFs to store them in your personal library</p>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <Upload className="w-5 h-5" />
                        Upload your first PDF
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    <AnimatePresence>
                        {files.map((file) => (
                            <motion.div
                                key={file.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="card p-4 hover:shadow-lg transition-shadow group"
                            >
                                <div className="aspect-[3/4] bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg mb-3 flex items-center justify-center relative">
                                    <FileText className="w-12 h-12 text-red-400" />
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                                        <button
                                            onClick={() => handleDownload(file)}
                                            className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow hover:bg-gray-50"
                                            title="Download"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (userFromStore?.plan === 'pro' || userFromStore?.plan === 'enterprise') {
                                                    setShareFile(file);
                                                } else {
                                                    toast.error('Public sharing is a Pro feature 🚀', {
                                                        description: 'Upgrade your plan to share PDFs with anyone!',
                                                        duration: 4000,
                                                    } as any);
                                                    router.push('/pricing');
                                                }
                                            }}
                                            className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow hover:bg-blue-50 text-blue-500"
                                            title="Share"
                                        >
                                            <Share2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handlePreview(file)}
                                            className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow hover:bg-purple-50 text-purple-500"
                                            title="Preview"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(file.id)}
                                            className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow hover:bg-red-50 text-red-500"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="font-medium text-sm truncate" title={file.fileName} onClick={() => handlePreview(file)}>
                                    {file.fileName}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                    <span>{file.pageCount} pg</span>
                                    <span>•</span>
                                    <span>{formatBytes(file.size)}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{formatDate(file.createdAt)}</p>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="card divide-y dark:divide-slate-700">
                    <AnimatePresence>
                        {files.map((file) => (
                            <motion.div
                                key={file.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-red-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium truncate">{file.fileName}</h3>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span>{file.pageCount} pages</span>
                                        <span>{formatBytes(file.size)}</span>
                                        <span>{formatDate(file.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleDownload(file)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
                                        title="Download"
                                    >
                                        <Download className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(file.id)}
                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )
            }

            {/* Share Modal */}
            <ShareModal
                isOpen={!!shareFile}
                onClose={() => setShareFile(null)}
                fileId={shareFile?.id || ''}
                fileType="library"
            />

            {/* Preview Modal */}
            <AnimatePresence>
                {previewUrl && previewFile && (
                    <PDFPreview
                        fileUrl={previewUrl}
                        onClose={closePreview}
                        title={previewFile.fileName}
                    />
                )}
            </AnimatePresence>

            {/* Upload Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => !isUploading && setShowUploadModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold">Upload PDFs</h2>
                                <button
                                    onClick={() => !isUploading && setShowUploadModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-gray-300 dark:border-slate-600 hover:border-primary-400'
                                    } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                <input {...getInputProps()} disabled={isUploading} />
                                {isUploading ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
                                        <p>Uploading...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        <Upload className="w-12 h-12 text-gray-400" />
                                        <p className="font-medium">Drop PDFs here or click to browse</p>
                                        <p className="text-sm text-gray-500">Up to 50MB per file</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setDeleteConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-bold mb-2">Delete File?</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                This action cannot be undone. The file will be permanently deleted.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    className="btn-primary flex-1 bg-red-500 hover:bg-red-600"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Share Modal */}
            <ShareModal
                isOpen={shareFile !== null}
                fileId={shareFile?.id || ''}
                fileType="library"
                onClose={() => setShareFile(null)}
            />
        </div >
    );
}
