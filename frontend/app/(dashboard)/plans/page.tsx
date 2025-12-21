'use client';

import { useState } from 'react';
import { Check, Star, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { paymentApi } from '@/lib/api';
import toast from 'react-hot-toast';

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

// Updated plans matching the config/plans.go storage limits
const plans = [
    {
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
        color: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-900 dark:text-white',
        buttonColor: 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100',
        planKey: 'free',
    },
    {
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
        color: 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500',
        textColor: 'text-blue-900 dark:text-blue-100',
        buttonColor: 'bg-blue-600 text-white hover:bg-blue-700',
        planKey: 'student',
    },
    {
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
        color: 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-500',
        textColor: 'text-purple-900 dark:text-purple-100',
        buttonColor: 'bg-purple-600 text-white hover:bg-purple-700',
        planKey: 'pro',
    },
    {
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
        color: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-500',
        textColor: 'text-amber-900 dark:text-amber-100',
        buttonColor: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600',
        planKey: 'plus',
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
                toast.error('Razorpay SDK failed to load');
                return;
            }

            // Create Order
            const { data: response } = await paymentApi.createOrder(planKey);
            if (!response.success) {
                throw new Error('Order creation failed');
            }

            const orderData = response.data;

            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: 'INR',
                name: 'BinaryPDF',
                description: `Upgrade to ${planKey.toUpperCase()} Plan`,
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
                            toast.success(`Successfully upgraded to ${planKey} plan!`);
                            window.location.reload();
                        } else {
                            toast.error('Payment verification failed');
                        }
                    } catch (err) {
                        toast.error('Payment verification failed');
                        console.error(err);
                    }
                },
                prefill: {
                    name: user?.displayName || '',
                    email: user?.email || '',
                },
                theme: {
                    color: '#8b5cf6', // purple-500
                },
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.open();
        } catch (error: any) {
            console.error('Payment Error:', error);
            toast.error(error.message || 'Something went wrong. Please try again.');
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
                    Upgrade Your Storage
                </h1>
                <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500 dark:text-gray-400">
                    Choose the perfect plan for your needs. Cancel anytime.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {plans.map((plan, index) => (
                    <motion.div
                        key={plan.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden ${plan.color} p-6 h-full`}
                    >
                        {plan.popular && (
                            <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current" /> MOST POPULAR
                            </div>
                        )}

                        <div>
                            <h3 className={`text-xl font-semibold ${plan.textColor} flex items-center gap-2`}>
                                <span className="text-2xl">{plan.emoji}</span>
                                {plan.name}
                            </h3>
                            <div className="mt-4 flex items-baseline">
                                <span className={`text-4xl font-extrabold tracking-tight ${plan.textColor}`}>
                                    {plan.price}
                                </span>
                                <span className={`ml-1 text-lg font-semibold opacity-70 ${plan.textColor}`}>
                                    {plan.period}
                                </span>
                            </div>
                            <p className="mt-3 text-sm opacity-80">{plan.description}</p>

                            <ul className="mt-6 space-y-3">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start">
                                        <Check className="flex-shrink-0 w-4 h-4 text-green-500 mt-1" />
                                        <span className="ml-2 text-sm opacity-90">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="mt-8">
                            {plan.planKey === currentPlan ? (
                                <div className="w-full block bg-green-500 text-white text-center font-semibold py-3 rounded-xl cursor-default">
                                    ✓ Active Plan
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleUpgrade(plan.planKey)}
                                    disabled={loadingPlan !== null}
                                    className={`w-full block text-center font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${plan.buttonColor}`}
                                >
                                    {loadingPlan === plan.planKey ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        plan.planKey === 'free' ? 'Downgrade' : 'Upgrade Now'
                                    )}
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Storage Info */}
            <div className="mt-12 text-center p-8 bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Your Current Storage
                </h3>
                <div className="flex items-center justify-center gap-4">
                    <div className="text-5xl font-bold text-primary-600">
                        {formatStorageSize(user?.storageUsed || 0)}
                    </div>
                    <div className="text-gray-400">/</div>
                    <div className="text-5xl font-bold text-gray-400">
                        {formatStorageSize(user?.storageLimit || 10 * 1024 * 1024)}
                    </div>
                </div>
                <p className="mt-4 text-gray-500">
                    Plan: <span className="font-bold text-primary-500 uppercase">{currentPlan}</span> • Free users get 10MB storage.
                </p>
            </div>
        </div>
    );
}

// Helper function to format storage size
function formatStorageSize(bytes: number): string {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
        return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${Math.round(mb)} MB`;
}
