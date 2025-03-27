
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Check, ChevronRight, Info, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

const notifications = [
  {
    id: 1,
    title: "Balance Updated",
    message: "Your account has been credited with ₦5,000",
    time: "2 hours ago",
    read: false,
    type: "info",
  },
  {
    id: 2,
    title: "Voice Call Campaign Complete",
    message: "Your voice call campaign to 150 recipients has completed successfully",
    time: "Yesterday",
    read: false,
    type: "success",
  },
  {
    id: 3,
    title: "New Feature Available",
    message: "Try our new audio message feature for better engagement",
    time: "2 days ago",
    read: true,
    type: "info",
  },
  {
    id: 4,
    title: "SMS Credits Low",
    message: "Your SMS credits are running low. Consider topping up soon.",
    time: "3 days ago",
    read: true,
    type: "warning",
  },
];

const NotificationMenu = () => {
  const [open, setOpen] = useState(false);
  const [userNotifications, setUserNotifications] = useState(notifications);
  
  const unreadCount = userNotifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setUserNotifications(
      userNotifications.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setUserNotifications(
      userNotifications.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id: number) => {
    setUserNotifications(
      userNotifications.filter(notification => notification.id !== id)
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <Check className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case "error":
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-[10px]"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all as read
              </Button>
            )}
          </div>
          <SheetDescription>
            Stay updated with activity on your account
          </SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto max-h-[calc(100vh-8rem)]">
          <AnimatePresence initial={false}>
            {userNotifications.length > 0 ? (
              userNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`border-b last:border-b-0 p-4 relative ${
                    notification.read ? "" : "bg-blue-50 dark:bg-blue-900/10"
                  }`}
                >
                  <div className="flex">
                    <div className="mr-3 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="text-sm font-medium mb-1">{notification.title}</h4>
                        <span className="text-xs text-gray-500">{notification.time}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="p-0 h-auto text-xs text-jaylink-600 hover:text-jaylink-800"
                        >
                          <span className="flex items-center">View details <ChevronRight className="h-3 w-3 ml-1" /></span>
                        </Button>
                        <div className="flex space-x-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => markAsRead(notification.id)}
                            >
                              Mark as read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-12 px-4 text-center text-gray-500">
                <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No notifications yet</p>
                <p className="text-sm mt-1">We'll notify you when something important happens</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationMenu;
