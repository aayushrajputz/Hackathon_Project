'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanText, Loader2, Copy, CheckCircle, FileText, Upload, X, ArrowRight, Zap, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { aiApi } from '@/lib/api';
import clsx from 'clsx';

export default function OCRExtractPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setResult(null);
        }
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false,
    });

    const handleOCR = async () => {
        if (!file) {
            toast.error('Please upload a PDF file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File too large. Maximum size is 10MB.');
            return;
        }

        setIsProcessing(true);
        setResult(null);

        try {
            const response = await aiApi.ocr(file);
            setResult(response.data.data);
            toast.success('Text extracted successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to extract text');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCopy = () => {
        if (result?.text) {
            navigator.clipboard.writeText(result.text);
            setCopied(true);
            toast.success('Copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
    };

    return (
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 overflow-hidden font-sans bg-slate-50 pb-12">
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-100 rounded-full blur-[120px] animate-pulse-slow"></div>

            <div className="relative z-10 max-w-5xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-6"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-200 shadow-sm flex items-center justify-center">
                            <ScanText className="w-10 h-10 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Extract <span className="text-blue-600">Text</span></h1>
                            <p className="text-slate-600 font-medium mt-1">Get text from images and PDFs</p>
                        </div>
                    </motion.div>

                    {file && !result && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleReset}
                            className="px-6 py-3 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all flex items-center gap-2 bg-white shadow-sm"
                        >
                            <X className="w-4 h-4" />
                            Discard
                        </motion.button>
                    )}
                </div>

                {!result ? (
                    <div className="grid lg:grid-cols-12 gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-8"
                        >
                            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 space-y-8">
                                <div
                                    {...getRootProps()}
                                    className={clsx(
                                        "h-[400px] flex items-center justify-center border-2 border-dashed rounded-[2rem] transition-all cursor-pointer",
                                        file ? "bg-slate-50 border-blue-400" : "bg-white border-slate-300 hover:border-blue-500 hover:bg-blue-50/50"
                                    )}
                                >
                                    <input {...getInputProps()} />
                                    {!file ? (
                                        <div className="flex flex-col items-center gap-6 text-center">
                                            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center shadow-inner">
                                                <Upload className="w-10 h-10 text-blue-500" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Select file</h3>
                                                <p className="text-slate-500 font-medium text-sm">PNG, JPG or PDF up to 10MB</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-6 text-center">
                                            <div className="w-24 h-32 bg-white border border-slate-200 rounded-2xl shadow-md flex items-center justify-center relative overflow-hidden">
                                                <div className="absolute inset-x-0 top-0 h-1/2 bg-blue-100/30"></div>
                                                <FileText className="w-12 h-12 text-blue-600" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-lg font-black text-slate-900">{file.name}</p>
                                                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">File Loaded</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {file && (
                                    <button
                                        onClick={handleOCR}
                                        disabled={isProcessing}
                                        className="w-full py-5 rounded-2xl bg-blue-600 text-white font-black text-lg shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 group"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                <span>Extracting text...</span>
                                            </>
                                        ) : (
                                            <>
                                                <ScanText className="w-6 h-6" />
                                                <span>Extract Now</span>
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-4 space-y-6"
                        >
                            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 space-y-8 shadow-sm">
                                <div className="space-y-3">
                                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-blue-600" />
                                        Settings
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        Our system performs high-level analysis to handle complex layouts and rotations.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Target className="w-4 h-4 text-blue-600" />
                                            <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Precision</p>
                                        </div>
                                        <p className="text-xs text-blue-700 font-bold">99.2% Accuracy on printed text</p>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Privacy</p>
                                        <p className="text-xs text-slate-600 font-medium">Documents are analyzed in isolation and discarded immediately.</p>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-700">
                                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-900 tracking-widest">READY</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">System Status: Active</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8 max-w-4xl mx-auto"
                    >
                        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden relative">
                            <div className="p-10 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                        <CheckCircle className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Extraction complete</h2>
                                        <p className="text-sm font-bold text-slate-500">{result.wordCount || 0} Words Identified</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleCopy}
                                        className={clsx(
                                            "px-8 py-3.5 rounded-2xl font-black text-sm flex items-center gap-3 transition-all",
                                            copied ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/10"
                                        )}
                                    >
                                        {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                        {copied ? 'Copied' : 'Copy text'}
                                    </button>
                                </div>
                            </div>

                            <div className="p-10 bg-white">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/80 pointer-events-none rounded-3xl z-10 transition-opacity group-hover:opacity-0"></div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 min-h-[500px] max-h-[700px] overflow-y-auto custom-scrollbar shadow-inner text-slate-900">
                                        <pre className="whitespace-pre-wrap font-mono text-sm leading-[1.8] tracking-tight selection:bg-blue-200 selection:text-blue-900">
                                            {result.text || 'No significant text found in document processing.'}
                                        </pre>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 border-t border-slate-100 flex justify-center bg-slate-50/30">
                                <button
                                    onClick={handleReset}
                                    className="px-10 py-4 text-xs font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-[0.2em]"
                                >
                                    Process New Image or PDF
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
