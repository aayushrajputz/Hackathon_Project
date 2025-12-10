'use client';

import NotificationCenter from './NotificationCenter';
import { useAppStore, useNotificationStore } from '@/lib/store';
import { useEffect } from 'react';
import clsx from 'clsx';
import { Menu } from 'lucide-react';

export default function Header() {
    const { toggleSidebar } = useAppStore(); // Correct store
    const { fetchNotifications } = useNotificationStore();

    useEffect(() => {
        // Fetch initially
        fetchNotifications();

        // Poll every 60 seconds
        const interval = setInterval(() => {
            fetchNotifications();
        }, 60000);

        return () => clearInterval(interval);
    }, [fetchNotifications]);

    return (
        <header className="h-16 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button
                    className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                    onClick={() => document.dispatchEvent(new CustomEvent('toggle-sidebar'))} // Temporary hack or we fix store
                >
                    <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>
                <div className="flex flex-col">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                        Dashboard
                    </h2>
                    <p className="text-sm text-gray-500 hidden sm:block">
                        Welcome back to BrainyPDF
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <NotificationCenter />
            </div>
        </header>
    );
}
