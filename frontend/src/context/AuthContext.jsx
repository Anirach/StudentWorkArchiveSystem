import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    // Check for existing session on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/auth/me', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.data);
          setSessionExpired(false);
        }
      } else if (response.status === 401) {
        // Session expired or not authenticated
        if (user) {
          // User was previously logged in, so session expired
          setSessionExpired(true);
        }
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle session expiry - can be called when any API returns 401
  const handleSessionExpiry = useCallback(() => {
    if (user) {
      setSessionExpired(true);
      setUser(null);
    }
  }, [user]);

  // Clear session expired flag
  const clearSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  const login = () => {
    // Redirect to Google OAuth
    window.location.href = '/auth/google';
  };

  const logout = async () => {
    try {
      await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      setSessionExpired(false);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAdmin,
      isAuthenticated,
      checkAuth,
      sessionExpired,
      handleSessionExpiry,
      clearSessionExpired
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
