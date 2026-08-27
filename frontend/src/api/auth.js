import { api } from './client';

export const register                   = (data)    => api.post('/api/auth/register', data);
export const login                      = (data)    => api.post('/api/auth/login', data);
// idToken  — classic GoogleLogin (<GoogleLogin> component)
export const googleLogin                = (idToken) => api.post('/api/auth/google', { idToken });
// accessToken — useGoogleLogin implicit flow
export const googleLoginWithAccessToken = (accessToken) => api.post('/api/auth/google', { accessToken });
export const refreshToken               = (token)   => api.post('/api/auth/refresh', { refreshToken: token });
export const logout                     = (token)   => api.post('/api/auth/logout', { refreshToken: token });
export const getAuthMe                  = ()        => api.get('/api/auth/me');
