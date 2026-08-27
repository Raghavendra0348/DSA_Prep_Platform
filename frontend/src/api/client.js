// ── Base API Client (Axios) ───────────────────────────────────────────────────
// Every api/*.js file uses this. Handles auth headers + 401 auto-refresh.

import axios from 'axios';
import { config } from '../lib/config';

const BASE = config.apiUrl;

// ── Create shared Axios instance ─────────────────────────────────────────────
const axiosClient = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach Bearer token ────────────────────────────────
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('dsa_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Token-refresh state ───────────────────────────────────────────────────────
let isRefreshing = false;
let refreshPromise = null;

async function tryRefresh() {
  const refreshToken = localStorage.getItem('dsa_refresh_token');
  if (!refreshToken) return false;

  // Prevent multiple parallel refresh calls
  if (isRefreshing) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      // Use plain axios (not the intercepted instance) to avoid an infinite loop
      const { data } = await axios.post(`${BASE}/api/auth/refresh`, { refreshToken });
      localStorage.setItem('dsa_token', data.token);
      return true;
    } catch {
      
      // Refresh failed — clear everything
      localStorage.removeItem('dsa_token');
      localStorage.removeItem('dsa_refresh_token');
      localStorage.removeItem('dsa_user');
      return false;

    } finally {

      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ── Response interceptor — handle 401 with one silent retry ──────────────────
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401) {
      if (!originalRequest._retry) {
        originalRequest._retry = true; // prevent infinite retry loops

        const refreshed = await tryRefresh();
        if (refreshed) {
          const newToken = localStorage.getItem('dsa_token');
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosClient(originalRequest); // retry with new token
        }
      }

      // If refresh failed or already retried, notify auth context to logout/sync
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dsa_auth_expired'));
      }
    }

    // Normalise error shape to match previous apiFetch behaviour
    const serverData = error.response?.data ?? {};
    const normalisedError = new Error(
      serverData.error || `Request failed: ${error.response?.status ?? 'Network Error'}`
    );
    normalisedError.code   = serverData.code;
    normalisedError.status = error.response?.status;
    normalisedError.issues = serverData.issues;

    return Promise.reject(normalisedError);
  }
);

// ── apiFetch — drop-in replacement for the old fetch-based helper ─────────────
// Accepts the same (path, options) signature. Strips fetch-specific keys
// (body → data, method stays the same) and delegates to Axios.
export async function apiFetch(path, options = {}) {
  const { body, method = 'GET', headers = {}, ...rest } = options;

  const { data } = await axiosClient.request({
    url: path,
    method,
    data: body,         // Axios uses `data` instead of `body`
    headers,
    ...rest,
  });

  return data;
}

// ── Convenience methods (same interface as before) ────────────────────────────
export const api = {
  get:   (path)        => apiFetch(path),
  post:  (path, body)  => apiFetch(path, { method: 'POST',   body }),
  put:   (path, body)  => apiFetch(path, { method: 'PUT',    body }),
  patch: (path, body)  => apiFetch(path, { method: 'PATCH',  body }),
  del:   (path)        => apiFetch(path, { method: 'DELETE' }),
};
