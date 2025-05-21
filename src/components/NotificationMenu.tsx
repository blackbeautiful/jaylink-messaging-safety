/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/NotificationMenu.tsx
// Updated NotificationMenu.tsx removing the 2-minute interval refresh
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  X, 
  Check, 
  ChevronRight, 
  Info, 
  AlertCircle, 
  Loader2, 
  Trash2,
  MoreVertical, 
  Settings 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { api } from "@/contexts/AuthContext";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";

// Keep the existing mock data function
const getMockNotifications = (): Notification[] => {
  return [
    {
      id: "1",
      title: "Low Balance Alert",
      message: "Your account balance is below the recommended minimum. Please top up to continue sending messages.",
      type: "warning" as const,
      read: false,
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
      metadata: {
        action: "low-balance",
        currentBalance: 230.50,
        minimumRecommended: 500
      }
    },
    {
      id: "2",
      title: "Bulk SMS Campaign Completed",
      message: "Your bulk SMS campaign to 126 recipients has completed. 120 messages were delivered successfully.",
      type: "success" as const,
      read: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      metadata: {
        action: "campaign-complete",
        campaignId: "camp_12345",
        total: 126,
        delivered: 120,
        failed: 6
      }
    },
    {
      id: "3",
      title: "New Voice Messaging Feature",
      message: "Try our new voice messaging feature for better audience engagement and higher response rates.",
      type: "info" as const,
      read: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      metadata: {
        action: "new-feature",
        featureLink: "/voice-calls",
        featureId: "voice-messaging-v1"
      }
    },
    {
      id: "4",
      title: "Password Changed",
      message: "Your account password was recently changed. If you didn't make this change, please contact support immediately.",
      type: "warning" as const,
      read: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      metadata: {
        action: "password-changed",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.1"
      }
    },
    {
      id: "5",
      title: "Payment Successful",
      message: "Your payment of ₦10,000 has been processed successfully and added to your account balance.",
      type: "success" as const,
      read: true,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      metadata: {
        action: "balance-update",
        amount: 10000,
        paymentMethod: "card",
        newBalance: 12345.67
      }
    }
  ];
};

// Define notification type
interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  metadata?: any;
}

// Define pagination type
interface Pagination {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const NotificationMenu = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 5,
    hasNext: false,
    hasPrev: false,
  });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
  const [bellClicked, setBellClicked] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      
      const response = await api.get(`/notifications?page=${page}&limit=5`);
      
      if (response.data.success) {
        setNotifications(response.data.data.notifications);
        setPagination(response.data.data.pagination);
        setUnreadCount(response.data.data.unreadCount);
      } else {
        throw new Error(response.data.message || "Failed to fetch notifications");
      }
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      
      // If no notifications endpoint exists yet, use mock data for development
      if (error.response?.status === 404) {
        const mockNotifications = getMockNotifications();
        
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.read).length);
        setPagination(prevPagination => ({
          ...prevPagination,
          total: mockNotifications.length,
          totalPages: 1,
          currentPage: 1,
          hasNext: false,
          hasPrev: false,
        }));
      } else {
        toast.error("Failed to load notifications");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch unread count on demand instead of using an interval
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get('/notifications/stats');
      
      if (response.data.success) {
        setUnreadCount(response.data.data.unreadCount);
      }
    } catch (error: any) {
      console.error("Error fetching notification stats:", error);
      
      // If endpoint doesn't exist in development, use mock data
      if (error.response?.status === 404) {
        const mockUnreadCount = getMockNotifications().filter(n => !n.read).length;
        setUnreadCount(mockUnreadCount);
      }
    }
  }, []);

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      
      if (response.data.success) {
        // Update the notification in the local state
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notification.id === id
              ? { ...notification, read: true }
              : notification
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      
      // Fallback for development if API fails
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await api.post('/notifications/read', { all: true });
      
      if (response.data.success) {
        // Update all notifications in the local state
        setNotifications(prevNotifications =>
          prevNotifications.map(notification => ({ ...notification, read: true }))
        );
        
        // Update unread count
        setUnreadCount(0);
        
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      
      // Fallback for development if API fails
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
      
      toast.success("All notifications marked as read");
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      const response = await api.delete(`/notifications/${id}`);
      
      if (response.data.success) {
        // Check if the deleted notification was unread
        const wasUnread = notifications.find(n => n.id === id && !n.read);
        
        // Update notifications in the local state
        setNotifications(prevNotifications =>
          prevNotifications.filter(notification => notification.id !== id)
        );
        
        // Update unread count if necessary
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        toast.success("Notification deleted");
        
        // If we've deleted all notifications on this page and there are more pages, fetch the previous page
        if (notifications.length === 1 && pagination.currentPage > 1) {
          fetchNotifications(pagination.currentPage - 1);
        } else if (notifications.length === 1) {
          // If it's the last notification on the first page, just set empty array
          setNotifications([]);
        }
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      
      // Fallback for development if API fails
      const wasUnread = notifications.find(n => n.id === id && !n.read);
      
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification.id !== id)
      );
      
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      toast.success("Notification deleted");
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    try {
      const notificationIds = notifications.map(n => n.id);
      
      const response = await api.delete('/notifications', {
        data: { notificationIds }
      });
      
      if (response.data.success) {
        // Clear notifications and unread count
        setNotifications([]);
        setUnreadCount(0);
        
        toast.success("All notifications deleted");
      }
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      
      // Fallback for development if API fails
      setNotifications([]);
      setUnreadCount(0);
      
      toast.success("All notifications deleted");
    }
  };

  // Handle confirmation of deletion
  const handleConfirmDelete = () => {
    if (notificationToDelete) {
      deleteNotification(notificationToDelete);
      setNotificationToDelete(null);
    }
    setConfirmDeleteOpen(false);
  };

  // Handle confirmation of all deletions
  const handleConfirmDeleteAll = () => {
    deleteAllNotifications();
    setDeleteAllConfirmOpen(false);
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <Check className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case "error":
        return <X className="h-5 w-5 text-red-500" />;
      case "info":
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  // Get notification action buttons based on notification type and metadata
  const getNotificationActions = (notification: Notification) => {
    // Extract metadata for specific actions
    const { type, metadata = {} } = notification;
    
    // Actions for various notification types
    if (metadata.messageId && type === "success" && metadata.action === "message-delivered") {
      return (
        <Link 
          to={`/sms/history?messageId=${metadata.messageId}`}
          onClick={() => {
            markAsRead(notification.id);
            setOpen(false);
          }}
          className="flex items-center text-xs text-jaylink-600 hover:text-jaylink-800"
        >
          View message details <ChevronRight className="h-3 w-3 ml-1" />
        </Link>
      );
    }
    
    if (metadata.action === "low-balance") {
      return (
        <Link 
          to="/balance"
          onClick={() => {
            markAsRead(notification.id);
            setOpen(false);
          }}
          className="flex items-center text-xs text-jaylink-600 hover:text-jaylink-800"
        >
          Top up balance <ChevronRight className="h-3 w-3 ml-1" />
        </Link>
      );
    }
    
    if (metadata.action === "password-changed" || metadata.action === "security-update") {
      return (
        <Link 
          to="/settings?tab=security"
          onClick={() => {
            markAsRead(notification.id);
            setOpen(false);
          }}
          className="flex items-center text-xs text-jaylink-600 hover:text-jaylink-800"
        >
          Security settings <ChevronRight className="h-3 w-3 ml-1" />
        </Link>
      );
    }
    
    if (metadata.action === "campaign-complete" && metadata.campaignId) {
      return (
        <Link 
          to={`/sms/history?campaignId=${metadata.campaignId}`}
          onClick={() => {
            markAsRead(notification.id);
            setOpen(false);
          }}
          className="flex items-center text-xs text-jaylink-600 hover:text-jaylink-800"
        >
          View campaign results <ChevronRight className="h-3 w-3 ml-1" />
        </Link>
      );
    }
    
    if (metadata.action === "new-feature") {
      return (
        <Link 
          to={metadata.featureLink || "/dashboard"}
          onClick={() => {
            markAsRead(notification.id);
            setOpen(false);
          }}
          className="flex items-center text-xs text-jaylink-600 hover:text-jaylink-800"
        >
          Try it now <ChevronRight className="h-3 w-3 ml-1" />
        </Link>
      );
    }
    
    // Default action for notifications with links
    if (metadata.link) {
      return (
        <Link 
          to={metadata.link}
          onClick={() => {
            markAsRead(notification.id);
            setOpen(false);
          }}
          className="flex items-center text-xs text-jaylink-600 hover:text-jaylink-800"
        >
          View details <ChevronRight className="h-3 w-3 ml-1" />
        </Link>
      );
    }
    
    // No action for other notifications
    return null;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      
      // If it's today, show relative time (e.g., "2 hours ago")
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      if (isToday) {
        return formatDistanceToNow(date, { addSuffix: true });
      } else {
        // If not today, show the date
        return format(date, "MMM d, yyyy");
      }
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Unknown time";
    }
  };

  // Handle bell icon click
  const handleBellClick = useCallback(() => {
    setBellClicked(true);
    fetchUnreadCount(); // Fetch unread count on demand
    setOpen(true);
  }, [fetchUnreadCount]);

  // Fetch initial unread count on component mount, but without interval
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Fetch full notifications when panel is opened
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative" 
              onClick={handleBellClick}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-[10px]"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Notifications{unreadCount > 0 ? ` (${unreadCount} unread)` : ''}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <SheetTitle>Notifications</SheetTitle>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount} unread
                  </Badge>
                )}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {unreadCount > 0 && (
                    <DropdownMenuItem onClick={markAllAsRead}>
                      <Check className="mr-2 h-4 w-4" />
                      Mark all as read
                    </DropdownMenuItem>
                  )}
                  {notifications.length > 0 && (
                    <>
                      {unreadCount > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuItem 
                        onClick={() => setDeleteAllConfirmOpen(true)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete all
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer" onClick={() => setOpen(false)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Notification settings
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <SheetDescription>
              Stay updated with activity on your account
            </SheetDescription>
          </SheetHeader>
          
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-jaylink-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading notifications...</span>
              </div>
            ) : notifications.length > 0 ? (
              <AnimatePresence initial={false}>
                {notifications.map((notification) => (
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
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          {getNotificationActions(notification)}
                          <div className="flex space-x-1 ml-auto">
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
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setNotificationToDelete(notification.id);
                                setConfirmDeleteOpen(true);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="py-12 px-4 text-center text-gray-500">
                <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No notifications yet</p>
                <p className="text-sm mt-1">We'll notify you when something important happens</p>
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {notifications.length > 0 && pagination.totalPages > 1 && (
            <div className="border-t p-2">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => pagination.hasPrev && fetchNotifications(pagination.currentPage - 1)}
                      className={pagination.hasPrev ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === pagination.totalPages || 
                      Math.abs(page - pagination.currentPage) <= 1
                    )
                    .map((page, index, array) => {
                      // Add ellipsis
                      if (index > 0 && array[index - 1] !== page - 1) {
                        return (
                          <PaginationItem key={`ellipsis-${page}`}>
                            <span className="px-4 py-2">...</span>
                          </PaginationItem>
                        );
                      }
                      
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => fetchNotifications(page)}
                            isActive={page === pagination.currentPage}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => pagination.hasNext && fetchNotifications(pagination.currentPage + 1)}
                      className={pagination.hasNext ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
          
          {/* Footer */}
          {notifications.length > 0 && (
            <SheetFooter className="border-t p-4 flex-row justify-between">
              {unreadCount > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <Check className="mr-2 h-3 w-3" />
                  Mark all as read
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDeleteAllConfirmOpen(true)}
                className="text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 ml-auto"
              >
                <Trash2 className="mr-2 h-3 w-3" />
                Delete all
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
      
      {/* Confirm Delete Dialog */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Confirm Delete All Dialog */}
      <AlertDialog open={deleteAllConfirmOpen} onOpenChange={setDeleteAllConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Notifications</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all notifications? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDeleteAll}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default NotificationMenu;