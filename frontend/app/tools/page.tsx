'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Merge,
    Scissors,
    RotateCw,
    Minimize2,
    FileOutput,
    Layers,
    Droplet,
    Hash,
    Crop,
    ArrowRight
} from 'lucide-react';

const tools = [
    {
        name: 'Merge PDF',
        description: 'Combine multiple PDFs into one document',
        icon: Merge,
        href: '/tools/merge',
        color: 'from-blue-500 to-indigo-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        textColor: 'text-blue-600',
    },
    {
        name: 'Split PDF',
        description: 'Divide PDF into separate files by page ranges',
        icon: Scissors,
        href: '/tools/split',
        color: 'from-purple-500 to-pink-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        textColor: 'text-purple-600',
    },
    {
        name: 'Compress PDF',
        description: 'Reduce file size while maintaining quality',
        icon: Minimize2,
        href: '/tools/compress',
        color: 'from-green-500 to-emerald-600',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-600',
    },
    {
        name: 'Rotate Pages',
        description: 'Rotate pages 90°, 180°, or 270°',
        icon: RotateCw,
        href: '/tools/rotate',
        color: 'from-orange-500 to-amber-600',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        textColor: 'text-orange-600',
    },
    {
        name: 'Extract Pages',
        description: 'Pull specific pages from a PDF',
        icon: FileOutput,
        href: '/tools/extract',
        color: 'from-cyan-500 to-blue-600',
        bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
        textColor: 'text-cyan-600',
    },
    {
        name: 'Organize Pages',
        description: 'Reorder pages with AI suggestions',
        icon: Layers,
        href: '/tools/organize',
        color: 'from-violet-500 to-purple-600',
        bgColor: 'bg-violet-100 dark:bg-violet-900/30',
        textColor: 'text-violet-600',
    },
    {
        name: 'Add Watermark',
        description: 'Add text watermarks to all pages',
        icon: Droplet,
        href: '/tools/watermark',
        color: 'from-teal-500 to-cyan-600',
        bgColor: 'bg-teal-100 dark:bg-teal-900/30',
        textColor: 'text-teal-600',
    },
    {
        name: 'Page Numbers',
        description: 'Add page numbers to your PDF',
        icon: Hash,
        href: '/tools/page-numbers',
        color: 'from-rose-500 to-pink-600',
        bgColor: 'bg-rose-100 dark:bg-rose-900/30',
        textColor: 'text-rose-600',
    },
    {
        name: 'Crop PDF',
        description: 'Adjust page margins and visible area',
        icon: Crop,
        href: '/tools/crop',
        color: 'from-amber-500 to-yellow-600',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        textColor: 'text-amber-600',
    },
];

export default function ToolsIndexPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                    PDF Tools
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-xl mx-auto">
                    Free online tools to merge, split, compress, and transform your PDF files.
                    No registration required.
                </p>
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool, index) => (
                    <motion.div
                        key={tool.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                        <Link
                            href={tool.href}
                            className="card-hover p-6 flex flex-col h-full group"
                        >
                            <div className={`w-14 h-14 rounded-2xl ${tool.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <tool.icon className={`w-7 h-7 ${tool.textColor}`} />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                {tool.name}
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                                {tool.description}
                            </p>
                            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary-600 group-hover:text-primary-700">
                                Use Tool
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* CTA */}
            <div className="card p-8 text-center bg-gradient-to-br from-primary-500 to-purple-600">
                <h2 className="text-2xl font-bold text-white mb-2">
                    Need More Features?
                </h2>
                <p className="text-white/80 mb-6">
                    Sign in to access AI-powered features, save your files, and more.
                </p>
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                >
                    Sign In Free
                    <ArrowRight className="w-5 h-5" />
                </Link>
            </div>
        </div>
    );
}
