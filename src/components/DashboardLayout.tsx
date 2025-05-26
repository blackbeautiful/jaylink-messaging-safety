// src/components/DashboardLayout.tsx - COMPLETE FIXED VERSION
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
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
  Settings,
  LogOut,
  User,
  Home,
  BarChart3,
  Wallet,
  LayoutDashboard,
  Menu,
  ChevronDown,
  Users,
  Calendar,
  Plus,
  Loader2,
  HelpCircle,
  History,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import NotificationMenu from "@/components/NotificationMenu";
import { useAuth, api } from '@/contexts/AuthContext';

// Define the DashboardLayout props interface
interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  backLink?: string;
  currentPath?: string;
}

const DashboardLayout = ({ children, title, backLink, currentPath }: DashboardLayoutProps) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { logout, user } = useAuth();

  // Use provided currentPath or fall back to location.pathname
  const actualPath = currentPath || location.pathname;

  // Sidebar navigation links configuration
  const sidebarLinks = useMemo(
    () => [
      { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
      { name: "Send Message", icon: <MessageSquare size={20} />, path: "/send-sms"},
      // { name: "Voice Calls", icon: <Phone size={20} />, path: "/voice-calls" },
      // { name: "Analytics", icon: <BarChart3 size={20} />, path: "/analytics" },
      { name: "Balance", icon: <Wallet size={20} />, path: "/balance" },
      { name: "Groups", icon: <Users size={20} />, path: "/groups" },
      { name: "Scheduled", icon: <Calendar size={20} />, path: "/scheduled" },
      { name: "History", icon: <History size={20} />, path: "/sms/history" },
    ],
    []
  );

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Sign out handler
  const handleSignOut = () => {
    logout(); // Call the logout function from AuthContext
  };

  // FIXED: Handle Top Up with proper API integration (like Balance page)
  const handleTopUp = async () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (parseFloat(topUpAmount) < 100) {
      toast.error("Minimum top-up amount is ₦100");
      return;
    }

    try {
      setLoading(true);
      
      // Initialize payment with backend API (same as Balance page)
      const response = await api.post('/payments/initialize', {
        amount: parseFloat(topUpAmount)
      });
      
      if (response.data.success) {
        const { authorizationUrl } = response.data.data;
        
        // Close dialog and reset form
        setTopUpDialogOpen(false);
        setTopUpAmount("");
        
        toast.success("Redirecting to payment gateway...");
        
        // Redirect to payment gateway
        window.location.href = authorizationUrl;
      } else {
        throw new Error(response.data.message || 'Failed to initialize payment');
      }
    } catch (error: any) {
      console.error('Top up error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to initialize payment';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Use user data from AuthContext
  const userName = user ? `${user.firstName} ${user.lastName}` : 'User';
  const userEmail = user ? user.email : 'user@example.com';

  return (
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
              <p className="text-sm font-medium text-gray-900 dark:text-white">{userName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{userEmail}</p>
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
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{userName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{userEmail}</p>
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

    {/* Main Content Area */}
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
            {/* FIXED: Top Up Popover for Desktop - Integrated like Balance page */}
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
                        min="100"
                        step="0.01"
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum amount: ₦100</p>
                    </div>
                    <Button
                      className="w-full bg-jaylink-600 hover:bg-jaylink-700"
                      onClick={() => {
                        if (topUpAmount && parseFloat(topUpAmount) >= 100) {
                          // Directly handle top up without opening dialog
                          handleTopUp();
                        } else if (topUpAmount && parseFloat(topUpAmount) < 100) {
                          toast.error('Minimum amount is ₦100');
                        } else {
                          toast.error('Please enter an amount');
                        }
                      }}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Proceed to Payment'
                      )}
                    </Button>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-xs text-blue-800 dark:text-blue-200">
                        <p className="font-medium mb-1">Payment Security:</p>
                        <p>• Secure payment via Paystack</p>
                        <p>• Your card details are encrypted</p>
                        <p>• You'll be redirected back after payment</p>
                      </div>
                    </div>
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

      {/* Main Content */}
      <main className="flex-1 w-full p-4 sm:p-6 md:p-8 overflow-auto">{children}</main>
    </div>

    {/* FIXED: Top Up Dialog - Integrated like Balance page */}
    <Dialog open={topUpDialogOpen} onOpenChange={setTopUpDialogOpen}>
      <DialogContent className="sm:max-w-[425px] w-[90vw] max-w-[90vw] sm:w-auto">
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
              min="100"
              step="0.01"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">Minimum amount: ₦100</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Payment Security:</p>
                <p>• Secure payment via Paystack</p>
                <p>• Your card details are encrypted</p>
                <p>• You'll be redirected back after payment</p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setTopUpDialogOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleTopUp} 
            disabled={loading} 
            className="bg-jaylink-600 hover:bg-jaylink-700 w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Proceed to Payment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
);
};

export default DashboardLayout;