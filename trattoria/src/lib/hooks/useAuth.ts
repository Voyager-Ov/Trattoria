'use client';

import { useState, useEffect } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

type AuthState = {
    loading: boolean;
    error: string | null;
};

type UserData = {
    id: string;
    email: string;
    rol: 'ADMIN' | 'EMPLEADO';
};

/**
 * useAuth Hook
 * Client-side authentication management
 * 
 * Based on Alquimia's working implementation
 * 
 * Flow:
 * 1. User enters email/password or clicks Google
 * 2. Firebase handles authentication (browser)
 * 3. Get ID token from Firebase
 * 4. Send token to /api/auth/login or /api/auth/register
 * 5. Backend creates session cookie
 * 6. Redirect to dashboard
 */
export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [state, setState] = useState<AuthState>({ loading: true, error: null });
    const router = useRouter();

    // Listen to Firebase auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setState(prev => ({ ...prev, loading: false }));
        });
        return () => unsubscribe();
    }, []);

    /**
     * Login with email and password
     */
    const loginEmail = async (email: string, password: string) => {
        setState({ loading: true, error: null });
        try {
            // 1. Authenticate with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();

            // 2. Send token to backend to create session
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Login failed');
            }

            const data = await response.json();
            setUserData(data.user);

            console.log('✅ Login successful:', data.user);

            // 3. Redirect to dashboard
            router.push('/dashboard');
            setState({ loading: false, error: null });

        } catch (error) {
            console.error('Login error:', error);
            setState({
                loading: false,
                error: (error as Error).message || 'Failed to login'
            });
        }
    };

    /**
     * Login with Google OAuth
     */
    const loginGoogle = async () => {
        setState({ loading: true, error: null });
        try {
            // 1. Open Google sign-in popup
            const userCredential = await signInWithPopup(auth, googleProvider);
            const idToken = await userCredential.user.getIdToken();

            // 2. Check if user exists in our system
            // If not, register them
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            if (!response.ok) {
                // If login fails, try registering
                const registerResponse = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken }),
                });

                if (!registerResponse.ok) {
                    throw new Error('Failed to authenticate with Google');
                }

                const data = await registerResponse.json();
                setUserData(data.user);
                console.log('✅ Google registration successful:', data.user);
            } else {
                const data = await response.json();
                setUserData(data.user);
                console.log('✅ Google login successful:', data.user);
            }

            // 3. Redirect to dashboard
            router.push('/admin/dashboard');
            setState({ loading: false, error: null });

        } catch (error) {
            console.error('Google login error:', error);
            setState({
                loading: false,
                error: (error as Error).message || 'Failed to login with Google'
            });
        }
    };

    /**
     * Register with email and password
     */
    const registerEmail = async (email: string, password: string) => {
        setState({ loading: true, error: null });
        try {
            // 1. Create user in Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();

            // 2. Register in our system
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Registration failed');
            }

            const data = await response.json();
            setUserData(data.user);

            console.log('✅ Registration successful:', data.user);

            if (data.isFirstUser) {
                console.log('🎉 First user - promoted to ADMIN');
            }

            // 3. Redirect to dashboard
            router.push('/dashboard');
            setState({ loading: false, error: null });

        } catch (error) {
            console.error('Registration error:', error);
            setState({
                loading: false,
                error: (error as Error).message || 'Failed to register'
            });
        }
    };

    /**
     * Logout
     */
    const logout = async () => {
        try {
            // 1. Call backend to clear session cookie
            await fetch('/api/auth/logout', { method: 'POST' });

            // 2. Sign out from Firebase
            await signOut(auth);

            // 3. Clear local state
            setUserData(null);

            console.log('✅ Logout successful');

            // 4. Redirect to login
            router.push('/login');

        } catch (error) {
            console.error('Logout error:', error);
            // Still redirect even if there's an error
            router.push('/login');
        }
    };

    return {
        user,
        userData,
        loading: state.loading,
        error: state.error,
        loginEmail,
        loginGoogle,
        registerEmail,
        logout,
    };
}
