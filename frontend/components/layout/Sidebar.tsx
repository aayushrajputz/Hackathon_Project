'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore, useAppStore } from '@/lib/store';
import { motion } from 'framer-motion';
import {
    FileText,
    Home,
    Merge,
    Scissors,
    RotateCw,
    Minimize2,
    FileOutput,
    FileInput,
    Layers,
    Droplet,
    Hash,
    Crop,
    RefreshCw,
    FileSearch,
    Brain,
    Shield,
    Search,
    FolderOpen,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronDown,
    MessageSquare,
    CreditCard,
} from 'lucide-react';
import clsx from 'clsx';
import Image from 'next/image';
import { useState } from 'react';

const pdfTools = [
    { name: 'Merge', href: '/tools/merge', icon: Merge },
    { name: 'Split', href: '/tools/split', icon: Scissors },
    { name: 'Rotate', href: '/tools/rotate', icon: RotateCw },
    { name: 'Compress', href: '/tools/compress', icon: Minimize2 },
    { name: 'Extract Pages', href: '/tools/extract', icon: FileOutput },
    { name: 'Remove Pages', href: '/tools/remove', icon: FileInput },
    { name: 'Organize', href: '/tools/organize', icon: Layers },
    { name: 'Watermark', href: '/tools/watermark', icon: Droplet },
    { name: 'Page Numbers', href: '/tools/page-numbers', icon: Hash },
    { name: 'Crop', href: '/tools/crop', icon: Crop },
    { name: 'Convert Docs', href: '/tools/convert', icon: RefreshCw },
];

const aiTools = [
    { name: 'Chat PDF', href: '/ai/chat', icon: MessageSquare },
    { name: 'OCR Extract', href: '/ai/ocr', icon: FileSearch },
    { name: 'Summarize', href: '/ai/summarize', icon: Brain },
    { name: 'Detect Sensitive', href: '/ai/detect-sensitive', icon: Shield },
    { name: 'Redact Data', href: '/ai/redact', icon: Shield },
    { name: 'Smart Search', href: '/ai/search', icon: Search },
];

// Helper function to format storage size in appropriate units
function formatStorageSize(bytes: number): string {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
        return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${Math.round(mb)} MB`;
}

export default function Sidebar() {
    const pathname = usePathname();
    const { user, signOut } = useAuthStore();
    const { sidebarOpen, toggleSidebar } = useAppStore();
    const [pdfExpanded, setPdfExpanded] = useState(true);
    const [aiExpanded, setAiExpanded] = useState(true);

    // Calculate effective storage limits for display (safety net)
    const effectiveLimit = user ? (
        (user.plan === 'free' || !user.plan)
            ? (Math.min(user.storageLimit || 0, 10 * 1024 * 1024) || 10 * 1024 * 1024)
            : (user.storageLimit || 100 * 1024 * 1024)
    ) : 10 * 1024 * 1024;

    const usageRatio = user ? (user.storageUsed || 0) / effectiveLimit : 0;
    const usagePercent = Math.min(100, usageRatio * 100);

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={toggleSidebar}
                className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-xl bg-white dark:bg-slate-800 shadow-lg"
            >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={clsx(
                    'fixed left-0 top-0 bottom-0 w-72 bg-slate-950 border-r border-white/5 z-50 transition-transform duration-500 ease-in-out',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                )}
            >
                {/* Background Decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
                </div>

                <div className="relative flex flex-col h-full z-10">
                    {/* Logo */}
                    <div className="p-8">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform duration-300">
                                <FileText className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-white">Binary<span className="text-cyan-400">PDF</span></h1>
                                <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Pro Dashboard</p>
                            </div>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-8 custom-scrollbar">
                        <div>
                            <p className="px-4 mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">General</p>
                            <div className="space-y-1">
                                <Link
                                    href="/dashboard"
                                    className={clsx(
                                        'sidebar-link-v2 group',
                                        pathname === '/dashboard' && 'sidebar-link-v2-active'
                                    )}
                                >
                                    <Home className="w-5 h-5" />
                                    <span>Home</span>
                                </Link>
                                <Link
                                    href="/library"
                                    className={clsx(
                                        'sidebar-link-v2 group',
                                        pathname === '/library' && 'sidebar-link-v2-active'
                                    )}
                                >
                                    <FolderOpen className="w-5 h-5" />
                                    <span>Library</span>
                                </Link>
                            </div>
                        </div>

                        {/* PDF Tools Section */}
                        <div>
                            <button
                                onClick={() => setPdfExpanded(!pdfExpanded)}
                                className="flex items-center justify-between w-full px-4 mb-3 group"
                            >
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-300 transition-colors">PDF Tools</p>
                                <ChevronDown
                                    className={clsx(
                                        'w-4 h-4 text-slate-500 transition-transform duration-300',
                                        pdfExpanded && 'rotate-180'
                                    )}
                                />
                            </button>
                            {pdfExpanded && (
                                <div className="space-y-1 grid grid-cols-1">
                                    {pdfTools.map((tool) => (
                                        <Link
                                            key={tool.href}
                                            href={tool.href}
                                            className={clsx(
                                                'sidebar-link-v2 text-sm group',
                                                pathname === tool.href && 'sidebar-link-v2-active'
                                            )}
                                        >
                                            <tool.icon className="w-4 h-4" />
                                            <span>{tool.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* AI Tools Section */}
                        <div className="pb-8">
                            <button
                                onClick={() => setAiExpanded(!aiExpanded)}
                                className="flex items-center justify-between w-full px-4 mb-3 group"
                            >
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-300 transition-colors">AI Intelligence</p>
                                <ChevronDown
                                    className={clsx(
                                        'w-4 h-4 text-slate-500 transition-transform duration-300',
                                        aiExpanded && 'rotate-180'
                                    )}
                                />
                            </button>
                            {aiExpanded && (
                                <div className="space-y-1">
                                    {aiTools.map((tool) => (
                                        <Link
                                            key={tool.href}
                                            href={tool.href}
                                            className={clsx(
                                                'sidebar-link-v2 text-sm group',
                                                pathname === tool.href && 'sidebar-link-v2-active'
                                            )}
                                        >
                                            <tool.icon className="w-4 h-4" />
                                            <span>{tool.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </nav>

                    {/* User Section - Premium Card */}
                    <div className="p-4 mt-auto">
                        <div className="glass-card-premium p-5 space-y-4">
                            {user && (
                                <>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            {user.photoURL ? (
                                                <Image
                                                    src={user.photoURL}
                                                    alt={user.displayName}
                                                    width={44}
                                                    height={44}
                                                    className="rounded-xl border border-white/10"
                                                />
                                            ) : (
                                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                                    {user.displayName?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{user.displayName}</p>
                                            <p className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-wider">{user.plan || 'Free'} Member</p>
                                        </div>
                                    </div>

                                    {/* Storage Usage */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Cloud Storage</span>
                                            <span className="text-[10px] font-bold text-white">
                                                {Math.round(usagePercent)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${usagePercent}%` }}
                                                className={clsx(
                                                    "h-full rounded-full",
                                                    usageRatio > 0.9 ? "bg-rose-500" :
                                                        usageRatio > 0.7 ? "bg-amber-500" :
                                                            "bg-cyan-500"
                                                )}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-500 text-center font-medium">
                                            {formatStorageSize(user.storageUsed || 0)} of {formatStorageSize(effectiveLimit)}
                                        </p>
                                    </div>

                                    <div className="pt-2 border-t border-white/5 space-y-1">
                                        <Link
                                            href="/plans"
                                            className="sidebar-link-v2 py-2 text-xs group"
                                        >
                                            <CreditCard className="w-3.5 h-3.5" />
                                            <span>Upgrade Plan</span>
                                        </Link>
                                        <button
                                            onClick={signOut}
                                            className="sidebar-link-v2 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 group"
                                        >
                                            <LogOut className="w-3.5 h-3.5" />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
