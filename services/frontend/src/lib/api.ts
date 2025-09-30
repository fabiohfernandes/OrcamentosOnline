// API Client Library
// NOVA Agent - Frontend Development
// OrçamentosOnline Frontend API Integration

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Get auth token helper
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;

  // First try direct access token (legacy format)
  let token = localStorage.getItem('access_token');
  if (token) {
    console.log('🔑 Using legacy access_token');
    return token;
  }

  // Then try auth store localStorage format (correct key)
  try {
    const authData = localStorage.getItem('orcamentos_auth_tokens');
    if (authData) {
      const { state } = JSON.parse(authData);
      if (state?.tokens?.accessToken && state?.isAuthenticated) {
        console.log('🔑 Using orcamentos_auth_tokens format');
        return state.tokens.accessToken;
      }
    }
  } catch (error) {
    console.warn('Failed to parse auth tokens from localStorage:', error);
  }

  console.warn('🔐 No valid token found in any format');
  return null;
};

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_TIMEOUT = 30000; // 30 seconds

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // Set to true if using cookies for auth
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;

      // Just log that we're using the token - let response interceptor handle expiration
      console.log('🔑 Using token for request');
    } else {
      console.warn('🔐 No authentication token found for request to:', config.url);
    }

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data
      });
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful response in development
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 or 403 Unauthorized - Token refresh logic
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          console.log('🔄 Attempting to refresh token...');
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: refreshToken
          });

          // Handle both legacy and new response formats
          const { access_token, refresh_token: newRefreshToken, data } = response.data;

          // Extract tokens from response (support multiple formats)
          const accessToken = access_token || data?.tokens?.accessToken;
          const newRefresh = newRefreshToken || data?.tokens?.refreshToken;

          if (accessToken && newRefresh) {
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', newRefresh);

            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
            }

            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, use auth store logout for proper cleanup
        console.error('❌ Token refresh failed:', refreshError);
        if (typeof window !== 'undefined') {
          // Clean up and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('auth-tokens');
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ API Error:', {
        status: error.response?.status,
        message: error.message,
        url: error.config?.url,
        data: error.response?.data
      });
    }

    return Promise.reject(error);
  }
);

// API Helper Functions
export const api = {
  // Generic HTTP methods
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.get(url, config),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.post(url, data, config),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.put(url, data, config),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.patch(url, data, config),

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.delete(url, config),

  // Authentication methods
  auth: {
    login: (credentials: { email: string; password: string }) =>
      api.post('/auth/login', credentials),

    register: (userData: {
      name: string;
      email: string;
      password: string;
      company?: string;
    }) => api.post('/auth/register', userData),

    logout: () => api.post('/auth/logout'),

    refresh: (refreshToken: string) =>
      api.post('/auth/refresh', { refresh_token: refreshToken }),

    profile: () => api.get('/auth/profile'),
  },

  // Proposal methods
  proposals: {
    list: (params?: { page?: number; limit?: number; status?: string }) =>
      api.get('/proposals', { params }),

    get: (id: string) => api.get(`/proposals/${id}`),

    create: (proposalData: any) => api.post('/proposals', proposalData),

    update: (id: string, proposalData: any) =>
      api.put(`/proposals/${id}`, proposalData),

    delete: (id: string) => api.delete(`/proposals/${id}`),

    stats: () => api.get('/proposals/stats'),
  },

  // Client management methods
  clients: {
    list: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
      api.get('/clients', { params }),

    get: (id: string) => api.get(`/clients/${id}`),

    create: (clientData: any) => api.post('/clients', clientData),

    update: (id: string, clientData: any) =>
      api.put(`/clients/${id}`, clientData),

    delete: (id: string) => api.delete(`/clients/${id}`),

    search: (query: string, limit?: number) =>
      api.get('/clients/search', { params: { q: query, limit } }),

    stats: () => api.get('/clients/stats/summary'),
  },

  // Client proposal access methods
  client: {
    login: (credentials: { username: string; password: string }) =>
      api.post('/client/login', credentials),

    getProposal: (token: string) => api.get(`/client/proposal/${token}`),

    addComment: (token: string, comment: any) =>
      api.post(`/client/proposal/${token}/comment`, comment),

    approve: (token: string) => api.post(`/client/proposal/${token}/approve`),

    trackView: (token: string, page: number) =>
      api.post(`/client/proposal/${token}/track`, { page }),
  },

  // Utility methods
  health: () => api.get('/health'),

  upload: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },
};

// Error handling utilities
export const handleApiError = (error: AxiosError) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;

    switch (status) {
      case 400:
        return { message: 'Invalid request data', details: data };
      case 401:
        return { message: 'Authentication required', details: data };
      case 403:
        return { message: 'Access forbidden', details: data };
      case 404:
        return { message: 'Resource not found', details: data };
      case 422:
        return { message: 'Validation failed', details: data };
      case 500:
        return { message: 'Server error', details: data };
      default:
        return { message: 'An error occurred', details: data };
    }
  } else if (error.request) {
    // Network error
    return { message: 'Network error - please check your connection', details: null };
  } else {
    // Something else happened
    return { message: error.message || 'An unexpected error occurred', details: null };
  }
};

// Export the main API client
export { apiClient };
export default api;