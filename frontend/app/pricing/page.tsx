'use client';

import { useState } from 'react';
import { Check, Star, ArrowLeft, FileText } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const plans = [
    {
        id: 'free',
        name: 'Free',
        emoji: '🆓',
        price: '₹0',
        period: '/month',
        description: 'Try before you buy',
        features: [
            '10 MB Storage',
            '5 Toolkit Operations',
            '3 AI Chats',
            'No Sharing Links',
            '1 Day Retention',
        ],
        color: 'bg-white/5 border-white/10',
        textColor: 'text-white',
        buttonColor: 'bg-white/10 text-white hover:bg-white/20',
        popular: false,
    },
    {
        id: 'student',
        name: 'Student',
        emoji: '🎓',
        price: '₹99',
        period: '/mo',
        description: 'Perfect for students',
        features: [
            '500 MB Storage',
            '25 MB Max PDF',
            '20 AI Chats/mo',
            '30 Toolkit Ops/mo',
            '5 Secure Links',
            '7 Days Retention',
        ],
        color: 'bg-blue-500/10 border-blue-500/30',
        textColor: 'text-blue-100',
        buttonColor: 'bg-blue-600 text-white hover:bg-blue-700',
        popular: false,
    },
    {
        id: 'pro',
        name: 'Pro',
        emoji: '💼',
        price: '₹299',
        period: '/mo',
        description: 'For professionals',
        popular: true,
        features: [
            '2 GB Storage',
            '100 MB Max PDF',
            '200 AI Chats/mo',
            'Unlimited Toolkit',
            '50 Secure Links',
            '30 Days Retention',
        ],
        color: 'bg-purple-500/10 border-purple-500/30 shadow-2xl shadow-purple-500/20',
        textColor: 'text-purple-100',
        buttonColor: 'bg-purple-600 text-white hover:bg-purple-700',
    },
    {
        id: 'plus',
        name: 'Plus',
        emoji: '🚀',
        price: '₹699',
        period: '/mo',
        description: 'Maximum power',
        features: [
            '10 GB Storage',
            '300 MB Max PDF',
            'Unlimited AI Chats',
            'Priority Processing',
            'API Access (Rate Limited)',
            'Smart Caching',
            '6 Months Retention',
        ],
        color: 'bg-amber-500/10 border-amber-500/30',
        textColor: 'text-amber-100',
        buttonColor: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600',
        popular: false,
    },
];

export default function PricingPage() {
    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const currentPlan = user?.plan || 'free';

    const handleAction = (planId: string) => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        // If logged in, go to dashboard pricing to handle payment
        router.push('/plans');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
            {/* Premium Background */}
            <div className="fixed inset-0 z-0">
                <Image
                    src="/images/hero-bg.png"
                    alt="Background"
                    fill
                    className="object-cover opacity-40"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/50 to-slate-950"></div>
                {/* Animated Orbs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px] animate-pulse delay-1000"></div>
            </div>

            {/* Header */}
            <header className="relative z-20 border-b border-white/10 backdrop-blur-md bg-slate-950/50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            BinaryPDF
                        </span>
                    </Link>
                    <nav className="flex items-center gap-6">
                        <Link href="/" className="text-gray-400 hover:text-white transition-colors">Home</Link>
                        {isAuthenticated ? (
                            <Link href="/dashboard" className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                                Dashboard
                            </Link>
                        ) : (
                            <Link href="/login" className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 transition-all font-semibold shadow-lg shadow-purple-500/25">
                                Login
                            </Link>
                        )}
                    </nav>
                </div>
            </header>

            <main className="relative z-10 container mx-auto px-6 py-20">
                <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <h1 className="text-5xl md:text-7xl font-bold mb-6">
                        <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                            Simple Pricing for
                        </span>
                        <br />
                        <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Infinite Possibilities
                        </span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Unlock powerful tools and higher storage limits. Choose the plan that works for you.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className={`relative rounded-3xl p-8 border backdrop-blur-xl flex flex-col h-full group hover:scale-[1.02] transition-all duration-300 ${plan.color}`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-400 to-purple-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                                    MOST POPULAR
                                </div>
                            )}

                            <div className="mb-8">
                                <div className="text-3xl mb-4">{plan.emoji}</div>
                                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-bold">{plan.price}</span>
                                    <span className="text-gray-400">{plan.period}</span>
                                </div>
                                <p className="mt-4 text-gray-400 text-sm leading-relaxed">
                                    {plan.description}
                                </p>
                            </div>

                            <ul className="space-y-4 mb-10 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Check className="w-3 h-3 text-green-500" />
                                        </div>
                                        <span className="text-gray-300 text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleAction(plan.id)}
                                disabled={isAuthenticated && currentPlan === plan.id}
                                className={`w-full py-4 rounded-2xl font-bold transition-all ${isAuthenticated && currentPlan === plan.id
                                    ? 'bg-green-500/20 text-green-500 cursor-default border border-green-500/30'
                                    : plan.buttonColor + ' shadow-lg hover:shadow-cyan-500/20'
                                    }`}
                            >
                                {isAuthenticated && currentPlan === plan.id
                                    ? 'Active Plan'
                                    : plan.id === 'free' ? 'Get Started' : 'Upgrade Now'}
                            </button>
                        </motion.div>
                    ))}
                </div>

                {/* FAQ section or similar if needed */}
                <div className="mt-32 text-center bg-white/5 border border-white/10 rounded-[40px] p-12 backdrop-blur-xl">
                    <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
                    <div className="grid md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
                        <div>
                            <h4 className="font-bold text-lg mb-2 text-cyan-400">Can I cancel anytime?</h4>
                            <p className="text-gray-400 text-sm">Yes, you can cancel your subscription at any time from your dashboard settings. No questions asked.</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-2 text-cyan-400">Is my data secure?</h4>
                            <p className="text-gray-400 text-sm">Absolutely. We use industry-standard encryption and never share your documents with anyone.</p>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="relative z-10 py-12 px-6 border-t border-white/10 text-center">
                <p className="text-gray-500 text-sm">
                    © 2025 BinaryPDF. All rights reserved. Crafted with ❤️ by Aayush.
                </p>
            </footer>
        </div>
    );
}
