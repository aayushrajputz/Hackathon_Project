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

    const effectiveLimit = user ? (
        (user.plan === 'free' || !user.plan)
            ? (Math.min(user.storageLimit || 0, 10 * 1024 * 1024) || 10 * 1024 * 1024)
            : (user.storageLimit || 100 * 1024 * 1024)
    ) : 10 * 1024 * 1024;

    const usageRatio = user ? (user.storageUsed || 0) / effectiveLimit : 0;
    const usagePercent = Math.min(100, usageRatio * 100);

    return (
        <>
            <button
                onClick={toggleSidebar}
                className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-xl bg-white shadow-lg border border-slate-200"
            >
                {sidebarOpen ? <X className="w-6 h-6 text-slate-800" /> : <Menu className="w-6 h-6 text-slate-800" />}
            </button>

            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={toggleSidebar}
                />
            )}

            <aside
                className={clsx(
                    'fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-200 z-50 transition-transform duration-500 ease-in-out shadow-xl shadow-slate-200/50 font-sans',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                )}
            >
                <div className="relative flex flex-col h-full z-10">
                    <div className="p-8">
                        <Link href="/" className="flex items-center gap-3.5 group">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                                <FileText className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none">Binary<span className="text-blue-600">PDF</span></h1>
                                <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase mt-1">Pro Workspace</p>
                            </div>
                        </Link>
                    </div>

                    <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-8 custom-scrollbar">
                        <div>
                            <p className="px-5 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Navigational</p>
                            <div className="space-y-1">
                                <Link
                                    href="/dashboard"
                                    className={clsx(
                                        'flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all font-black text-xs uppercase tracking-tight group',
                                        pathname === '/dashboard'
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    )}
                                >
                                    <Home className={clsx("w-5 h-5", pathname === '/dashboard' ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500 transition-colors")} />
                                    <span>Dashboard</span>
                                </Link>
                                {user && (
                                    <Link
                                        href="/library"
                                        className={clsx(
                                            'flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all font-black text-xs uppercase tracking-tight group',
                                            pathname === '/library'
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        )}
                                    >
                                        <FolderOpen className={clsx("w-5 h-5", pathname === '/library' ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500 transition-colors")} />
                                        <span>Vault Library</span>
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div>
                            <button
                                onClick={() => setPdfExpanded(!pdfExpanded)}
                                className="flex items-center justify-between w-full px-5 mb-4 group"
                            >
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-blue-600 transition-colors">PDF Modules</p>
                                <ChevronDown
                                    className={clsx(
                                        'w-4 h-4 text-slate-400 transition-transform duration-300 group-hover:text-blue-600',
                                        pdfExpanded && 'rotate-180'
                                    )}
                                />
                            </button>
                            {pdfExpanded && (
                                <div className="space-y-1">
                                    {pdfTools.map((tool) => (
                                        <Link
                                            key={tool.href}
                                            href={tool.href}
                                            className={clsx(
                                                'flex items-center gap-3 px-5 py-2.5 rounded-xl transition-all font-black text-xs uppercase tracking-tight group',
                                                pathname === tool.href
                                                    ? 'bg-blue-50 text-blue-600'
                                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                            )}
                                        >
                                            <tool.icon className={clsx("w-4 h-4", pathname === tool.href ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500 transition-colors")} />
                                            <span>{tool.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {user && (
                            <div className="pb-10">
                                <button
                                    onClick={() => setAiExpanded(!aiExpanded)}
                                    className="flex items-center justify-between w-full px-5 mb-4 group"
                                >
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-blue-600 transition-colors">AI Processing</p>
                                    <ChevronDown
                                        className={clsx(
                                            'w-4 h-4 text-slate-400 transition-transform duration-300 group-hover:text-blue-600',
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
                                                    'flex items-center gap-3 px-5 py-2.5 rounded-xl transition-all font-black text-xs uppercase tracking-tight group',
                                                    pathname === tool.href
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                                )}
                                            >
                                                <tool.icon className={clsx("w-4 h-4", pathname === tool.href ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500 transition-colors")} />
                                                <span>{tool.name}</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </nav>

                    <div className="p-6 mt-auto">
                        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-5 shadow-sm">
                            {user ? (
                                <>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            {user.photoURL ? (
                                                <Image
                                                    src={user.photoURL}
                                                    alt={user.displayName || 'User'}
                                                    width={44}
                                                    height={44}
                                                    className="rounded-xl border border-slate-200 shadow-sm"
                                                />
                                            ) : (
                                                <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md uppercase">
                                                    {user.displayName?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-slate-900 truncate tracking-tight">{user.displayName || 'User'}</p>
                                            <p className="text-[10px] text-blue-600 font-black truncate uppercase tracking-[0.1em]">{user.plan || 'Free'} Member</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5 pt-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Efficiency</span>
                                            <span className="text-[10px] font-black text-slate-900">
                                                {Math.round(usagePercent)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden shadow-inner p-0.5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${usagePercent}%` }}
                                                className={clsx(
                                                    "h-full rounded-full shadow-sm",
                                                    usageRatio > 0.9 ? "bg-rose-500" : "bg-blue-600"
                                                )}
                                            />
                                        </div>
                                        <p className="text-[9px] text-slate-400 text-center font-black uppercase tracking-tighter">
                                            {formatStorageSize(user.storageUsed || 0)} OF {formatStorageSize(effectiveLimit)}
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t border-slate-200 space-y-1">
                                        <Link
                                            href="/plans"
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm group border border-transparent hover:border-slate-100"
                                        >
                                            <CreditCard className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                                            <span>Upgrade Plan</span>
                                        </Link>
                                        <button
                                            onClick={signOut}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest text-rose-500 hover:bg-rose-50 hover:text-rose-600 group"
                                        >
                                            <LogOut className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                                            <span>Secure Logout</span>
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-3 bg-blue-100 rounded-xl">
                                        <Brain className="w-6 h-6 text-blue-600 mb-2" />
                                        <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Guest Access</p>
                                        <p className="text-[9px] text-blue-700 font-bold leading-tight mt-1">Sign in to save files and unlock AI features.</p>
                                    </div>
                                    <Link
                                        href="/login"
                                        className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
                                    >
                                        Sign In
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
