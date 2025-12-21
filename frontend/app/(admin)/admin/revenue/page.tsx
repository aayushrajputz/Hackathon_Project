'use client';

import {
    CreditCard,
    ArrowUpRight,
    TrendingUp,
    DollarSign,
    Target,
    Zap,
    Users,
    Activity
} from 'lucide-react';

export default function RevenueDashboard() {
    // Mock data for visual appeal (In real app, this would come from a dedicated revenue service/API)
    const metrics = [
        { label: 'Total Revenue', value: '₹48,290', trend: '+22.4%', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { label: 'Active Subscriptions', value: '142', trend: '+12', icon: CreditCard, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { label: 'Avg. Revenue/User', value: '₹340', trend: '+5.2%', icon: Target, color: 'text-purple-400', bg: 'bg-purple-400/10' },
        { label: 'Churn Rate', value: '2.4%', trend: '-0.8%', icon: Activity, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    ];

    const planRevenue = [
        { name: 'Student Plan', count: 85, revenue: '₹8,415', color: 'bg-blue-500' },
        { name: 'Pro Plan', count: 42, revenue: '₹12,558', color: 'bg-indigo-500' },
        { name: 'Plus Plan', count: 12, revenue: '₹8,388', color: 'bg-purple-500' },
        { name: 'Business Plan', count: 3, revenue: '₹5,997', color: 'bg-pink-500' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div>
                <h1 className="text-3xl font-bold">Revenue Analytics</h1>
                <p className="text-slate-400">Financial performance and subscription health.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((m, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:shadow-2xl hover:shadow-blue-500/5 transition-all group overflow-hidden relative">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${m.bg}`}>
                                <m.icon className={`w-6 h-6 ${m.color}`} />
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                                <ArrowUpRight className="w-3 h-3" />
                                {m.trend}
                            </div>
                        </div>
                        <h3 className="text-slate-500 text-sm font-medium mb-1">{m.label}</h3>
                        <div className="text-3xl font-bold tracking-tight">{m.value}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue by Plan */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold">Revenue by Subscription Tier</h3>
                        <button className="text-xs text-blue-400 font-bold hover:underline">View Detailed Breakdown</button>
                    </div>

                    <div className="space-y-6">
                        {planRevenue.map((plan, i) => (
                            <div key={i} className="group cursor-pointer">
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <h4 className="font-semibold text-slate-200">{plan.name}</h4>
                                        <p className="text-xs text-slate-500">{plan.count} active subscribers</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-slate-100">{plan.revenue}</div>
                                        <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Growing</div>
                                    </div>
                                </div>
                                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${plan.color} transition-all duration-1000 group-hover:brightness-125`}
                                        style={{ width: `${(parseInt(plan.count.toString()) / 142) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Target Progress */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-600/5 blur-3xl rounded-full"></div>
                    <div className="relative z-10">
                        <div className="w-40 h-40 rounded-full border-8 border-slate-800 flex items-center justify-center relative mb-6">
                            <div className="absolute inset-0 border-8 border-blue-600 rounded-full" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 65%, 0 65%)' }}></div>
                            <div className="flex flex-col">
                                <span className="text-3xl font-black">₹50K</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Monthly Goal</span>
                            </div>
                        </div>
                        <h4 className="text-lg font-bold mb-2">Goal Milestone</h4>
                        <p className="text-sm text-slate-400 mb-6">You are just ₹1,710 away from your December target! 🚀</p>
                        <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-600/20">
                            Create Promo Campaign
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Payouts Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-slate-800">
                    <h3 className="font-bold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        Recent Subscription Payments
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs text-slate-500 uppercase font-bold tracking-widest bg-slate-950/50">
                                <th className="px-6 py-4">Transaction ID</th>
                                <th className="px-6 py-4">Plan</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 text-xs font-mono text-blue-400">pay_RX{Math.random().toString(36).substring(7).toUpperCase()}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold uppercase tracking-tighter px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20">Pro Plan</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium">user_demo_{i}@example.com</td>
                                    <td className="px-6 py-4 text-sm font-bold">₹299.00</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                            Success
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500">2 hours ago</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
