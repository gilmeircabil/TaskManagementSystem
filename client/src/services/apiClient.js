import axios from 'axios';
import { supabase } from './supabase';

/**
 * Shared axios instance for talking to the Express backend.
 * Automatically attaches the current Supabase access token so the
 * server's authMiddleware can verify the request and scope queries
 * to the logged-in user via RLS.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
