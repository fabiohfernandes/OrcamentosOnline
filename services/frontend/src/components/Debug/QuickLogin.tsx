// Quick Login Debug Component
// Temporary component to help with authentication during development

'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { setValidToken, clearAllAuth, debugAuth } from '@/utils/auth-debug';

export default function QuickLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { login, isAuthenticated, user } = useAuthStore();

  const handleQuickLogin = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      // Clear any existing auth data first
      clearAllAuth();

      // Attempt login
      await login('test@example.com', 'Test123456');
      setMessage('✅ Login successful!');

      // Debug the new auth state
      setTimeout(() => {
        debugAuth();
      }, 1000);

    } catch (error: any) {
      setMessage(`❌ Login failed: ${error.message}`);
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAuth = () => {
    clearAllAuth();
    setMessage('🧹 Authentication data cleared');
  };

  const handleDebugAuth = () => {
    debugAuth();
  };

  if (isAuthenticated) {
    return (
      <div className="fixed top-4 right-4 bg-green-100 border border-green-300 rounded-lg p-4 shadow-lg z-50">
        <div className="text-sm">
          <div className="font-semibold text-green-800">✅ Authenticated</div>
          <div className="text-green-700">User: {user?.name}</div>
          <div className="text-green-700">Email: {user?.email}</div>
          <div className="mt-2 space-x-2">
            <button
              onClick={handleDebugAuth}
              className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded"
            >
              Debug Auth
            </button>
            <button
              onClick={handleClearAuth}
              className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded"
            >
              Clear Auth
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-4 shadow-lg z-50">
      <div className="text-sm">
        <div className="font-semibold text-yellow-800 mb-2">🔐 Authentication Required</div>

        {message && (
          <div className="mb-2 text-xs">{message}</div>
        )}

        <div className="space-y-2">
          <button
            onClick={handleQuickLogin}
            disabled={isLoading}
            className="w-full text-xs bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Quick Login (test@example.com)'}
          </button>

          <div className="flex space-x-1">
            <button
              onClick={handleDebugAuth}
              className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded"
            >
              Debug Auth
            </button>
            <button
              onClick={handleClearAuth}
              className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded"
            >
              Clear Auth
            </button>
          </div>
        </div>

        <div className="mt-2 text-xs text-yellow-700">
          This is a development debug component.
        </div>
      </div>
    </div>
  );
}