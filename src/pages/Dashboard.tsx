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
} from "lucide-react";
import DashboardStats from "@/components/DashboardStats";
import MessageForm from "@/components/MessageForm";

const Dashboard = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sidebarLinks = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
    { name: "Send SMS", icon: <MessageSquare size={20} />, path: "/send-sms" },
    { name: "Voice Calls", icon: <Phone size={20} />, path: "/voice-calls" },
    { name: "Upload Audio", icon: <Upload size={20} />, path: "/upload-audio" },
    { name: "Analytics", icon: <BarChart3 size={20} />, path: "/analytics" },
    { name: "Balance", icon: <Wallet size={20} />, path: "/balance" },
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
        <div className="p-6">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-2xl text-jaylink-800 dark:text-white">
              Jay<span className="text-jaylink-600">Link</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {sidebarLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  className="flex items-center px-3 py-3 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-jaylink-600 dark:text-jaylink-400 mr-3">
                    {link.icon}
                  </span>
                  <span className="font-medium">{link.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-jaylink-100 flex items-center justify-center text-jaylink-600">
              <User size={20} />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                John Doe
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                john@example.com
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full mt-4 border-gray-200 text-gray-700 hover:bg-gray-100 flex items-center justify-center"
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
              <Button variant="ghost" size="icon" className="md:hidden mr-2">
                <LayoutDashboard size={20} />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <Home size={20} />
                </Button>
              </Link>
              <Button variant="ghost" size="icon">
                <Settings size={20} />
              </Button>
              <div className="w-8 h-8 rounded-full bg-jaylink-100 flex items-center justify-center text-jaylink-600 md:hidden">
                <User size={16} />
              </div>
            </div>
          </div>
        </motion.header>

        {/* Page content */}
        <main className="p-4 sm:p-6 md:p-8">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Overview
            </h2>
            <DashboardStats />
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Quick Actions
            </h2>
            <MessageForm />
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Recent Messages
            </h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-subtle"
            >
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Recipient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {[
                      {
                        date: "2023-05-12 09:34",
                        recipient: "+234 800 123 4567",
                        type: "SMS",
                        status: "Delivered",
                      },
                      {
                        date: "2023-05-11 14:22",
                        recipient: "+234 800 987 6543",
                        type: "Voice",
                        status: "Completed",
                      },
                      {
                        date: "2023-05-10 11:15",
                        recipient: "+234 800 555 1234",
                        type: "SMS",
                        status: "Failed",
                      },
                      {
                        date: "2023-05-09 16:42",
                        recipient: "+234 800 444 5678",
                        type: "Audio",
                        status: "Delivered",
                      },
                    ].map((message, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {message.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {message.recipient}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              message.type === "SMS"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                : message.type === "Voice"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                            }`}
                          >
                            {message.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              message.status === "Delivered"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : message.status === "Completed"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            }`}
                          >
                            {message.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-center">
                <Link to="/balance">
                  <Button variant="outline" className="border-jaylink-200 text-jaylink-700 hover:bg-jaylink-50">
                    View All Messages
                  </Button>
                </Link>
              </div>
            </motion.div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
