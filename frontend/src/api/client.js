// ── Base API Client ──────────────────────────────────────────────────────────
// Every api/*.js file uses this. Handles auth headers + 401 auto-refresh.

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
      const res = await fetch(`${BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        // Refresh failed — clear everything
        localStorage.removeItem('dsa_token');
        localStorage.removeItem('dsa_refresh_token');
        localStorage.removeItem('dsa_user');
        return false;
      }

      const data = await res.json();
      localStorage.setItem('dsa_token', data.token);
      return true;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('dsa_token');

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  // JSON-stringify body for POST/PUT/PATCH
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  let res = await fetch(`${BASE}${path}`, config);

  // On 401 — try refresh once, then retry
  if (res.status === 401 && token) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const newToken = localStorage.getItem('dsa_token');
      config.headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(`${BASE}${path}`, config);
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.error || `Request failed: ${res.status}`);
    error.code = err.code;
    error.status = res.status;
    error.issues = err.issues;
    throw error;
  }

  return res.json();
}

// ── Convenience methods ──────────────────────────────────────────────────────
export const api = {
  get:   (path)        => apiFetch(path),
  post:  (path, body)  => apiFetch(path, { method: 'POST', body }),
  put:   (path, body)  => apiFetch(path, { method: 'PUT', body }),
  patch: (path, body)  => apiFetch(path, { method: 'PATCH', body }),
  del:   (path)        => apiFetch(path, { method: 'DELETE' }),
};
