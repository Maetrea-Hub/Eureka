import axios from 'axios';
import { supabase } from './supabase';

export const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL as string ?? 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
});

// Sisipkan Supabase access token di setiap request ke backend
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle TOKEN_EXPIRED dari backend — coba refresh, lalu retry sekali
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const code = error.response?.data?.code as string | undefined;

    if (code === 'TOKEN_EXPIRED' && !error.config._retried) {
      error.config._retried = true;

      const { data, error: refreshError } = await supabase.auth.refreshSession();
      if (!refreshError && data.session) {
        error.config.headers.Authorization = `Bearer ${data.session.access_token}`;
        return api(error.config);
      }

      // Refresh gagal — paksa logout dan redirect ke login
      await supabase.auth.signOut();
      window.location.href = '/login';
    }

    if (code === 'TOKEN_INVALID') {
      await supabase.auth.signOut();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);
