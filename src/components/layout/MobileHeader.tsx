
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  Menu,
} from "lucide-react";

interface MobileHeaderProps {
  title: string;
}

const MobileHeader = ({ title }: MobileHeaderProps) => {
  const [open, setOpen] = useState(false);

  const sidebarLinks = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
    { name: "Send SMS", icon: <MessageSquare size={20} />, path: "/send-sms" },
    { name: "Voice Calls", icon: <Phone size={20} />, path: "/voice-calls" },
    { name: "Audio Message", icon: <Upload size={20} />, path: "/audio-message" },
    { name: "Upload Audio", icon: <Upload size={20} />, path: "/upload-audio" },
    { name: "Analytics", icon: <BarChart3 size={20} />, path: "/analytics" },
    { name: "Balance", icon: <Wallet size={20} />, path: "/balance" },
    { name: "Settings", icon: <Settings size={20} />, path: "/settings" },
  ];

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 md:hidden">
      <div className="px-4 py-3 flex items-center justify-between">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu size={24} />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-0">
            <SheetHeader className="p-6 border-b">
              <SheetTitle className="text-left font-bold text-2xl text-jaylink-800 dark:text-white">
                Jay<span className="text-jaylink-600">Link</span>
              </SheetTitle>
            </SheetHeader>
            
            <nav className="flex-1 px-4 py-4">
              <ul className="space-y-1">
                {sidebarLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="flex items-center px-3 py-3 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setOpen(false)}
                    >
                      <span className="mr-3 text-gray-500 dark:text-gray-400">
                        {link.icon}
                      </span>
                      <span className="font-medium">{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
              <div className="flex items-center mb-4">
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
                className="w-full border-gray-200 text-gray-700 hover:bg-gray-100 flex items-center justify-center"
              >
                <LogOut size={16} className="mr-2" />
                Sign out
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 justify-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h1>
        </div>

        <div className="w-8 h-8 rounded-full bg-jaylink-100 flex items-center justify-center text-jaylink-600">
          <User size={16} />
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
