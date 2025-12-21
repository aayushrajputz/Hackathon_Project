'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ScanText, Loader2, Copy, CheckCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import PDFDropzone from '@/components/pdf/PDFDropzone';
import { aiApi } from '@/lib/api';
import clsx from 'clsx';

export default function OCRExtractPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    const handleOCR = async () => {
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
            const response = await aiApi.ocr(files[0]);
            setResult(response.data.data);
            toast.success('Text extracted successfully!');
        } catch (error: any) {
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                toast.error('Request timed out. Please try with a smaller document.');
            } else if (error.response?.status === 503) {
                toast.error('OCR service is not available.');
            } else if (error.response?.status === 429) {
                toast.error('Too many requests. Please wait a moment and try again.');
            } else {
                toast.error(error.response?.data?.error?.message || 'Failed to extract text. Please try again.');
            }
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
        setFiles([]);
        setResult(null);
    };

    return (
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 bg-mesh pointer-events-none opacity-40"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>

            <div className="relative z-10 max-w-5xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-6"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 via-cyan-500 to-teal-500 p-[1px] shadow-2xl shadow-emerald-500/20">
                            <div className="w-full h-full rounded-[23px] bg-slate-950 flex items-center justify-center">
                                <ScanText className="w-10 h-10 text-emerald-400" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight">OCR <span className="text-gradient-premium">Extract</span></h1>
                            <p className="text-slate-400 font-medium mt-1">AI-powered text recognition for scanned PDFs</p>
                        </div>
                    </motion.div>

                    {result && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleReset}
                            className="btn-glass text-white"
                        >
                            Process Another
                        </motion.button>
                    )}
                </div>

                {!result ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <div className="glass-card-premium p-8">
                            <div className="space-y-6">
                                <PDFDropzone
                                    files={files}
                                    onFilesChange={setFiles}
                                    multiple={false}
                                    maxFiles={1}
                                    disabled={isProcessing}
                                />

                                {files.length > 0 && (
                                    <div className="pt-4">
                                        <button
                                            onClick={handleOCR}
                                            disabled={isProcessing}
                                            className={clsx(
                                                "w-full btn-premium shadow-xl",
                                                isProcessing && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            {isProcessing ? (
                                                <div className="flex items-center gap-3">
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    <span>Digitizing Document...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <ScanText className="w-5 h-5" />
                                                    <span>Start OCR Recognition</span>
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pro Features Grid */}
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { title: 'High Accuracy', desc: 'State-of-the-art neural networks for character recognition.' },
                                { title: 'Multi-Language', desc: 'Support for over 50 languages including complex scripts.' },
                                { title: 'No Data Storage', desc: 'Files are processed in memory and never stored on disk.' }
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + i * 0.1 }}
                                    className="p-6 rounded-3xl bg-white/5 border border-white/5"
                                >
                                    <h3 className="font-bold text-white mb-2">{feature.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8"
                    >
                        <div className="glass-card-premium p-8">
                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Extracted Metadata</h3>
                                        <p className="text-sm text-slate-400">
                                            {result.totalPages || 1} page(s) analyzed • {result.method || 'Neural Engine'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className="btn-premium px-6 py-2.5 !rounded-xl text-sm"
                                >
                                    {copied ? (
                                        <><CheckCircle className="w-4 h-4" /> Copied</>
                                    ) : (
                                        <><Copy className="w-4 h-4" /> Copy Text</>
                                    )}
                                </button>
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/80 pointer-events-none rounded-2xl z-10"></div>
                                <div className="bg-slate-950/50 backdrop-blur-sm rounded-2xl p-8 border border-white/5 min-h-[400px] max-h-[600px] overflow-y-auto custom-scrollbar">
                                    <pre className="whitespace-pre-wrap text-emerald-50/90 font-mono text-sm leading-relaxed tracking-tight">
                                        {result.text || 'No text detected in the provided document.'}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center gap-4">
                            <button
                                onClick={handleReset}
                                className="px-8 py-4 text-slate-400 hover:text-white font-bold transition-all"
                            >
                                Clear Results
                            </button>
                            <button
                                onClick={handleOCR}
                                className="btn-glass text-white"
                            >
                                Reprocess Document
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
