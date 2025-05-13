import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import SendSMS from "./pages/SendSMS";
import AudioMessage from "./pages/AudioMessage";
import VoiceCalls from "./pages/VoiceCalls";
import Analytics from "./pages/Analytics";
import Balance from "./pages/Balance";
import Groups from "./pages/Groups";
import Scheduled from "./pages/Scheduled";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import UploadAudio from "./pages/UploadAudio";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminServiceCosts from "./pages/admin/AdminServiceCosts";
import AdminBalanceManagement from "./pages/admin/AdminBalanceManagement";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminLayout from "./components/admin/AdminLayout";
import AdminRoute from "./components/admin/AdminRoute";
import AdminUserManagement from "./pages/admin/AdminUserManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/send-sms" element={<SendSMS />} />
          <Route path="/audio-message" element={<AudioMessage />} />
          <Route path="/voice-calls" element={<VoiceCalls />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/balance" element={<Balance />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/scheduled" element={<Scheduled />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/upload-audio" element={<UploadAudio />} />
          
          {/* Admin Routes - Changed from /admin to /jayadminlink */}
          <Route path="/jayadminlink/login" element={<AdminLogin />} />
          <Route element={<AdminRoute />}>
            <Route path="/jayadminlink" element={<Navigate to="/jayadminlink/dashboard" replace />} />
            <Route path="/jayadminlink/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
            <Route path="/jayadminlink/service-costs" element={<AdminLayout><AdminServiceCosts /></AdminLayout>} />
            <Route path="/jayadminlink/balance-management" element={<AdminLayout><AdminBalanceManagement /></AdminLayout>} />
            <Route path="/jayadminlink/transactions" element={<AdminLayout><AdminTransactions /></AdminLayout>} />
            <Route path="/jayadminlink/analytics" element={<AdminLayout><AdminAnalytics /></AdminLayout>} />
            <Route path="/jayadminlink/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />
            <Route path="/jayadminlink/users" element={<AdminLayout><AdminUserManagement /></AdminLayout>} />
          </Route>
          
          {/* Redirect /login to the root path */}
          <Route path="/login" element={<Navigate to="/" replace />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;