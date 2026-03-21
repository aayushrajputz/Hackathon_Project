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
    ArrowRight,
    Search,
    Wand2,
    FileText,
    ShieldCheck,
    Type,
    Award
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const tools = [
    {
        name: 'Merge PDF',
        description: 'Combine multiple PDFs into one document seamlessly',
        icon: Merge,
        href: '/tools/merge',
        category: 'Edit',
    },
    {
        name: 'Split PDF',
        description: 'Extract specific page ranges into new files',
        icon: Scissors,
        href: '/tools/split',
        category: 'Edit',
    },
    {
        name: 'Compress PDF',
        description: 'Optimize file size without losing quality',
        icon: Minimize2,
        href: '/tools/compress',
        category: 'Optimize',
    },
    {
        name: 'Rotate PDF',
        description: 'Correct orientation of your PDF pages',
        icon: RotateCw,
        href: '/tools/rotate',
        category: 'Edit',
    },
    {
        name: 'Extract Pages',
        description: 'Select and export specific pages only',
        icon: FileOutput,
        href: '/tools/extract',
        category: 'Edit',
    },
    {
        name: 'Organize Pages',
        description: 'Rearrange or delete pages with ease',
        icon: Layers,
        href: '/tools/organize',
        category: 'AI Powered',
    },
    {
        name: 'Add Watermark',
        description: 'Protect documents with custom identity layers',
        icon: Droplet,
        href: '/tools/watermark',
        category: 'Secure',
    },
    {
        name: 'Page Numbers',
        description: 'Automate document numbering for indexing',
        icon: Hash,
        href: '/tools/page-numbers',
        category: 'Annotate',
    },
    {
        name: 'Crop PDF',
        description: 'Adjust visible margins and page dimensions',
        icon: Crop,
        href: '/tools/crop',
        category: 'Edit',
    },
    {
        name: 'Draw Text',
        description: 'Add custom annotations at any position',
        icon: Type,
        href: '/tools/draw-text',
        category: 'Annotate',
    },
    {
        name: 'Add Badge',
        description: 'Verify documents with professional badges',
        icon: Award,
        href: '/tools/add-badge',
        category: 'Verify',
    },
];

const categories = ['All', 'Edit', 'Optimize', 'Secure', 'Annotate', 'AI Powered'];

export default function ToolsIndexPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const filteredTools = tools.filter(tool => {
        const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || tool.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="relative min-h-screen font-sans bg-slate-50/50">
            {/* Background elements */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>

            <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
                {/* Header Section */}
                <div className="flex flex-col items-center text-center mb-16 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="px-4 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-black uppercase tracking-[0.2em]"
                    >
                        Premium PDF Suite
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight"
                    >
                        Master Your <span className="text-blue-600">Documents</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-500 text-lg md:text-xl max-w-2xl font-medium leading-relaxed"
                    >
                        Professional grade tools to edit, optimize, and secure your PDF files in seconds. No installation required.
                    </motion.p>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-12">
                    <div className="flex flex-wrap items-center gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={clsx(
                                    "px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border",
                                    activeCategory === cat
                                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                                        : "bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 shadow-sm"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full lg:w-96 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search tools..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-slate-900 shadow-sm"
                        />
                    </div>
                </div>

                {/* Tools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredTools.map((tool, index) => (
                        <motion.div
                            key={tool.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                            <Link
                                href={tool.href}
                                className="group relative block p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-blue-400 hover:-translate-y-2 transition-all h-full bg-gradient-to-b hover:from-white hover:to-blue-50/30"
                            >
                                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>

                                <div className="w-16 h-16 rounded-[1.5rem] bg-blue-50 border border-blue-100 flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                    <tool.icon className="w-8 h-8 text-blue-600" />
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1.5 opacity-70">
                                            {tool.category}
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                                            {tool.name}
                                        </h2>
                                    </div>
                                    <p className="text-sm text-slate-500 font-bold leading-relaxed">
                                        {tool.description}
                                    </p>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Cloud Ready</span>
                                    <div className="flex -space-x-2">
                                        {[1, 2].map((i) => (
                                            <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100"></div>
                                        ))}
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredTools.length === 0 && (
                    <div className="py-20 text-center space-y-4 bg-white border border-slate-200 rounded-[3rem] shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <Search className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">No tools found</h3>
                        <p className="text-slate-500 font-bold">Try adjusting your search or filters</p>
                        <button
                            onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                            className="mt-4 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all text-sm shadow-md"
                        >
                            Reset Explore
                        </button>
                    </div>
                )}

                {/* Desktop Premium Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-20 rounded-[3.5rem] p-16 text-center bg-slate-900 shadow-2xl relative overflow-hidden group"
                >
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,#2563eb_0%,transparent_50%)] opacity-30"></div>
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] group-hover:bg-blue-600/20 transition-all duration-1000"></div>

                    <div className="relative z-10 max-w-3xl mx-auto space-y-10">
                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                                Unlock <span className="text-blue-500">Intelligent</span> Operations
                            </h2>
                            <p className="text-slate-400 text-lg font-medium leading-relaxed">
                                Join 50,000+ professionals using BinaryPDF to automate document workflows with AI precision.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Link
                                href="/login"
                                className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 hover:-translate-y-1 flex items-center justify-center gap-3 tracking-wide"
                            >
                                Start Free Workspace
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/pricing"
                                className="w-full sm:w-auto px-10 py-5 bg-slate-800 text-white font-black rounded-2xl hover:bg-slate-700 transition-all border border-slate-700 flex items-center justify-center gap-3 tracking-wide"
                            >
                                View Enterprise Plan
                            </Link>
                        </div>

                        <div className="flex items-center justify-center gap-12 pt-10 border-t border-slate-800">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="w-5 h-5 text-blue-400" />
                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Bank-grade Security</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Wand2 className="w-5 h-5 text-blue-400" />
                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">AI Assisted</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
