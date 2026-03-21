'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const { signInWithGoogle } = useAuthStore();
    const router = useRouter();

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            await signInWithGoogle();
            toast.success('Signed in successfully!');
            router.push('/dashboard');
        } catch (error: any) {
            console.error('Sign in error:', error);
            toast.error(error.message || 'Failed to sign in');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50 relative overflow-hidden">
            {/* Premium Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-mesh opacity-50"></div>
                {/* Animated Orbs */}
                <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-cyan-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-3 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-sky-500 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                    </Link>
                    <h1 className="text-4xl font-bold text-slate-900">
                        Welcome Back
                    </h1>
                    <p className="text-slate-600 mt-3 text-lg">
                        Sign in to access all premium PDF tools
                    </p>
                </div>

                <div className="p-8 space-y-6 rounded-[2rem] bg-white border border-slate-200 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors font-semibold text-slate-700 disabled:opacity-50 shadow-sm hover:shadow-md"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        ) : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                        )}
                        {isLoading ? 'Signing in...' : 'Continue with Google'}
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-slate-200"></div>
                        <span className="text-sm text-slate-500 font-medium">Secure Login</span>
                        <div className="flex-1 h-px bg-slate-200"></div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            </div>
                            Access all 11+ PDF tools
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            </div>
                            AI-powered features included
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            </div>
                            Save &amp; share your documents
                        </div>
                    </div>

                    <p className="text-center text-xs text-slate-500 pt-2 font-medium">
                        By signing in, you agree to our{' '}
                        <Link href="/terms" className="text-blue-600 hover:text-blue-700 hover:underline">
                            Terms
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="text-blue-600 hover:text-blue-700 hover:underline">
                            Privacy Policy
                        </Link>
                    </p>
                </div>

                <p className="text-center text-sm text-slate-500 mt-8 font-medium">
                    <Link href="/" className="text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                        &larr; Back to home
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}

