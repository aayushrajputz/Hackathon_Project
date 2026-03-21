'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck,
    Loader2,
    Copy,
    RotateCcw,
    Sparkles,
    Eye,
    EyeOff,
    Check,
    Shield,
    Mail,
    Phone,
    Lock,
    CreditCard,
    ArrowRight,
    Search,
    FileText,
    Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { aiApi } from '@/lib/api';
import clsx from 'clsx';

type RedactionType = 'email' | 'phone' | 'ssn' | 'credit_card';

interface RedactionOption {
    id: RedactionType;
    label: string;
    icon: any;
    description: string;
}

const redactionOptions: RedactionOption[] = [
    { id: 'email', label: 'Emails', icon: Mail, description: 'Hide all email addresses' },
    { id: 'phone', label: 'Phone Numbers', icon: Phone, description: 'Hide telephone contacts' },
    { id: 'ssn', label: 'SSN', icon: Lock, description: 'Social security numbers' },
    { id: 'credit_card', label: 'Credit Cards', icon: CreditCard, description: 'Financial card details' },
];

export default function IntelligentRedactionPage() {
    const [file, setFile] = useState<File | null>(null);
    const [selectedTypes, setSelectedTypes] = useState<RedactionType[]>(['email', 'phone', 'ssn', 'credit_card']);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [result, setResult] = useState<{ maskedText: string; maskedCount: number } | null>(null);
    const [displayText, setDisplayText] = useState('');
    const [copied, setCopied] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setResult(null);
            setDisplayText('');
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false,
    });

    const toggleType = (type: RedactionType) => {
        setSelectedTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const animateRedaction = useCallback((finalText: string) => {
        setIsAnimating(true);
        const chars = finalText.split('');
        const redactedIndices: number[] = [];

        chars.forEach((char, i) => {
            if (char === '█' || char === '*') {
                redactedIndices.push(i);
            }
        });

        let currentText = finalText.replace(/[█*]+/g, (match) => '░'.repeat(match.length));
        setDisplayText(currentText);

        let animationIndex = 0;
        const animationInterval = setInterval(() => {
            if (animationIndex >= redactedIndices.length) {
                clearInterval(animationInterval);
                setDisplayText(finalText);
                setIsAnimating(false);
                return;
            }

            const newText = chars.slice(0, animationIndex + 1).join('') +
                currentText.slice(animationIndex + 1);
            setDisplayText(newText);
            animationIndex += 5;
        }, 10);

        setTimeout(() => {
            clearInterval(animationInterval);
            setDisplayText(finalText);
            setIsAnimating(false);
        }, 3000);
    }, []);

    const handleRedact = async () => {
        if (!file) {
            toast.error('Please upload a PDF file');
            return;
        }

        if (selectedTypes.length === 0) {
            toast.error('Select at least one data type');
            return;
        }

        setIsProcessing(true);
        setResult(null);
        setDisplayText('');

        try {
            const response = await aiApi.maskSensitive(file, selectedTypes);
            const data = response.data.data;

            setResult({
                maskedText: data.maskedText,
                maskedCount: data.maskedCount,
            });

            animateRedaction(data.maskedText);

            if (data.maskedCount > 0) {
                toast.success(`${data.maskedCount} entities secured!`);
            } else {
                toast.success('Clean sweep: No sensitive data found');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to redact document.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCopy = async () => {
        if (!result) return;
        try {
            await navigator.clipboard.writeText(result.maskedText);
            setCopied(true);
            toast.success('Encrypted text copied');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Copy failed');
        }
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
        setDisplayText('');
    };

    return (
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 overflow-hidden bg-slate-50 font-sans pb-12">
            {/* Ambient Background Lights */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-50 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>

            <div className="relative z-10 max-w-6xl mx-auto space-y-10">
                {/* Master Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-7"
                    >
                        <div className="w-20 h-20 rounded-[2.5rem] bg-blue-600 shadow-xl shadow-blue-500/20 flex items-center justify-center border border-white/20">
                            <ShieldCheck className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 mb-2">
                                <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest">Neural Security Matrix</span>
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                    <Zap className="w-3.5 h-3.5" />
                                    Real-time
                                </div>
                            </div>
                            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">AI <span className="text-blue-600">Redactor</span></h1>
                            <p className="text-slate-500 font-bold mt-2 text-lg">Intelligent deep-masking for confidential assets</p>
                        </div>
                    </motion.div>

                    {result && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleReset}
                            className="px-8 py-4 bg-white border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                        >
                            Process New Asset
                        </motion.button>
                    )}
                </div>

                {!result ? (
                    <div className="grid lg:grid-cols-12 gap-8 items-start">
                        {/* Dropzone & Rules */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-8 space-y-8"
                        >
                            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-8 space-y-10">
                                <div
                                    {...getRootProps()}
                                    className={clsx(
                                        "border-4 border-dashed rounded-[2.5rem] transition-all cursor-pointer h-[350px] flex items-center justify-center relative group/drop",
                                        file
                                            ? "bg-slate-50 border-slate-200"
                                            : "bg-slate-50/50 border-slate-200 hover:border-blue-600 hover:bg-blue-50/50"
                                    )}
                                >
                                    <input {...getInputProps()} />
                                    <div className="flex flex-col items-center gap-6 text-center px-10">
                                        {file ? (
                                            <>
                                                <div className="w-24 h-24 rounded-[2rem] bg-white border border-slate-100 shadow-xl flex items-center justify-center group-hover/drop:scale-105 transition-all duration-500">
                                                    <FileText className="w-10 h-10 text-blue-600" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight truncate max-w-[400px]">{file.name}</h3>
                                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px]">Identity Verified • {(file.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center shadow-inner group-hover/drop:scale-110 transition-transform duration-700">
                                                    <Search className="w-10 h-10 text-blue-600" />
                                                </div>
                                                <div className="space-y-3">
                                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Injection Dropzone</h3>
                                                    <p className="text-slate-500 font-bold max-w-sm">Drop your PDF for neural scanning or click to browse local storage.</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6 px-2 pb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                            <Sparkles className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                            SELECT PROTECTION RULES
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {redactionOptions.map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => toggleType(option.id)}
                                                className={clsx(
                                                    "p-6 rounded-[2rem] border-2 transition-all text-left relative overflow-hidden group/opt",
                                                    selectedTypes.includes(option.id)
                                                        ? "border-blue-600 bg-blue-600 text-white shadow-xl shadow-blue-500/20 scale-[1.02]"
                                                        : "border-slate-100 bg-slate-50 hover:border-blue-200 hover:bg-white"
                                                )}
                                            >
                                                <div className={clsx(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-colors",
                                                    selectedTypes.includes(option.id) ? "bg-white/20" : "bg-white border border-slate-100 shadow-sm"
                                                )}>
                                                    <option.icon className={clsx(
                                                        "w-6 h-6",
                                                        selectedTypes.includes(option.id) ? "text-white" : "text-blue-600"
                                                    )} />
                                                </div>
                                                <p className={clsx(
                                                    "font-black text-sm tracking-tight",
                                                    selectedTypes.includes(option.id) ? "text-white" : "text-slate-900"
                                                )}>{option.label}</p>
                                                <p className={clsx(
                                                    "text-[10px] mt-1 font-bold",
                                                    selectedTypes.includes(option.id) ? "text-white/70" : "text-slate-400"
                                                )}>{option.description}</p>

                                                {selectedTypes.includes(option.id) && (
                                                    <div className="absolute top-4 right-4 animate-in zoom-in duration-300">
                                                        <Check className="w-5 h-5 text-white" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right Sidebar */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-4 space-y-6"
                        >
                            <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 space-y-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/20 rounded-full blur-[60px] -z-10"></div>

                                <div className="space-y-2">
                                    <h3 className="text-white text-2xl font-black tracking-tight">Deployment</h3>
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Security Configuration</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-slate-500">Active Rules</span>
                                            <span className="text-blue-500">{selectedTypes.length} Modules</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-600 rounded-full transition-all duration-700" style={{ width: `${(selectedTypes.length / 4) * 100}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/20 flex gap-4">
                                        <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                                        <p className="text-[10px] font-bold text-blue-200 leading-relaxed uppercase tracking-tight">
                                            Neural masking generates a redacted clone. Your original asset remains untouched on local storage.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleRedact}
                                    disabled={isProcessing || !file || selectedTypes.length === 0}
                                    className={clsx(
                                        "w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 transition-all group",
                                        (isProcessing || !file || selectedTypes.length === 0)
                                            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                            : "bg-blue-600 text-white shadow-xl shadow-blue-500/40 hover:bg-blue-700 hover:-translate-y-1"
                                    )}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Scanning Deeply...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            <span>Execute Redaction</span>
                                            <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                                <div className="flex items-center gap-4 mb-5">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <Lock className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Privacy Protocol</p>
                                </div>
                                <p className="text-xs text-slate-500 font-bold leading-relaxed px-1">
                                    Advanced pattern recognition detects and removes PII (Personally Identifiable Information) with sub-second latency.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-4xl mx-auto space-y-10"
                    >
                        <div className="bg-white rounded-[4rem] border border-slate-200 shadow-2xl overflow-hidden">
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-3xl bg-blue-600 shadow-lg shadow-blue-500/20 flex items-center justify-center border border-white/20">
                                        <ShieldCheck className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Neural Mask Output</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] bg-blue-50 px-2 py-0.5 rounded-md">{result.maskedCount} Entities Cleansed</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verified Secure</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleCopy}
                                        className="h-14 px-8 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 shadow-lg shadow-black/10"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                        <span>{copied ? 'Captured' : 'Capture Buffer'}</span>
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all flex items-center justify-center shadow-sm"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-10 bg-slate-100/50">
                                <div className="bg-white rounded-[2rem] border border-slate-200 p-10 shadow-inner">
                                    <pre className="whitespace-pre-wrap font-mono text-sm text-slate-700 leading-relaxed max-h-[600px] overflow-y-auto custom-scrollbar">
                                        {isAnimating ? (
                                            <motion.span
                                                initial={{ opacity: 0.8 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ repeat: Infinity, duration: 0.8 }}
                                            >
                                                {displayText}
                                            </motion.span>
                                        ) : (
                                            displayText || result.maskedText
                                        )}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-10">
                            {redactionOptions.map((opt) => (
                                <div key={opt.id} className={clsx(
                                    "flex items-center gap-4 p-4 rounded-2xl transition-all",
                                    selectedTypes.includes(opt.id) ? "bg-blue-50 text-blue-600 border border-blue-100" : "opacity-30 grayscale"
                                )}>
                                    <opt.icon className="w-5 h-5" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">{opt.label}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
