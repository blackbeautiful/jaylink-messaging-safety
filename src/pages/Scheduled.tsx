
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MobileDashboardMenu from "@/components/MobileDashboardMenu";
import NotificationMenu from "@/components/NotificationMenu";
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
  Calendar,
  Clock,
  Trash2,
  Search,
  Loader2,
  Users,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// Mock data for scheduled messages
const mockScheduledMessages = [
  { 
    id: 1, 
    type: "sms", 
    recipients: "+234800123456, +234800123457, +234800123458", 
    recipientCount: 3,
    message: "Good morning! Don't forget about our special promotion running today. Use code SPECIAL20 for 20% off.",
    sender: "JayLink",
    scheduledDate: "2023-11-30 08:00:00",
    status: "pending"
  },
  { 
    id: 2, 
    type: "voice", 
    recipients: "+234800123456", 
    recipientCount: 1,
    message: "This is a reminder about your appointment tomorrow at 2 PM. Please confirm your attendance.",
    sender: "+2348012345678",
    scheduledDate: "2023-12-01 09:30:00",
    status: "pending"
  },
  { 
    id: 3, 
    type: "audio", 
    recipients: "+234800123456, +234800123459", 
    recipientCount: 2,
    message: "Holiday announcement.mp3",
    sender: "+2348023456789",
    scheduledDate: "2023-12-24 10:00:00",
    status: "pending"
  },
  { 
    id: 4, 
    type: "sms", 
    recipients: "Customers Group (248 contacts)", 
    recipientCount: 248,
    message: "Thank you for being our valued customer. We wish you happy holidays and a prosperous new year!",
    sender: "INFO",
    scheduledDate: "2023-12-25 12:00:00",
    status: "pending"
  },
];

const Scheduled = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageType, setMessageType] = useState("all");
  
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

  const filteredMessages = mockScheduledMessages
    .filter(msg => 
      (messageType === "all" || msg.type === messageType) &&
      (msg.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
      msg.recipients.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const handleCancel = (id: number) => {
    setLoading(true);
    
    // Simulate API call to cancel scheduled message
    setTimeout(() => {
      toast.success("Scheduled message has been cancelled");
      setLoading(false);
    }, 1000);
  };

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

        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {sidebarLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
                    link.path === "/scheduled"
                      ? "bg-jaylink-50 text-jaylink-700 dark:bg-jaylink-900/20 dark:text-jaylink-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className={`mr-3 ${
                    link.path === "/scheduled"
                      ? "text-jaylink-600 dark:text-jaylink-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}>
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
              <MobileDashboardMenu userName="John Doe" userEmail="john@example.com" />
              <Link to="/dashboard" className="inline-flex items-center text-gray-500 hover:text-gray-700 mr-4">
                <ArrowLeft size={18} />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Scheduled Messages
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="text-sm hidden sm:flex">
                <Plus className="mr-2 h-4 w-4" />
                Top Up
              </Button>
              <Link to="/dashboard">
                <Button variant="ghost" size="icon">
                  <Home size={20} />
                </Button>
              </Link>
              <NotificationMenu />
              <Link to="/settings">
                <Button variant="ghost" size="icon">
                  <Settings size={20} />
                </Button>
              </Link>
            </div>
          </div>
        </motion.header>

        {/* Page content */}
        <main className="p-4 sm:p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="w-full md:w-1/2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      type="text"
                      placeholder="Search scheduled messages..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="w-full md:w-auto">
                  <Select
                    value={messageType}
                    onValueChange={setMessageType}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="sms">SMS Messages</SelectItem>
                      <SelectItem value="voice">Voice Calls</SelectItem>
                      <SelectItem value="audio">Audio Messages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Upcoming Scheduled Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="animate-spin h-8 w-8 text-jaylink-600" />
                    </div>
                  ) : filteredMessages.length > 0 ? (
                    <div className="space-y-4">
                      {filteredMessages.map(message => (
                        <div 
                          key={message.id} 
                          className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm"
                        >
                          <div className="flex flex-col md:flex-row justify-between mb-3">
                            <div className="flex items-center mb-2 md:mb-0">
                              {message.type === "sms" ? (
                                <MessageSquare className="text-jaylink-600 mr-2" size={18} />
                              ) : message.type === "voice" ? (
                                <Phone className="text-green-600 mr-2" size={18} />
                              ) : (
                                <Upload className="text-amber-600 mr-2" size={18} />
                              )}
                              <span className="font-medium capitalize">
                                {message.type === "sms" ? "SMS Message" : 
                                 message.type === "voice" ? "Voice Call" : "Audio Message"}
                              </span>
                              <span className="ml-2 text-sm text-gray-500">• {message.recipientCount} recipient(s)</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="mr-1" size={14} />
                              <span>{new Date(message.scheduledDate).toLocaleDateString()}</span>
                              <Clock className="ml-2 mr-1" size={14} />
                              <span>{new Date(message.scheduledDate).toLocaleTimeString()}</span>
                            </div>
                          </div>
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message:</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {message.type === "audio" ? 
                                <span className="italic">Audio file: {message.message}</span> : 
                                message.message}
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {message.type === "sms" ? "Sender ID:" : "Caller ID:"}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{message.sender}</p>
                            </div>
                            <div className="text-right sm:text-left">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-500 border-red-200 hover:bg-red-50"
                                onClick={() => handleCancel(message.id)}
                              >
                                <Trash2 size={14} className="mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">No scheduled messages found</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Schedule messages or calls by enabling the "Schedule for later" option.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Scheduled;
