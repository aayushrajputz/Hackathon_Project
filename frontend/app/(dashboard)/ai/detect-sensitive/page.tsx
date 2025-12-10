'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Loader2, AlertTriangle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import PDFDropzone from '@/components/pdf/PDFDropzone';
import { aiApi } from '@/lib/api';

interface SensitiveItem {
    type: string;
    value: string;
    page?: number;
    location?: string;
}

export default function DetectSensitivePage() {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [showValues, setShowValues] = useState(false);

    const sensitiveTypeInfo: Record<string, { label: string; color: string; icon: string }> = {
        email: { label: 'Email Address', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: '📧' },
        phone: { label: 'Phone Number', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: '📱' },
        ssn: { label: 'SSN', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: '🔒' },
        credit_card: { label: 'Credit Card', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: '💳' },
        ip_address: { label: 'IP Address', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: '🌐' },
        pan: { label: 'PAN Number', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: '🆔' },
        aadhaar: { label: 'Aadhaar', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: '🪪' },
        bank_account: { label: 'Bank Account', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400', icon: '🏦' },
    };

    const handleDetect = async () => {
        if (files.length === 0) {
            toast.error('Please upload a PDF file');
            return;
        }

        if (files[0].size > 10 * 1024 * 1024) {
            toast.error('File too large. Maximum size is 10MB.');
            return;
        }

        setIsProcessing(true);
        setResult(null);

        try {
            const response = await aiApi.detectSensitive(files[0]);
            setResult(response.data.data);
            const count = response.data.data?.findings?.length || 0;
            if (count > 0) {
                toast.success(`Found ${count} sensitive item(s)`);
            } else {
                toast.success('No sensitive data found');
            }
        } catch (error: any) {
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                toast.error('Request timed out. Please try with a smaller document.');
            } else if (error.response?.status === 503) {
                toast.error('Detection service is not available.');
            } else {
                toast.error(error.response?.data?.error?.message || 'Failed to analyze document.');
            }
        } finally {
            setIsProcessing(false);
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
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 mb-4">
                    <Shield className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Detect Sensitive Data
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Scan documents for personal and sensitive information
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

                    {/* Detection Types Info */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Types of sensitive data detected:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(sensitiveTypeInfo).map(([key, info]) => (
                                <span
                                    key={key}
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${info.color}`}
                                >
                                    {info.icon} {info.label}
                                </span>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleDetect}
                        disabled={files.length === 0 || isProcessing}
                        className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Scanning Document...
                            </>
                        ) : (
                            <>
                                <Shield className="w-5 h-5" />
                                Detect Sensitive Data
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
                            {result.findings?.length > 0 ? (
                                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                            )}
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {result.findings?.length > 0
                                        ? `Found ${result.findings.length} Sensitive Item(s)`
                                        : 'No Sensitive Data Found'}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Document scanned successfully
                                </p>
                            </div>
                        </div>
                        {result.findings?.length > 0 && (
                            <button
                                onClick={() => setShowValues(!showValues)}
                                className="btn-secondary flex items-center gap-2"
                            >
                                {showValues ? (
                                    <>
                                        <EyeOff className="w-4 h-4" />
                                        Hide Values
                                    </>
                                ) : (
                                    <>
                                        <Eye className="w-4 h-4" />
                                        Show Values
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Findings List */}
                    {result.findings?.length > 0 && (
                        <div className="space-y-3">
                            {result.findings.map((item: SensitiveItem, index: number) => {
                                const typeInfo = sensitiveTypeInfo[item.type] || {
                                    label: item.type,
                                    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
                                    icon: '📄'
                                };
                                return (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                                                {typeInfo.icon} {typeInfo.label}
                                            </span>
                                        </div>
                                        <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                                            {showValues ? item.value : '••••••••'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Type Summary */}
                    {result.types && Object.keys(result.types).length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Summary by Type
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.entries(result.types).map(([type, count]) => (
                                    <div key={type} className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {count as number}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {sensitiveTypeInfo[type]?.label || type}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleReset}
                            className="flex-1 btn-secondary py-3"
                        >
                            Scan Another Document
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
