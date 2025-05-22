import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import SendSMS from "./pages/SendSMS";
import VoiceCalls from "./pages/VoiceCalls";
import Analytics from "./pages/Analytics";
import AudioMessage from "./pages/AudioMessage";
import Settings from "./pages/Settings";
import MessageHistory from "./pages/MessageHistory";
import Balance from "./pages/Balance";
import Groups from "./pages/Groups";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/admin/AdminRoute";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUserManagement from "./pages/admin/AdminUserManagement";
import AdminServiceCosts from "./pages/admin/AdminServiceCosts";
import AdminBalanceManagement from "./pages/admin/AdminBalanceManagement";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import { ThemeProvider } from "./components/ThemeProvider";
import { EnhancedSettingsProvider } from "./hooks/use-enhanced-settings";
import { Toaster } from "sonner";
import "./App.css";

function App() {
  return (
    <ThemeProvider>
      <EnhancedSettingsProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/sms/send" element={<PrivateRoute><SendSMS /></PrivateRoute>} />
            <Route path="/sms/history" element={<PrivateRoute><MessageHistory /></PrivateRoute>} />
            <Route path="/voice" element={<PrivateRoute><VoiceCalls /></PrivateRoute>} />
            <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
            <Route path="/audio" element={<PrivateRoute><AudioMessage /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/balance" element={<PrivateRoute><Balance /></PrivateRoute>} />
            <Route path="/groups" element={<PrivateRoute><Groups /></PrivateRoute>} />
            <Route path="/support" element={<PrivateRoute><Support /></PrivateRoute>} />
            
            {/* Admin routes */}
            <Route path="/jayadminlink/login" element={<AdminLogin />} />
            <Route path="/jayadminlink/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/jayadminlink/users" element={<AdminRoute><AdminUserManagement /></AdminRoute>} />
            <Route path="/jayadminlink/service-costs" element={<AdminRoute><AdminServiceCosts /></AdminRoute>} />
            <Route path="/jayadminlink/balance" element={<AdminRoute><AdminBalanceManagement /></AdminRoute>} />
            <Route path="/jayadminlink/transactions" element={<AdminRoute><AdminTransactions /></AdminRoute>} />
            <Route path="/jayadminlink/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
            <Route path="/jayadminlink/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
            
            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster richColors position="top-right" />
      </EnhancedSettingsProvider>
    </ThemeProvider>
  );
}

export default App;
