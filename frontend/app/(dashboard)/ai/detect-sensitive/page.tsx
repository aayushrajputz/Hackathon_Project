'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Loader2, AlertTriangle, Eye, EyeOff, CheckCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import PDFDropzone from '@/components/pdf/PDFDropzone';
import { aiApi } from '@/lib/api';
import clsx from 'clsx';

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
        email: { label: 'Email Address', color: 'bg-blue-500/20 text-blue-400 border-blue-500/20', icon: '📧' },
        phone: { label: 'Phone Number', color: 'bg-green-500/20 text-green-400 border-green-500/20', icon: '📱' },
        ssn: { label: 'SSN', color: 'bg-red-500/20 text-red-400 border-red-500/20', icon: '🔒' },
        credit_card: { label: 'Credit Card', color: 'bg-orange-500/20 text-orange-400 border-orange-500/20', icon: '💳' },
        ip_address: { label: 'IP Address', color: 'bg-purple-500/20 text-purple-400 border-purple-500/20', icon: '🌐' },
        pan: { label: 'PAN Number', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20', icon: '🆔' },
        aadhaar: { label: 'Aadhaar', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20', icon: '🪪' },
        bank_account: { label: 'Bank Account', color: 'bg-pink-500/20 text-pink-400 border-pink-500/20', icon: '🏦' },
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
            toast.error(error.response?.data?.error?.message || 'Failed to analyze document.');
        } finally {
            setIsProcessing(false);
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
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>

            <div className="relative z-10 max-w-5xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-6"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-400 via-orange-500 to-rose-500 p-[1px] shadow-2xl shadow-red-500/20">
                            <div className="w-full h-full rounded-[23px] bg-slate-950 flex items-center justify-center">
                                <Shield className="w-10 h-10 text-red-400" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight">Privacy <span className="text-gradient-premium">Scan</span></h1>
                            <p className="text-slate-400 font-medium mt-1">Deep AI inspection for sensitive data patterns</p>
                        </div>
                    </motion.div>

                    {result && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleReset}
                            className="btn-glass text-white"
                        >
                            Scan Another
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
                            <div className="space-y-8">
                                <PDFDropzone
                                    files={files}
                                    onFilesChange={setFiles}
                                    multiple={false}
                                    maxFiles={1}
                                    disabled={isProcessing}
                                />

                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Info className="w-5 h-5 text-red-400" />
                                        <h4 className="text-sm font-bold text-white uppercase tracking-widest">
                                            Supported Detection Patterns
                                        </h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(sensitiveTypeInfo).map(([key, info]) => (
                                            <span
                                                key={key}
                                                className={clsx(
                                                    "px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors",
                                                    info.color
                                                )}
                                            >
                                                {info.icon} {info.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {files.length > 0 && (
                                    <button
                                        onClick={handleDetect}
                                        disabled={isProcessing}
                                        className={clsx(
                                            "w-full btn-premium shadow-xl py-5",
                                            isProcessing && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        {isProcessing ? (
                                            <div className="flex items-center gap-3">
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                <span className="text-lg">Inspecting Pixels & Metadata...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <Shield className="w-6 h-6" />
                                                <span className="text-lg">Start Deep Scan</span>
                                            </div>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                            <div className="lg:col-span-1 space-y-6">
                                <div className="glass-card-premium p-6 text-center">
                                    <div className={clsx(
                                        "w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center",
                                        result.findings?.length > 0 ? "bg-red-500/20" : "bg-emerald-500/20"
                                    )}>
                                        {result.findings?.length > 0 ? (
                                            <AlertTriangle className="w-8 h-8 text-red-500" />
                                        ) : (
                                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-black text-white">
                                        {result.findings?.length || 0}
                                    </h3>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                                        Total Findings
                                    </p>
                                </div>

                                <button
                                    onClick={() => setShowValues(!showValues)}
                                    className="w-full btn-glass text-white py-4"
                                >
                                    {showValues ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                                    <span>{showValues ? 'Mask Values' : 'Reveal Values'}</span>
                                </button>
                            </div>

                            <div className="lg:col-span-3">
                                <div className="glass-card-premium p-8 h-full bg-slate-950/40">
                                    {result.findings?.length > 0 ? (
                                        <div className="space-y-4">
                                            {result.findings.map((item: SensitiveItem, index: number) => {
                                                const typeInfo = sensitiveTypeInfo[item.type] || {
                                                    label: item.type,
                                                    color: 'bg-slate-800 text-slate-400 border-white/5',
                                                    icon: '📄'
                                                };
                                                return (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors group"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={clsx(
                                                                "w-10 h-10 rounded-xl flex items-center justify-center text-lg",
                                                                typeInfo.color.split(' ')[0]
                                                            )}>
                                                                {typeInfo.icon}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{typeInfo.label}</p>
                                                                <p className="text-white font-mono mt-1">
                                                                    {showValues ? item.value : '••••••••••••'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {item.page && (
                                                            <div className="px-3 py-1 rounded-lg bg-slate-800 text-[10px] font-black text-slate-400">
                                                                PAGE {item.page}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                            <CheckCircle className="w-16 h-16 text-emerald-500 mb-6 opacity-20" />
                                            <h3 className="text-xl font-bold text-white mb-2">Pristine Document</h3>
                                            <p className="text-slate-400 max-w-xs mx-auto">Our AI engine could not find any sensitive data patterns in this document.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {result.types && Object.keys(result.types).length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {Object.entries(result.types).map(([type, count]) => (
                                    <div key={type} className="glass-card p-4 text-center">
                                        <p className="text-lg font-black text-white">{count as number}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">
                                            {sensitiveTypeInfo[type]?.label || type}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
