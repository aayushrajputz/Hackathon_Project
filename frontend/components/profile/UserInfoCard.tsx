"use client";

import { useAuthStore } from "@/lib/store";
import { User, Crown, HardDrive, Shield } from "lucide-react";

export function UserInfoCard() {
    const { user } = useAuthStore();

    if (!user) return null;

    const formatStorage = (bytes: number) => {
        if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + " GB";
        if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + " MB";
        if (bytes >= 1024) return (bytes / 1024).toFixed(2) + " KB";
        return bytes + " B";
    };

    const storageUsed = user.storageUsed ?? 0;
    const storageLimit = user.storageLimit ?? 0;
    const storagePercentage = storageLimit > 0
        ? Math.min((storageUsed / storageLimit) * 100, 100)
        : 0;

    const formatRole = (role?: string) => {
        if (!role) return "User";
        return role.charAt(0).toUpperCase() + role.slice(1);
    };

    const formatPlan = (plan?: string) => {
        if (!plan) return "Free";
        return plan.charAt(0).toUpperCase() + plan.slice(1);
    };

    // Get first letter for avatar fallback
    const getInitial = () => {
        if (user.displayName) return user.displayName.charAt(0).toUpperCase();
        if (user.email) return user.email.charAt(0).toUpperCase();
        return "U";
    };

    // Info items without email (since login is only via Firebase/Google)
    const infoItems = [
        { label: "Display Name", value: user.displayName || "Not set", icon: User },
        { label: "Role", value: formatRole(user.role), icon: Shield },
        { label: "Plan", value: formatPlan(user.plan), icon: Crown },
    ];

    return (
        <div className="rounded-xl border bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border-white/10 shadow-2xl overflow-hidden">
            {/* Profile Header */}
            <div className="relative p-8 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(6,182,212,0.15),transparent_50%)]"></div>
                <div className="relative flex flex-col md:flex-row items-center gap-6">
                    {/* Avatar - Shows Google photo if available, otherwise first letter */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                        {user.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt={user.displayName || "User"}
                                className="relative w-28 h-28 rounded-full object-cover border-4 border-slate-900"
                            />
                        ) : (
                            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center border-4 border-slate-900">
                                <span className="text-5xl font-bold text-white">
                                    {getInitial()}
                                </span>
                            </div>
                        )}
                        {/* Plan Badge */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${user.plan === 'pro'
                                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/50 text-amber-400'
                                : user.plan === 'enterprise'
                                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50 text-purple-400'
                                    : 'bg-slate-800 border-slate-700 text-slate-400'
                                }`}>
                                {user.plan?.toUpperCase() || 'FREE'}
                            </span>
                        </div>
                    </div>

                    {/* Name & Role Badge */}
                    <div className="text-center md:text-left">
                        <h3 className="text-2xl font-bold text-white mb-2">
                            {user.displayName || "Anonymous User"}
                        </h3>
                        <div className="flex items-center gap-2 justify-center md:justify-start">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${user.role === 'admin'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}>
                                {user.role?.toUpperCase() || 'USER'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Grid - Without Email */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {infoItems.map((item, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-white/5 hover:border-cyan-500/30 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                            <item.icon className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{item.label}</p>
                            <p className="text-white font-semibold">{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Storage Usage */}
            <div className="p-6 pt-0">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                                <HardDrive className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Storage Used</p>
                                <p className="text-white font-semibold">
                                    {formatStorage(storageUsed)} / {formatStorage(storageLimit)}
                                </p>
                            </div>
                        </div>
                        <span className={`text-sm font-bold ${storagePercentage > 90 ? 'text-red-400' :
                            storagePercentage > 70 ? 'text-amber-400' :
                                'text-emerald-400'
                            }`}>
                            {storagePercentage.toFixed(1)}%
                        </span>
                    </div>
                    <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${storagePercentage > 90 ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                                storagePercentage > 70 ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
                                    'bg-gradient-to-r from-emerald-500 to-cyan-500'
                                }`}
                            style={{ width: `${storagePercentage}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
