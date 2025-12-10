'use client';

import { useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { notify } from '@/lib/notifications';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface PDFDropzoneProps {
    files: File[];
    onFilesChange: (files: File[]) => void;
    multiple?: boolean;
    maxFiles?: number;
    disabled?: boolean;
}

export default function PDFDropzone({
    files,
    onFilesChange,
    multiple = true,
    maxFiles = 10,
    disabled = false,
}: PDFDropzoneProps) {
    const onDrop = useCallback(
        (acceptedFiles: File[], fileRejections: FileRejection[]) => {
            if (fileRejections?.length > 0) {
                const rejection = fileRejections[0];
                if (rejection.errors[0]?.code === 'file-too-large') {
                    notify.uploadError('File is too large. Max size is 50MB.');
                } else if (rejection.errors[0]?.code === 'file-invalid-type') {
                    notify.uploadError('Invalid file type. Please upload a PDF.');
                } else {
                    notify.uploadError('Failed to upload file.');
                }
                // If there are rejections, we might not want to process accepted files in the same drop event
                // or we might want to process them but still show the error.
                // For now, let's assume we still process accepted files if any.
            }

            if (acceptedFiles?.length > 0) {
                if (multiple) {
                    const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles);
                    onFilesChange(newFiles);
                    acceptedFiles.forEach(file => notify.uploadSuccess(file.name));
                } else {
                    onFilesChange(acceptedFiles.slice(0, 1));
                    notify.uploadSuccess(acceptedFiles[0].name);
                }
            }
        },
        [files, multiple, maxFiles, onFilesChange]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
        },
        multiple,
        maxFiles,
        disabled,
    });

    const removeFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        onFilesChange(newFiles);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={clsx(
                    'dropzone',
                    isDragActive && 'dropzone-active',
                    disabled && 'opacity-50 cursor-not-allowed'
                )}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <Upload className="w-8 h-8 text-primary-600" />
                    </div>
                    <div>
                        <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
                            {isDragActive ? 'Drop your PDFs here' : 'Drag & drop PDFs here'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            or click to browse (max {maxFiles} files)
                        </p>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                    >
                        {files.map((file, index) => (
                            <motion.div
                                key={`${file.name}-${index}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700"
                            >
                                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-primary-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(index);
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
