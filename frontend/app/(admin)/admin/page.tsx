'use client';

import { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { adminApi } from '@/lib/api';
import {
    Users,
    FileText,
    HardDrive,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    ArrowRight
} from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface Stats {
    totalUsers: number;
    totalDocs: number;
    totalStorage: number;
    planStats: { _id: string; count: number }[];
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, analyticsRes] = await Promise.all([
                    adminApi.getStats(),
                    adminApi.getAnalytics()
                ]);
                setStats(statsRes.data.data);
                setAnalytics(analyticsRes.data.data);
            } catch (error) {
                console.error('Failed to fetch admin data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Activity className="w-8 h-8 text-blue-500 animate-pulse" />
            </div>
        );
    }

    // Chart Data: User Growth
    const growthChartData = {
        labels: analytics?.userGrowth?.map((d: any) => d._id) || [],
        datasets: [
            {
                label: 'New Users',
                data: analytics?.userGrowth?.map((d: any) => d.count) || [],
                fill: true,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#3b82f6',
            }
        ]
    };

    // Chart Data: Plan Distribution
    const planChartData = {
        labels: stats?.planStats.map(p => p._id.toUpperCase()) || [],
        datasets: [
            {
                data: stats?.planStats.map(p => p.count) || [],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                    'rgba(100, 116, 139, 0.8)',
                ],
                borderColor: '#0f172a',
                borderWidth: 2,
            }
        ]
    };

    const cards = [
        {
            title: 'Total Users',
            value: stats?.totalUsers || 0,
            icon: Users,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10',
            trend: '+12%',
            trendUp: true
        },
        {
            title: 'Files Uploaded',
            value: stats?.totalDocs || 0,
            icon: FileText,
            color: 'text-purple-400',
            bg: 'bg-purple-400/10',
            trend: '+8%',
            trendUp: true
        },
        {
            title: 'Platform Storage',
            value: formatBytes(stats?.totalStorage || 0),
            icon: HardDrive,
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10',
            trend: '+2.4GB',
            trendUp: true
        },
        {
            title: 'Est. Monthly Revenue',
            value: '₹12,450',
            icon: TrendingUp,
            color: 'text-orange-400',
            bg: 'bg-orange-400/10',
            trend: '+18.5%',
            trendUp: true
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold mb-2 text-slate-100">System Overview</h1>
                <p className="text-slate-400">Real-time performance metrics and platform health.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all group overflow-hidden relative">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-600/5 rounded-full blur-2xl group-hover:bg-blue-600/10 transition-all"></div>

                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl ${card.bg}`}>
                                <card.icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${card.trendUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {card.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {card.trend}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-slate-400 text-sm font-medium mb-1">{card.title}</h3>
                            <div className="text-2xl font-bold tracking-tight text-slate-100">{card.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User Growth Chart */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-100">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        User Growth (Last 7 Days)
                    </h3>
                    <div className="h-[300px]">
                        <Line
                            data={growthChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
                                    x: { grid: { display: false }, ticks: { color: '#64748b' } }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Plan Distribution Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-6 text-slate-100">Plan Distribution</h3>
                    <div className="h-[250px] flex items-center justify-center">
                        <Doughnut
                            data={planChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: { color: '#94a3b8', boxWidth: 12, padding: 20 }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-6 text-slate-100">Quick Operations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-left text-sm font-medium transition-all flex items-center justify-between group text-slate-200">
                        Purge Temp Files
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </button>
                    <button className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-left text-sm font-medium transition-all flex items-center justify-between group text-slate-200">
                        Sync Storage Quotas
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </button>
                </div>
            </div>
        </div>
    );
}
