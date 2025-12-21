'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import {
    FileText,
    Search,
    Filter,
    Download,
    Trash2,
    Eye,
    User,
    Calendar,
    Database
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function DocumentExplorer() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const response = await adminApi.listDocuments();
            setDocuments(response.data.data || []);
        } catch (error) {
            toast.error('Failed to load documents');
        } finally {
            setIsLoading(false);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const filteredDocs = documents.filter(doc =>
        doc.originalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.filename?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Document Explorer</h1>
                    <p className="text-slate-400">Monitoring {documents.length} files across the platform.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search by filename..."
                            className="bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm w-64 focus:border-blue-500 outline-none transition-all text-slate-100"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="h-48 bg-slate-900 rounded-2xl border border-slate-800 animate-pulse"></div>
                    ))
                ) : filteredDocs.map((doc) => (
                    <div key={doc.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-blue-500/50 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button className="p-2 bg-slate-800 hover:bg-blue-600 rounded-lg text-white transition-colors">
                                <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 bg-slate-800 hover:bg-red-600 rounded-lg text-white transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center shrink-0">
                                <FileText className="w-6 h-6 text-blue-500" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-semibold text-slate-100 truncate pr-16" title={doc.originalName}>
                                    {doc.originalName || doc.filename}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">
                                    {doc.mimeType?.split('/')[1] || 'PDF'} • {formatBytes(doc.size)}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-800">
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <User className="w-4 h-4 text-slate-500" />
                                <span className="truncate">User ID: {doc.userId}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Calendar className="w-4 h-4 text-slate-500" />
                                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                </div>
                                {doc.isTemporary && (
                                    <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
                                        Temporary
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 text-slate-500">
                                <Database className="w-3 h-3" />
                                <span>MinIO Path: {doc.minioPath.split('/').pop()?.substring(0, 15)}...</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {!isLoading && filteredDocs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-900 rounded-3xl border border-slate-800 border-dashed">
                    <FileText className="w-12 h-12 text-slate-700 mb-4" />
                    <p className="text-slate-500">No documents found matching your search.</p>
                </div>
            )}
        </div>
    );
}
