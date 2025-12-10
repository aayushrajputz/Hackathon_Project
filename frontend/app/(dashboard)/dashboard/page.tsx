'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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

} from 'lucide-react';

const quickTools = [
    { name: 'Merge PDFs', icon: Merge, href: '/tools/merge', color: 'from-blue-500 to-blue-600' },
    { name: 'Split PDF', icon: Scissors, href: '/tools/split', color: 'from-purple-500 to-purple-600' },
    { name: 'Compress', icon: Minimize2, href: '/tools/compress', color: 'from-green-500 to-green-600' },
    { name: 'OCR Extract', icon: FileSearch, href: '/ai/ocr', color: 'from-pink-500 to-pink-600' },
    { name: 'AI Summary', icon: Brain, href: '/ai/summarize', color: 'from-indigo-500 to-indigo-600' },
    { name: 'Rotate Pages', icon: RotateCw, href: '/tools/rotate', color: 'from-orange-500 to-orange-600' },
];

const allTools = [
    {
        name: 'Merge',
        href: '/tools/merge',
        icon: Merge,
        description: 'Combine multiple PDFs',
        color: 'from-blue-500 to-blue-600',
        format: 'PDFs → PDF'
    },
    {
        name: 'Split',
        href: '/tools/split',
        icon: Scissors,
        description: 'Divide PDF by pages',
        color: 'from-purple-500 to-purple-600',
        format: 'PDF → PDFs'
    },
    {
        name: 'Rotate',
        href: '/tools/rotate',
        icon: RotateCw,
        description: 'Rotate pages',
        color: 'from-orange-500 to-orange-600',
        format: 'PDF → PDF'
    },
    {
        name: 'Compress',
        href: '/tools/compress',
        icon: Minimize2,
        description: 'Reduce file size',
        color: 'from-emerald-500 to-emerald-600',
        format: 'PDF → PDF'
    },
    {
        name: 'Extract',
        href: '/tools/extract',
        icon: FileOutput,
        description: 'Extract specific pages',
        color: 'from-pink-500 to-pink-600',
        format: 'PDF → PDF'
    },
    {
        name: 'Organize',
        href: '/tools/organize',
        icon: Layers,
        description: 'Reorder pages',
        color: 'from-sky-500 to-sky-600',
        format: 'PDF → PDF'
    },
    {
        name: 'Watermark',
        href: '/tools/watermark',
        icon: Droplet,
        description: 'Add text watermark',
        color: 'from-cyan-500 to-cyan-600',
        format: 'PDF → PDF'
    },
    {
        name: 'Page Numbers',
        href: '/tools/page-numbers',
        icon: Hash,
        description: 'Add page numbers',
        color: 'from-teal-500 to-teal-600',
        format: 'PDF → PDF'
    },
    {
        name: 'Crop',
        href: '/tools/crop',
        icon: Crop,
        description: 'Crop pages',
        color: 'from-red-500 to-red-600',
        format: 'PDF → PDF'
    },
    {
        name: 'Convert Docs',
        href: '/tools/convert',
        icon: RefreshCw,
        description: 'Convert documents',
        color: 'from-violet-500 to-violet-600',
        format: 'DOC, XLS ↔ PDF'
    },
];

const aiTools = [
    {
        name: 'OCR',
        href: '/ai/ocr',
        icon: FileSearch,
        description: 'Extract text from scans',
        color: 'from-amber-500 to-amber-600',
        format: 'Img/PDF → Text'
    },
    {
        name: 'Summarize',
        href: '/ai/summarize',
        icon: Brain,
        description: 'AI-powered summary',
        color: 'from-indigo-500 to-indigo-600',
        format: 'PDF → Summary'
    },
    {
        name: 'Sensitive Data',
        href: '/ai/detect-sensitive',
        icon: Shield,
        description: 'Detect PII',
        color: 'from-rose-500 to-rose-600',
        format: 'PDF → Report'
    },
    {
        name: 'Smart Search',
        href: '/ai/search',
        icon: Search,
        description: 'Semantic search',
        color: 'from-fuchsia-500 to-fuchsia-600',
        format: 'Q&A → Results'
    },
];

const conversionTools = [
    {
        name: 'Word to PDF',
        href: '/tools/convert',
        icon: FileText,
        description: 'Convert DOC, DOCX to PDF',
        color: 'from-blue-500 to-blue-600',
        format: 'DOC → PDF'
    },
    {
        name: 'PDF to Word',
        href: '/tools/convert',
        icon: FileText,
        description: 'Convert PDF to DOCX',
        color: 'from-green-500 to-green-600',
        format: 'PDF → DOCX'
    },
    {
        name: 'Excel to PDF',
        href: '/tools/convert',
        icon: FileSpreadsheet,
        description: 'Convert XLS, XLSX to PDF',
        color: 'from-emerald-500 to-emerald-600',
        format: 'XLS → PDF'
    },
    {
        name: 'PPT to PDF',
        href: '/tools/convert',
        icon: Presentation,
        description: 'Convert PPT, PPTX to PDF',
        color: 'from-orange-500 to-orange-600',
        format: 'PPT → PDF'
    },
    {
        name: 'ODT to PDF',
        href: '/tools/convert',
        icon: File,
        description: 'Convert ODT to PDF',
        color: 'from-purple-500 to-purple-600',
        format: 'ODT → PDF'
    }
];

export default function DashboardPage() {
    const { user, syncStorage } = useAuthStore();

    // Sync storage usage on mount
    React.useEffect(() => {
        if (user) {
            syncStorage();
        }
    }, [user, syncStorage]);

    return (
        <div className="space-y-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {user ? `Welcome back, ${user.displayName?.split(' ')[0]}!` : 'Welcome to BrainyPDF'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    What would you like to do with your PDFs today?
                </p>
            </div>

            {/* Quick Actions */}
            <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary-500" />
                    Quick Actions
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {quickTools.map((tool, index) => (
                        <motion.div
                            key={tool.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                            <Link href={tool.href} className="tool-card group">
                                <div className={`tool-icon bg-gradient-to-br ${tool.color} group-hover:scale-110 transition-transform`}>
                                    <tool.icon className="w-6 h-6" />
                                </div>
                                <span className="font-medium text-sm text-gray-700 dark:text-gray-200">
                                    {tool.name}
                                </span>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* PDF Tools */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary-500" />
                        PDF Tools
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {allTools.map((tool, index) => (
                        <motion.div
                            key={tool.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                        >
                            <Link href={tool.href} className={`
                                block p-6 rounded-2xl bg-gradient-to-br ${tool.color} text-white 
                                transition-all hover:scale-105 hover:shadow-xl
                            `}>
                                <div className="flex items-center gap-4 mb-3">
                                    <tool.icon className="w-8 h-8 opacity-90" />
                                    <div>
                                        <h3 className="font-bold text-lg">{tool.name}</h3>
                                        <p className="text-sm opacity-90 leading-tight">{tool.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm opacity-80 pt-2 border-t border-white/20 mt-2">
                                    <span className="font-medium bg-white/20 px-2 py-0.5 rounded text-xs">
                                        {tool.format}
                                    </span>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* AI Features */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-500" />
                        AI Features
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {aiTools.map((tool, index) => (
                        <motion.div
                            key={tool.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                        >
                            <Link href={tool.href} className={`
                                block p-6 rounded-2xl bg-gradient-to-br ${tool.color} text-white 
                                transition-all hover:scale-105 hover:shadow-xl
                            `}>
                                <div className="flex items-center gap-4 mb-3">
                                    <tool.icon className="w-8 h-8 opacity-90" />
                                    <div>
                                        <h3 className="font-bold text-lg">{tool.name}</h3>
                                        <p className="text-sm opacity-90 leading-tight">{tool.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm opacity-80 pt-2 border-t border-white/20 mt-2">
                                    <span className="font-medium bg-white/20 px-2 py-0.5 rounded text-xs">
                                        {tool.format}
                                    </span>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Conversion Tools */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-indigo-500" />
                        Document Conversion
                    </h2>
                    <Link href="/tools/convert" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
                        View All
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {conversionTools.map((tool, index) => (
                        <motion.div
                            key={tool.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
                        >
                            <Link href={tool.href} className={`
                                block p-6 rounded-2xl bg-gradient-to-br ${tool.color} text-white 
                                transition-all hover:scale-105 hover:shadow-xl
                            `}>
                                <div className="flex items-center gap-4 mb-3">
                                    <tool.icon className="w-8 h-8 opacity-90" />
                                    <div>
                                        <h3 className="font-bold text-lg">{tool.name}</h3>
                                        <p className="text-sm opacity-90 leading-tight">{tool.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm opacity-80 pt-2 border-t border-white/20 mt-2">
                                    <span className="font-medium bg-white/20 px-2 py-0.5 rounded text-xs">
                                        {tool.format}
                                    </span>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Storage Info (if logged in) */}
            {user && (
                <section className="card p-6">
                    <h2 className="text-lg font-semibold mb-4">Storage Usage</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full"
                                    style={{
                                        width: `${Math.min((user.storageUsed / user.storageLimit) * 100, 100)}%`,
                                    }}
                                />
                            </div>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatBytes(user.storageUsed)} / {formatBytes(user.storageLimit)}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        {user.plan === 'free' ? (
                            <>
                                You're on the free plan.{' '}
                                <Link href="/pricing" className="text-primary-600 hover:underline">
                                    Upgrade for more storage
                                </Link>
                            </>
                        ) : (
                            `${user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} plan`
                        )}
                    </p>
                </section>
            )}
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
