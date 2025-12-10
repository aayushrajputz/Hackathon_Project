'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// User type that mirrors Firebase User
interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    signOut: () => Promise<void>;
    getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOut: async () => { },
    getIdToken: async () => null,
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
                        });
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

    return (
        <AuthContext.Provider value={{ user, loading, signOut, getIdToken }}>
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
