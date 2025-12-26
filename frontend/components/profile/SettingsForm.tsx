"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function SettingsForm() {
    const { user, initAuth } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [displayName, setDisplayName] = useState(user?.displayName || "");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await authApi.updateProfile(displayName);
            await initAuth(); // Refresh user data
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error("Failed to update profile");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid gap-6">
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="font-semibold leading-none tracking-tight text-slate-900 dark:text-white">Profile Settings</h3>
                    <p className="text-sm text-muted-foreground text-slate-500 dark:text-slate-400">
                        Update your personal information.
                    </p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 pt-0 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700 dark:text-slate-300" htmlFor="email">Email</label>
                            <input
                                id="email"
                                value={user?.email || ""}
                                disabled
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 border-slate-200 dark:border-slate-800 opacity-50 text-slate-500"
                            />
                            <p className="text-xs text-muted-foreground text-slate-500">
                                Email cannot be changed directly.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700 dark:text-slate-300" htmlFor="displayName">Display Name</label>
                            <input
                                id="displayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Your Name"
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700 dark:text-slate-300">Current Plan</label>
                            <div className="font-medium capitalize text-slate-900 dark:text-white">{user?.plan || "Free"}</div>
                        </div>
                    </div>
                    <div className="flex items-center p-6 pt-0">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
