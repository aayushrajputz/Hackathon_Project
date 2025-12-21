'use client';

import NotificationCenter from './NotificationCenter';
import { useAppStore, useNotificationStore } from '@/lib/store';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Menu, Search, Command } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Header() {
    const { fetchNotifications } = useNotificationStore();
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(() => fetchNotifications(), 60000);

        const handleScroll = () => setIsScrolled(window.scrollY > 0);
        window.addEventListener('scroll', handleScroll);

        return () => {
            clearInterval(interval);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [fetchNotifications]);

    const getPageTitle = () => {
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length === 0) return 'Overview';
        const last = segments[segments.length - 1];
        return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
    };

    return (
        <header
            className={clsx(
                "sticky top-0 z-40 h-20 flex items-center justify-between px-4 md:px-8 transition-all duration-300",
                isScrolled ? "bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-2" : "bg-transparent py-4"
            )}
        >
            <div className="flex items-center gap-6">
                <button
                    className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-white/10 text-white"
                    onClick={() => document.dispatchEvent(new CustomEvent('toggle-sidebar'))}
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div className="flex flex-col">
                    <h2 className="text-xl font-black text-white tracking-tight">
                        {getPageTitle()}
                    </h2>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <span>Systems</span>
                        <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <span>Active</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Search Bar Preview */}
                <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-900/50 border border-white/5 rounded-xl text-slate-500 group focus-within:border-cyan-500/50 transition-all cursor-pointer">
                    <Search className="w-4 h-4 group-focus-within:text-cyan-400" />
                    <span className="text-sm font-medium pr-8">Global Search...</span>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 rounded-md border border-white/10 text-[10px]">
                        <Command className="w-2.5 h-2.5" />
                        <span>K</span>
                    </div>
                </div>

                <div className="h-8 w-px bg-white/5 mx-2 hidden md:block"></div>

                <NotificationCenter />
            </div>
        </header>
    );
}
