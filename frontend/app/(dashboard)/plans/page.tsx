'use client';

import { Check, Shield, Zap, Database, Star } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';

const plans = [
    {
        name: 'Free',
        price: '$0',
        period: '/month',
        description: 'Perfect for getting started',
        features: [
            '100 MB Storage',
            'Basic PDF Tools',
            'Limited AI Summaries',
            'Standard Support',
        ],
        color: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-900 dark:text-white',
        buttonColor: 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100',
        current: (plan: string) => plan === 'free',
        limit: 100 * 1024 * 1024,
    },
    {
        name: 'Basic',
        price: '$9',
        period: '/month',
        description: 'For regular users',
        features: [
            '2 GB Storage',
            'Unlimited AI Chat',
            'OCR & Masking',
            'Priority Support',
        ],
        popular: true,
        color: 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500',
        textColor: 'text-blue-900 dark:text-blue-100',
        buttonColor: 'bg-blue-600 text-white hover:bg-blue-700',
        current: (plan: string) => plan === 'basic',
        limit: 2 * 1024 * 1024 * 1024,
    },
    {
        name: 'Pro',
        price: '$29',
        period: '/month',
        description: 'For power users & teams',
        features: [
            '10 GB Storage',
            'Priority AI Processing',
            'Folder Management',
            'Advanced Security',
            'API Access',
        ],
        color: 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-500',
        textColor: 'text-purple-900 dark:text-purple-100',
        buttonColor: 'bg-purple-600 text-white hover:bg-purple-700',
        current: (plan: string) => plan === 'pro',
        limit: 10 * 1024 * 1024 * 1024,
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        period: '',
        description: 'For large organizations',
        features: [
            'Custom Storage',
            'SSO & Admin Controls',
            'Dedicated Account Manager',
            'Custom AI Models',
            'SLA Guarantee',
        ],
        color: 'bg-gray-900 text-white dark:bg-black',
        textColor: 'text-white',
        buttonColor: 'bg-white text-gray-900 hover:bg-gray-100',
        current: (plan: string) => plan === 'enterprise',
        limit: -1,
    },
];

export default function PlansPage() {
    const { user } = useAuthStore();
    const currentPlan = user?.plan || 'free';

    return (
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
                    Simple, transparent pricing
                </h1>
                <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500 dark:text-gray-400">
                    Choose the plan that best fits your needs. Upgrade or downgrade at any time.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                {plans.map((plan, index) => (
                    <motion.div
                        key={plan.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden ${plan.color} p-8`}
                    >
                        {plan.popular && (
                            <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current" /> POPULAR
                            </div>
                        )}

                        <div>
                            <h3 className={`text-xl font-semibold ${plan.textColor}`}>
                                {plan.name}
                            </h3>
                            <div className="mt-4 flex items-baseline text-gray-900 dark:text-white">
                                <span className="text-5xl font-extrabold tracking-tight">
                                    {plan.price}
                                </span>
                                <span className={`ml-1 text-xl font-semibold opacity-70 ${plan.textColor}`}>
                                    {plan.period}
                                </span>
                            </div>
                            <p className="mt-4 text-base opacity-80">{plan.description}</p>

                            <ul className="mt-6 space-y-4">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex">
                                        <Check className="flex-shrink-0 w-5 h-5 text-green-500" />
                                        <span className="ml-3 text-base opacity-90">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="mt-8">
                            {plan.current(currentPlan) ? (
                                <div className="w-full block bg-green-500 text-white text-center font-semibold py-3 rounded-lg cursor-default">
                                    Current Plan
                                </div>
                            ) : (
                                <button
                                    className={`w-full block text-center font-semibold py-3 rounded-lg transition-colors ${plan.buttonColor}`}
                                    onClick={() => alert(`Clicked upgrade to ${plan.name} plan`)}
                                >
                                    {plan.name === 'Enterprise' ? 'Contact Sales' : 'Upgrade'}
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-16 bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden lg:grid lg:grid-cols-2 lg:gap-4">
                <div className="pt-10 pb-12 px-6 sm:pt-16 sm:px-16 lg:py-16 lg:pr-0 xl:py-20 xl:px-20">
                    <div className="lg:self-center">
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
                            <span className="block">Ready to dive in?</span>
                            <span className="block text-primary-600">Start your free trial today.</span>
                        </h2>
                        <p className="mt-4 text-lg leading-6 text-gray-500 dark:text-gray-400">
                            Experience the full power of BrainyPDF with our 14-day free trial on Pro plans. No credit card required.
                        </p>
                        <a
                            href="#"
                            className="mt-8 bg-primary-600 border border-transparent rounded-md shadow px-5 py-3 inline-flex items-center text-base font-medium text-white hover:bg-primary-700"
                        >
                            Get started
                        </a>
                    </div>
                </div>
                <div className="-mt-6 aspect-w-5 aspect-h-3 md:aspect-w-2 md:aspect-h-1">
                    <div className="transform translate-x-6 translate-y-6 rounded-md object-cover object-left-top sm:translate-x-16 lg:translate-y-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-900 h-full w-full opacity-50 p-8 flex items-center justify-center">
                        <Shield className="w-32 h-32 text-gray-400 opacity-20" />
                    </div>
                </div>
            </div>
        </div>
    );
}
