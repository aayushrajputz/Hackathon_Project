import React from 'react';
import { Share2, Eye, Download } from 'lucide-react';

interface StatsProps {
    stats: {
        totalShared: number;
        totalViews: number;
        totalDownloads: number;
    } | null;
    loading: boolean;
}

export function StatsCards({ stats, loading }: StatsProps) {
    const statItems = [
        {
            title: "Files Shared",
            value: stats?.totalShared || 0,
            icon: Share2,
            description: "Total active share links created"
        },
        {
            title: "Total Views",
            value: stats?.totalViews || 0,
            icon: Eye,
            description: "Total views across all shared files"
        },
        {
            title: "Total Downloads",
            value: stats?.totalDownloads || 0,
            icon: Download,
            description: "Total downloads across all shared files"
        }
    ];

    return (
        <div className="grid gap-4 md:grid-cols-3">
            {statItems.map((item, index) => (
                <div key={index} className="rounded-xl border bg-card text-card-foreground shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-slate-700 dark:text-slate-200">
                            {item.title}
                        </h3>
                        <item.icon className="h-4 w-4 text-muted-foreground text-slate-500" />
                    </div>
                    <div className="p-6 pt-0">
                        {loading ? (
                            <div className="h-8 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold text-slate-900 dark:text-white">{item.value}</div>
                                <p className="text-xs text-muted-foreground text-slate-500 dark:text-slate-400">
                                    {item.description}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
