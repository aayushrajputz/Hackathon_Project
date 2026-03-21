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
                "sticky top-0 z-40 flex items-center justify-between px-6 md:px-10 transition-all duration-500 font-sans",
                isScrolled ? "bg-white/80 backdrop-blur-2xl border-b border-slate-200 py-3.5 shadow-xl shadow-blue-500/5" : "bg-transparent py-6"
            )}
        >
            <div className="flex items-center gap-6">
                <button
                    className="md:hidden w-11 h-11 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-800 shadow-sm"
                    onClick={() => document.dispatchEvent(new CustomEvent('toggle-sidebar'))}
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div className="flex flex-col">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter">
                        {getPageTitle()}
                    </h2>
                    <div className="flex items-center gap-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        <span>Systems Cloud</span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm relative">
                            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
                        </div>
                        <span className="text-emerald-600">Operational</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 group focus-within:border-blue-500 focus-within:bg-white transition-all">
                    <Search className="w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search modules..."
                        className="bg-transparent border-none focus:outline-none text-xs font-bold text-slate-900 placeholder:text-slate-400 w-32"
                    />
                    <kbd className="text-[10px] font-black tracking-widest bg-white border border-slate-200 px-1.5 py-0.5 rounded-md shadow-sm">⌘K</kbd>
                </div>

                <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

                <NotificationCenter />

                {/* User Profile Button */}
                {user && (
                    <div className="relative" ref={profileMenuRef}>
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex items-center gap-3 px-2 py-1.5 rounded-[1.25rem] bg-white border border-slate-200 hover:border-blue-600 hover:shadow-xl hover:shadow-blue-500/10 transition-all group"
                        >
                            <div className="relative">
                                {user.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt={user.displayName || "User"}
                                        className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-sm group-hover:scale-105 transition-transform"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
                                        <span className="text-sm font-black text-white uppercase">
                                            {user.displayName?.charAt(0) || "U"}
                                        </span>
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full group-hover:animate-pulse"></div>
                            </div>
                            <div className="hidden md:block text-left mr-2">
                                <p className="text-xs font-black text-slate-900 truncate max-w-[100px] tracking-tight">
                                    {user.displayName || "Professional"}
                                </p>
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none pt-1">{user.plan || "PRO"} SPEC</p>
                            </div>
                            <ChevronDown className={clsx(
                                "w-4 h-4 text-slate-400 transition-transform group-hover:text-blue-600 mr-1",
                                showProfileMenu && "rotate-180"
                            )} />
                        </button>

                        {/* Dropdown Menu */}
                        {showProfileMenu && (
                            <div className="absolute right-0 mt-4 w-72 rounded-[2rem] bg-white border border-slate-200 shadow-2xl overflow-hidden z-50 transform origin-top-right transition-all animate-in fade-in zoom-in duration-300">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                    <p className="text-sm font-black text-slate-900 truncate tracking-tight">{user.displayName || "Professional"}</p>
                                    <p className="text-[11px] text-slate-400 font-bold truncate mt-1 lowercase">{user.email}</p>
                                </div>
                                <div className="p-3 space-y-1">
                                    <button
                                        onClick={() => {
                                            router.push('/profile');
                                            setShowProfileMenu(false);
                                        }}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <User className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                                            <span>Profile Matrix</span>
                                        </div>
                                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            router.push('/profile');
                                            setShowProfileMenu(false);
                                        }}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Settings className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                                            <span>Global Specs</span>
                                        </div>
                                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                </div>
                                <div className="p-3 bg-slate-50/80 border-t border-slate-100">
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all group"
                                    >
                                        <LogOut className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                                        <span>Secure Exit</span>
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

function ArrowRight(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    );
}
