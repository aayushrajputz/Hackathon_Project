'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield,
    Loader2,
    AlertTriangle,
    Eye,
    EyeOff,
    CheckCircle,
    Info,
    ShieldCheck,
    Search,
    Zap,
    FileText,
    ArrowRight,
    Lock,
    CreditCard,
    Mail,
    Phone,
    Globe,
    Fingerprint,
    Landmark
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { aiApi } from '@/lib/api';
import clsx from 'clsx';

interface SensitiveItem {
    type: string;
    value: string;
    page?: number;
    location?: string;
}

const sensitiveTypeInfo: Record<string, { label: string; icon: any; color: string }> = {
    email: { label: 'Email Address', icon: Mail, color: 'text-blue-500 bg-blue-50' },
    phone: { label: 'Phone Number', icon: Phone, color: 'text-blue-500 bg-blue-50' },
    ssn: { label: 'SSN', icon: Lock, color: 'text-blue-500 bg-blue-50' },
    credit_card: { label: 'Credit Card', icon: CreditCard, color: 'text-blue-500 bg-blue-50' },
    ip_address: { label: 'IP Address', icon: Globe, color: 'text-blue-500 bg-blue-50' },
    pan: { label: 'PAN Number', icon: Fingerprint, color: 'text-blue-500 bg-blue-50' },
    aadhaar: { label: 'Aadhaar Card', icon: Fingerprint, color: 'text-blue-500 bg-blue-50' },
    bank_account: { label: 'Bank Account', icon: Landmark, color: 'text-blue-500 bg-blue-50' },
};

export default function DetectSensitivePage() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [showValues, setShowValues] = useState(false);

    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setResult(null);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false,
    });

    const handleDetect = async () => {
        if (!file) {
            toast.error('Please upload a PDF file');
            return;
        }

        setIsProcessing(true);
        setResult(null);

        try {
            const response = await aiApi.detectSensitive(file);
            setResult(response.data.data);
            const count = response.data.data?.findings?.length || 0;
            if (count > 0) {
                toast.success(`Found ${count} sensitive item(s)`);
            } else {
                toast.success('Privacy check complete: Clean Asset');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to analyze document.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
    };

    return (
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 overflow-hidden bg-slate-50 font-sans pb-16">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[140px] -z-10 animate-pulse-slow"></div>

            <div className="relative z-10 max-w-6xl mx-auto space-y-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-7"
                    >
                        <div className="w-20 h-20 rounded-[2.5rem] bg-blue-600 shadow-xl shadow-blue-500/20 flex items-center justify-center border border-white/20">
                            <Shield className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 mb-2">
                                <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest">Active Privacy Shield</span>
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                    <Zap className="w-3.5 h-3.5" />
                                    Deep AI
                                </div>
                            </div>
                            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Privacy <span className="text-blue-600">Scan</span></h1>
                            <p className="text-slate-500 font-bold mt-2 text-lg">Deep AI inspection for sensitive data patterns</p>
                        </div>
                    </motion.div>

                    {result && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleReset}
                            className="px-8 py-4 bg-white border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                        >
                            Scan Another Asset
                        </motion.button>
                    )}
                </div>

                {!result ? (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm p-10 space-y-12">
                            <div
                                {...getRootProps()}
                                className={clsx(
                                    "border-4 border-dashed rounded-[3rem] transition-all cursor-pointer h-[400px] flex items-center justify-center relative group/drop",
                                    file ? "bg-slate-50 border-slate-200" : "bg-slate-50/50 border-slate-200 hover:border-blue-600 hover:bg-blue-50/50"
                                )}
                            >
                                <input {...getInputProps()} />
                                <div className="flex flex-col items-center gap-8 text-center px-12">
                                    {file ? (
                                        <>
                                            <div className="w-28 h-28 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl flex items-center justify-center group-hover/drop:scale-105 transition-all duration-700">
                                                <FileText className="w-12 h-12 text-blue-600" />
                                            </div>
                                            <div className="space-y-3">
                                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{file.name}</h3>
                                                <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[11px]">Source Verified • {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-28 h-28 rounded-full bg-blue-100 flex items-center justify-center shadow-inner group-hover/drop:scale-110 transition-transform duration-700">
                                                <Search className="w-12 h-12 text-blue-600" />
                                            </div>
                                            <div className="space-y-4">
                                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Injection Well</h3>
                                                <p className="text-slate-500 font-bold text-lg max-w-sm">Drop document for deep pattern analysis or browse local storage.</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-8 px-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                                        <Info className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                                        DEEP SCAN CAPABILITIES
                                    </h4>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {Object.entries(sensitiveTypeInfo).map(([key, info]) => (
                                        <span key={key} className="px-5 py-3 rounded-2xl text-[11px] font-black text-blue-600 bg-white border border-blue-100 shadow-sm flex items-center gap-3 uppercase tracking-widest hover:border-blue-300 transition-colors">
                                            <info.icon className="w-4 h-4" />
                                            {info.label}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {file && (
                                <button
                                    onClick={handleDetect}
                                    disabled={isProcessing}
                                    className={clsx(
                                        "w-full py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all group",
                                        isProcessing ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-blue-600 text-white shadow-2xl shadow-blue-500/40 hover:bg-blue-700 hover:-translate-y-1"
                                    )}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            <span>Analyzing Pixel Integrity...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                            <span>Execute Deep Scan</span>
                                            <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-10"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Summary Card */}
                            <div className="lg:col-span-4 space-y-8">
                                <div className="bg-white rounded-[3rem] border border-slate-200 p-10 text-center shadow-xl space-y-8">
                                    <div className={clsx(
                                        "w-24 h-24 rounded-[2.5rem] mx-auto flex items-center justify-center shadow-inner",
                                        result.findings?.length > 0 ? "bg-amber-50" : "bg-emerald-50"
                                    )}>
                                        {result.findings?.length > 0 ? (
                                            <AlertTriangle className="w-12 h-12 text-amber-500" />
                                        ) : (
                                            <CheckCircle className="w-12 h-12 text-emerald-500" />
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-5xl font-black text-slate-900 tracking-tighter">
                                            {result.findings?.length || 0}
                                        </h3>
                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                            TOTAL IDENTITIES DETECTED
                                        </p>
                                    </div>

                                    <div className="h-px bg-slate-100 w-2/3 mx-auto"></div>

                                    <button
                                        onClick={() => setShowValues(!showValues)}
                                        className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg shadow-black/10"
                                    >
                                        {showValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        {showValues ? 'Secure Data' : 'Expose Data'}
                                    </button>
                                </div>

                                <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                                    <div className="relative z-10 space-y-6 text-center lg:text-left">
                                        <h4 className="text-xl font-black tracking-tight leading-tight">Proceed to Automated Redaction?</h4>
                                        <p className="text-blue-100 text-xs font-bold leading-relaxed">Instantly purge these findings using our AI Redaction module.</p>
                                        <button className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                                            Deploy Redactor
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Findings */}
                            <div className="lg:col-span-8">
                                <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm p-10 h-full">
                                    <div className="flex items-center justify-between mb-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-[1.25rem] bg-slate-900 flex items-center justify-center">
                                                <ShieldCheck className="w-6 h-6 text-white" />
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Deep Inspection Buffer</h3>
                                        </div>
                                        <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Live Result
                                        </div>
                                    </div>

                                    {result.findings?.length > 0 ? (
                                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                                            {result.findings.map((item: SensitiveItem, index: number) => {
                                                const typeInfo = sensitiveTypeInfo[item.type] || {
                                                    label: item.type,
                                                    icon: FileText,
                                                    color: 'text-slate-500 bg-slate-50'
                                                };
                                                return (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, x: 30 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-blue-50 hover:border-blue-200 transition-all group"
                                                    >
                                                        <div className="flex items-center gap-6">
                                                            <div className={clsx(
                                                                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-colors",
                                                                "bg-white border border-slate-100 group-hover:border-blue-300"
                                                            )}>
                                                                <typeInfo.icon className="w-7 h-7 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">{typeInfo.label}</p>
                                                                <p className="text-slate-900 font-black text-lg tracking-tight font-mono">
                                                                    {showValues ? item.value : '••••••••••••'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            {item.page && (
                                                                <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[10px] font-black text-slate-500 shadow-sm uppercase tracking-widest">
                                                                    Layer {item.page}
                                                                </div>
                                                            )}
                                                            <div className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity">Precision Verified</div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center py-20">
                                            <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mb-8">
                                                <CheckCircle className="w-12 h-12 text-emerald-500" />
                                            </div>
                                            <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Clearance Confirmed</h3>
                                            <p className="text-slate-400 font-bold max-w-sm mx-auto text-lg leading-relaxed">No sensitive identity patterns detected within this document asset.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Distribution Matrix */}
                        {result.types && Object.keys(result.types).length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                {Object.entries(result.types).map(([type, count]) => (
                                    <div key={type} className="bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                                        <p className="text-3xl font-black text-blue-600 mb-1">{count as number}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
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
