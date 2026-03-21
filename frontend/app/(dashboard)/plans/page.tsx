'use client';

import { useState } from 'react';
import { Check, Star, Loader2, ShieldCheck, Zap, Server, Globe, Crown, ArrowRight, Shield } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { paymentApi } from '@/lib/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// Load Razorpay script
const loadRazorpay = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const plans = [
    {
        name: 'Lite',
        price: '₹0',
        period: '/month',
        description: 'For occasional PDF tasks',
        features: [
            '10 MB High-Speed Storage',
            '5 Global Operations / mo',
            '3 Neural AI Chats / mo',
            'Standard Encryption',
            '24h Asset Retention',
        ],
        planKey: 'free',
        isPremium: false,
    },
    {
        name: 'Student',
        price: '₹99',
        period: '/month',
        description: 'Accelerated academic workflow',
        features: [
            '500 MB High-Speed Storage',
            '25 MB Max Asset Injection',
            '20 Neural AI Chats / mo',
            '30 Global Operations / mo',
            '5 Secure Access Links',
            '7 Days Asset Retention',
        ],
        planKey: 'student',
        isPremium: false,
    },
    {
        name: 'Pro Pack',
        price: '₹299',
        period: '/month',
        description: 'Professional grade document suite',
        popular: true,
        features: [
            '2 GB High-Speed Storage',
            '100 MB Max Asset Injection',
            '200 Neural AI Chats / mo',
            'Unlimited Global Operations',
            '50 Secure Access Links',
            '30 Days Asset Retention',
            'Priority Neural Processing',
        ],
        planKey: 'pro',
        isPremium: true,
    },
    {
        name: 'Enterprise',
        price: '₹699',
        period: '/month',
        description: 'Unlimited document power',
        features: [
            '10 GB Managed Storage',
            '300 MB Max Asset Injection',
            'Unlimited Neural AI Chats',
            'Instant Priority Processing',
            'API Access Matrix',
            'Advanced Smart Caching',
            '6 Months Asset Retention',
            'White-glove Support',
        ],
        planKey: 'plus',
        isPremium: true,
    },
];

export default function PlansPage() {
    const { user } = useAuthStore();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const currentPlan = user?.plan || 'free';

    const handleUpgrade = async (planKey: string) => {
        if (planKey === 'free') return;
        setLoadingPlan(planKey);

        try {
            const res = await loadRazorpay();
            if (!res) {
                toast.error('Payment gateway failed to initialize');
                return;
            }

            const { data: response } = await paymentApi.createOrder(planKey);
            if (!response.success) throw new Error('Order creation rejected');

            const orderData = response.data;

            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: 'INR',
                name: 'BinaryPDF Premium',
                description: `Activation: ${planKey.toUpperCase()} Plan`,
                order_id: orderData.orderId,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await paymentApi.verifyPayment({
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpaySignature: response.razorpay_signature,
                            plan: planKey,
                        });

                        if (verifyRes.data.success) {
                            toast.success(`Welcome to the ${planKey} tier!`);
                            window.location.reload();
                        } else {
                            toast.error('Authentication verification failed');
                        }
                    } catch (err) {
                        toast.error('Payment signature mismatch');
                    }
                },
                prefill: {
                    name: user?.displayName || '',
                    email: user?.email || '',
                },
                theme: {
                    color: '#2563eb',
                },
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.open();
        } catch (error: any) {
            toast.error(error.message || 'Transmission error. Try again.');
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="relative min-h-[calc(100vh-4rem)] bg-slate-50 font-sans pb-24 overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/30 rounded-full blur-[140px] -z-10 animate-pulse-slow"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-100 rounded-full blur-[120px] -z-10"></div>

            <div className="max-w-7xl mx-auto px-6 pt-16 md:pt-24 space-y-20 relative z-10">
                {/* Tactical Header */}
                <div className="text-center space-y-6 max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest"
                    >
                        <Crown className="w-3.5 h-3.5" />
                        Subscription Matrix
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9]"
                    >
                        Provision Your <span className="text-blue-600">Storage</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-500 text-lg md:text-xl font-bold max-w-2xl mx-auto leading-relaxed"
                    >
                        Select a Tier matching your operational scale. Enterprise-grade encryption included in all provisions.
                    </motion.p>
                </div>

                {/* Grid Architecture */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={clsx(
                                "group relative rounded-[3rem] p-8 flex flex-col justify-between transition-all duration-500 border-2",
                                plan.popular
                                    ? "bg-white border-blue-600 shadow-2xl shadow-blue-500/10 scale-105 z-10"
                                    : "bg-white/50 backdrop-blur-sm border-slate-200 hover:border-blue-400 hover:bg-white"
                            )}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black px-6 py-2 rounded-full flex items-center gap-2 shadow-xl shadow-blue-500/40 tracking-widest">
                                    <Star className="w-3.5 h-3.5 fill-current" /> MOST CHOSEN
                                </div>
                            )}

                            <div>
                                <div className="flex justify-between items-start mb-10">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{plan.name}</h3>
                                        <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">{plan.description}</p>
                                    </div>
                                    <div className={clsx(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                                        plan.isPremium ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                                    )}>
                                        {plan.isPremium ? <Zap className="w-6 h-6" /> : <Server className="w-6 h-6" />}
                                    </div>
                                </div>

                                <div className="mb-10 flex items-baseline gap-1">
                                    <span className="text-5xl font-black text-slate-900 tracking-tighter">{plan.price}</span>
                                    <span className="text-slate-400 font-bold text-sm tracking-widest uppercase">{plan.period}</span>
                                </div>

                                <ul className="space-y-5 mb-12">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3">
                                            <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                                                <Check className="w-2.5 h-2.5 text-blue-600 stroke-[4]" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-600 leading-tight">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                {plan.planKey === currentPlan ? (
                                    <div className="w-full py-5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-center font-black text-[11px] uppercase tracking-widest shadow-sm">
                                        Active Profile
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleUpgrade(plan.planKey)}
                                        disabled={loadingPlan !== null}
                                        className={clsx(
                                            "w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3",
                                            plan.popular
                                                ? "bg-blue-600 text-white shadow-xl shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-1"
                                                : "bg-slate-900 text-white hover:bg-black"
                                        )}
                                    >
                                        {loadingPlan === plan.planKey ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <span>{plan.planKey === 'free' ? 'Revert to Lite' : 'Activate Tier'}</span>
                                                <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Storage Diagnostics */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-[3.5rem] p-12 shadow-sm relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-[80px] -z-10 translate-x-1/3 -translate-y-1/3"></div>

                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1 space-y-6 text-center md:text-left">
                            <div className="flex items-center gap-4 justify-center md:justify-start">
                                <div className="w-12 h-12 rounded-[1.25rem] bg-slate-900 flex items-center justify-center shadow-lg">
                                    <Server className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Vault Capacity</h3>
                            </div>
                            <p className="text-slate-500 font-bold leading-relaxed">
                                Real-time diagnostic of your current cloud storage provision. <span className="text-blue-600">Lite</span> users are capped at 10MB of indexed document data.
                            </p>
                            <div className="flex items-center gap-6 justify-center md:justify-start">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    Secure
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <Globe className="w-4 h-4 text-blue-500" />
                                    Global
                                </div>
                            </div>
                        </div>

                        <div className="w-px h-32 bg-slate-100 hidden md:block"></div>

                        <div className="space-y-4 min-w-[240px]">
                            <div className="flex items-end justify-center gap-3">
                                <div className="text-6xl font-black text-blue-600 tracking-tighter">
                                    {formatStorageSize(user?.storageUsed || 0)}
                                </div>
                                <div className="text-slate-300 font-black text-2xl mb-1">/</div>
                                <div className="text-3xl font-bold text-slate-300 tracking-tight mb-1">
                                    {formatStorageSize(user?.storageLimit || 10 * 1024 * 1024)}
                                </div>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                                <div
                                    className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min(((user?.storageUsed || 0) / (user?.storageLimit || 10 * 1024 * 1024)) * 100, 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-center font-black text-slate-400 uppercase tracking-widest">
                                {(((user?.storageUsed || 0) / (user?.storageLimit || 10 * 1024 * 1024)) * 100).toFixed(1)}% Capacity Occupied
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function formatStorageSize(bytes: number): string {
    if (bytes === 0) return '0MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
        return `${(mb / 1024).toFixed(1)}GB`;
    }
    return `${Math.round(mb)}MB`;
}
