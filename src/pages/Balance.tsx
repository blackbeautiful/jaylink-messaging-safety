
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Phone,
  Upload,
  Settings,
  LogOut,
  User,
  Home,
  BarChart3,
  Wallet,
  LayoutDashboard,
  ArrowLeft,
  Plus,
  ChevronRight,
  Users,
  Calendar,
} from "lucide-react";
import BalanceOverview from "@/components/BalanceOverview";
import NotificationMenu from "@/components/NotificationMenu";
import MobileDashboardMenu from "@/components/MobileDashboardMenu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Balance = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sidebarLinks = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
    { name: "Send Message", icon: <MessageSquare size={20} />, path: "/send-sms"},
    { name: "Voice Calls", icon: <Phone size={20} />, path: "/voice-calls" },
    { name: "Upload Audio", icon: <Upload size={20} />, path: "/upload-audio" },
    { name: "Analytics", icon: <BarChart3 size={20} />, path: "/analytics" },
    { name: "Balance", icon: <Wallet size={20} />, path: "/balance" },
    { name: "Groups", icon: <Users size={20} />, path: "/groups" },
    { name: "Scheduled", icon: <Calendar size={20} />, path: "/scheduled" },
    { name: "Settings", icon: <Settings size={20} />, path: "/settings" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <Link to="/" className="flex items-center space-x-2 mb-4">
            <span className="font-bold text-2xl text-jaylink-800 dark:text-white">
              Jay<span className="text-jaylink-600">Link</span>
            </span>
          </Link>
          
          {/* User info moved to the top under logo */}
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-jaylink-100 flex items-center justify-center text-jaylink-600 mr-3">
              <User size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                John Doe
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                john@example.com
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {sidebarLinks.map((link) => 
              (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
                      link.path === "/balance"
                        ? "bg-jaylink-50 text-jaylink-700 dark:bg-jaylink-900/20 dark:text-jaylink-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span className={`mr-3 ${
                      link.path === "/balance"
                        ? "text-jaylink-600 dark:text-jaylink-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}>
                      {link.icon}
                    </span>
                    <span className="font-medium">{link.name}</span>
                  </Link>
                </li>
              )
            )}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            className="w-full border-gray-200 text-gray-700 hover:bg-gray-100 flex items-center justify-center"
          >
            <LogOut size={16} className="mr-2" />
            Sign out
          </Button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 md:ml-64">
        {/* Top navbar */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10"
        >
          <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <MobileDashboardMenu userName="John Doe" userEmail="john@example.com" />
              <Link to="/dashboard" className="inline-flex items-center text-gray-500 hover:text-gray-700 mr-4">
                <ArrowLeft size={18} />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Balance & Transactions
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="text-sm hidden sm:flex">
                <Plus className="mr-2 h-4 w-4" />
                Top Up
              </Button>
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <Home size={20} />
                </Button>
              </Link>
              <NotificationMenu />
              <Button variant="ghost" size="icon">
                <Settings size={20} />
              </Button>
            </div>
          </div>
        </motion.header>

        {/* Page content */}
        <main className="p-4 sm:p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <BalanceOverview />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Balance;
