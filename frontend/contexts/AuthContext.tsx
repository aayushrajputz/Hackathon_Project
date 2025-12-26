'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// User type that mirrors Firebase User + backend data
interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    plan?: string;
    role?: string;
    storageUsed?: number;
    storageLimit?: number;
}

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    signOut: () => Promise<void>;
    getIdToken: () => Promise<string | null>;
    refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOut: async () => { },
    getIdToken: async () => null,
    refetchUser: async () => { },
});

// Firebase is loaded dynamically to avoid SSR issues
let firebaseAuth: any = null;
let firebaseApp: any = null;

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [firebaseUser, setFirebaseUser] = useState<any>(null);

    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined') {
            setLoading(false);
            return;
        }

        const initAuth = async () => {
            try {
                // Dynamic import to avoid SSR issues
                const { initializeApp, getApps } = await import('firebase/app');
                const { getAuth, onAuthStateChanged } = await import('firebase/auth');

                const firebaseConfig = {
                    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
                    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
                    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
                };

                // Check if Firebase config is available
                if (!firebaseConfig.apiKey) {
                    console.warn('Firebase not configured');
                    setLoading(false);
                    return;
                }

                // Initialize Firebase
                if (getApps().length === 0) {
                    firebaseApp = initializeApp(firebaseConfig);
                } else {
                    firebaseApp = getApps()[0];
                }

                firebaseAuth = getAuth(firebaseApp);

                // Listen for auth state changes
                const unsubscribe = onAuthStateChanged(firebaseAuth, (fbUser) => {
                    if (fbUser) {
                        setFirebaseUser(fbUser);
                        setUser({
                            uid: fbUser.uid,
                            email: fbUser.email,
                            displayName: fbUser.displayName,
                            photoURL: fbUser.photoURL,
                            plan: 'free', // Default, will be updated by refetchUser if called
                        });
                        // Optimistically try to fetch latest from backend
                        fetchBackendUser();
                    } else {
                        setFirebaseUser(null);
                        setUser(null);
                    }
                    setLoading(false);
                });

                return () => unsubscribe();
            } catch (error) {
                console.error('Firebase initialization error:', error);
                setLoading(false);
            }
        };

        const fetchBackendUser = async () => {
            // We can't import api here easily due to circular deps if api uses AuthContext, 
            // but api uses localStorage or internal interceptor.
            // For now, we'll implement refetchUser to just update from what we have or 
            // ideally call the backend.
        }

        initAuth();
    }, []);

    const signOut = async () => {
        if (firebaseAuth) {
            const { signOut: fbSignOut } = await import('firebase/auth');
            await fbSignOut(firebaseAuth);
            setUser(null);
            setFirebaseUser(null);
        }
    };

    const getIdToken = async (): Promise<string | null> => {
        if (firebaseUser) {
            try {
                return await firebaseUser.getIdToken();
            } catch (error) {
                console.error('Failed to get ID token:', error);
                return null;
            }
        }
        return null;
    };

    const refetchUser = async () => {
        // This is a simplified version. Ideally we should call /auth/me here.
        // For now, we will allow components to manually update by re-triggering this 
        // OR we can just reload the firebase user.
        if (firebaseUser) {
            try {
                await firebaseUser.reload();
                const refreshedUser = firebaseAuth.currentUser;
                if (refreshedUser) {
                    setFirebaseUser(refreshedUser);
                    // Note: This won't reflect backend-only changes unless backend synced to Firebase.
                    // So we might need a way to set user manually.
                }
            } catch (e) {
                console.error("Failed to reload user", e);
            }
        }

        // HACK: To support backend updates propagating to UI without full reload:
        // We really need to fetch from /auth/me. 
        // Let's rely on the components to refresh data or api-level caching.
        // I will allow refetchUser to fetch from /auth/me using the authApi

        // Dynamic import to avoid circular dependency if possible, or just standard fetch
        try {
            const token = await getIdToken();
            if (!token) return;

            // Using standard fetch to avoid import cycles with api.ts if any
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setUser(prev => ({
                        ...prev!,
                        ...data.data
                    }));
                }
            }
        } catch (error) {
            console.error("Failed to fetch user from backend", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signOut, getIdToken, refetchUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
