import { createContext, useState, useCallback } from 'react';
import { logout as apiLogout } from '../api/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('dsa_token') || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('dsa_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem('dsa_token');
      localStorage.removeItem('dsa_refresh_token');
      localStorage.removeItem('dsa_user');
      return null;
    }
  });

  const [isLoading] = useState(false);

  // login — called after successful POST /api/auth/login or /register
  const login = useCallback((data) => {
    localStorage.setItem('dsa_token', data.token);
    localStorage.setItem('dsa_refresh_token', data.refreshToken);
    localStorage.setItem('dsa_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }, []);

  // logout — revokes refresh token on server, clears everything
  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('dsa_refresh_token');
      if (refreshToken) {
        await apiLogout(refreshToken);
      }
    } catch {
      // Server might be down — still clear local state
    }
    localStorage.removeItem('dsa_token');
    localStorage.removeItem('dsa_refresh_token');
    localStorage.removeItem('dsa_user');
    setToken(null);
    setUser(null);
  }, []);

  // updateUser — called after profile edit
  const updateUser = useCallback((updatedUser) => {
    localStorage.setItem('dsa_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
