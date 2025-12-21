'use client';

import { useAuthStore } from '@/lib/store';

import Link from 'next/link';
import Image from 'next/image';
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
    Play,
    Star,
    Users,
    Globe,
    CheckCircle,
    Award,
    Type
} from 'lucide-react';

const tools = [
    { name: 'Merge PDF', icon: Merge, color: 'from-blue-500 to-indigo-600', href: '/tools/merge' },
    { name: 'Split PDF', icon: Scissors, color: 'from-purple-500 to-pink-600', href: '/tools/split' },
    { name: 'Compress', icon: Minimize2, color: 'from-emerald-500 to-teal-600', href: '/tools/compress' },
    { name: 'Rotate', icon: RotateCw, color: 'from-orange-500 to-amber-600', href: '/tools/rotate' },
    { name: 'Draw Text', icon: Type, color: 'from-indigo-500 to-purple-600', href: '/tools/draw-text' },
    { name: 'Add Badge', icon: Award, color: 'from-yellow-400 to-orange-500', href: '/tools/add-badge' },
    { name: 'OCR Extract', icon: FileSearch, color: 'from-pink-500 to-rose-600', href: '/ai/ocr' },
    { name: 'AI Summary', icon: Brain, color: 'from-cyan-500 to-blue-600', href: '/ai/summarize' },
];

const features = [
    {
        icon: Zap,
        title: 'Lightning Fast',
        description: 'Process your PDFs in seconds with our Go-powered backend',
        gradient: 'from-yellow-400 to-orange-500',
    },
    {
        icon: Shield,
        title: 'Bank-Grade Security',
        description: 'Your files are encrypted and auto-deleted after processing',
        gradient: 'from-green-400 to-emerald-600',
    },
    {
        icon: Brain,
        title: 'AI-Powered Magic',
        description: 'Extract text, summarize content, detect sensitive data instantly',
        gradient: 'from-purple-500 to-pink-600',
    },
    {
        icon: Sparkles,
        title: 'Premium Output',
        description: 'Watermarks, badges, custom text - make PDFs truly yours',
        gradient: 'from-cyan-400 to-blue-600',
    },
];

const stats = [
    { value: '10M+', label: 'PDFs Processed', icon: FileText },
    { value: '500K+', label: 'Happy Users', icon: Users },
    { value: '99.9%', label: 'Uptime', icon: Globe },
    { value: '4.9', label: 'User Rating', icon: Star },
];

export default function HomePage() {
    const { isAuthenticated } = useAuthStore();
    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 z-0">
                <Image
                    src="/images/hero-bg.png"
                    alt="Background"
                    fill
                    className="object-cover opacity-60"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950"></div>
                {/* Animated Orbs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-950/50 border-b border-white/5">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            BrainyPDF
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors font-medium">
                            Pricing
                        </Link>
                        {isAuthenticated ? (
                            <>
                                <Link href="/tools" className="text-gray-300 hover:text-white transition-colors font-medium">
                                    Tools
                                </Link>
                                <Link href="/ai/chat" className="text-gray-300 hover:text-white transition-colors font-medium">
                                    AI Features
                                </Link>
                                <Link href="/dashboard" className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium border border-white/10">
                                    Dashboard
                                </Link>
                            </>
                        ) : (
                            <Link href="/login" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 transition-all font-semibold shadow-lg shadow-purple-500/25">
                                Get Started
                            </Link>
                        )}
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative z-10 pt-40 pb-24 px-6">
                <div className="container mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-sm text-gray-300">Trusted by 500K+ professionals worldwide</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
                            <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                                Transform PDFs
                            </span>
                            <br />
                            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                with AI Magic
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
                            The most powerful PDF toolkit on the planet. Merge, split, compress,
                            add custom text, badges, and unlock AI-powered insights — all in one place.
                        </p>

                        <div className="flex flex-wrap gap-4 justify-center mb-16">
                            <Link href="/login" className="group px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 transition-all font-semibold text-lg shadow-2xl shadow-purple-500/30 flex items-center gap-2">
                                Get Started Free
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link href="/pricing" className="px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors font-semibold text-lg border border-white/10 flex items-center gap-2">
                                View Pricing
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                                    className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
                                >
                                    <stat.icon className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
                                    <div className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{stat.value}</div>
                                    <div className="text-sm text-gray-500">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Tools Grid */}
            <section className="relative z-10 py-24 px-6">
                <div className="container mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                Powerful Tools at Your Fingertips
                            </span>
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            From basic operations to AI-powered magic. No learning curve.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {tools.map((tool, index) => (
                            <motion.div
                                key={tool.name}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                            >
                                <Link href="/login" className="group block p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all hover:scale-105">
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                                        <tool.icon className="w-7 h-7 text-white" />
                                    </div>
                                    <span className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                                        {tool.name}
                                    </span>
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    <div className="text-center mt-10">
                        <Link href="/login" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium text-lg">
                            Sign In to Access All Tools
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative z-10 py-24 px-6">
                <div className="container mx-auto">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                                className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 py-24 px-6">
                <div className="container mx-auto">
                    <div className="relative rounded-3xl overflow-hidden">
                        {/* Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 via-purple-600 to-pink-600"></div>
                        <div className="absolute inset-0 bg-[url('/images/hero-bg.png')] opacity-20 mix-blend-overlay"></div>

                        <div className="relative p-12 md:p-20 text-center">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                                Ready to Transform Your PDFs?
                            </h2>
                            <p className="text-white/80 text-xl max-w-2xl mx-auto mb-10">
                                Join 500K+ professionals who trust BrainyPDF. Start free — no credit card required.
                            </p>
                            <div className="flex flex-wrap gap-4 justify-center">
                                <Link href="/login" className="px-8 py-4 bg-white text-purple-600 font-bold rounded-xl hover:bg-gray-100 transition-colors text-lg shadow-xl flex items-center gap-2">
                                    Get Started Free
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                                <Link href="/pricing" className="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-lg border border-white/20">
                                    View Pricing
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-16 px-6 border-t border-white/10">
                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                                BrainyPDF
                            </span>
                        </div>
                        <div className="flex items-center gap-6 text-gray-400 text-sm">
                            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
                            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
                        </div>
                        <p className="text-gray-500 text-sm">
                            © 2025 BrainyPDF. Crafted with ❤️ by Aayush
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
