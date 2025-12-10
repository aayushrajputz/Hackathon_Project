'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import Sidebar from '@/components/layout/Sidebar';

// Header would be better placed inside the main content area
import Header from '@/components/layout/Header';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { initAuth } = useAuthStore();

    useEffect(() => {
        initAuth();
    }, [initAuth]);

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
