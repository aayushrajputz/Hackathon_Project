'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ScanText, Loader2, Copy, CheckCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import PDFDropzone from '@/components/pdf/PDFDropzone';
import { aiApi } from '@/lib/api';

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
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 mb-4">
                    <ScanText className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    OCR Text Extraction
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Extract text from scanned PDFs and image-based documents
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
                    />

                    <button
                        onClick={handleOCR}
                        disabled={files.length === 0 || isProcessing}
                        className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Extracting Text...
                            </>
                        ) : (
                            <>
                                <ScanText className="w-5 h-5" />
                                Extract Text
                            </>
                        )}
                    </button>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-6 space-y-6"
                >
                    {/* Results Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Extracted Text</h3>
                                <p className="text-sm text-gray-500">
                                    {result.totalPages || 1} page(s) • Method: {result.method || 'OCR'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleCopy}
                            className="btn-secondary flex items-center gap-2"
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

                    {/* Extracted Text */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 max-h-96 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono">
                            {result.text || 'No text extracted'}
                        </pre>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleReset}
                            className="flex-1 btn-secondary py-3"
                        >
                            Extract Another PDF
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
