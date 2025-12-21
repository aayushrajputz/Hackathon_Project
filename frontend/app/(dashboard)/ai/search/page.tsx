'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, FileText, ArrowRight, Sparkles, X, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import PDFDropzone from '@/components/pdf/PDFDropzone';
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
    const [files, setFiles] = useState<File[]>([]);
    const [query, setQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async () => {
        if (files.length === 0) {
            toast.error('Please upload a PDF file');
            return;
        }

        if (!query.trim()) {
            toast.error('Please enter a search query');
            return;
        }

        if (files[0].size > 10 * 1024 * 1024) {
            toast.error('File too large. Maximum size is 10MB.');
            return;
        }

        setIsProcessing(true);
        setResults([]);
        setHasSearched(false);

        try {
            const ocrResponse = await aiApi.ocr(files[0]);
            const pdfText = ocrResponse.data.data?.text || '';

            if (!pdfText || pdfText.length < 50) {
                toast.error('Could not extract enough text from the PDF');
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
                toast.success(`Found ${count} relevant result(s)`);
            } else {
                toast.success('No matches found');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Search failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setQuery('');
        setResults([]);
        setHasSearched(false);
    };

    const exampleQueries = [
        'refund policy',
        'payment terms',
        'warranty details',
        'contact info',
    ];

    return (
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 overflow-hidden">
            <div className="absolute inset-0 bg-mesh pointer-events-none opacity-40"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>

            <div className="relative z-10 max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-6"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-400 via-indigo-500 to-blue-500 p-[1px] shadow-2xl shadow-purple-500/20">
                            <div className="w-full h-full rounded-[23px] bg-slate-950 flex items-center justify-center">
                                <Search className="w-10 h-10 text-purple-400" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight">Smart <span className="text-gradient-premium">Search</span></h1>
                            <p className="text-slate-400 font-medium mt-1">Semantic AI discovery across document contents</p>
                        </div>
                    </motion.div>

                    {hasSearched && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleReset}
                            className="btn-glass text-white"
                        >
                            Reset Search
                        </motion.button>
                    )}
                </div>

                {!hasSearched && !isProcessing ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <div className="glass-card-premium p-8">
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-4 h-4 text-purple-400" />
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target Document</p>
                                    </div>
                                    <PDFDropzone
                                        files={files}
                                        onFilesChange={setFiles}
                                        multiple={false}
                                        maxFiles={1}
                                        disabled={isProcessing}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="w-4 h-4 text-purple-400" />
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">AI Query</p>
                                    </div>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder="What are you looking for?"
                                            className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 px-6 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium text-lg pr-16"
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-purple-500/20 text-purple-400">
                                            <Search className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {exampleQueries.map((example) => (
                                            <button
                                                key={example}
                                                onClick={() => setQuery(example)}
                                                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400 uppercase hover:bg-purple-500/10 hover:text-purple-400 transition-colors"
                                            >
                                                {example}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {files.length > 0 && query.trim() && (
                                    <button
                                        onClick={handleSearch}
                                        disabled={isProcessing}
                                        className={clsx(
                                            "w-full btn-premium shadow-xl py-5",
                                            isProcessing && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Search className="w-6 h-6" />
                                            <span className="text-lg">Search with AI Context</span>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="space-y-8">
                        {isProcessing ? (
                            <div className="glass-card-premium p-12 flex flex-col items-center justify-center text-center space-y-6">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Deep Scanning Document...</h3>
                                    <p className="text-slate-400 max-w-xs mx-auto">Our AI is reading your document and mapping semantic relationships to find the best matches.</p>
                                </div>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="grid grid-cols-1 lg:grid-cols-4 gap-8"
                                >
                                    <div className="lg:col-span-1 space-y-6">
                                        <div className="glass-card p-6 bg-slate-950/40">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Current Query</p>
                                            <p className="text-white font-bold leading-relaxed">&quot;{query}&quot;</p>
                                            <button
                                                onClick={() => { setHasSearched(false); }}
                                                className="w-full mt-6 py-2 rounded-lg border border-white/5 text-[10px] font-bold text-slate-500 uppercase hover:text-white hover:border-white/10 transition-colors"
                                            >
                                                Edit Query
                                            </button>
                                        </div>

                                        <div className="glass-card p-6 border-purple-500/20 bg-purple-500/5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Filter className="w-4 h-4 text-purple-400" />
                                                <p className="text-xs font-bold text-white uppercase tracking-widest">Relevance</p>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden mt-3">
                                                <div className="h-full bg-purple-500 w-[85%]" />
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase text-right">High Precision</p>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-3 space-y-6">
                                        {results.length > 0 ? (
                                            results.map((res, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className="glass-card-premium p-8 hover:border-purple-500/30 transition-all group"
                                                >
                                                    <div className="flex items-start gap-6">
                                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/10 transition-colors">
                                                            <FileText className="w-6 h-6 text-slate-400 group-hover:text-purple-400 transition-colors" />
                                                        </div>
                                                        <div className="flex-1 space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <div className="px-3 py-1 rounded-lg bg-slate-800 text-[10px] font-black text-slate-400 uppercase">
                                                                    MATCH {i + 1} {res.page && `• PAGE ${res.page}`}
                                                                </div>
                                                                {res.relevance && (
                                                                    <div className="text-[10px] font-bold text-purple-400 uppercase">
                                                                        {Math.round(res.relevance * 100)}% RELEVANCE
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <p className="text-slate-300 leading-relaxed text-lg">
                                                                {res.snippet || res.match || 'No direct snippet available'}
                                                            </p>
                                                            <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-purple-400 font-bold text-xs cursor-pointer hover:translate-x-1 transition-transform">
                                                                <span>Go to full document section</span>
                                                                <ArrowRight className="w-4 h-4" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="glass-card-premium p-12 text-center">
                                                <X className="w-12 h-12 text-red-500/20 mx-auto mb-6" />
                                                <h3 className="text-xl font-bold text-white mb-2">No Matches Found</h3>
                                                <p className="text-slate-400 max-w-xs mx-auto">Try broadening your search terms or using simpler keywords.</p>
                                                <button
                                                    onClick={() => setHasSearched(false)}
                                                    className="mt-8 btn-glass text-white px-8"
                                                >
                                                    Modify Search
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
