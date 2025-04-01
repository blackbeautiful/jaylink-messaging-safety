
import { useState } from "react";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X, Bell, User, LogOut } from "lucide-react";
import LogoImg from "@/assets/logo.svg";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface MobileHeaderProps {
  title: string;
  backLink?: string;
  userName: string;
  userEmail: string;
}

const MobileHeader = ({ title, backLink, userName, userEmail }: MobileHeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden mr-2">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0" onCloseAutoFocus={(e) => e.preventDefault()}>
              <div className="flex flex-col h-full">
                <div className="p-4 border-b flex items-center justify-between">
                  <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                    <img src={LogoImg} alt="Logo" className="h-8" />
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                    <X size={18} />
                  </Button>
                </div>
                <div className="px-4 py-3 border-b">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-jaylink-100 flex items-center justify-center text-jaylink-600">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{userName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{userEmail}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  <nav className="px-2 py-4">
                    <ul className="space-y-1">
                      {[
                        { name: "Dashboard", path: "/dashboard" },
                        { name: "Send SMS", path: "/send-sms" },
                        { name: "Audio Message", path: "/audio-message" },
                        { name: "Voice Calls", path: "/voice-calls" },
                        { name: "Contact Groups", path: "/groups" },
                        { name: "Scheduled", path: "/scheduled" },
                        { name: "Analytics", path: "/analytics" },
                        { name: "Balance", path: "/balance" },
                        { name: "Settings", path: "/settings" }
                      ].map((item) => (
                        <li key={item.name}>
                          <Link
                            to={item.path}
                            className="flex items-center px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setIsOpen(false)}
                          >
                            <span className="font-medium">{item.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
                
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

          {backLink && (
            <Link 
              to={backLink} 
              className="inline-flex items-center text-gray-500 hover:text-gray-700 mr-3"
              aria-label="Go back"
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
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </Link>
          )}

          <div className="flex items-center md:hidden">
            <Link to="/dashboard" className="mr-2">
              <img src={LogoImg} alt="Logo" className="h-7" />
            </Link>
            <Separator orientation="vertical" className="h-6 mx-2" />
          </div>
          
          <h1 className={cn(
            "font-semibold text-gray-900 dark:text-white",
            backLink ? "text-lg" : "text-xl"
          )}>
            {title}
          </h1>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon">
            <Bell size={18} />
          </Button>
          <div className="w-8 h-8 rounded-full bg-jaylink-100 flex items-center justify-center text-jaylink-600 md:hidden">
            <User size={16} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
