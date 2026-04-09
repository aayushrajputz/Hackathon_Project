'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileText, Shield, ArrowLeft, Lock, Trash2, EyeOff } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-100/40 rounded-full blur-[160px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-50/60 rounded-full blur-[140px]"></div>
            </div>

            <nav className="fixed top-0 left-0 right-0 z-50 p-6">
                <div className="container mx-auto">
                    <Link href="/" className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg text-sm font-black uppercase tracking-widest hover:bg-white transition-all">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </nav>

            <main className="relative z-10 pt-32 pb-24 px-6">
                <div className="container mx-auto max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-12"
                    >
                        <header className="space-y-6">
                            <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/20">
                                <Shield className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight">
                                Privacy <span className="text-blue-600">Policy.</span>
                            </h1>
                            <p className="text-xl text-slate-500 font-medium tracking-tight">
                                Last updated: April 9, 2026. <br />
                                Your trust is our most important asset.
                            </p>
                        </header>

                        <div className="grid gap-8">
                            <section className="p-10 rounded-[3rem] bg-white border border-slate-200 shadow-sm space-y-6">
                                <div className="flex items-center gap-4 text-blue-600">
                                    <Trash2 className="w-6 h-6" />
                                    <h2 className="text-2xl font-black uppercase tracking-tight">Zero Retention</h2>
                                </div>
                                <p className="text-slate-600 font-medium leading-relaxed">
                                    We do not store your original or processed files permanently. All documents uploaded for immediate processing are deleted from our servers the moment the session ends or after 1 hour, whichever comes first.
                                </p>
                            </section>

                            <section className="p-10 rounded-[3rem] bg-white border border-slate-200 shadow-sm space-y-6">
                                <div className="flex items-center gap-4 text-blue-600">
                                    <Lock className="w-6 h-6" />
                                    <h2 className="text-2xl font-black uppercase tracking-tight">End-to-End Encryption</h2>
                                </div>
                                <p className="text-slate-600 font-medium leading-relaxed">
                                    All file transfers occur over secure SSL/TLS channels. We use enterprise-grade encryption for both data in transit and any temporary data at rest.
                                </p>
                            </section>

                            <section className="p-10 rounded-[3rem] bg-white border border-slate-200 shadow-sm space-y-6">
                                <div className="flex items-center gap-4 text-blue-600">
                                    <EyeOff className="w-6 h-6" />
                                    <h2 className="text-2xl font-black uppercase tracking-tight">No Third-Party Tracking</h2>
                                </div>
                                <p className="text-slate-600 font-medium leading-relaxed">
                                    BinaryPDF does not sell your personal data or document content to third parties. We use minimal, privacy-focused analytics (Umami) to improve our tools without tracking individual users.
                                </p>
                            </section>
                        </div>

                        <footer>
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest text-center">
                                &copy; 2026 BINARYPDF. ALL RIGHTS RESERVED.
                            </p>
                        </footer>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
