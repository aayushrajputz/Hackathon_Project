import toast, { ToastOptions } from 'react-hot-toast';

const defaultOptions: ToastOptions = {
    duration: 4000,
    position: 'bottom-right',
};

export const notify = {
    success: (message: string) => {
        toast.success(message, {
            ...defaultOptions,
            style: {
                background: '#10B981',
                color: '#fff',
            },
            iconTheme: {
                primary: '#fff',
                secondary: '#10B981',
            },
        });
    },

    error: (message: string) => {
        toast.error(message, {
            ...defaultOptions,
            duration: 5000,
            style: {
                background: '#EF4444',
                color: '#fff',
            },
            iconTheme: {
                primary: '#fff',
                secondary: '#EF4444',
            },
        });
    },

    warning: (message: string) => {
        toast(message, {
            ...defaultOptions,
            icon: '⚠️',
            style: {
                background: '#F59E0B',
                color: '#fff',
            },
        });
    },

    info: (message: string) => {
        toast(message, {
            ...defaultOptions,
            icon: 'ℹ️',
            style: {
                background: '#3B82F6',
                color: '#fff',
            },
        });
    },

    promise: <T>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string;
            error: string;
        }
    ) => {
        return toast.promise(promise, messages, {
            style: {
                background: '#1F2937',
                color: '#fff',
            },
            success: {
                iconTheme: {
                    primary: '#10B981',
                    secondary: '#fff',
                },
            },
            error: {
                iconTheme: {
                    primary: '#EF4444',
                    secondary: '#fff',
                },
            },
        });
    },

    // Specific use cases for consistency
    // Specific use cases for consistency
    uploadSuccess: (filename: string) => {
        const message = `${filename} uploaded successfully.`;
        notify.success(message);
        // Sync with store (dynamically imported to avoid circular deps if any, though store is separate)
        import('./store').then(({ useNotificationStore }) => {
            useNotificationStore.getState().addNotification({
                title: 'Upload Successful',
                message,
                type: 'success',
            });
        });
    },

    uploadError: (reason: string) => {
        const message = `Upload failed: ${reason}`;
        notify.error(message);
        import('./store').then(({ useNotificationStore }) => {
            useNotificationStore.getState().addNotification({
                title: 'Upload Failed',
                message,
                type: 'error',
            });
        });
    },

    storageWarning: (percent: number) => {
        const message = `You have used ${percent}% of your storage.`;
        notify.warning(message);
        import('./store').then(({ useNotificationStore }) => {
            useNotificationStore.getState().addNotification({
                title: 'Storage Warning',
                message,
                type: 'warning',
            });
        });
    },

    planLimit: () => {
        const message = 'Plan limit reached. Please upgrade to continue.';
        notify.error(message);
        import('./store').then(({ useNotificationStore }) => {
            useNotificationStore.getState().addNotification({
                title: 'Plan Limit Reached',
                message,
                type: 'error',
            });
        });
    },

    // Generic handlers that also sync to store
    customSuccess: (title: string, message: string) => {
        notify.success(message);
        import('./store').then(({ useNotificationStore }) => {
            useNotificationStore.getState().addNotification({
                title,
                message,
                type: 'success',
            });
        });
    },

    customError: (title: string, message: string) => {
        notify.error(message);
        import('./store').then(({ useNotificationStore }) => {
            useNotificationStore.getState().addNotification({
                title,
                message,
                type: 'error',
            });
        });
    },
};
