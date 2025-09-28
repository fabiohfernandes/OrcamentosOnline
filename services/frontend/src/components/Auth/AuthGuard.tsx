// ============================================================================
// Authentication Guard Component
// Protects routes and ensures user is authenticated before rendering content
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function AuthGuard({ children, redirectTo = '/auth/login' }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, tokens, isLoading } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check if we already have tokens in localStorage without triggering API calls
    const authData = localStorage.getItem('auth-tokens');
    if (authData) {
      try {
        const { state } = JSON.parse(authData);
        if (state?.tokens && state?.isAuthenticated) {
          setIsInitialized(true);
          return;
        }
      } catch (error) {
        console.warn('Failed to parse auth data from localStorage:', error);
      }
    }

    // If no valid auth data in localStorage, we're not authenticated
    setIsInitialized(true);
  }, []);

  // Redirect if not authenticated after initialization
  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated && !tokens) {
      router.push(redirectTo);
    }
  }, [isInitialized, isLoading, isAuthenticated, tokens, router, redirectTo]);

  // Show loading while initializing or checking auth
  if (!isInitialized || isLoading || (!isAuthenticated && !tokens)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}