'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import {
    Search,
    Filter,
    MoreVertical,
    Shield,
    User as UserIcon,
    Mail,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Edit2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await adminApi.listUsers();
            setUsers(response.data.data || []);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlanUpdate = async (uid: string, newPlan: string) => {
        try {
            await adminApi.updateUserPlan(uid, newPlan);
            toast.success(`Plan updated to ${newPlan}`);
            fetchUsers();
        } catch (error) {
            toast.error('Failed to update plan');
        }
    };

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <p className="text-slate-400">Manage {users.length} registered users.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm w-64 focus:border-blue-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all">
                        <Filter className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-950/50">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">User</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Plan</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Role</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Storage Used</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Joined</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {user.photoURL ? (
                                                <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border border-slate-700" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                                                    <UserIcon className="w-5 h-5 text-slate-500" />
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-100">{user.displayName || 'Anonymous'}</span>
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {user.email}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={user.plan}
                                            onChange={(e) => handlePlanUpdate(user.firebaseUid, e.target.value)}
                                            className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer capitalize"
                                        >
                                            <option value="free">Free</option>
                                            <option value="pro">Pro</option>
                                            <option value="enterprise">Enterprise</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'
                                            }`}>
                                            {user.role || 'user'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 w-32">
                                            <div className="flex justify-between text-[10px] text-slate-500">
                                                <span>{(user.storageUsed / (1024 * 1024)).toFixed(1)}MB</span>
                                                <span>{(user.storageLimit / (1024 * 1024)).toFixed(0)}MB</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${Math.min((user.storageUsed / user.storageLimit) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="p-2 hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-white">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/30">
                    <span className="text-sm text-slate-500">Showing {filteredUsers.length} users</span>
                    <div className="flex gap-2">
                        <button className="p-2 bg-slate-800 rounded-lg disabled:opacity-50">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-slate-800 rounded-lg disabled:opacity-50">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
