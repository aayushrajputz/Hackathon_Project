'use client';

import NotificationCenter from './NotificationCenter';
import { useAppStore, useNotificationStore, useAuthStore } from '@/lib/store';
import { useEffect, useState, useRef } from 'react';
import clsx from 'clsx';
import { Menu, Search, Command, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function Header() {
    const { fetchNotifications } = useNotificationStore();
    const { user, signOut } = useAuthStore();
    const pathname = usePathname();
    const router = useRouter();
    const [isScrolled, setIsScrolled] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(() => fetchNotifications(), 60000);

        const handleScroll = () => setIsScrolled(window.scrollY > 0);
        window.addEventListener('scroll', handleScroll);

        // Close menu when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            clearInterval(interval);
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [fetchNotifications]);

    const getPageTitle = () => {
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length === 0) return 'Overview';
        const last = segments[segments.length - 1];
        return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
    };

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
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
                <NotificationCenter />

                {/* User Profile Button */}
                {user && (
                    <div className="relative" ref={profileMenuRef}>
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-slate-900/50 border border-white/10 hover:border-cyan-500/50 transition-all group"
                        >
                            {user.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt={user.displayName || "User"}
                                    className="w-8 h-8 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                    <span className="text-sm font-bold text-white">
                                        {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                                    </span>
                                </div>
                            )}
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium text-white truncate max-w-[100px]">
                                    {user.displayName || "User"}
                                </p>
                                <p className="text-[10px] text-slate-500 capitalize">{user.plan || "Free"}</p>
                            </div>
                            <ChevronDown className={clsx(
                                "w-4 h-4 text-slate-400 transition-transform",
                                showProfileMenu && "rotate-180"
                            )} />
                        </button>

                        {/* Dropdown Menu */}
                        {showProfileMenu && (
                            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden z-50">
                                <div className="p-3 border-b border-white/5">
                                    <p className="text-sm font-medium text-white truncate">{user.displayName || "User"}</p>
                                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                </div>
                                <div className="py-1">
                                    <button
                                        onClick={() => {
                                            router.push('/profile');
                                            setShowProfileMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                                    >
                                        <User className="w-4 h-4" />
                                        View Profile
                                    </button>
                                    <button
                                        onClick={() => {
                                            router.push('/profile');
                                            setShowProfileMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Settings
                                    </button>
                                </div>
                                <div className="border-t border-white/5 py-1">
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
