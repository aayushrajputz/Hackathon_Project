'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, initAuth, isLoading } = useAuthStore();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        initAuth();
    }, [initAuth]);

    useEffect(() => {
        if (!isLoading) {
            if (!user || user.role !== 'admin') {
                router.push('/library');
            } else {
                setIsAuthorized(true);
            }
        }
    }, [user, isLoading, router]);

    if (isLoading || !isAuthorized) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100">
            <AdminSidebar />
            <main className="flex-1 md:ml-64 flex flex-col min-h-screen overflow-x-hidden">
                <AdminHeader />
                <div className="p-6 md:p-8 flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
}
