// src/App.tsx
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
// import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/admin/AdminRoute';
import { useAuth } from './contexts/AuthContext';

// Public pages
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';

// User pages
import Dashboard from './pages/Dashboard';
import SendSMS from './pages/SendSMS';
import AudioMessage from './pages/AudioMessage';
import VoiceCalls from './pages/VoiceCalls';
import Analytics from './pages/Analytics';
import Balance from './pages/Balance';
import Support from './pages/Support';
import Groups from './pages/Groups';
import Scheduled from './pages/Scheduled';
import MessageHistory from './pages/MessageHistory';
import PaymentPage from './pages/PaymentPage';
import Settings from './pages/Settings';
import UploadAudio from './pages/UploadAudio';

// Admin pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminServiceCosts from './pages/admin/AdminServiceCosts';
import AdminBalanceManagement from './pages/admin/AdminBalanceManagement';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSettings from './pages/admin/AdminSettings';
import AdminLayout from './components/admin/AdminLayout';
import AdminUserManagement from './pages/admin/AdminUserManagement';

const queryClient = new QueryClient();

// Root component to check auth state and render appropriate routes
const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Decide where to redirect for the root path based on auth state
  const getHomeRedirect = () => {
    // Wait until auth status is confirmed
    if (loading) return null;

    return isAuthenticated ? (
      <Navigate to="/dashboard" replace />
    ) : (
      <Navigate to="/login" replace />
    );
  };

  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Root path redirects based on auth state */}
        <Route path="/" element={getHomeRedirect()} />

        {/* Public routes */}
        <Route path="/home" element={<Index />} />

        {/* Public Auth Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/login" element={<Login />} />

        {/* Protected User Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/send-sms" element={<SendSMS />} />
          <Route path="/audio-message" element={<AudioMessage />} />
          <Route path="/voice-calls" element={<VoiceCalls />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/balance" element={<Balance />} />
          <Route path="/support" element={<Support />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/scheduled" element={<Scheduled />} />
          <Route path="/sms/history" element={<MessageHistory />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/upload-audio" element={<UploadAudio />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/jayadminlink/login" element={<AdminLogin />} />
        <Route element={<AdminRoute />}>
          <Route path="/jayadminlink" element={<Navigate to="/jayadminlink/dashboard" replace />} />
          <Route
            path="/jayadminlink/dashboard"
            element={
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            }
          />
          <Route
            path="/jayadminlink/service-costs"
            element={
              <AdminLayout>
                <AdminServiceCosts />
              </AdminLayout>
            }
          />
          <Route
            path="/jayadminlink/balance-management"
            element={
              <AdminLayout>
                <AdminBalanceManagement />
              </AdminLayout>
            }
          />
          <Route
            path="/jayadminlink/transactions"
            element={
              <AdminLayout>
                <AdminTransactions />
              </AdminLayout>
            }
          />
          <Route
            path="/jayadminlink/analytics"
            element={
              <AdminLayout>
                <AdminAnalytics />
              </AdminLayout>
            }
          />
          <Route
            path="/jayadminlink/settings"
            element={
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            }
          />
          <Route
            path="/jayadminlink/users"
            element={
              <AdminLayout>
                <AdminUserManagement />
              </AdminLayout>
            }
          />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppRoutes />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;