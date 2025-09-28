'use client';

import { useState, useEffect } from 'react';
import { SimpleAPI, requireAuth, AuthToken } from '@/lib/simple-auth';

export default function SimpleClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check auth first
    if (!requireAuth()) {
      return;
    }

    // Load clients
    const loadClients = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await SimpleAPI.getClients();

        if (response.success && response.data.clients) {
          setClients(response.data.clients);
        } else {
          setClients([]);
        }
      } catch (error: any) {
        console.error('Error loading clients:', error);

        if (error.response?.status === 401 || error.response?.status === 403) {
          // Auth failed, redirect to login
          AuthToken.clear();
          window.location.href = '/auth/login';
          return;
        }

        setError('Failed to load clients');
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600">Manage your clients</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          {clients.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No clients found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {clients.map((client) => (
                <div key={client.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {client.name}
                      </h3>
                      <p className="text-gray-600">{client.email}</p>
                      <p className="text-gray-500">{client.company}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 text-xs rounded ${
                        client.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          <button
            onClick={() => {
              AuthToken.clear();
              window.location.href = '/auth/login';
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}