'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { paymentApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

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
        id: 'free',
        name: 'Free',
        price: '₹0',
        features: ['100MB Storage', 'Basic PDF Tools', 'Limit 10 Files/Day'],
        popular: false,
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '₹499',
        interval: '/lifetime',
        features: ['5GB Storage', 'Priority AI Processing', 'Unlimited Files', 'No Ads'],
        popular: true,
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: '₹2999',
        interval: '/lifetime',
        features: ['50GB Storage', 'Team Collaboration', 'API Access', '24/7 Support'],
        popular: false,
    },
];

export default function PricingPage() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState<string | null>(null);

    const handleUpgrade = async (planId: string) => {
        if (planId === 'free') return;
        setLoading(planId);

        try {
            const res = await loadRazorpay();
            if (!res) {
                toast.error('Razorpay SDK failed to load');
                setLoading(null);
                return;
            }

            // Create Order
            const { data: response } = await paymentApi.createOrder(planId);
            if (!response.success) {
                throw new Error('Order creation failed');
            }

            const orderData = response.data;

            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: 'INR',
                name: 'BrainyPDF',
                description: `Upgrade to ${planId.toUpperCase()} Plan`,
                order_id: orderData.orderId,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await paymentApi.verifyPayment({
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpaySignature: response.razorpay_signature,
                            plan: planId,
                        });

                        if (verifyRes.data.success) {
                            toast.success(`Successfully upgraded to ${planId} plan!`);
                            // Optionally reload user to update storage limits
                            window.location.reload();
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
                    color: '#2563eb',
                },
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.open();
        } catch (error) {
            console.error('Payment Error:', error);
            toast.error('Something went wrong. Please try again.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold mb-4">Upgrade Your Storage</h1>
                <p className="text-gray-500">Choose the perfect plan for your needs</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`relative rounded-2xl border p-8 bg-card ${plan.popular ? 'border-primary shadow-lg ring-1 ring-primary' : 'border-border'
                            }`}
                    >
                        {plan.popular && (
                            <div className="absolute top-0 transform -translate-y-1/2 left-1/2 -translate-x-1/2">
                                <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                    Most Popular
                                </span>
                            </div>
                        )}

                        <div className="mb-8">
                            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold">{plan.price}</span>
                                {plan.interval && <span className="text-gray-500">{plan.interval}</span>}
                            </div>
                        </div>

                        <ul className="space-y-4 mb-8">
                            {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span className="text-gray-600">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleUpgrade(plan.id)}
                            disabled={loading === plan.id || plan.id === 'free'}
                            className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${plan.id === 'free'
                                ? 'bg-secondary text-secondary-foreground cursor-default'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                }`}
                        >
                            {loading === plan.id ? (
                                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                            ) : plan.id === 'free' ? (
                                'Current Plan'
                            ) : (
                                'Upgrade Now'
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
