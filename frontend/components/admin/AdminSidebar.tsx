'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    FileText,
    CreditCard,
    Settings,
    ShieldCheck,
    BarChart3
} from 'lucide-react';

const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { name: 'User Management', icon: Users, href: '/admin/users' },
    { name: 'Documents', icon: FileText, href: '/admin/documents' },
    { name: 'Revenue', icon: BarChart3, href: '/admin/revenue' },
    { name: 'Plans & Pricing', icon: CreditCard, href: '/admin/plans' },
    { name: 'Security Logs', icon: ShieldCheck, href: '/admin/security' },
    { name: 'Settings', icon: Settings, href: '/admin/settings' },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 hidden md:block">
            <div className="flex flex-col h-full">
                <div className="p-6 border-b border-slate-800">
                    <Link href="/admin" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">
                            B
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                            Admin Central
                        </span>
                    </Link>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
                    BinaryPDF v2.0 Admin Panel
                </div>
            </div>
        </aside>
    );
}
