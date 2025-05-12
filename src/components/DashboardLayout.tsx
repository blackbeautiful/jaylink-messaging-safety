import { ReactNode, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Bell,
  ChevronDown,
  ChevronRight,
  Users,
  Calendar,
  Volume2,
} from "lucide-react";
import LogoImg from "@/assets/logo.svg";

// We need to update the interface for DashboardLayout props
interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  backLink?: string;
  currentPath?: string; // Add this prop to fix the error
}

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const DashboardLayout = ({ children, title, backLink, currentPath }: DashboardLayoutProps) => {
  const location = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

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

  const toggleSubMenu = (name: string) => {
    setExpandedMenus(prev => 
      prev.includes(name) 
        ? prev.filter(item => item !== name) 
        : [...prev, name]
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(note => ({ ...note, read: true })));
    setHasNewNotifications(false);
  };

  const sidebarLinks = [
    { 
      name: "Dashboard", 
      icon: <LayoutDashboard size={20} />, 
      path: "/dashboard",
      hasSubmenu: false,
    },
    { 
      name: "Send Message", 
      icon: <MessageSquare size={20} />, 
      path: "/send-message",
      hasSubmenu: true,
      submenu: [
        { name: "Send SMS", icon: <MessageSquare size={18} />, path: "/send-sms" },
        { name: "Audio Message", icon: <Volume2 size={18} />, path: "/audio-message" },
      ]
    },
    { 
      name: "Voice Calls", 
      icon: <Phone size={20} />, 
      path: "/voice-calls",
      hasSubmenu: false,
    },
    { 
      name: "Contact Groups", 
      icon: <Users size={20} />, 
      path: "/groups",
      hasSubmenu: false,
    },
    { 
      name: "Scheduled", 
      icon: <Calendar size={20} />, 
      path: "/scheduled",
      hasSubmenu: false,
    },
    { 
      name: "Analytics", 
      icon: <BarChart3 size={20} />, 
      path: "/analytics",
      hasSubmenu: false,
    },
    { 
      name: "Balance", 
      icon: <Wallet size={20} />, 
      path: "/balance",
      hasSubmenu: false,
    },
    { 
      name: "Settings", 
      icon: <Settings size={20} />, 
      path: "/settings",
      hasSubmenu: false,
    },
  ];

  const isPathActive = (link: any) => {
    if (link.hasSubmenu && link.submenu) {
      return link.submenu.some((subItem: any) => subItem.path === currentPath);
    }
    return link.path === currentPath;
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
      >
        <div className="flex flex-col p-6 space-y-4">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <img src={LogoImg} alt="Logo" width={120} height={40} />
          </Link>
          
          <div className="flex items-center space-x-3 pt-2 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 rounded-full bg-jaylink-100 flex items-center justify-center text-jaylink-600">
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
            {sidebarLinks.map((link) => (
              <li key={link.name}>
                {!link.hasSubmenu ? (
                  <Link
                    to={link.path}
                    className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
                      isPathActive(link)
                        ? "bg-jaylink-50 text-jaylink-700 dark:bg-jaylink-900/20 dark:text-jaylink-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span className={`mr-3 ${
                      isPathActive(link)
                        ? "text-jaylink-600 dark:text-jaylink-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}>
                      {link.icon}
                    </span>
                    <span className="font-medium">{link.name}</span>
                  </Link>
                ) : (
                  <div>
                    <button
                      onClick={() => toggleSubMenu(link.name)}
                      className={`flex items-center justify-between w-full px-3 py-3 rounded-lg transition-colors ${
                        isPathActive(link) || expandedMenus.includes(link.name)
                          ? "bg-jaylink-50 text-jaylink-700 dark:bg-jaylink-900/20 dark:text-jaylink-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <div className="flex items-center">
                        <span className={`mr-3 ${
                          isPathActive(link) || expandedMenus.includes(link.name)
                            ? "text-jaylink-600 dark:text-jaylink-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}>
                          {link.icon}
                        </span>
                        <span className="font-medium">{link.name}</span>
                      </div>
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform ${
                          expandedMenus.includes(link.name) ? "rotate-180" : ""
                        }`} 
                      />
                    </button>
                    
                    {expandedMenus.includes(link.name) && link.submenu && (
                      <ul className="pl-10 mt-1 space-y-1">
                        {link.submenu.map((subItem) => (
                          <li key={subItem.name}>
                            <Link
                              to={subItem.path}
                              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                                subItem.path === currentPath
                                  ? "bg-jaylink-50 text-jaylink-700 dark:bg-jaylink-900/20 dark:text-jaylink-300"
                                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              }`}
                            >
                              <span className={`mr-3 ${
                                subItem.path === currentPath
                                  ? "text-jaylink-600 dark:text-jaylink-400"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}>
                                {subItem.icon}
                              </span>
                              <span className="font-medium text-sm">{subItem.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            ))}
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

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-[280px]">
          <div className="flex flex-col h-full">
            <div className="flex flex-col p-6 space-y-4">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <img src={LogoImg} alt="Logo" width={100} height={34} />
              </Link>
              
              <div className="flex items-center space-x-3 pt-2 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 rounded-full bg-jaylink-100 flex items-center justify-center text-jaylink-600">
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
                {sidebarLinks.map((link) => (
                  <li key={link.name}>
                    {!link.hasSubmenu ? (
                      <Link
                        to={link.path}
                        className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
                          isPathActive(link)
                            ? "bg-jaylink-50 text-jaylink-700 dark:bg-jaylink-900/20 dark:text-jaylink-300"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <span className={`mr-3 ${
                          isPathActive(link)
                            ? "text-jaylink-600 dark:text-jaylink-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}>
                          {link.icon}
                        </span>
                        <span className="font-medium">{link.name}</span>
                      </Link>
                    ) : (
                      <div>
                        <button
                          onClick={() => toggleSubMenu(link.name)}
                          className={`flex items-center justify-between w-full px-3 py-3 rounded-lg transition-colors ${
                            isPathActive(link) || expandedMenus.includes(link.name)
                              ? "bg-jaylink-50 text-jaylink-700 dark:bg-jaylink-900/20 dark:text-jaylink-300"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          <div className="flex items-center">
                            <span className={`mr-3 ${
                              isPathActive(link) || expandedMenus.includes(link.name)
                                ? "text-jaylink-600 dark:text-jaylink-400"
                                : "text-gray-500 dark:text-gray-400"
                            }`}>
                              {link.icon}
                            </span>
                            <span className="font-medium">{link.name}</span>
                          </div>
                          <ChevronRight 
                            className={`h-4 w-4 transition-transform ${
                              expandedMenus.includes(link.name) ? "rotate-90" : ""
                            }`} 
                          />
                        </button>
                        
                        {expandedMenus.includes(link.name) && link.submenu && (
                          <ul className="pl-10 mt-1 space-y-1">
                            {link.submenu.map((subItem) => (
                              <li key={subItem.name}>
                                <Link
                                  to={subItem.path}
                                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                                    subItem.path === currentPath
                                      ? "bg-jaylink-50 text-jaylink-700 dark:bg-jaylink-900/20 dark:text-jaylink-300"
                                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  }`}
                                >
                                  <span className={`mr-3 ${
                                    subItem.path === currentPath
                                      ? "text-jaylink-600 dark:text-jaylink-400"
                                      : "text-gray-500 dark:text-gray-400"
                                  }`}>
                                    {subItem.icon}
                                  </span>
                                  <span className="font-medium text-sm">{subItem.name}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                ))}
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
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1 md:ml-64">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10"
        >
          <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden mr-2">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              
              {backLink && (
                <Link to={backLink} className="inline-flex items-center text-gray-500 hover:text-gray-700 mr-4">
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
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                </Link>
              )}
              
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <DropdownMenu 
                open={notificationsOpen} 
                onOpenChange={(open) => {
                  setNotificationsOpen(open);
                  if (open) setHasNewNotifications(false);
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell size={20} />
                    {hasNewNotifications && (
                      <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-medium">Notifications</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      Mark all as read
                    </Button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No notifications
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <div 
                          key={notification.id} 
                          className={`p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-700 ${!notification.read ? 'bg-jaylink-50 dark:bg-jaylink-900/10' : ''}`}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <span className="text-xs text-gray-500">{notification.time}</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.description}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t text-center">
                    <Link 
                      to="/notifications" 
                      className="text-sm text-jaylink-600 hover:text-jaylink-700 dark:text-jaylink-400 dark:hover:text-jaylink-300"
                    >
                      View all notifications
                    </Link>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="/">
                <Button variant="ghost" size="icon">
                  <Home size={20} />
                </Button>
              </Link>
              <Link to="/settings">
                <Button variant="ghost" size="icon">
                  <Settings size={20} />
                </Button>
              </Link>
              <div className="w-8 h-8 rounded-full bg-jaylink-100 flex items-center justify-center text-jaylink-600 md:hidden">
                <User size={16} />
              </div>
            </div>
          </div>
        </motion.header>

        <main className="p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
