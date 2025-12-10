'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, FileText, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import PDFDropzone from '@/components/pdf/PDFDropzone';
import { aiApi, pdfApi } from '@/lib/api';

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
            // First, extract text from PDF
            const ocrResponse = await aiApi.ocr(files[0]);
            const pdfText = ocrResponse.data.data?.text || '';

            if (!pdfText || pdfText.length < 50) {
                toast.error('Could not extract enough text from the PDF');
                return;
            }

            // Then perform smart search with the extracted text
            const searchResponse = await aiApi.search(query, [pdfText]);

            if (searchResponse.data.data?.results) {
                setResults(searchResponse.data.data.results);
            } else {
                setResults([]);
            }
            setHasSearched(true);

            const count = searchResponse.data.data?.results?.length || 0;
            if (count > 0) {
                toast.success(`Found ${count} relevant section(s)`);
            } else {
                toast.success('No matches found for your query');
            }
        } catch (error: any) {
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                toast.error('Request timed out. Please try with a smaller document.');
            } else if (error.response?.status === 503) {
                toast.error('Search service is not available.');
            } else {
                toast.error(error.response?.data?.error?.message || 'Search failed. Please try again.');
            }
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
        'contact information',
        'payment terms',
        'delivery timeline',
        'warranty details',
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 mb-4">
                    <Search className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Smart Search
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    AI-powered semantic search across your documents
                </p>
            </div>

            {/* Main Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6 space-y-6"
            >
                {/* File Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Upload PDF Document
                    </label>
                    <PDFDropzone
                        files={files}
                        onFilesChange={setFiles}
                        multiple={false}
                        maxFiles={1}
                    />
                </div>

                {/* Search Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Search Query
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="What are you looking for?"
                            className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                </div>

                {/* Example Queries */}
                <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Try:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {exampleQueries.map((example) => (
                            <button
                                key={example}
                                onClick={() => setQuery(example)}
                                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                            >
                                {example}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Button */}
                <button
                    onClick={handleSearch}
                    disabled={files.length === 0 || !query.trim() || isProcessing}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Searching...
                        </>
                    ) : (
                        <>
                            <Search className="w-5 h-5" />
                            Search Document
                        </>
                    )}
                </button>
            </motion.div>

            {/* Results */}
            {hasSearched && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-6 space-y-6"
                >
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            Search Results
                        </h3>
                        <span className="text-sm text-gray-500">
                            {results.length} result(s) found
                        </span>
                    </div>

                    {results.length > 0 ? (
                        <div className="space-y-4">
                            {results.map((result, index) => (
                                <div
                                    key={index}
                                    className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-l-4 border-purple-500"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div className="flex-1">
                                            {result.page && (
                                                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                                    Page {result.page}
                                                </span>
                                            )}
                                            <p className="text-gray-700 dark:text-gray-300 mt-1">
                                                {result.snippet || result.match || 'No preview available'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>No matches found for &quot;{query}&quot;</p>
                            <p className="text-sm mt-1">Try different keywords or phrases</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleReset}
                            className="flex-1 btn-secondary py-3"
                        >
                            New Search
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
