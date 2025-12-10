'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Loader2, Copy, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import PDFDropzone from '@/components/pdf/PDFDropzone';
import { aiApi } from '@/lib/api';

export default function SummarizePage() {
    const [files, setFiles] = useState<File[]>([]);
    const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    const lengthOptions = [
        { value: 'short', label: 'Short', description: '~100 words' },
        { value: 'medium', label: 'Medium', description: '~300 words' },
        { value: 'long', label: 'Detailed', description: '~500 words' },
    ];

    const handleSummarize = async () => {
        if (files.length === 0) {
            toast.error('Please upload a PDF file');
            return;
        }

        // Validate file size (max 10MB)
        if (files[0].size > 10 * 1024 * 1024) {
            toast.error('File too large. Maximum size is 10MB.');
            return;
        }

        setIsProcessing(true);
        setResult(null);

        try {
            const response = await aiApi.summarize(files[0], length);
            setResult(response.data.data);
            toast.success('PDF summarized successfully!');
        } catch (error: any) {
            // Handle specific error types
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                toast.error('Request timed out. Please try with a smaller document.');
            } else if (error.response?.status === 503) {
                toast.error('AI service is not available. Please check your API key configuration.');
            } else if (error.response?.status === 429) {
                toast.error('Too many requests. Please wait a moment and try again.');
            } else if (error.response?.status === 504) {
                toast.error('AI processing timed out. Please try with a smaller document.');
            } else {
                toast.error(error.response?.data?.error?.message || 'Failed to summarize PDF. Please try again.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCopy = () => {
        if (result) {
            const text = `${result.summary}\n\nKey Points:\n${result.keyPoints?.map((p: string) => `• ${p}`).join('\n')}`;
            navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success('Copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 mb-4">
                    <Brain className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    AI PDF Summarizer
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Get AI-powered summaries and key points from your documents
                </p>
            </div>

            {/* Main Content */}
            {!result ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-6 space-y-6"
                >
                    <PDFDropzone
                        files={files}
                        onFilesChange={setFiles}
                        multiple={false}
                        maxFiles={1}
                        disabled={isProcessing}
                    />

                    {files.length > 0 && (
                        <>
                            {/* Length Selection */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Summary Length
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {lengthOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => setLength(option.value as any)}
                                            className={`p-4 rounded-xl border-2 transition-all text-center ${length === option.value
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                                                }`}
                                        >
                                            <p className="font-medium">{option.label}</p>
                                            <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={handleSummarize}
                                    disabled={isProcessing}
                                    className="btn-primary flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Analyzing<span className="loading-dots"></span>
                                        </>
                                    ) : (
                                        <>
                                            <Brain className="w-5 h-5" />
                                            Summarize with AI
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleReset}
                                    disabled={isProcessing}
                                    className="btn-secondary"
                                >
                                    Clear
                                </button>
                            </div>
                        </>
                    )}
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Summary Card */}
                    <div className="card p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Summary</h2>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                {copied ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {result.summary}
                        </p>
                    </div>

                    {/* Key Points */}
                    {result.keyPoints?.length > 0 && (
                        <div className="card p-6 space-y-4">
                            <h2 className="text-xl font-semibold">Key Points</h2>
                            <ul className="space-y-3">
                                {result.keyPoints.map((point: string, index: number) => (
                                    <motion.li
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex gap-3 text-gray-700 dark:text-gray-300"
                                    >
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center text-sm font-medium">
                                            {index + 1}
                                        </span>
                                        {point}
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Topics */}
                    {result.topics?.length > 0 && (
                        <div className="card p-6 space-y-4">
                            <h2 className="text-xl font-semibold">Topics Covered</h2>
                            <div className="flex flex-wrap gap-2">
                                {result.topics.map((topic: string, index: number) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium"
                                    >
                                        {topic}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Document Stats */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>Original document: ~{result.wordCount?.toLocaleString() || 'N/A'} words</span>
                            <button
                                onClick={handleReset}
                                className="text-primary-600 hover:text-primary-700 font-medium"
                            >
                                Summarize Another PDF
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
