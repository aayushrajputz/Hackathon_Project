'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore, useAppStore } from '@/lib/store';
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

export default function Sidebar() {
    const pathname = usePathname();
    const { user, signOut } = useAuthStore();
    const { sidebarOpen, toggleSidebar } = useAppStore();
    const [pdfExpanded, setPdfExpanded] = useState(true);
    const [aiExpanded, setAiExpanded] = useState(true);

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
                    'fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 z-50 transition-transform duration-300',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold gradient-text">BrainyPDF</span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                        <Link
                            href="/dashboard"
                            className={clsx(
                                'sidebar-link',
                                pathname === '/dashboard' && 'sidebar-link-active'
                            )}
                        >
                            <Home className="w-5 h-5" />
                            Dashboard
                        </Link>

                        <Link
                            href="/library"
                            className={clsx(
                                'sidebar-link',
                                pathname === '/library' && 'sidebar-link-active'
                            )}
                        >
                            <FolderOpen className="w-5 h-5" />
                            My Library
                        </Link>

                        {/* PDF Tools Section */}
                        <div className="pt-4">
                            <button
                                onClick={() => setPdfExpanded(!pdfExpanded)}
                                className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-500 uppercase tracking-wider"
                            >
                                PDF Tools
                                <ChevronDown
                                    className={clsx(
                                        'w-4 h-4 transition-transform',
                                        pdfExpanded && 'rotate-180'
                                    )}
                                />
                            </button>
                            {pdfExpanded && (
                                <div className="space-y-1 mt-2">
                                    {pdfTools.map((tool) => (
                                        <Link
                                            key={tool.href}
                                            href={tool.href}
                                            className={clsx(
                                                'sidebar-link text-sm',
                                                pathname === tool.href && 'sidebar-link-active'
                                            )}
                                        >
                                            <tool.icon className="w-4 h-4" />
                                            {tool.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* AI Tools Section */}
                        <div className="pt-4">
                            <button
                                onClick={() => setAiExpanded(!aiExpanded)}
                                className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-500 uppercase tracking-wider"
                            >
                                AI Features
                                <ChevronDown
                                    className={clsx(
                                        'w-4 h-4 transition-transform',
                                        aiExpanded && 'rotate-180'
                                    )}
                                />
                            </button>
                            {aiExpanded && (
                                <div className="space-y-1 mt-2">
                                    {aiTools.map((tool) => (
                                        <Link
                                            key={tool.href}
                                            href={tool.href}
                                            className={clsx(
                                                'sidebar-link text-sm',
                                                pathname === tool.href && 'sidebar-link-active'
                                            )}
                                        >
                                            <tool.icon className="w-4 h-4" />
                                            {tool.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </nav>

                    {/* User Section */}
                    <div className="p-4 border-t border-gray-200 dark:border-slate-700">
                        {user ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800">
                                    {user.photoURL ? (
                                        <Image
                                            src={user.photoURL}
                                            alt={user.displayName}
                                            width={40}
                                            height={40}
                                            className="rounded-full"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">
                                            {user.displayName?.charAt(0) || 'U'}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{user.displayName}</p>
                                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                    </div>
                                </div>

                                {/* Storage Usage */}
                                <div className="px-1">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>Storage</span>
                                        <span>{Math.round((user.storageUsed || 0) / (1024 * 1024))} / {Math.round((user.storageLimit || 100 * 1024 * 1024) / (1024 * 1024))} MB</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={clsx(
                                                "h-full rounded-full transition-all duration-500",
                                                (user.storageUsed || 0) / (user.storageLimit || 100 * 1024 * 1024) > 0.9 ? "bg-red-500" :
                                                    (user.storageUsed || 0) / (user.storageLimit || 100 * 1024 * 1024) > 0.7 ? "bg-yellow-500" :
                                                        "bg-green-500"
                                            )}
                                            style={{ width: `${Math.min(100, ((user.storageUsed || 0) / (user.storageLimit || 100 * 1024 * 1024) * 100))}%` }}
                                        />
                                    </div>
                                    {(user.storageUsed || 0) / (user.storageLimit || 100 * 1024 * 1024) > 0.9 && (
                                        <div className="mt-1 text-xs text-red-500 font-medium">
                                            Storage almost full
                                        </div>
                                    )}
                                </div>
                                <Link
                                    href="/pricing"
                                    className={clsx(
                                        'sidebar-link',
                                        pathname === '/pricing' && 'sidebar-link-active'
                                    )}
                                >
                                    <CreditCard className="w-5 h-5" />
                                    Upgrade to Pro
                                </Link>

                                <div className="flex gap-2">
                                    <Link
                                        href="/settings"
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Settings
                                    </Link>
                                    <button
                                        onClick={signOut}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="block w-full text-center px-4 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}
