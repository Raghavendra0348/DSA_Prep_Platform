import { api } from './client';

export const getMe           = ()     => api.get('/api/me');
export const updateProfile   = (data) => api.put('/api/me', data);
export const changePassword  = (data) => api.put('/api/me/password', data);
