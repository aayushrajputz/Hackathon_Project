"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { authApi } from "@/lib/api";
import { StatsCards } from "@/components/profile/StatsCards";
import { SettingsForm } from "@/components/profile/SettingsForm";
import { UserInfoCard } from "@/components/profile/UserInfoCard";

export default function ProfilePage() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<any>(null);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await authApi.getUserStats();
                if (response.data.success) {
                    setStats(response.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch user stats", error);
            } finally {
                setLoadingStats(false);
            }
        };

        if (user) {
            fetchStats();
        }
    }, [user]);

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight text-white">Profile & Settings</h2>
            </div>

            <div className="grid gap-6">
                {/* User Information Card */}
                <UserInfoCard />

                {/* Activity Stats */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Activity Overview</h3>
                    <StatsCards stats={stats} loading={loadingStats} />
                </div>

                {/* Settings */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Account Settings</h3>
                    <SettingsForm />
                </div>
            </div>
        </div>
    );
}
