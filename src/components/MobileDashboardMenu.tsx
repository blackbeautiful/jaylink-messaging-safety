
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  MessageSquare,
  Phone,
  Upload,
  Settings,
  LogOut,
  User,
  BarChart3,
  Wallet,
  LayoutDashboard,
  ChevronRight,
  Users,
  Calendar,
} from "lucide-react";

interface MobileDashboardMenuProps {
  userName: string;
  userEmail: string;
}

const MobileDashboardMenu = ({ userName, userEmail }: MobileDashboardMenuProps) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Define navigation items
  const navItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
    { 
      name: "Send Message", 
      icon: <MessageSquare size={20} />, 
      path: "/send-message",
      subItems: [
        { name: "Send SMS", path: "/send-sms" },
        { name: "Audio Message", path: "/audio-message" },
      ]
    },
    { name: "Voice Calls", icon: <Phone size={20} />, path: "/voice-calls" },
    { name: "Analytics", icon: <BarChart3 size={20} />, path: "/analytics" },
    { name: "Balance", icon: <Wallet size={20} />, path: "/balance" },
    { name: "Groups", icon: <Users size={20} />, path: "/groups" },
    { name: "Scheduled", icon: <Calendar size={20} />, path: "/scheduled" },
    { name: "Settings", icon: <Settings size={20} />, path: "/settings" },
  ];

  // Helper to check if a path is current (either exact match or subitem)
  const isCurrentPath = (path: string, subItems?: { name: string; path: string }[]) => {
    if (currentPath === path) return true;
    if (subItems && subItems.some(item => item.path === currentPath)) return true;
    return false;
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <div className="flex flex-col h-full">
          {/* User info at the top */}
          <div className="p-4 border-b">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-jaylink-100 flex items-center justify-center text-jaylink-600 mr-3">
                <User size={20} />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {userName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {userEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-2">
            <nav className="px-2">
              {navItems.map((item) => 
                item.subItems ? (
                  <Accordion type="single" collapsible key={item.name} className="border-none">
                    <AccordionItem value="send-message" className="border-none">
                      <AccordionTrigger 
                        className={`flex items-center py-2.5 px-3 rounded-lg mb-1 text-left w-full ${
                          isCurrentPath(item.path, item.subItems)
                            ? "bg-jaylink-50 text-jaylink-700 dark:bg-jaylink-900/20 dark:text-jaylink-300"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <div className="flex items-center">
                          <span className={`mr-3 ${
                            isCurrentPath(item.path, item.subItems)
                              ? "text-jaylink-600 dark:text-jaylink-400"
                              : "text-gray-500 dark:text-gray-400"
                          }`}>
                            {item.icon}
                          </span>
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pl-9 space-y-1">
                          {item.subItems.map((subItem) => (
                            <Link
                              key={subItem.name}
                              to={subItem.path}
                              className={`flex items-center py-2 px-3 rounded-lg text-sm ${
                                currentPath === subItem.path
                                  ? "bg-jaylink-50 text-jaylink-700 dark:bg-jaylink-900/20 dark:text-jaylink-300"
                                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              }`}
                            >
                              <ChevronRight size={14} className="mr-2 text-gray-400" />
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ) : (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center py-2.5 px-3 rounded-lg mb-1 ${
                      currentPath === item.path
                        ? "bg-jaylink-50 text-jaylink-700 dark:bg-jaylink-900/20 dark:text-jaylink-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span className={`mr-3 ${
                      currentPath === item.path
                        ? "text-jaylink-600 dark:text-jaylink-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}>
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )
              )}
            </nav>
          </div>

          {/* Sign out button */}
          <div className="p-4 border-t">
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
  );
};

export default MobileDashboardMenu;
