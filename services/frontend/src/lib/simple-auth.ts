// Simple, Working Authentication System
// No bullshit, just works

import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/v1';

// Simple token storage
export const AuthToken = {
  get(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  },

  set(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth_token', token);
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('orcamentos_auth_tokens');
    localStorage.removeItem('access_token');
  },

  isValid(): boolean {
    const token = this.get();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  }
};

// Simple API client
export const SimpleAPI = {
  async login(email: string, password: string) {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email,
      password
    });

    if (response.data.success) {
      const token = response.data.data.tokens.accessToken;
      AuthToken.set(token);
      return {
        success: true,
        user: response.data.data.user,
        token
      };
    }

    throw new Error(response.data.message || 'Login failed');
  },

  async getClients() {
    const token = AuthToken.get();
    if (!token) throw new Error('No token');

    const response = await axios.get(`${API_BASE}/clients`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;
  },

  async createClient(clientData: any) {
    const token = AuthToken.get();
    if (!token) throw new Error('No token');

    const response = await axios.post(`${API_BASE}/clients`, clientData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  },

  async updateClient(id: string, clientData: any) {
    const token = AuthToken.get();
    if (!token) throw new Error('No token');

    const response = await axios.put(`${API_BASE}/clients/${id}`, clientData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  },

  async deleteClient(id: string) {
    const token = AuthToken.get();
    if (!token) throw new Error('No token');

    const response = await axios.delete(`${API_BASE}/clients/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;
  }
};

// Simple auth check
export const requireAuth = () => {
  if (!AuthToken.isValid()) {
    AuthToken.clear();
    window.location.href = '/auth/login';
    return false;
  }
  return true;
};