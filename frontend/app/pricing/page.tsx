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
        color: 'bg-white border-slate-200',
        textColor: 'text-slate-900',
        buttonColor: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200',
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
        color: 'bg-blue-50/50 border-blue-200',
        textColor: 'text-blue-900',
        buttonColor: 'bg-gradient-to-r from-blue-600 to-sky-500 text-white hover:opacity-90',
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
        color: 'bg-white border-blue-300 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20',
        textColor: 'text-slate-900',
        buttonColor: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 shadow-md',
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
        color: 'bg-white border-slate-200',
        textColor: 'text-slate-900',
        buttonColor: 'bg-slate-800 text-white hover:bg-slate-900',
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
        router.push('/plans');
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 relative overflow-hidden">
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-mesh opacity-50"></div>
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-[128px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-300/20 rounded-full blur-[128px] animate-pulse delay-1000"></div>
            </div>

            <header className="relative z-20 border-b border-slate-200 backdrop-blur-xl bg-white/70">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gradient-premium">
                            BinaryPDF
                        </span>
                    </Link>
                    <nav className="flex items-center gap-6 font-medium">
                        <Link href="/" className="text-slate-600 hover:text-blue-600 transition-colors">Home</Link>
                        {isAuthenticated ? (
                            <Link href="/dashboard" className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors text-slate-700">
                                Dashboard
                            </Link>
                        ) : (
                            <Link href="/login" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 transition-all font-semibold shadow-md shadow-blue-500/20 text-white">
                                Login
                            </Link>
                        )}
                    </nav>
                </div>
            </header>

            <main className="relative z-10 container mx-auto px-6 py-20">
                <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <h1 className="text-5xl md:text-7xl font-bold mb-6">
                        <span className="text-slate-900">
                            Simple Pricing for
                        </span>
                        <br />
                        <span className="text-gradient-premium">
                            Infinite Possibilities
                        </span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
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
                            className={`relative rounded-3xl p-8 border backdrop-blur-xl flex flex-col h-full group hover:shadow-lg transition-all duration-300 ${plan.color}`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                                    MOST POPULAR
                                </div>
                            )}

                            <div className="mb-8">
                                <div className="text-3xl mb-4">{plan.emoji}</div>
                                <h3 className={`text-2xl font-bold mb-2 ${plan.textColor}`}>{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-bold text-slate-900">{plan.price}</span>
                                    <span className="text-slate-500 font-medium">{plan.period}</span>
                                </div>
                                <p className="mt-4 text-slate-600 text-sm leading-relaxed font-medium">
                                    {plan.description}
                                </p>
                            </div>

                            <ul className="space-y-4 mb-10 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Check className="w-3 h-3 text-emerald-600" />
                                        </div>
                                        <span className="text-slate-700 text-sm font-medium">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleAction(plan.id)}
                                disabled={isAuthenticated && currentPlan === plan.id}
                                className={`w-full py-4 rounded-2xl font-bold transition-all border ${isAuthenticated && currentPlan === plan.id
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default'
                                    : plan.buttonColor
                                    }`}
                            >
                                {isAuthenticated && currentPlan === plan.id
                                    ? 'Active Plan'
                                    : plan.id === 'free' ? 'Get Started' : 'Upgrade Now'}
                            </button>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-32 text-center bg-white border border-slate-200 rounded-[40px] p-12 shadow-sm">
                    <h2 className="text-3xl font-bold mb-6 text-slate-900">Frequently Asked Questions</h2>
                    <div className="grid md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
                        <div>
                            <h4 className="font-bold text-lg mb-2 text-blue-600">Can I cancel anytime?</h4>
                            <p className="text-slate-600 text-sm">Yes, you can cancel your subscription at any time from your dashboard settings. No questions asked.</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-2 text-blue-600">Is my data secure?</h4>
                            <p className="text-slate-600 text-sm">Absolutely. We use industry-standard encryption and never share your documents with anyone.</p>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="relative z-10 py-12 px-6 border-t border-slate-200 text-center bg-white">
                <p className="text-slate-500 text-sm font-medium">
                    &copy; 2025 BinaryPDF. All rights reserved. Crafted with ❤️ by Aayush.
                </p>
            </footer>
        </div>
    );
}
