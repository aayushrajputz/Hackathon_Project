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
    LayoutDashboard,
    ArrowUpRight,
    HardDrive
} from 'lucide-react';
import clsx from 'clsx';

const quickTools = [
    { name: 'Merge PDFs', icon: Merge, href: '/tools/merge' },
    { name: 'Split PDF', icon: Scissors, href: '/tools/split' },
    { name: 'Compress', icon: Minimize2, href: '/tools/compress' },
    { name: 'OCR Extract', icon: FileSearch, href: '/ai/ocr' },
    { name: 'AI Summary', icon: Brain, href: '/ai/summarize' },
    { name: 'Rotate PDF', icon: RotateCw, href: '/tools/rotate' },
];

const coreTools = [
    {
        name: 'Merge',
        href: '/tools/merge',
        icon: Merge,
        description: 'Combine multiple PDFs into one',
    },
    {
        name: 'Split',
        href: '/tools/split',
        icon: Scissors,
        description: 'Split your PDF into separate files',
    },
    {
        name: 'Compress',
        href: '/tools/compress',
        icon: Minimize2,
        description: 'Reduce file size while keeping quality',
    },
    {
        name: 'Organize',
        href: '/tools/organize',
        icon: Layers,
        description: 'Reorder or remove pages',
    },
];

const aiIntelligence = [
    {
        name: 'OCR Scanner',
        href: '/ai/ocr',
        icon: FileSearch,
        description: 'Extract text from scanned documents',
    },
    {
        name: 'AI Summarizer',
        href: '/ai/summarize',
        icon: Brain,
        description: 'Get an AI summary of any document',
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

    const storageUsage = user ? (user.storageUsed || 0) / (user.storageLimit || 10 * 1024 * 1024) : 0;
    const storagePercent = Math.min(100, Math.round(storageUsage * 100));

    return (
        <div className="relative min-h-screen pb-20 bg-slate-50 font-sans">
            {/* Background elements */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-12"
            >
                {/* Premium Hero Section */}
                <section className="relative overflow-hidden rounded-[3rem] bg-white border border-slate-200 p-8 md:p-14 shadow-sm group">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-blue-50 to-transparent blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-1000"></div>

                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                        <div className="space-y-6 text-center lg:text-left">
                            <motion.div
                                variants={itemVariants}
                                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm"
                            >
                                <Zap className="w-3.5 h-3.5" />
                                Active
                            </motion.div>
                            <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
                                Hello, <br />
                                <span className="text-blue-600">{user?.displayName?.split(' ')[0] || 'User'}</span>
                            </motion.h1>
                            <motion.p variants={itemVariants} className="text-slate-500 text-lg font-medium max-w-md leading-relaxed">
                                Welcome back! All your tools are ready and your workspace is optimized.
                            </motion.p>
                        </div>

                        <motion.div
                            variants={itemVariants}
                            className="w-full lg:w-96 space-y-4"
                        >
                            <div className="bg-slate-50/80 backdrop-blur-sm p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <HardDrive className="w-4 h-4 text-slate-400" />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Storage used</span>
                                        </div>
                                        <span className={clsx(
                                            "text-xs font-black",
                                            storagePercent > 90 ? "text-rose-600" : "text-blue-600"
                                        )}>{storagePercent}%</span>
                                    </div>
                                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner p-0.5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${storagePercent}%` }}
                                            className={clsx(
                                                "h-full rounded-full shadow-sm",
                                                storagePercent > 90 ? "bg-rose-500" : "bg-blue-600"
                                            )}
                                        />
                                    </div>
                                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-tighter">
                                        {formatBytes(user?.storageUsed || 0)} OF {formatBytes(user?.storageLimit || 10485760)}
                                    </p>
                                </div>

                                <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Plan</p>
                                        <p className="text-xs font-black text-slate-900 uppercase">{user?.plan || 'Free'} Plan</p>
                                    </div>
                                    <Link
                                        href="/plans"
                                        className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-500 transition-all shadow-sm"
                                    >
                                        <ArrowUpRight className="w-5 h-5 text-blue-600" />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Quick Actions Panel */}
                <section className="space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center border border-blue-200 shadow-sm">
                                <Clock className="w-5 h-5 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Quick Tools</h2>
                        </div>
                        <Link href="/tools" className="text-xs font-black text-blue-600 uppercase tracking-widest hover:translate-x-1 transition-transform inline-flex items-center gap-2">
                            Explore All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
                        {quickTools.map((tool) => (
                            <motion.div key={tool.name} variants={itemVariants}>
                                <Link
                                    href={tool.href}
                                    className="group relative flex flex-col items-center gap-5 p-8 bg-white rounded-[2.5rem] border border-slate-200 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-2 shadow-sm"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner">
                                        <tool.icon className="w-8 h-8" />
                                    </div>
                                    <span className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight text-center leading-tight">
                                        {tool.name}
                                    </span>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Processing and AI Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Document Engine */}
                    <section className="space-y-8">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center border border-blue-200">
                                <Grid className="w-5 h-5 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">All Tools</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {coreTools.map((tool) => (
                                <motion.div key={tool.name} variants={itemVariants}>
                                    <Link
                                        href={tool.href}
                                        className="block p-8 rounded-[2.5rem] bg-white border border-slate-200 transition-all duration-500 group hover:shadow-xl hover:-translate-y-2 shadow-sm hover:border-blue-300"
                                    >
                                        <div className="flex items-start justify-between mb-8">
                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-blue-100 bg-blue-50 transition-all duration-500 group-hover:scale-110 shadow-sm">
                                                <tool.icon className="w-7 h-7 text-blue-600" />
                                            </div>
                                            <div className="p-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                                                <ArrowRight className="w-5 h-5 text-blue-500" />
                                            </div>
                                        </div>
                                        <h3 className="text-slate-900 font-black text-xl mb-2">{tool.name}</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed font-bold opacity-80 group-hover:opacity-100">{tool.description}</p>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* AI & Labs */}
                    <section className="space-y-8">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center border border-blue-500 shadow-lg shadow-blue-500/20">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI Tools</h2>
                        </div>

                        <div className="space-y-5">
                            {aiIntelligence.map((tool) => (
                                <motion.div key={tool.name} variants={itemVariants}>
                                    <Link
                                        href={tool.href}
                                        className="flex items-center gap-8 p-8 rounded-[3rem] bg-white border border-slate-200 transition-all duration-500 group hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/10 shadow-sm"
                                    >
                                        <div className="w-20 h-20 shrink-0 rounded-[2rem] flex items-center justify-center bg-blue-50 border border-blue-100 transition-all duration-500 group-hover:scale-110 shadow-inner">
                                            <tool.icon className="w-10 h-10 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-slate-900 font-black text-2xl mb-1">{tool.name}</h3>
                                            <p className="text-slate-500 text-sm leading-relaxed font-bold">{tool.description}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                            <ArrowRight className="w-5 h-5" />
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}

                            <motion.div
                                variants={itemVariants}
                                className="relative overflow-hidden p-10 rounded-[3rem] bg-slate-900 border border-slate-800 shadow-2xl group cursor-pointer"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 opacity-10 rounded-full blur-[80px] group-hover:opacity-20 transition-all duration-1000"></div>
                                <div className="relative z-10 space-y-6">
                                    <div className="space-y-3">
                                        <h3 className="text-3xl font-black text-white tracking-tight">Get more storage</h3>
                                        <p className="text-slate-400 font-medium max-w-xs text-lg">Upgrade to a paid plan for more storage and priority processing.</p>
                                    </div>
                                    <Link
                                        href="/plans"
                                        className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-blue-600 text-white text-sm font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-1 transition-all"
                                    >
                                        Upgrade to Pro
                                        <Zap className="w-4 h-4 fill-current" />
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
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
