'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Loader2, Copy, RotateCcw, Sparkles, Eye, EyeOff, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import PDFDropzone from '@/components/pdf/PDFDropzone';
import { aiApi } from '@/lib/api';

type RedactionType = 'email' | 'phone' | 'ssn' | 'credit_card';

interface RedactionOption {
    id: RedactionType;
    label: string;
    icon: string;
    color: string;
}

const redactionOptions: RedactionOption[] = [
    { id: 'email', label: 'Emails', icon: '📧', color: 'from-blue-500 to-cyan-500' },
    { id: 'phone', label: 'Phone Numbers', icon: '📱', color: 'from-green-500 to-emerald-500' },
    { id: 'ssn', label: 'SSN', icon: '🔒', color: 'from-red-500 to-rose-500' },
    { id: 'credit_card', label: 'Credit Cards', icon: '💳', color: 'from-orange-500 to-amber-500' },
];

export default function IntelligentRedactionPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<RedactionType[]>(['email', 'phone', 'ssn', 'credit_card']);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [result, setResult] = useState<{ maskedText: string; maskedCount: number } | null>(null);
    const [displayText, setDisplayText] = useState('');
    const [showOriginal, setShowOriginal] = useState(false);
    const [originalText, setOriginalText] = useState('');
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

        // Find indices of redacted blocks (█ characters)
        chars.forEach((char, i) => {
            if (char === '█' || char === '*') {
                redactedIndices.push(i);
            }
        });

        // Show original first, then animate redaction
        let currentText = finalText.replace(/[█*]+/g, (match) => {
            // Replace redacted blocks with placeholder text initially
            return '░'.repeat(match.length);
        });
        setDisplayText(currentText);

        // Animate each redacted block
        let animationIndex = 0;
        const animationInterval = setInterval(() => {
            if (animationIndex >= redactedIndices.length) {
                clearInterval(animationInterval);
                setDisplayText(finalText);
                setIsAnimating(false);
                return;
            }

            // Update text progressively
            const newText = chars.slice(0, animationIndex + 1).join('') +
                currentText.slice(animationIndex + 1);
            setDisplayText(newText);
            animationIndex += 3; // Animate 3 characters at a time for speed
        }, 10);

        // Fallback: ensure final text is shown
        setTimeout(() => {
            clearInterval(animationInterval);
            setDisplayText(finalText);
            setIsAnimating(false);
        }, 2000);
    }, []);

    const handleRedact = async () => {
        if (files.length === 0) {
            toast.error('Please upload a PDF file');
            return;
        }

        if (selectedTypes.length === 0) {
            toast.error('Please select at least one data type to redact');
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
            setOriginalText(data.maskedText); // Store for toggle

            // Start animation
            animateRedaction(data.maskedText);

            if (data.maskedCount > 0) {
                toast.success(`Successfully redacted ${data.maskedCount} sensitive item(s)!`);
            } else {
                toast.success('No sensitive data found to redact');
            }
        } catch (error: any) {
            console.error('Redaction error:', error);
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                toast.error('Request timed out. Please try with a smaller document.');
            } else if (error.response?.status === 503) {
                toast.error('AI service is not available.');
            } else {
                toast.error(error.response?.data?.error?.message || 'Failed to redact document.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCopy = async () => {
        if (!result) return;
        try {
            await navigator.clipboard.writeText(result.maskedText);
            setCopied(true);
            toast.success('Copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Failed to copy');
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
        setDisplayText('');
        setOriginalText('');
        setShowOriginal(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 mb-4 shadow-2xl shadow-purple-500/30"
                >
                    <ShieldCheck className="w-10 h-10 text-white" />
                </motion.div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                    Intelligent Redaction
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                    Watch AI scan & black out sensitive data in real-time
                </p>
            </div>

            {/* Main Content */}
            <AnimatePresence mode="wait">
                {!result ? (
                    <motion.div
                        key="upload"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="card p-8 space-y-8 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl"
                    >
                        <PDFDropzone
                            files={files}
                            onFilesChange={setFiles}
                            multiple={false}
                            maxFiles={1}
                        />

                        {/* Redaction Type Selection */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-500" />
                                Select Data Types to Redact
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {redactionOptions.map((option) => (
                                    <motion.button
                                        key={option.id}
                                        onClick={() => toggleType(option.id)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${selectedTypes.includes(option.id)
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="text-2xl mb-2">{option.icon}</div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {option.label}
                                        </div>
                                        {selectedTypes.includes(option.id) && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center"
                                            >
                                                <Check className="w-3 h-3 text-white" />
                                            </motion.div>
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Redact Button */}
                        <motion.button
                            onClick={handleRedact}
                            disabled={files.length === 0 || isProcessing || selectedTypes.length === 0}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white font-semibold text-lg shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    <span>Scanning Document...</span>
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="w-6 h-6" />
                                    <span>Redact Sensitive Data</span>
                                </>
                            )}
                        </motion.button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="card p-8 space-y-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl"
                    >
                        {/* Result Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                                    <ShieldCheck className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        Redaction Complete!
                                    </h3>
                                    <p className="text-gray-500">
                                        {result.maskedCount} item{result.maskedCount !== 1 ? 's' : ''} redacted
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowOriginal(!showOriginal)}
                                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    title={showOriginal ? 'Show redacted' : 'Show original'}
                                >
                                    {showOriginal ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Redacted Text Display */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 rounded-xl blur-xl" />
                            <div className="relative bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
                                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                                    {isAnimating ? (
                                        <motion.span
                                            initial={{ opacity: 0.5 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ repeat: Infinity, duration: 0.5 }}
                                        >
                                            {displayText}
                                        </motion.span>
                                    ) : (
                                        displayText || result.maskedText
                                    )}
                                </pre>
                            </div>
                        </div>

                        {/* Redaction Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {selectedTypes.map((type) => {
                                const option = redactionOptions.find(o => o.id === type);
                                if (!option) return null;
                                return (
                                    <div
                                        key={type}
                                        className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 text-center"
                                    >
                                        <div className="text-2xl mb-1">{option.icon}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{option.label}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <motion.button
                                onClick={handleCopy}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                {copied ? 'Copied!' : 'Copy Redacted Text'}
                            </motion.button>
                            <motion.button
                                onClick={handleReset}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="py-3 px-6 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-5 h-5" />
                                New Document
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
