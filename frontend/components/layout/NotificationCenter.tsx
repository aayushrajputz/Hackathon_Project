'use client';

import { Fragment, useEffect, useState } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { useNotificationStore } from '@/lib/store';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationCenter() {
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        removeNotification
    } = useNotificationStore();

    // Hydration fix
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return (
        <Popover className="relative">
            {({ open }) => (
                <>
                    <Popover.Button
                        className={clsx(
                            "relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500",
                            open && "bg-gray-100 dark:bg-slate-800"
                        )}
                    >
                        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                        )}
                    </Popover.Button>

                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                    >
                        <Popover.Panel className="absolute right-0 z-50 mt-2 w-80 sm:w-96 transform">
                            <div className="overflow-hidden rounded-2xl shadow-xl ring-1 ring-black ring-opacity-5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
                                <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Notifications
                                    </h3>
                                    <div className="flex gap-2">
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                        {notifications.length > 0 && (
                                            <button
                                                onClick={clearAll}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="max-h-[28rem] overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                                                <Bell className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <p className="text-sm text-gray-500">No notifications yet</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100 dark:divide-slate-800">
                                            <AnimatePresence initial={false}>
                                                {notifications.map((notification) => (
                                                    <motion.div
                                                        key={notification.id}
                                                        layout
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className={clsx(
                                                            "relative p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group",
                                                            !notification.read && "bg-blue-50/50 dark:bg-blue-900/10"
                                                        )}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className={clsx(
                                                                "w-2 h-2 mt-2 rounded-full flex-shrink-0",
                                                                notification.type === 'success' ? "bg-green-500" :
                                                                    notification.type === 'error' ? "bg-red-500" :
                                                                        notification.type === 'warning' ? "bg-yellow-500" :
                                                                            "bg-blue-500"
                                                            )} />
                                                            <div className="flex-1 min-w-0">
                                                                <p className={clsx(
                                                                    "text-sm font-medium",
                                                                    notification.read ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-white"
                                                                )}>
                                                                    {notification.title}
                                                                </p>
                                                                <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                                                                    {notification.message}
                                                                </p>
                                                                <p className="text-xs text-gray-400 mt-1">
                                                                    {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                                                                </p>
                                                            </div>
                                                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {!notification.read && (
                                                                    <button
                                                                        onClick={() => markAsRead(notification.id)}
                                                                        className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded"
                                                                        title="Mark as read"
                                                                    >
                                                                        <Check className="w-3 h-3 text-gray-500" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => removeNotification(notification.id)}
                                                                    className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded"
                                                                    title="Remove"
                                                                >
                                                                    <X className="w-3 h-3 text-gray-500" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Popover.Panel>
                    </Transition>
                </>
            )}
        </Popover>
    );
}
