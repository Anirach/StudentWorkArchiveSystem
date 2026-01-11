import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DevLoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth } = useAuth();

  const from = location.state?.from?.pathname || '/';

  const handleDevLogin = async (role) => {
    setLoading(true);
    try {
      const response = await fetch('/auth/dev-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        await checkAuth();
        navigate(from, { replace: true });
      } else {
        console.error('Dev login failed');
      }
    } catch (error) {
      console.error('Dev login error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Only show in development
  if (import.meta.env.PROD) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Development login is not available in production.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">Development Mode</h2>
        <p className="text-sm text-yellow-700">
          This login page is only available in development mode for testing purposes.
        </p>
      </div>

      <h1 className="text-2xl font-bold text-center mb-6">Dev Login</h1>

      <div className="space-y-4">
        <button
          onClick={() => handleDevLogin('user')}
          disabled={loading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          Login as Regular User
        </button>

        <button
          onClick={() => handleDevLogin('admin')}
          disabled={loading}
          className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          Login as Admin
        </button>
      </div>

      {loading && (
        <div className="text-center mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      )}
    </div>
  );
}
