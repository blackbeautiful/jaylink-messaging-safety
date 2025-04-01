
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
