'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Document, Page, pdfjs } from 'react-pdf';
import { FileText, Loader2, ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFPreviewProps {
    fileUrl?: string;
    file?: File | null;
    onClose?: () => void;
    title?: string;
    mode?: 'modal' | 'embedded';
}

export default function PDFPreview({
    fileUrl,
    file,
    onClose,
    title = "Document Preview",
    mode = 'modal'
}: PDFPreviewProps) {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);

    // Create URL if file object provided
    const displayUrl = file ? URL.createObjectURL(file) : fileUrl;

    if (!displayUrl) return null;

    const Content = (
        <div className={`
            ${mode === 'modal' ? 'bg-gray-900 w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl border border-gray-700' : 'w-full h-full bg-gray-900'} 
            flex overflow-hidden relative
        `}>
            {/* Sidebar / Info - Only show in modal or if enough space */}
            {mode === 'modal' && (
                <div className="w-80 bg-gray-800 border-r border-gray-700 p-6 flex flex-col hidden md:flex">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <FileText className="w-6 h-6 text-blue-400" />
                            Preview
                        </h2>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                            <h3 className="text-gray-400 text-sm font-medium mb-1">Filename</h3>
                            <p className="text-white font-mono text-sm break-all">{file?.name || title}</p>
                        </div>

                        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                            <h3 className="text-gray-400 text-sm font-medium mb-1">Viewer Mode</h3>
                            <p className="text-blue-300 text-sm flex items-center gap-2">
                                <Maximize2 className="w-4 h-4" />
                                {mode === 'modal' ? 'Interactive Modal' : 'Embedded View'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <p className="text-xs text-gray-500 text-center">
                            Powered by BinaryPDF Engine
                        </p>
                    </div>
                </div>
            )}

            {/* Main Viewer Area */}
            <div className="flex-1 flex flex-col relative bg-gray-900">
                {mode === 'modal' && (
                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                        <button
                            onClick={onClose}
                            className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg shadow-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-gray-900/50">
                    <Document
                        file={displayUrl}
                        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                        loading={
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                                <p className="text-gray-400">Loading document...</p>
                            </div>
                        }
                        error={
                            <div className="text-center p-8 bg-red-900/20 rounded-xl border border-red-800">
                                <FileText className="w-12 h-12 text-red-400 mx-auto mb-4" />
                                <h3 className="text-red-400 font-bold mb-2">Detailed Preview Unavailable</h3>
                                <p className="text-gray-400 text-sm max-w-xs">
                                    This file type might not be fully supported for preview, or the file is corrupted.
                                </p>
                            </div>
                        }
                        className="shadow-2xl"
                    >
                        <Page
                            pageNumber={pageNumber}
                            scale={mode === 'embedded' ? 1.0 : 1.2}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            className="shadow-2xl"
                        />
                    </Document>
                </div>

                {/* Controls */}
                {numPages && numPages > 1 && (
                    <div className="h-16 border-t border-gray-800 bg-gray-800/50 flex items-center justify-center gap-6">
                        <button
                            disabled={pageNumber <= 1}
                            onClick={() => setPageNumber(p => p - 1)}
                            className="p-2 bg-gray-800 rounded-full disabled:opacity-50 hover:bg-gray-700 hover:text-blue-400 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-white" />
                        </button>
                        <span className="text-white font-mono bg-gray-900 px-3 py-1 rounded border border-gray-700 text-sm">
                            {pageNumber} / {numPages}
                        </span>
                        <button
                            disabled={pageNumber >= numPages}
                            onClick={() => setPageNumber(p => p + 1)}
                            className="p-2 bg-gray-800 rounded-full disabled:opacity-50 hover:bg-gray-700 hover:text-blue-400 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-white" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    if (mode === 'embedded') {
        return Content;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="contents"
            >
                {Content}
            </motion.div>
        </motion.div>
    );
}
