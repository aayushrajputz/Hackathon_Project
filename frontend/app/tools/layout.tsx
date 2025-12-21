'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function ToolsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { isAuthenticated, isLoading, initAuth } = useAuthStore();

    // Initialize auth on mount
    useEffect(() => {
        initAuth();
    }, [initAuth]);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    // Show access denied if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-3">Login Required</h1>
                    <p className="text-gray-400 mb-8 max-w-md">
                        Please sign in to access our premium PDF tools and AI features.
                    </p>
                    <Link
                        href="/login"
                        className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-purple-500 transition-all shadow-lg shadow-purple-500/25"
                    >
                        Sign In to Continue
                    </Link>
                </div>
            </div>
        );
    }

    // Authenticated - show full dashboard layout with sidebar
    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900">
            <Sidebar />
            <main className="flex-1 md:ml-72 p-6 md:p-8 overflow-x-hidden">
                <Header />
                {children}
            </main>
        </div>
    );
}
