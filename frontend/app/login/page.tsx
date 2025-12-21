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
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-950 relative overflow-hidden">
            {/* Premium Background */}
            <div className="fixed inset-0 z-0">
                <Image
                    src="/images/hero-bg.png"
                    alt="Background"
                    fill
                    className="object-cover opacity-50"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/50 to-slate-950"></div>
                {/* Animated Orbs */}
                <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-3 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                    </Link>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                        Welcome Back
                    </h1>
                    <p className="text-gray-400 mt-3 text-lg">
                        Sign in to access all premium PDF tools
                    </p>
                </div>

                <div className="p-8 space-y-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white rounded-xl hover:bg-gray-100 transition-colors font-semibold text-gray-700 disabled:opacity-50 shadow-lg"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
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
                        <div className="flex-1 h-px bg-white/10"></div>
                        <span className="text-sm text-gray-500">Secure Login</span>
                        <div className="flex-1 h-px bg-white/10"></div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            </div>
                            Access all 11+ PDF tools
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            </div>
                            AI-powered features included
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            </div>
                            Save & share your documents
                        </div>
                    </div>

                    <p className="text-center text-xs text-gray-500 pt-2">
                        By signing in, you agree to our{' '}
                        <Link href="/terms" className="text-cyan-400 hover:underline">
                            Terms
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="text-cyan-400 hover:underline">
                            Privacy Policy
                        </Link>
                    </p>
                </div>

                <p className="text-center text-sm text-gray-500 mt-8">
                    <Link href="/" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                        ← Back to home
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
