// Firebase configuration - uses dynamic imports to avoid SSR issues
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Lazy-loaded Firebase instances
let firebaseApp: any = null;
let firebaseAuth: any = null;
let googleAuthProvider: any = null;

// Initialize Firebase (call this only on client-side)
export async function initializeFirebase() {
    if (typeof window === 'undefined') {
        return { app: null, auth: null, provider: null };
    }

    if (firebaseApp && firebaseAuth) {
        return { app: firebaseApp, auth: firebaseAuth, provider: googleAuthProvider };
    }

    try {
        const { initializeApp, getApps } = await import('firebase/app');
        const { getAuth, GoogleAuthProvider } = await import('firebase/auth');

        if (!getApps().length) {
            firebaseApp = initializeApp(firebaseConfig);
        } else {
            firebaseApp = getApps()[0];
        }

        firebaseAuth = getAuth(firebaseApp);
        googleAuthProvider = new GoogleAuthProvider();
        googleAuthProvider.setCustomParameters({
            prompt: 'select_account',
        });

        return { app: firebaseApp, auth: firebaseAuth, provider: googleAuthProvider };
    } catch (error) {
        console.error('Firebase initialization failed:', error);
        return { app: null, auth: null, provider: null };
    }
}

// Helper to get auth instance
export async function getFirebaseAuth() {
    const { auth } = await initializeFirebase();
    return auth;
}

// Helper to get current user's ID token
export async function getIdToken(): Promise<string | null> {
    const auth = await getFirebaseAuth();
    if (auth?.currentUser) {
        return auth.currentUser.getIdToken();
    }
    return null;
}

export { firebaseConfig };
