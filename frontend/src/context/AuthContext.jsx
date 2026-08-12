import { createContext, useState, useEffect, useCallback } from 'react';
import { logout as apiLogout } from '../api/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount — restore from localStorage
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('dsa_token');
      const savedUser  = localStorage.getItem('dsa_user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {
      // Corrupted localStorage — clear it
      localStorage.removeItem('dsa_token');
      localStorage.removeItem('dsa_refresh_token');
      localStorage.removeItem('dsa_user');
    }
    setIsLoading(false);
  }, []);

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
