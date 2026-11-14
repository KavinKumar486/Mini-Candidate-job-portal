import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function loadMe() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api('/api/auth/me');
      setUser(data.user);
    } catch {
      localStorage.removeItem('accessToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
    const onLogout = () => {
      setUser(null);
      navigate('/login');
    };
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      async login(email, password) {
        const data = await api('/api/auth/login', { method: 'POST', body: { email, password } });
        localStorage.setItem('accessToken', data.accessToken);
        await loadMe();
      },
      async register(payload) {
        await api('/api/auth/register', { method: 'POST', body: payload });
        const data = await api('/api/auth/login', {
          method: 'POST',
          body: { email: payload.email, password: payload.password },
        });
        localStorage.setItem('accessToken', data.accessToken);
        await loadMe();
      },
      logout() {
        localStorage.removeItem('accessToken');
        setUser(null);
        navigate('/login');
      },
      refresh: loadMe,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
