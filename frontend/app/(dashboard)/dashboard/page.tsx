'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import {
    Merge,
    Scissors,
    RotateCw,
    Minimize2,
    FileOutput,
    Layers,
    Droplet,
    Hash,
    FileSearch,
    Brain,
    Shield,
    Search,
    ArrowRight,
    FileText,
    Clock,
    RefreshCw,
    Crop,
    FileSpreadsheet,
    Presentation,
    File,
    Sparkles,
    Zap,
    Grid,
    LayoutDashboard
} from 'lucide-react';
import clsx from 'clsx';

const quickTools = [
    { name: 'Merge PDFs', icon: Merge, href: '/tools/merge', color: 'bg-blue-500' },
    { name: 'Split PDF', icon: Scissors, href: '/tools/split', color: 'bg-purple-500' },
    { name: 'Compress', icon: Minimize2, href: '/tools/compress', color: 'bg-emerald-500' },
    { name: 'OCR Extract', icon: FileSearch, href: '/ai/ocr', color: 'bg-amber-500' },
    { name: 'AI Summary', icon: Brain, href: '/ai/summarize', color: 'bg-indigo-500' },
    { name: 'Rotate Pages', icon: RotateCw, href: '/tools/rotate', color: 'bg-orange-500' },
];

const allTools = [
    {
        name: 'Merge',
        href: '/tools/merge',
        icon: Merge,
        description: 'Combine multiple PDFs into one',
        color: 'from-blue-500/20 to-blue-600/20',
        borderColor: 'border-blue-500/30',
        glow: 'shadow-blue-500/10'
    },
    {
        name: 'Split',
        href: '/tools/split',
        icon: Scissors,
        description: 'Divide PDF by choosing page ranges',
        color: 'from-purple-500/20 to-purple-600/20',
        borderColor: 'border-purple-500/30',
        glow: 'shadow-purple-500/10'
    },
    {
        name: 'Compress',
        href: '/tools/compress',
        icon: Minimize2,
        description: 'Reduce size while keeping quality',
        color: 'from-emerald-500/20 to-emerald-600/20',
        borderColor: 'border-emerald-500/30',
        glow: 'shadow-emerald-500/10'
    },
    {
        name: 'Organize',
        href: '/tools/organize',
        icon: Layers,
        description: 'Reorder or delete document pages',
        color: 'from-cyan-500/20 to-cyan-600/20',
        borderColor: 'border-cyan-500/30',
        glow: 'shadow-cyan-500/10'
    },
];

const aiTools = [
    {
        name: 'OCR Scanner',
        href: '/ai/ocr',
        icon: FileSearch,
        description: 'Extract text from any scanned PDF',
        color: 'from-amber-500/20 to-orange-600/20',
        borderColor: 'border-amber-500/30',
        glow: 'shadow-amber-500/10'
    },
    {
        name: 'AI Intelligence',
        href: '/ai/summarize',
        icon: Brain,
        description: 'Summarize long documents instantly',
        color: 'from-indigo-500/20 to-blue-600/20',
        borderColor: 'border-indigo-500/30',
        glow: 'shadow-indigo-500/10'
    },
];

export default function DashboardPage() {
    const { user, syncStorage } = useAuthStore();

    React.useEffect(() => {
        if (user) {
            syncStorage();
        }
    }, [user, syncStorage]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="relative min-h-screen pb-20">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] -z-10 animate-pulse-slow delay-1000"></div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-12"
            >
                {/* Hero / Welcome Section */}
                <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-white/5 p-8 md:p-12">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-transparent blur-3xl"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="space-y-4 text-center md:text-left">
                            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                                <Zap className="w-3 h-3" />
                                Systems Operational
                            </motion.div>
                            <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl font-black text-white leading-tight">
                                Welcome back, <br />
                                <span className="text-gradient-premium">{user?.displayName?.split(' ')[0] || 'Explorer'}</span>
                            </motion.h1>
                            <motion.p variants={itemVariants} className="text-slate-400 font-medium max-w-md">
                                Your digital workspace is optimized and ready. What premium operation would you like to perform?
                            </motion.p>
                        </div>

                        <motion.div
                            variants={itemVariants}
                            className="w-full md:w-auto grid grid-cols-2 gap-4"
                        >
                            <div className="glass-card p-6 border-white/10 text-center space-y-2">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Plan</p>
                                <p className="text-xl font-black text-white capitalize">{user?.plan || 'Free'}</p>
                            </div>
                            <div className="glass-card p-6 border-white/10 text-center space-y-2">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Storage Status</p>
                                <p className="text-xl font-black text-cyan-400">
                                    {Math.round((user?.storageUsed || 0) / (user?.storageLimit || 1) * 100)}%
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Quick Launch Panel */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                                <Clock className="w-5 h-5 text-cyan-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Quick Launch</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                        {quickTools.map((tool) => (
                            <motion.div key={tool.name} variants={itemVariants}>
                                <Link
                                    href={tool.href}
                                    className="group relative flex flex-col items-center gap-4 p-6 glass-card border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div className={clsx(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6",
                                        tool.color,
                                        "shadow-inner bg-opacity-10 border border-white/5"
                                    )}>
                                        <tool.icon className="w-7 h-7 text-white" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{tool.name}</span>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Main Tools Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Core Processing */}
                    <section className="space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                <Grid className="w-5 h-5 text-purple-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Document Processing</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {allTools.map((tool) => (
                                <motion.div key={tool.name} variants={itemVariants}>
                                    <Link
                                        href={tool.href}
                                        className={clsx(
                                            "block p-6 rounded-[2rem] bg-slate-900/50 border backdrop-blur-sm transition-all duration-500 group",
                                            tool.borderColor,
                                            "hover:bg-slate-900"
                                        )}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={clsx(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center border bg-gradient-to-br transition-all duration-500 group-hover:scale-110",
                                                tool.color,
                                                tool.borderColor
                                            )}>
                                                <tool.icon className="w-6 h-6 text-white" />
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                        </div>
                                        <h3 className="text-white font-bold text-lg mb-1">{tool.name}</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed">{tool.description}</p>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* AI & Intelligence */}
                    <section className="space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <Sparkles className="w-5 h-5 text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">AI Intelligence</h2>
                        </div>

                        <div className="space-y-4">
                            {aiTools.map((tool) => (
                                <motion.div key={tool.name} variants={itemVariants}>
                                    <Link
                                        href={tool.href}
                                        className={clsx(
                                            "flex items-center gap-6 p-6 rounded-[2rem] bg-slate-900/50 border border-white/5 backdrop-blur-sm transition-all duration-500 group hover:border-white/10 hover:bg-slate-900"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-16 h-16 shrink-0 rounded-3xl flex items-center justify-center border bg-gradient-to-br transition-all duration-500 group-hover:scale-110",
                                            tool.color,
                                            tool.borderColor
                                        )}>
                                            <tool.icon className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-white font-black text-xl mb-1">{tool.name}</h3>
                                            <p className="text-slate-400 text-sm leading-relaxed">{tool.description}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                            <ArrowRight className="w-5 h-5 text-white" />
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>

                        {/* Upgrade CTA Card */}
                        <motion.div
                            variants={itemVariants}
                            className="relative overflow-hidden p-8 rounded-[2.5rem] bg-gradient-to-br from-cyan-500 to-purple-600 border border-white/20 group cursor-pointer"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="relative z-10 space-y-4">
                                <h3 className="text-2xl font-black text-white">Unlock Full Power</h3>
                                <p className="text-white/80 font-medium max-w-xs">Get unlimited AI extractions, larger file sizes, and premium cloud storage.</p>
                                <Link
                                    href="/plans"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-slate-950 text-sm font-bold shadow-xl hover:scale-105 transition-transform"
                                >
                                    Boost Your Plan
                                    <Zap className="w-4 h-4 fill-current" />
                                </Link>
                            </div>
                        </motion.div>
                    </section>
                </div>
            </motion.div>
        </div>
    );
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
