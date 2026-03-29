'use client';

import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Brain, Database, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SignupBanner() {
    const { isAuthenticated } = useAuthStore();

    if (isAuthenticated) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 p-8 rounded-[2.5rem] bg-blue-600 shadow-2xl shadow-blue-500/20 text-left relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -z-0 translate-x-1/2 -translate-y-1/2 group-hover:bg-white/20 transition-all duration-700"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                        <Database className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight leading-none uppercase mb-2">Save to your Library</h3>
                        <p className="text-blue-100 text-sm font-bold leading-relaxed max-w-sm">
                            Create a free account to keep your processed files in secure private storage and unlock AI insights.
                        </p>
                    </div>
                </div>

                <Link
                    href="/login"
                    className="px-10 py-5 bg-white text-blue-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-50 transition-all shadow-xl hover:-translate-y-1 flex items-center gap-3 group/btn shrink-0"
                >
                    Create Free Account
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
            </div>
        </motion.div>
    );
}
