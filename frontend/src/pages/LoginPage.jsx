import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { isAuthenticated, login, checkAuth, clearSessionExpired, sessionExpired: authSessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [devLoading, setDevLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';
  const isDev = import.meta.env.DEV;
  // Check state, auth context, and URL params for session expired
  const sessionExpired = location.state?.sessionExpired || authSessionExpired || searchParams.get('session_expired') === 'true';

  useEffect(() => {
    if (isAuthenticated) {
      // Clear session expired flag when user logs in
      clearSessionExpired();
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from, clearSessionExpired]);

  const handleDevLogin = async (role) => {
    setDevLoading(true);
    try {
      const response = await fetch('/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role }),
      });
      if (response.ok) {
        await checkAuth();
      }
    } catch (error) {
      console.error('Dev login failed:', error);
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {sessionExpired && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-yellow-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-medium">Your session has expired</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Please sign in again to continue.
            </p>
          </div>
        )}
        <h1 className="text-3xl font-bold mb-4">Welcome Back</h1>
        <p className="text-muted-foreground mb-8">
          Sign in to access your favorites, vote on works, and join the discussion.
        </p>
        <button
          onClick={login}
          className="inline-flex items-center gap-3 px-6 py-3 rounded-lg bg-white border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
        <p className="text-sm text-muted-foreground mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>

        {/* Development login options */}
        {isDev && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-muted-foreground mb-4">
              Development Mode - Quick Login:
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => handleDevLogin('user')}
                disabled={devLoading}
                className="px-4 py-2 rounded-lg bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 transition-colors disabled:opacity-50"
              >
                Login as User
              </button>
              <button
                onClick={() => handleDevLogin('admin')}
                disabled={devLoading}
                className="px-4 py-2 rounded-lg bg-purple-100 text-purple-700 font-medium hover:bg-purple-200 transition-colors disabled:opacity-50"
              >
                Login as Admin
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
