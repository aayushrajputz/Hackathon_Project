'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Loader2, Copy, RotateCcw, Sparkles, Eye, EyeOff, Check, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import PDFDropzone from '@/components/pdf/PDFDropzone';
import { aiApi } from '@/lib/api';
import clsx from 'clsx';

type RedactionType = 'email' | 'phone' | 'ssn' | 'credit_card';

interface RedactionOption {
    id: RedactionType;
    label: string;
    icon: string;
    description: string;
}

const redactionOptions: RedactionOption[] = [
    { id: 'email', label: 'Emails', icon: '📧', description: 'Hide all email addresses' },
    { id: 'phone', label: 'Phone Numbers', icon: '📱', description: 'Hide telephone contacts' },
    { id: 'ssn', label: 'SSN', icon: '🔒', description: 'Social security numbers' },
    { id: 'credit_card', label: 'Credit Cards', icon: '💳', description: 'Financial card details' },
];

export default function IntelligentRedactionPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<RedactionType[]>(['email', 'phone', 'ssn', 'credit_card']);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [result, setResult] = useState<{ maskedText: string; maskedCount: number } | null>(null);
    const [displayText, setDisplayText] = useState('');
    const [showOriginal, setShowOriginal] = useState(false);
    const [copied, setCopied] = useState(false);

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
        if (files.length === 0) {
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
            const response = await aiApi.maskSensitive(files[0], selectedTypes);
            const data = response.data.data;

            setResult({
                maskedText: data.maskedText,
                maskedCount: data.maskedCount,
            });

            animateRedaction(data.maskedText);

            if (data.maskedCount > 0) {
                toast.success(`${data.maskedCount} item(s) protected!`);
            } else {
                toast.success('Privacy check complete');
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
            toast.success('Safely copied!');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Copy failed');
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
        setDisplayText('');
        setShowOriginal(false);
    };

    return (
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 overflow-hidden">
            <div className="absolute inset-0 bg-mesh pointer-events-none opacity-40"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>

            <div className="relative z-10 max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-6"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-500 p-[1px] shadow-2xl shadow-purple-500/20">
                            <div className="w-full h-full rounded-[23px] bg-slate-950 flex items-center justify-center">
                                <ShieldCheck className="w-10 h-10 text-violet-400" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight">AI <span className="text-gradient-premium">Redactor</span></h1>
                            <p className="text-slate-400 font-medium mt-1">Intelligent masking for confidential data</p>
                        </div>
                    </motion.div>

                    {result && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleReset}
                            className="btn-glass text-white"
                        >
                            Redact Another
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
                            <div className="space-y-10">
                                <PDFDropzone
                                    files={files}
                                    onFilesChange={setFiles}
                                    multiple={false}
                                    maxFiles={1}
                                    disabled={isProcessing}
                                />

                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <Sparkles className="w-5 h-5 text-violet-400" />
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            Select Protection Rules
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {redactionOptions.map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => toggleType(option.id)}
                                                className={clsx(
                                                    "p-5 rounded-2xl border-2 transition-all text-left relative overflow-hidden group",
                                                    selectedTypes.includes(option.id)
                                                        ? "border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/10"
                                                        : "border-white/5 bg-white/5 hover:border-white/10"
                                                )}
                                            >
                                                <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">{option.icon}</div>
                                                <p className={clsx(
                                                    "font-bold text-sm",
                                                    selectedTypes.includes(option.id) ? "text-white" : "text-slate-400"
                                                )}>{option.label}</p>
                                                <p className="text-[10px] text-slate-500 mt-1 font-medium">{option.description}</p>
                                                {selectedTypes.includes(option.id) && (
                                                    <div className="absolute top-3 right-3">
                                                        <Check className="w-4 h-4 text-violet-500" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {files.length > 0 && (
                                    <button
                                        onClick={handleRedact}
                                        disabled={isProcessing || selectedTypes.length === 0}
                                        className={clsx(
                                            "w-full btn-premium shadow-xl py-5",
                                            (isProcessing || selectedTypes.length === 0) && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        {isProcessing ? (
                                            <div className="flex items-center gap-3">
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                <span className="text-lg">AI is wiping sensitive data...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <Shield className="w-6 h-6" />
                                                <span className="text-lg">Apply Redaction</span>
                                            </div>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8"
                    >
                        <div className="glass-card-premium overflow-hidden">
                            <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                                        <ShieldCheck className="w-5 h-5 text-violet-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white uppercase tracking-tighter">Masked Document Preview</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">{result.maskedCount} entities secured</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCopy}
                                        className="btn-glass text-xs py-2 px-4 h-10"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                        <span className="ml-2">{copied ? 'Copied' : 'Copy Text'}</span>
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="btn-glass text-xs py-2 px-4 h-10"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-8 bg-slate-950/50">
                                <pre className="whitespace-pre-wrap font-mono text-sm text-slate-300 leading-loose">
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

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {redactionOptions.map((opt) => (
                                <div key={opt.id} className={clsx(
                                    "p-4 rounded-2xl border transition-all text-center",
                                    selectedTypes.includes(opt.id) ? "bg-white/5 border-white/10" : "opacity-30 border-transparent grayscale"
                                )}>
                                    <div className="text-xl mb-1">{opt.icon}</div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">{opt.label}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
