/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  Menu,
  Bell,
  ChevronDown,
  ChevronRight,
  Users,
  Calendar,
  Volume2,
  Plus,
  CreditCard,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import NotificationMenu from "@/components/NotificationMenu";

// Define the DashboardLayout props interface
interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  backLink?: string;
  currentPath?: string;
}

// Define the Notification interface
interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const DashboardLayout = ({ children, title, backLink, currentPath }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // Use provided currentPath or fall back to location.pathname
  const actualPath = currentPath || location.pathname;

  // Mock notifications data
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Low Balance Alert',
      description: 'Your account balance is below the recommended minimum.',
      time: '10 minutes ago',
      read: false,
    },
    {
      id: '2',
      title: 'Delivery Report',
      description: 'Bulk message to 126 recipients delivered successfully.',
      time: '2 hours ago',
      read: false,
    },
    {
      id: '3',
      title: 'New Feature Available',
      description: 'Try our new voice messaging feature for better engagement.',
      time: 'Yesterday',
      read: true,
    },
  ]);

  // Toggle submenu expansion
  const toggleSubMenu = (name: string) => {
    setExpandedMenus((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((note) => ({ ...note, read: true })));
    setHasNewNotifications(false);
  };

  // Handle Top Up
  const handleTopUp = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setTopUpDialogOpen(false);
      setTopUpAmount("");
      toast.success("Balance topped up successfully!");
      // Navigate to payment/checkout page after successful API response
      navigate('/payment', { 
        state: { 
          amount: topUpAmount,
          type: 'topup',
          date: new Date().toISOString()
        } 
      });
    }, 1500);
  };

  // Sidebar navigation links configuration
  const sidebarLinks = useMemo(
    () => [
      { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
      { name: "Send Message", icon: <MessageSquare size={20} />, path: "/send-sms"},
      { name: "Voice Calls", icon: <Phone size={20} />, path: "/voice-calls" },
      // { name: "Upload Audio", icon: <Upload size={20} />, path: "/upload-audio" },
      { name: "Analytics", icon: <BarChart3 size={20} />, path: "/analytics" },
      { name: "Balance", icon: <Wallet size={20} />, path: "/balance" },
      { name: "Groups", icon: <Users size={20} />, path: "/groups" },
      { name: "Scheduled", icon: <Calendar size={20} />, path: "/scheduled" },
      { name: "Settings", icon: <Settings size={20} />, path: "/settings" },
    ],
    []
  );

  // Enhanced isPathActive function to match exact paths or prefixes
  const isPathActive = (link: any) => {
    if (link.hasSubmenu && link.submenu) {
      return link.submenu.some(
        (subItem: any) =>
          actualPath === subItem.path ||
          (subItem.path !== '/' && actualPath.startsWith(subItem.path))
      );
    }
    return actualPath === link.path || (link.path !== '/' && actualPath.startsWith(link.path));
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Sign out handler
  const handleSignOut = () => {
    localStorage.removeItem('token');
    toast.success('You have logged out successfully.');
    navigate('/');
  };

  return (
    // Changed from h-screen to min-h-screen to prevent fixed height issues
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
      >
        <div className="flex flex-col p-6 space-y-4">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <span className="font-bold text-2xl text-jaylink-800 dark:text-white">
              Jay<span className="text-jaylink-600">Link</span>
            </span>
          </Link>

          <div className="flex items-center space-x-3 pt-2 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 rounded-full bg-jaylink-100 flex items-center justify-center text-jaylink-600">
              <User size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">John Doe</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">john@example.com</p>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {sidebarLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  className={`flex items-center px-2 py-2 text-sm rounded-lg transition-colors ${
                    link.path === actualPath
                      ? 'bg-jaylink-50 text-jaylink-700 dark:bg-jaylink-900/20 dark:text-jaylink-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span
                    className={`mr-3 ${
                      link.path === actualPath
                        ? 'text-jaylink-600 dark:text-jaylink-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {link.icon}
                  </span>
                  <span className="font-medium">{link.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          {/* Support/Help Link for Desktop */}
          <Link 
            to="/support" 
            className="flex items-center px-3 py-2 text-sm rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <HelpCircle size={16} className="mr-2" />
            Get Help
          </Link>
          <Button
            variant="outline"
            className="w-full border-gray-200 text-gray-700 hover:bg-gray-100 flex items-center justify-center"
            onClick={handleSignOut}
          >
            <LogOut size={16} className="mr-2" />
            Sign out
          </Button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-[280px]">
          <div className="flex flex-col h-full">
            <div className="flex flex-col p-6 space-y-4">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <span className="font-bold text-2xl text-jaylink-800 dark:text-white">
                  Jay<span className="text-jaylink-600">Link</span>
                </span>
              </Link>

              <div className="flex items-center space-x-3 pt-2 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 rounded-full bg-jaylink-100 flex items-center justify-center text-jaylink-600">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">John Doe</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">john@example.com</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-3 py-4 overflow-y-auto">
              <ul className="space-y-1">
                {sidebarLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className={`flex items-center px-2 py-2 text-sm rounded-lg transition-colors ${
                        link.path === actualPath
                          ? 'bg-jaylink-50 text-jaylink-700 dark:bg-jaylink-900/20 dark:text-jaylink-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`mr-3 ${
                          link.path === actualPath
                            ? 'text-jaylink-600 dark:text-jaylink-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {link.icon}
                      </span>
                      <span className="font-medium">{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
              {/* Top Up Button for Mobile */}
              <button
                onClick={() => setTopUpDialogOpen(true)}
                className="flex items-center w-full px-3 py-2 text-sm rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Plus size={16} className="mr-2" />
                Top Up Balance
              </button>

              {/* Support/Help Link for Mobile */}
              <Link
                to="/support"
                className="flex items-center px-3 py-2 text-sm rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <HelpCircle size={16} className="mr-2" />
                Get Help
              </Link>

              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-3 py-2 text-sm rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <LogOut size={16} className="mr-2" />
                Sign out
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content Area - Add overflow-x-hidden to prevent horizontal scrolling */}
      <div className="flex-1 w-full md:ml-64 flex flex-col overflow-x-hidden">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10"
        >
          <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden mr-2"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu size={20} />
              </Button>

              {backLink && (
                <Link
                  to={backLink}
                  className="inline-flex items-center text-gray-500 hover:text-gray-700 mr-4"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </Link>
              )}

              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
            </div>
            <div className="flex items-center space-x-2">
              {/* Top Up Button for Desktop */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="text-sm hidden sm:flex">
                    <Plus className="mr-2 h-4 w-4" />
                    Top Up
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Top Up Balance</h4>
                      <p className="text-sm text-muted-foreground">Add funds to your account</p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 gap-2">
                        {[500, 1000, 2000, 5000, 10000, 20000].map((amount) => (
                          <Button
                            key={amount}
                            variant="outline"
                            className={
                              topUpAmount === amount.toString()
                                ? 'border-jaylink-600 bg-jaylink-50'
                                : ''
                            }
                            onClick={() => setTopUpAmount(amount.toString())}
                          >
                            ₦{amount.toLocaleString()}
                          </Button>
                        ))}
                      </div>
                      <div className="relative">
                        <Label htmlFor="amount">Custom Amount (₦)</Label>
                        <Input
                          id="amount"
                          placeholder="Enter amount"
                          type="number"
                          value={topUpAmount}
                          onChange={(e) => setTopUpAmount(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <Button
                        className="w-full bg-jaylink-600 hover:bg-jaylink-700"
                        onClick={() => {
                          if (topUpAmount) {
                            setTopUpDialogOpen(true);
                          } else {
                            toast.error('Please enter an amount');
                          }
                        }}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

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

        {/* Main Content - Add auto to allow content to scroll when necessary */}
        <main className="flex-1 w-full p-4 sm:p-6 md:p-8 overflow-auto">{children}</main>
      </div>

      {/* Top Up Dialog */}
      <Dialog open={topUpDialogOpen} onOpenChange={setTopUpDialogOpen}>
        <DialogContent className="sm:max-w-[425px] w-[95%] mx-auto">
          <DialogHeader>
            <DialogTitle>Top Up Balance</DialogTitle>
            <DialogDescription>
              Add funds to your account to continue sending messages.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="topUpAmount">Amount (₦)</Label>
              <Input
                id="topUpAmount"
                placeholder="Enter amount"
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" className="justify-start">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Credit Card
                </Button>
                <Button type="button" variant="outline" className="justify-start">
                  <Wallet className="mr-2 h-4 w-4" />
                  Bank Transfer
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleTopUp}
              disabled={loading}
              className="bg-jaylink-600 hover:bg-jaylink-700 w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                'Proceed to Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardLayout;