'use client';

import { useAuthStore } from '@/lib/store';
import { Bell, Search, User } from 'lucide-react';

export default function AdminHeader() {
    const { user } = useAuthStore();

    return (
        <header className="h-20 border-b border-slate-800 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-40 px-6 md:px-8">
            <div className="flex items-center justify-between h-full">
                <div className="flex-1 max-w-xl hidden md:block">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Universal search (users, documents, transactions)..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-900 rounded-lg relative transition-all">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-950"></span>
                    </button>

                    <div className="h-8 w-[1px] bg-slate-800 mx-2"></div>

                    <div className="flex items-center gap-3 bg-slate-900 p-1.5 pr-4 rounded-full border border-slate-800">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-slate-700" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
                                {user?.displayName?.[0] || 'A'}
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold truncate max-w-[120px]">{user?.displayName || 'Admin'}</span>
                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Super Admin</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
