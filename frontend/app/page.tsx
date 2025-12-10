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
} from 'lucide-react';

const tools = [
    { name: 'Merge PDF', icon: Merge, color: 'from-blue-500 to-blue-600', href: '/tools/merge' },
    { name: 'Split PDF', icon: Scissors, color: 'from-purple-500 to-purple-600', href: '/tools/split' },
    { name: 'Compress', icon: Minimize2, color: 'from-green-500 to-green-600', href: '/tools/compress' },
    { name: 'Rotate', icon: RotateCw, color: 'from-orange-500 to-orange-600', href: '/tools/rotate' },
    { name: 'OCR Extract', icon: FileSearch, color: 'from-pink-500 to-pink-600', href: '/ai/ocr' },
    { name: 'AI Summary', icon: Brain, color: 'from-indigo-500 to-indigo-600', href: '/ai/summarize' },
];

const features = [
    {
        icon: Zap,
        title: 'Lightning Fast',
        description: 'Process your PDFs in seconds with our optimized backend',
    },
    {
        icon: Shield,
        title: 'Secure & Private',
        description: 'Your files are encrypted and automatically deleted after processing',
    },
    {
        icon: Brain,
        title: 'AI-Powered',
        description: 'Extract text, summarize content, and detect sensitive data with AI',
    },
    {
        icon: Sparkles,
        title: 'Beautiful Output',
        description: 'High-quality results with watermarks, page numbers, and more',
    },
];

export default function HomePage() {
    const { isAuthenticated } = useAuthStore();
    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 glass">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold gradient-text">BrainyPDF</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="/tools" className="text-gray-600 hover:text-primary-600 transition-colors">
                            Tools
                        </Link>
                        <Link href="/ai" className="text-gray-600 hover:text-primary-600 transition-colors">
                            AI Features
                        </Link>
                        {isAuthenticated ? (
                            <Link href="/dashboard" className="btn-secondary">
                                Dashboard
                            </Link>
                        ) : (
                            <Link href="/login" className="btn-secondary">
                                Sign In
                            </Link>
                        )}
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="container mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-bold mb-6">
                            <span className="gradient-text">Transform</span> Your PDFs
                            <br />
                            with <span className="gradient-text">AI Power</span>
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
                            Merge, split, compress, extract text, and unlock the full potential of your documents
                            with our intelligent PDF toolkit.
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link href="/tools" className="btn-primary flex items-center gap-2">
                                Get Started Free
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            {isAuthenticated ? (
                                <Link href="/dashboard" className="btn-secondary">
                                    Dashboard
                                </Link>
                            ) : (
                                <Link href="/login" className="btn-secondary">
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Tools Grid */}
            <section className="py-20 px-6 bg-white/50 dark:bg-slate-900/50">
                <div className="container mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            All the Tools You Need
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
                            From basic operations to AI-powered features, we've got you covered.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {tools.map((tool, index) => (
                            <motion.div
                                key={tool.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                            >
                                <Link href={tool.href} className="tool-card group">
                                    <div className={`tool-icon bg-gradient-to-br ${tool.color} group-hover:scale-110 transition-transform`}>
                                        <tool.icon className="w-7 h-7" />
                                    </div>
                                    <span className="font-medium text-gray-700 dark:text-gray-200">
                                        {tool.name}
                                    </span>
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    <div className="text-center mt-8">
                        <Link href="/tools" className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1">
                            View All Tools
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-6">
                <div className="container mx-auto">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                                className="card p-6"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                                    <feature.icon className="w-6 h-6 text-primary-600" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="container mx-auto">
                    <div className="card p-12 text-center bg-gradient-to-br from-primary-500 to-purple-600">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Ready to Transform Your PDFs?
                        </h2>
                        <p className="text-white/80 max-w-xl mx-auto mb-8">
                            Start using BrainyPDF for free. No registration required for basic features.
                        </p>
                        <Link href="/tools" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors">
                            Start Now
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-gray-200 dark:border-slate-700">
                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-semibold">BrainyPDF</span>
                        </div>
                        <p className="text-gray-500 text-sm">
                            © 2024 BrainyPDF. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
