'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function ToolsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { isAuthenticated } = useAuthStore();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-slate-700">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/"
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                <span className="hidden sm:inline">Back</span>
                            </Link>
                            <div className="h-6 w-px bg-gray-200 dark:bg-slate-700" />
                            <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-bold text-lg hidden sm:inline gradient-text">BrainyPDF</span>
                            </Link>
                        </div>

                        <nav className="flex items-center gap-2">
                            {isAuthenticated ? (
                                <Link
                                    href="/dashboard"
                                    className="ml-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href="/login"
                                    className="ml-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    Sign In
                                </Link>
                            )}
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 dark:border-slate-700 py-6">
                <div className="container mx-auto px-4 text-center text-sm text-gray-500">
                    © 2025 BrainyPDF. All tools are free to use.
                </div>
            </footer>
        </div>
    );
}
