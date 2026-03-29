'use client';

import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    FileText,
    Merge,
    Scissors,
    RotateCw,
    Minimize2,
    FileSearch,
    Brain,
    Shield,
    Sparkles,
    ArrowRight,
    Zap,
    Star,
    Users,
    Globe,
    Award,
    Type,
    CheckCircle2,
    Cloud,
    ShieldCheck,
    Cpu
} from 'lucide-react';
import clsx from 'clsx';

const tools = [
    { name: 'Merge PDF', icon: Merge, href: '/tools/merge' },
    { name: 'Split PDF', icon: Scissors, href: '/tools/split' },
    { name: 'Compress', icon: Minimize2, href: '/tools/compress' },
    { name: 'Rotate', icon: RotateCw, href: '/tools/rotate' },
    { name: 'Draw Text', icon: Type, href: '/tools/draw-text' },
    { name: 'Add Badge', icon: Award, href: '/tools/add-badge' },
    { name: 'OCR Extract', icon: FileSearch, href: '/ai/ocr' },
    { name: 'AI Summary', icon: Brain, href: '/ai/summarize' },
];

const features = [
    {
        icon: Zap,
        title: 'Fast Processing',
        description: 'Merge and split PDFs in seconds. No waiting in long queues.',
    },
    {
        icon: ShieldCheck,
        title: 'Privacy First',
        description: 'Your documents are your business. We delete all files immediately after processing.',
    },
    {
        icon: Brain,
        title: 'AI Summaries',
        description: 'Get key insights from long documents without reading every page.',
    },
    {
        icon: Sparkles,
        title: 'Clean Design',
        description: 'No complex menus or cluttered interfaces. Just straightforward tools.',
    },
];

// Stats removed - minimal brand approach

export default function HomePage() {
    const { isAuthenticated } = useAuthStore();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-100/40 rounded-full blur-[160px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-50/60 rounded-full blur-[140px] animate-pulse-slow delay-700"></div>
            </div>

            {/* Premium Navigation */}
            <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
                <nav className="container mx-auto px-6 py-5">
                    <div className="bg-white/70 backdrop-blur-2xl border border-white/40 shadow-xl shadow-blue-500/5 rounded-[2.5rem] px-8 py-4 flex items-center justify-between">
                        <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-3.5 group">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                                <FileText className="w-7 h-7 text-white" />
                            </div>
                            <span className="text-2xl font-black text-slate-900 tracking-tighter">
                                Binary<span className="text-blue-600">PDF</span>
                            </span>
                        </Link>

                        <div className="hidden lg:flex items-center gap-10">
                            {['Tools', 'AI Features', 'Pricing', 'Documentation'].map((item) => (
                                <Link
                                    key={item}
                                    href={`/${item.toLowerCase().replace(' ', '-')}`}
                                    className="text-sm font-black text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-[0.15em]"
                                >
                                    {item}
                                </Link>
                            ))}
                        </div>

                        <div className="flex items-center gap-4">
                            {isAuthenticated ? (
                                <Link href="/dashboard" className="px-8 py-3.5 rounded-2xl bg-blue-600 text-white font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 hover:-translate-y-0.5">
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login" className="hidden sm:block text-sm font-black text-slate-900 uppercase tracking-widest px-6">
                                        Login
                                    </Link>
                                    <Link href="/login" className="px-8 py-3.5 rounded-2xl bg-blue-600 text-white font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 hover:-translate-y-0.5">
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <section className="relative z-10 pt-48 pb-32 px-6">
                <div className="container mx-auto text-center space-y-12">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="space-y-8"
                    >
                        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-blue-50 border border-blue-100 shadow-sm">
                            <Cloud className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-blue-800 font-black uppercase tracking-[0.2em]">Built for students and small businesses</span>
                        </div>

                        <h1 className="text-5xl md:text-8xl lg:text-9xl font-black text-slate-900 leading-[0.95] tracking-tight">
                            PDF Tools. <br />
                            <span className="text-blue-600">Simplified.</span>
                        </h1>

                        <p className="text-lg md:text-2xl text-slate-500 max-w-3xl mx-auto font-medium leading-relaxed">
                            No complex menus, no annoying popups. Just high-quality tools to merge, split, and compress your PDFs in seconds.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-5 justify-center pt-8">
                            <Link href="/tools/merge" className="px-12 py-6 bg-blue-600 text-white font-black rounded-3xl text-lg uppercase tracking-widest hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/40 hover:-translate-y-1 flex items-center justify-center gap-4 group">
                                Try Merge PDF
                                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                            </Link>
                            <Link href="/login" className="px-12 py-6 bg-white text-slate-900 font-black rounded-3xl text-lg uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all shadow-lg hover:-translate-y-1">
                                Create Free Account
                            </Link>
                        </div>
                    </motion.div>

                    {/* Value Prop Section (Replacing Stats) */}
                    <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto pt-24 text-left">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="space-y-4"
                        >
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Private Storage</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                Save your processed files to your secure library. Access them from any device, anytime. No more searching through downloads.
                            </p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                            className="space-y-4"
                        >
                            <h3 className="text-2xl font-black text-blue-600 uppercase tracking-tight">Shareable Links</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                Generate temporary links to share your PDFs with clients or colleagues instantly. Control who sees your work without attachments.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Tools Ecosystem */}
            <section className="relative z-10 py-32 px-6 bg-white border-y border-slate-200 shadow-sm">
                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8 text-center md:text-left">
                        <div className="space-y-4">
                            <div className="text-blue-600 font-black uppercase tracking-[0.3em] text-xs">Features</div>
                            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none">
                                Everything you <span className="text-blue-600">need</span>
                            </h2>
                        </div>
                        <p className="text-slate-500 font-bold max-w-md text-lg leading-relaxed">
                            A simple yet powerful set of tools to help you manage your documents efficiently.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {tools.map((tool, index) => (
                            <motion.div
                                key={tool.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link href="/login" className="group block p-10 rounded-[3rem] bg-slate-50 border border-slate-100 hover:bg-white hover:border-blue-500 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                                    <div className="w-20 h-20 rounded-[1.5rem] bg-white flex items-center justify-center mb-10 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border border-slate-100">
                                        <tool.icon className="w-10 h-10 text-blue-600" />
                                    </div>
                                    <h3 className="font-black text-2xl text-slate-900 mb-2 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                                        {tool.name}
                                    </h3>
                                    <div className="flex items-center gap-2 pt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        Active Module
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* AI Capability Section */}
            <section className="relative z-10 py-32 px-6 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,#dbeafe_0%,transparent_70%)] opacity-30"></div>

                <div className="container mx-auto">
                    <div className="grid lg:grid-cols-12 gap-16 items-center">
                        <div className="lg:col-span-12 grid md:grid-cols-4 gap-8">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="p-10 rounded-[3rem] bg-white border border-slate-200 hover:border-blue-300 transition-all shadow-sm"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-8 shadow-xl shadow-blue-500/20 text-white">
                                        <feature.icon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-black mb-4 text-slate-900 tracking-tight uppercase">{feature.title}</h3>
                                    <p className="text-slate-500 font-bold leading-relaxed">{feature.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* High Impact CTA */}
            <section className="relative z-10 py-32 px-6">
                <div className="container mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="relative rounded-[4rem] overflow-hidden bg-slate-900 p-16 md:p-24 text-center shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[160px] opacity-20"></div>
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500 rounded-full blur-[140px] opacity-10"></div>

                        <div className="relative z-10 max-w-3xl mx-auto space-y-10">
                            <h2 className="text-4xl md:text-7xl font-black text-white leading-tight tracking-tight">
                                Ready to <br />
                                get <span className="text-blue-600">started</span>?
                            </h2>
                            <p className="text-slate-400 text-xl font-medium leading-relaxed">
                                Join thousands of students and freelancers who trust BinaryPDF for their document work.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
                                <Link href="/login" className="px-12 py-5 bg-blue-600 text-white font-black rounded-2xl text-lg uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 hover:-translate-y-1">
                                    Create Free Account
                                </Link>
                                <Link href="/pricing" className="px-12 py-5 bg-slate-800 text-white font-black rounded-2xl text-lg uppercase tracking-widest border border-slate-700 hover:bg-slate-700 transition-all hover:-translate-y-1">
                                    View Pricing
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Minimalist Footer */}
            <footer className="relative z-10 py-16 px-6 border-t border-slate-100 bg-white">
                <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center p-2 shadow-sm">
                            <FileText className="w-full h-full text-white" />
                        </div>
                        <span className="text-xl font-black text-slate-900 tracking-tighter">BinaryPDF</span>
                    </Link>

                    <div className="flex gap-12">
                        {['Security', 'Privacy', 'Status', 'API'].map((item) => (
                            <Link key={item} href="/" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
                                {item}
                            </Link>
                        ))}
                    </div>

                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        &copy; 2025 ALL RIGHTS RESERVED
                    </div>
                </div>
            </footer>
        </div>
    );
}
