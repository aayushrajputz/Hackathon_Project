import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from './api';

interface UserData {
    id: string;
    email: string;
    displayName: string;
    photoURL: string;
    plan: string;
    storageUsed: number;
    storageLimit: number;
}

interface AuthState {
    user: UserData | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    // Actions
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    setUser: (user: UserData | null) => void;
    initAuth: () => Promise<void>;
    syncStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isLoading: true,
            isAuthenticated: false,

            signInWithGoogle: async () => {
                try {
                    set({ isLoading: true });

                    // Dynamically import Firebase
                    const { initializeFirebase } = await import('./firebase');
                    const { auth, provider } = await initializeFirebase();

                    if (!auth || !provider) {
                        throw new Error('Firebase not initialized');
                    }

                    const { signInWithPopup } = await import('firebase/auth');
                    const result = await signInWithPopup(auth, provider);
                    const firebaseUser = result.user;

                    // Get ID token
                    const idToken = await firebaseUser.getIdToken();

                    // Store token
                    localStorage.setItem('authToken', idToken);

                    // Send to backend
                    const response = await authApi.googleAuth(idToken);
                    const userData = response.data.data.user;

                    set({
                        user: userData,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error) {
                    console.error('Sign in error:', error);
                    set({ isLoading: false });
                    throw error;
                }
            },

            signOut: async () => {
                try {
                    const { getFirebaseAuth } = await import('./firebase');
                    const auth = await getFirebaseAuth();

                    if (auth) {
                        const { signOut: firebaseSignOut } = await import('firebase/auth');
                        await firebaseSignOut(auth);
                    }

                    localStorage.removeItem('authToken');

                    set({
                        user: null,
                        isAuthenticated: false,
                    });
                } catch (error) {
                    console.error('Sign out error:', error);
                    throw error;
                }
            },

            setUser: (user) => {
                set({ user, isAuthenticated: !!user });
            },

            initAuth: async () => {
                try {
                    set({ isLoading: true });

                    const token = localStorage.getItem('authToken');
                    if (token) {
                        const response = await authApi.getMe();
                        set({
                            user: response.data.data,
                            isAuthenticated: true,
                        });
                    }
                } catch (error) {
                    localStorage.removeItem('authToken');
                    set({ user: null, isAuthenticated: false });
                } finally {
                    set({ isLoading: false });
                }
            },

            syncStorage: async () => {
                const { user } = get();
                if (!user) return;

                try {
                    const response = await authApi.syncStorage();
                    const storageUsed = response.data?.data?.storageUsed;

                    if (typeof storageUsed === 'number') {
                        set({
                            user: { ...user, storageUsed }
                        });
                    }
                } catch (error) {
                    console.error('Failed to sync storage:', error);
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user }),
        }
    )
);

// App state store
interface AppState {
    sidebarOpen: boolean;
    currentTool: string | null;
    uploadedFiles: File[];
    processedResult: any;
    isProcessing: boolean;

    // Actions
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    setCurrentTool: (tool: string | null) => void;
    setUploadedFiles: (files: File[]) => void;
    addUploadedFile: (file: File) => void;
    removeUploadedFile: (index: number) => void;
    clearUploadedFiles: () => void;
    setProcessedResult: (result: any) => void;
    setIsProcessing: (processing: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    sidebarOpen: true,
    currentTool: null,
    uploadedFiles: [],
    processedResult: null,
    isProcessing: false,

    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    setCurrentTool: (tool) => set({ currentTool: tool }),

    setUploadedFiles: (files) => set({ uploadedFiles: files }),
    addUploadedFile: (file) =>
        set((state) => ({ uploadedFiles: [...state.uploadedFiles, file] })),
    removeUploadedFile: (index) =>
        set((state) => ({
            uploadedFiles: state.uploadedFiles.filter((_, i) => i !== index),
        })),
    clearUploadedFiles: () => set({ uploadedFiles: [], processedResult: null }),

    setProcessedResult: (result) => set({ processedResult: result }),
    setIsProcessing: (processing) => set({ isProcessing: processing }),
}));

// Notification Store
export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    read: boolean;
    createdAt: number;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;

    // Actions
    addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
    removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set) => ({
            notifications: [],
            unreadCount: 0,

            addNotification: (n) =>
                set((state) => {
                    const newNotification: Notification = {
                        ...n,
                        id: Math.random().toString(36).substring(2, 9),
                        read: false,
                        createdAt: Date.now(),
                    };
                    return {
                        notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep last 50
                        unreadCount: state.unreadCount + 1,
                    };
                }),

            fetchNotifications: async () => {
                try {
                    // Check if we have token first
                    if (typeof window !== 'undefined' && !localStorage.getItem('authToken')) {
                        return;
                    }

                    const { api } = await import('./api');
                    const response = await api.get('/notifications');
                    const backendNotifs = response.data.data.notifications || [];

                    if (backendNotifs.length === 0) return;

                    set((state) => {
                        // Merge backend notifications, avoiding duplicates by title/message + approximate time, 
                        // or just prepend new ones. 
                        // Since backend provides ID, we can use that. Local ones have random IDs.
                        // Strategy: Just add them if they don't exist in local state by some criteria or rely on backend entirely?
                        // Simplified: We'll prepend them. In a real app we'd sync properly.
                        // For now, let's just REPLACE local notifications with backend ones to ensure "it works" as user requested, 
                        // but keep local ones if they are "system" notifications?
                        // User request implies "notification is not come", so we want the backend ones to show up.

                        const incoming = backendNotifs.map((bn: any) => ({
                            id: bn.id,
                            title: bn.title,
                            message: bn.message,
                            type: bn.type,
                            read: bn.read,
                            createdAt: new Date(bn.createdAt).getTime()
                        }));

                        // Filter out duplicates based on ID
                        const existingIds = new Set(state.notifications.map(n => n.id));
                        const uniqueIncoming = incoming.filter((n: Notification) => !existingIds.has(n.id));

                        if (uniqueIncoming.length === 0) return state;

                        const merged = [...uniqueIncoming, ...state.notifications]
                            .sort((a, b) => b.createdAt - a.createdAt)
                            .slice(0, 50);

                        return {
                            notifications: merged,
                            unreadCount: merged.filter(n => !n.read).length
                        };
                    });
                } catch (err) {
                    console.error("Failed to fetch notifications", err);
                }
            },

            markAsRead: (id) =>
                set((state) => {
                    const newNotifications = state.notifications.map((n) =>
                        n.id === id ? { ...n, read: true } : n
                    );

                    // Also try to mark on backend
                    import('./api').then(({ api }) => {
                        api.patch(`/notifications/${id}/read`).catch(() => { });
                    });

                    return {
                        notifications: newNotifications,
                        unreadCount: newNotifications.filter((n) => !n.read).length,
                    };
                }),

            markAllAsRead: () =>
                set((state) => {
                    // Sync backend
                    import('./api').then(({ api }) => {
                        api.post('/notifications/read-all').catch(() => { });
                    });

                    return {
                        notifications: state.notifications.map((n) => ({ ...n, read: true })),
                        unreadCount: 0,
                    };
                }),

            clearAll: () => set({ notifications: [], unreadCount: 0 }),

            removeNotification: (id) =>
                set((state) => {
                    const newNotifications = state.notifications.filter((n) => n.id !== id);
                    return {
                        notifications: newNotifications,
                        unreadCount: newNotifications.filter((n) => !n.read).length,
                    };
                }),
        }),
        {
            name: 'notification-storage',
        }
    )
);
