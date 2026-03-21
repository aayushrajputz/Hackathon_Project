'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Lock } from 'lucide-react';
import Link from 'next/link';

export default function ToolsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, isLoading, initAuth } = useAuthStore();
    const router = useRouter();

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
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500 font-medium">Preparing workspace...</p>
                </div>
            </div>
        );
    }

    // Show access denied if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div className="text-center bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-xl max-w-lg">
                    <div className="w-20 h-20 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-6 shadow-inner border border-rose-100">
                        <Lock className="w-10 h-10 text-rose-500" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-3">Login Required</h1>
                    <p className="text-slate-600 mb-8 max-w-sm mx-auto font-medium">
                        Please sign in to access your secure dashboard and premium features.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-md shadow-blue-500/20"
                    >
                        Sign In to Continue
                    </Link>
                </div>
            </div>
        );
    }

    // Authenticated - show full dashboard layout with sidebar
    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 md:ml-72 p-6 md:p-8 overflow-x-hidden">
                <Header />
                {children}
            </main>
        </div>
    );
}
