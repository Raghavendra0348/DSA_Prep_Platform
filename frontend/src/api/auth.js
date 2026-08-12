import { api } from './client';

export const register     = (data)  => api.post('/api/auth/register', data);
export const login        = (data)  => api.post('/api/auth/login', data);
export const refreshToken = (token) => api.post('/api/auth/refresh', { refreshToken: token });
export const logout       = (token) => api.post('/api/auth/logout', { refreshToken: token });
export const getAuthMe    = ()      => api.get('/api/auth/me');
