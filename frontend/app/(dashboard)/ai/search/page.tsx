'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, FileText, ArrowRight, Sparkles, X, Filter, Zap, ShieldCheck, Database, Layout, SearchCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { aiApi } from '@/lib/api';
import clsx from 'clsx';

interface SearchResult {
    documentIndex?: number;
    page?: number;
    snippet: string;
    match?: string;
    relevance?: number;
}

export default function SmartSearchPage() {
    const [file, setFile] = useState<File | null>(null);
    const [query, setQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setResults([]);
            setHasSearched(false);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false,
    });

    const handleSearch = async () => {
        if (!file) {
            toast.error('Please upload a PDF file');
            return;
        }

        if (!query.trim()) {
            toast.error('Please enter a search query');
            return;
        }

        setIsProcessing(true);
        setResults([]);
        setHasSearched(false);

        try {
            const ocrResponse = await aiApi.ocr(file);
            const pdfText = ocrResponse.data.data?.text || '';

            if (!pdfText || pdfText.length < 50) {
                toast.error('Document extraction yielded insufficient data');
                setIsProcessing(false);
                return;
            }

            const searchResponse = await aiApi.search(query, [pdfText]);

            if (searchResponse.data.data?.results) {
                setResults(searchResponse.data.data.results);
            } else {
                setResults([]);
            }
            setHasSearched(true);

            const count = searchResponse.data.data?.results?.length || 0;
            if (count > 0) {
                toast.success(`Found ${count} semantic match(es)`);
            } else {
                toast.success('Zero matches in semantic buffer');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Neural search failed.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setQuery('');
        setResults([]);
        setHasSearched(false);
    };

    const exampleQueries = [
        'refund policy',
        'payment terms',
        'warranty details',
        'compliance info',
    ];

    return (
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-10 overflow-hidden bg-slate-50 font-sans pb-20">
            {/* Ambient Background Light */}
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[140px] -z-10 animate-pulse-slow"></div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-12">
                {/* Tactical Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-8"
                    >
                        <div className="w-20 h-20 rounded-[2.5rem] bg-blue-600 shadow-xl shadow-blue-500/20 flex items-center justify-center border border-white/20">
                            <SearchCode className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 mb-2">
                                <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest">Neural Document Discovery</span>
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                    <Zap className="w-3.5 h-3.5" />
                                    Deep AI
                                </div>
                            </div>
                            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Smart <span className="text-blue-600">Search</span></h1>
                            <p className="text-slate-500 font-bold mt-2 text-lg">Semantic AI discovery across document contents</p>
                        </div>
                    </motion.div>

                    {hasSearched && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleReset}
                            className="px-8 py-4 bg-white border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                        >
                            Reset Interface
                        </motion.button>
                    )}
                </div>

                {!hasSearched && !isProcessing ? (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm p-10 space-y-12">
                            <div className="grid md:grid-cols-2 gap-10">
                                {/* Upload Zone */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Asset</h3>
                                    </div>
                                    <div
                                        {...getRootProps()}
                                        className={clsx(
                                            "border-4 border-dashed rounded-[2.5rem] transition-all cursor-pointer h-[350px] flex items-center justify-center relative group/drop",
                                            file ? "bg-slate-50 border-slate-200 shadow-inner" : "bg-slate-50/50 border-slate-100 hover:border-blue-600 hover:bg-blue-50/50"
                                        )}
                                    >
                                        <input {...getInputProps()} />
                                        <div className="flex flex-col items-center gap-6 text-center px-10">
                                            {file ? (
                                                <>
                                                    <div className="w-20 h-20 rounded-[1.75rem] bg-white border border-slate-100 shadow-xl flex items-center justify-center group-hover/drop:scale-105 transition-transform duration-500">
                                                        <FileText className="w-9 h-9 text-blue-600" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="text-xl font-black text-slate-900 tracking-tight truncate max-w-[200px]">{file.name}</h3>
                                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">{(file.size / (1024 * 1024)).toFixed(2)} MB Asset</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center shadow-inner group-hover/drop:scale-110 transition-transform duration-700">
                                                        <Database className="w-9 h-9 text-blue-600" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Inject Data</h3>
                                                        <p className="text-slate-400 font-bold text-[10px] uppercase leading-relaxed tracking-tighter">Drop PDF for neural scanning</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Query Zone */}
                                <div className="space-y-8 flex flex-col justify-center">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 px-1">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                                <Sparkles className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Query Matrix</h3>
                                        </div>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                value={query}
                                                onChange={(e) => setQuery(e.target.value)}
                                                placeholder="Ask your document anything..."
                                                className="w-full bg-slate-50 border border-slate-200 rounded-[1.75rem] py-6 px-8 text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-600 transition-all font-black text-base pr-20 shadow-sm"
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            />
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                                <Search className="w-6 h-6" />
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2.5 px-1 py-1">
                                            {exampleQueries.map((example) => (
                                                <button
                                                    key={example}
                                                    onClick={() => setQuery(example)}
                                                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-[9px] font-black text-slate-400 uppercase hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all tracking-widest shadow-sm"
                                                >
                                                    {example}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            onClick={handleSearch}
                                            disabled={isProcessing || !file || !query.trim()}
                                            className={clsx(
                                                "w-full py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all group shadow-xl",
                                                (isProcessing || !file || !query.trim())
                                                    ? "bg-slate-100 text-slate-300 border border-slate-100 cursor-not-allowed"
                                                    : "bg-blue-600 text-white shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-1 hover:shadow-blue-500/40"
                                            )}
                                        >
                                            <Search className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                            <span>Execute AI Discovery</span>
                                            <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-3 transition-all" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="space-y-10">
                        {isProcessing ? (
                            <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-[4rem] p-16 flex flex-col items-center justify-center text-center space-y-12 shadow-xl">
                                <div className="relative">
                                    <div className="w-32 h-32 rounded-full border-[6px] border-slate-50 border-t-blue-600 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="w-10 h-10 text-blue-600 animate-pulse" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Scanning Document Entropy</h3>
                                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest max-w-sm mx-auto leading-relaxed">Reading deep semantics and mapping relationships for high-precision matching.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                <div className="lg:col-span-4 space-y-8">
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm space-y-8"
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                                    <Search className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Discovery Matrix</p>
                                            </div>
                                            <p className="text-2xl font-black text-slate-900 tracking-tight bg-slate-50 p-6 rounded-2xl border border-slate-100">&quot;{query}&quot;</p>
                                        </div>

                                        <button
                                            onClick={() => { setHasSearched(false); }}
                                            className="w-full py-5 rounded-2xl border border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-3"
                                        >
                                            <Layout className="w-4 h-4" />
                                            Redefine Matrix
                                        </button>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="bg-slate-900 rounded-[3rem] border border-slate-800 p-10 text-white shadow-2xl relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/20 rounded-full blur-[70px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                                    <Filter className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">Confidence Index</p>
                                            </div>
                                            <div className="space-y-3 px-1">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-6xl font-black tracking-tighter">85%</span>
                                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Semantics Match</span>
                                                </div>
                                                <div className="h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                                                    <div className="h-full bg-blue-500 rounded-full w-[85%] shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
                                                </div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] text-right">Precision Verified</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>

                                <div className="lg:col-span-8 space-y-6 max-h-[1000px] overflow-y-auto pr-4 custom-scrollbar">
                                    <AnimatePresence mode="popLayout">
                                        {results.length > 0 ? (
                                            results.map((res, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className="bg-white border border-slate-200 rounded-[3.5rem] p-10 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-500/5 transition-all group"
                                                >
                                                    <div className="flex items-start gap-10">
                                                        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                                            <Search className="w-8 h-8 text-white transition-colors" />
                                                        </div>
                                                        <div className="flex-1 space-y-6">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="px-5 py-2 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl">
                                                                        SEQUENCE {i + 1}
                                                                    </div>
                                                                    {res.page && (
                                                                        <div className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest shadow-sm">
                                                                            LAYER {res.page}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {res.relevance && (
                                                                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                                                        <ShieldCheck className="w-4 h-4" />
                                                                        {(res.relevance * 100).toFixed(0)}% MATCH
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="relative">
                                                                <p className="text-slate-900 leading-relaxed text-xl font-bold tracking-tight">
                                                                    {res.snippet || res.match || 'No data stream available in current window.'}
                                                                </p>
                                                                <div className="absolute -left-10 top-0 w-1 h-full bg-blue-600/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                            </div>
                                                            <button className="flex items-center gap-3 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] group-hover:gap-5 transition-all bg-blue-50/50 px-6 py-3 rounded-2xl self-start border border-transparent group-hover:border-blue-100">
                                                                Launch Context View
                                                                <ArrowRight className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="bg-white border border-slate-200 rounded-[4rem] p-24 text-center shadow-sm"
                                            >
                                                <div className="w-28 h-28 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-10 border border-slate-100 shadow-inner">
                                                    <X className="w-12 h-12 text-slate-300" />
                                                </div>
                                                <h3 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-4 uppercase">Identity mismatch</h3>
                                                <p className="text-slate-400 font-bold text-lg max-w-sm mx-auto leading-relaxed">Our neural index returned zero matches for this query. Try lowering sensitivity or broadening the query matrix.</p>
                                                <button
                                                    onClick={() => setHasSearched(false)}
                                                    className="mt-12 px-10 py-5 rounded-2xl bg-blue-600 text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all hover:-translate-y-1 overflow-hidden group"
                                                >
                                                    <span className="relative z-10">Adjust Discovery Parameters</span>
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
