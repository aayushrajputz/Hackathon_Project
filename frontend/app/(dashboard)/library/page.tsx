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
    Filter,
    Clock,
    Shield
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
            const toastId = toast.loading('Synchronizing preview buffer...');
            const response = await api.get(`/library/download/${file.id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            setPreviewUrl(url);
            setPreviewFile(file);
            toast.dismiss(toastId);
        } catch (e) {
            toast.error('Failed to load asset preview');
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
            if (localStorage.getItem('authToken') === 'mock-token-123') {
                setFiles([]);
                setHasFetched(true);
                setIsLoading(false);
                return;
            }

            if (err.response?.status === 401) {
                if (!user && !authLoading) router.push('/login');
                else setError('Vault access expired. Please re-authenticate.');
            } else {
                setError(err.response?.data?.error?.message || 'Failed to synchronize vault');
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
                toast.error(`${file.name} exceeds quota logic.`, { icon: '⚠️' });
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
            toast.success(`${successCount} Asset(s) secured in Vault`);
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
            toast.success('Asset transmission started');
        } catch (error: any) {
            toast.error('Download failed');
        }
    };

    const handleDelete = async (fileId: string) => {
        try {
            await api.delete(`/library/${fileId}`);
            toast.success('Asset purged from Cloud Vault');
            setFiles(prev => prev.filter(f => f.id !== fileId));
            setDeleteConfirm(null);
            useAuthStore.getState().syncStorage();
        } catch (error) {
            toast.error('Purge failed');
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

    return (
        <div className="relative min-h-[calc(100vh-4rem)] pb-20 overflow-hidden bg-slate-50 font-sans">
            {/* Ambient Background Lights */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[140px] -z-10 animate-pulse-slow"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-100 rounded-full blur-[120px] -z-10"></div>

            <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-10 py-10 space-y-12">
                {/* Master Header */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
                    <div className="flex items-center gap-8">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-blue-600 shadow-xl shadow-blue-500/20 flex items-center justify-center border border-white/20">
                            <LibraryIcon className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest">Global Asset Manager</span>
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                    <Shield className="w-3 h-3" />
                                    Encrypted
                                </div>
                            </div>
                            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Document <span className="text-blue-600">Vault</span></h1>
                            <p className="text-slate-500 font-bold mt-3 text-lg">Synchronized interface for high-fidelity document assets</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="flex items-center justify-center gap-3 px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-500/30 transition-all font-black uppercase tracking-widest text-sm group"
                        >
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                            Secure Upload
                        </button>
                    </div>
                </div>

                {/* Tactical Toolbar */}
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="relative flex-1 group shadow-2xl shadow-slate-200/50 rounded-2xl">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                            <Search className="w-full h-full" />
                        </div>
                        <input
                            type="text"
                            placeholder="Filter vault contents by metadata..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-blue-600/50 focus:ring-8 focus:ring-blue-500/5 rounded-2xl py-5 pl-14 pr-6 text-slate-900 placeholder-slate-400 outline-none transition-all font-bold text-sm"
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <kbd className="hidden md:block text-[10px] font-black tracking-widest bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-slate-400">ESC TO CLEAR</kbd>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-2 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm">
                        <div className="px-4 border-r border-slate-100 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <Filter className="w-3.5 h-3.5" />
                            Sort
                        </div>
                        {[
                            { id: 'createdAt', icon: Clock, label: 'Timeline' },
                            { id: 'name', icon: SortAsc, label: 'Identity' },
                            { id: 'size', icon: HardDrive, label: 'Weight' },
                            { id: 'pages', icon: Hash, label: 'Count' },
                        ].map((s) => (
                            <button
                                key={s.id}
                                onClick={() => {
                                    if (sortBy === s.id) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                                    else { setSortBy(s.id as SortField); setSortOrder('desc'); }
                                }}
                                className={clsx(
                                    "px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                                    sortBy === s.id
                                        ? "bg-blue-600 text-white shadow-xl shadow-blue-500/30"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                )}
                            >
                                <s.icon className="w-4 h-4" />
                                <span className="hidden xl:inline">{s.label}</span>
                                {sortBy === s.id && (
                                    sortOrder === 'asc' ? <SortAsc className="w-3 h-3 text-white/70" /> : <SortDesc className="w-3 h-3 text-white/70" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={clsx(
                                "p-3 rounded-xl transition-all",
                                viewMode === 'grid' ? "bg-slate-100 text-blue-600 shadow-inner" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                            )}
                        >
                            <Grid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={clsx(
                                "p-3 rounded-xl transition-all",
                                viewMode === 'list' ? "bg-slate-100 text-blue-600 shadow-inner" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                            )}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content Matrix */}
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="py-48 flex flex-col items-center justify-center gap-10"
                        >
                            <div className="relative">
                                <Loader2 className="w-20 h-20 animate-spin text-blue-600" />
                                <div className="absolute inset-0 blur-3xl bg-blue-400/20" />
                            </div>
                            <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-xs animate-pulse">Syncing Cloud Matrix...</p>
                        </motion.div>
                    ) : files.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[4rem] border border-slate-200 shadow-sm py-40 text-center space-y-8 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-50/50 rounded-full blur-[100px] -z-10"></div>
                            <div className="w-32 h-32 mx-auto rounded-[2.5rem] bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
                                <FileText className="w-14 h-14 text-slate-300" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Vault Matrix Empty</h3>
                                <p className="text-slate-500 font-bold max-w-sm mx-auto text-lg leading-relaxed">Your secure document repository is offline. Deploy assets to activate workspace.</p>
                            </div>
                            <button onClick={() => setShowUploadModal(true)} className="px-10 py-4 font-black uppercase tracking-widest text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-2xl transition-all border border-blue-100 shadow-sm">
                                Deploy First Asset
                            </button>
                        </motion.div>
                    ) : viewMode === 'grid' ? (
                        <motion.div
                            layout
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8"
                        >
                            {files.map((file) => (
                                <motion.div
                                    key={file.id}
                                    layout
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="group bg-white rounded-[2.5rem] p-5 border border-slate-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2"
                                >
                                    <div className="relative aspect-[3/4] bg-slate-50 rounded-[2rem] mb-6 overflow-hidden border border-slate-100 flex items-center justify-center group-hover:bg-blue-600 transition-all duration-700">
                                        <FileText className="w-20 h-20 text-slate-200 group-hover:text-white/20 transition-all duration-700 group-hover:scale-125 group-hover:-rotate-6" />

                                        {/* Precision Actions Overlay */}
                                        <div className="absolute inset-0 bg-blue-600/95 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center gap-6 p-6">
                                            <div className="flex gap-4">
                                                <button onClick={() => handlePreview(file)} className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white text-white hover:text-blue-600 transition-all shadow-xl backdrop-blur-md flex items-center justify-center group/btn">
                                                    <Eye className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
                                                </button>
                                                <button onClick={() => handleDownload(file)} className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white text-white hover:text-blue-600 transition-all shadow-xl backdrop-blur-md flex items-center justify-center group/btn">
                                                    <Download className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
                                                </button>
                                            </div>
                                            <div className="flex gap-4">
                                                <button onClick={() => setShareFile(file)} className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white text-white hover:text-blue-600 transition-all shadow-xl backdrop-blur-md flex items-center justify-center group/btn">
                                                    <Share2 className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
                                                </button>
                                                <button onClick={() => setDeleteConfirm(file.id)} className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-rose-500 text-white transition-all shadow-xl backdrop-blur-md flex items-center justify-center group/btn border border-white/10 hover:border-transparent">
                                                    <Trash2 className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 px-2">
                                        <h3 className="font-black text-slate-900 truncate text-base tracking-tight" title={file.fileName}>{file.fileName}</h3>
                                        <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <div className="flex items-center gap-1.5">
                                                <Hash className="w-3 h-3" />
                                                <span>{file.pageCount} PAGES</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <HardDrive className="w-3 h-3" />
                                                <span>{formatBytes(file.size)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div layout className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
                            {files.map((file) => (
                                <motion.div
                                    key={file.id}
                                    layout
                                    className="flex items-center justify-between gap-6 p-6 hover:bg-slate-50 transition-all group"
                                >
                                    <div className="flex items-center gap-6 flex-1 min-w-0">
                                        <div className="w-16 h-16 rounded-[1.25rem] bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:border-blue-700 transition-all duration-500">
                                            <FileText className="w-8 h-8 text-blue-600 group-hover:text-white transition-all duration-500" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-slate-900 font-black text-lg truncate tracking-tight mb-1">{file.fileName}</h3>
                                            <div className="flex items-center gap-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {formatDate(file.createdAt)}</span>
                                                <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                                                <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> {file.pageCount} PAGES</span>
                                                <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                                                <span className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5" /> {formatBytes(file.size)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-4 group-hover:translate-x-0">
                                        <button onClick={() => handlePreview(file)} className="p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-600 hover:text-blue-600 text-slate-500 transition-all shadow-sm">
                                            <Eye className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDownload(file)} className="p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-600 hover:text-emerald-600 text-slate-500 transition-all shadow-sm">
                                            <Download className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => setShareFile(file)} className="p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-600 hover:text-blue-600 text-slate-500 transition-all shadow-sm">
                                            <Share2 className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => setDeleteConfirm(file.id)} className="p-3 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-500 hover:text-rose-600 text-slate-500 transition-all shadow-sm">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Tactical Upload Overlay */}
            <AnimatePresence>
                {showUploadModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[60] flex items-center justify-center p-6"
                        onClick={() => !isUploading && setShowUploadModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 30 }}
                            className="bg-white p-10 rounded-[3rem] max-w-2xl w-full border border-slate-200 shadow-2xl relative overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-[80px] -z-10 translate-x-1/2 -translate-y-1/2"></div>

                            <div className="flex items-center justify-between mb-10">
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Vault Injection</h2>
                                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest opacity-70">Secure Document Provisioning</p>
                                </div>
                                <button onClick={() => !isUploading && setShowUploadModal(false)} className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div
                                {...getRootProps()}
                                className={clsx(
                                    "border-4 border-dashed rounded-[2.5rem] transition-all cursor-pointer h-[400px] flex items-center justify-center relative group/drop",
                                    isUploading
                                        ? "bg-slate-50/50 border-slate-200 opacity-50 pointer-events-none"
                                        : "bg-slate-50/50 border-slate-200 hover:border-blue-600 hover:bg-blue-50/50"
                                )}
                            >
                                <input {...getInputProps()} disabled={isUploading} />
                                <div className="flex flex-col items-center gap-8 text-center px-10">
                                    {isUploading ? (
                                        <>
                                            <div className="relative">
                                                <Loader2 className="w-24 h-24 animate-spin text-blue-600" />
                                                <div className="absolute inset-0 blur-3xl bg-blue-400/30" />
                                            </div>
                                            <p className="text-blue-600 text-xl font-black uppercase tracking-[0.2em] animate-pulse">Encrypting & Storing Assets...</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-28 h-28 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl flex items-center justify-center group-hover/drop:scale-110 group-hover/drop:rotate-6 transition-all duration-700">
                                                <Upload className="w-12 h-12 text-blue-600" />
                                            </div>
                                            <div className="space-y-3">
                                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Source Selection</h3>
                                                <p className="text-slate-500 font-bold text-base leading-relaxed">Drag documents to the encrypted dropzone or browse local storage.</p>
                                                <div className="pt-4 flex items-center justify-center gap-6">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        <Shield className="w-4 h-4 text-blue-500" />
                                                        End-to-End Secure
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        <Plus className="w-4 h-4 text-blue-500" />
                                                        Bulk Capacity
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Security Purge Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl z-[70] flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="bg-white p-10 rounded-[3rem] max-w-sm w-full border border-slate-200 shadow-2xl text-center"
                        >
                            <div className="w-20 h-20 rounded-[1.5rem] bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-8 shadow-inner animate-bounce">
                                <Trash2 className="w-10 h-10 text-rose-500" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Confirm Purge</h2>
                            <p className="text-slate-500 text-lg font-bold mb-10 leading-relaxed px-2">This asset will be permanently erased from Cloud Vault infrastructure.</p>
                            <div className="flex flex-col gap-3">
                                <button onClick={() => handleDelete(deleteConfirm)} className="w-full py-5 rounded-2xl bg-rose-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-rose-500/30 hover:bg-rose-700 transition-all">Execute Purge</button>
                                <button onClick={() => setDeleteConfirm(null)} className="w-full py-5 rounded-2xl bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">Abort Task</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
