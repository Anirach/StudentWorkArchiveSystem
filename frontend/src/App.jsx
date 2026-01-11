import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import BrowsePage from './pages/BrowsePage';
import WorkDetailPage from './pages/WorkDetailPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import FavoritesPage from './pages/FavoritesPage';
import AdminDashboard from './pages/admin/Dashboard';
import AdminWorks from './pages/admin/Works';
import AdminCategories from './pages/admin/Categories';
import AdminTags from './pages/admin/Tags';
import AdminUsers from './pages/admin/Users';
import AdminConfig from './pages/admin/Config';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public routes */}
            <Route index element={<HomePage />} />
            <Route path="works" element={<BrowsePage />} />
            <Route path="works/:id" element={<WorkDetailPage />} />
            <Route path="share/:token" element={<WorkDetailPage />} />
            <Route path="login" element={<LoginPage />} />

            {/* Protected routes (require authentication) */}
            <Route element={<ProtectedRoute />}>
              <Route path="profile" element={<ProfilePage />} />
              <Route path="favorites" element={<FavoritesPage />} />
            </Route>

            {/* Admin routes (require admin role) */}
            <Route path="admin" element={<AdminRoute />}>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="works" element={<AdminWorks />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="tags" element={<AdminTags />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="config" element={<AdminConfig />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
