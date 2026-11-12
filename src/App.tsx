import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from './hooks/useAuth';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentDashboard from './pages/StudentDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import ReceiverDashboard from './pages/ReceiverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import MealConfirmation from './pages/MealConfirmation';
import Feedback from './pages/Feedback';
import Leftovers from './pages/Leftovers';
import MyOrders from './pages/MyOrders';
import NotFound from './pages/NotFound';

// Components
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Role-based dashboard router
const DashboardRouter: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'student') return <StudentDashboard />;
  if (user.role === 'manager') return <ManagerDashboard />;
  if (user.role === 'receiver') return <ReceiverDashboard />;
  if (user.role === 'admin') return <AdminDashboard />;
  return <div className="p-8 text-center text-gray-500">Unknown role. Contact admin.</div>;
};

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light dark:bg-dark-bg">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-light dark:bg-dark-bg transition-colors">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: theme === 'dark' ? '#1a2f27' : '#FFFFFF',
              color: theme === 'dark' ? '#F3F4F6' : '#1F2937',
              border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
            },
          }}
        />

        {/* Show navbar only when logged in */}
        {user && <Navbar />}

        <Routes>
          {/* Public routes */}
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />

          {/* Protected: dashboard (role-based) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />

          {/* Student routes */}
          <Route
            path="/meals"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MealConfirmation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Feedback />
              </ProtectedRoute>
            }
          />

          {/* Manager routes */}
          <Route
            path="/leftovers"
            element={
              <ProtectedRoute allowedRoles={['manager', 'admin']}>
                <Leftovers />
              </ProtectedRoute>
            }
          />

          {/* Receiver routes */}
          <Route
            path="/alerts"
            element={
              <ProtectedRoute allowedRoles={['receiver']}>
                <ReceiverDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRoles={['receiver']}>
                <MyOrders />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
