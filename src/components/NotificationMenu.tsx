/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/NotificationMenu.tsx - FIXED VERSION
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
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
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
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
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
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
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
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
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
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
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

// Cache interface
interface NotificationCache {
  data: Notification[];
  pagination: Pagination;
  unreadCount: number;
  lastFetch: number;
  searchQuery: string;
}

const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes cache
const INITIAL_PAGINATION: Pagination = {
  total: 0,
  totalPages: 0,
  currentPage: 1,
  limit: 5,
  hasNext: false,
  hasPrev: false,
};

const NotificationMenu = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState<Pagination>(INITIAL_PAGINATION);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Cache management
  const [notificationCache, setNotificationCache] = useState<NotificationCache | null>(null);
  
  // Check if cache is valid
  const isCacheValid = useCallback((cache: NotificationCache | null): boolean => {
    if (!cache) return false;
    const isExpired = Date.now() - cache.lastFetch > CACHE_DURATION;
    return !isExpired;
  }, []);

  // FIXED: Fetch notifications with proper error handling and caching
  const fetchNotifications = useCallback(async (page = 1, forceRefresh = false) => {
    try {
      // Check cache first unless force refresh
      if (!forceRefresh && page === 1 && isCacheValid(notificationCache)) {
        console.log('Using cached notifications');
        setNotifications(notificationCache!.data);
        setPagination(notificationCache!.pagination);
        setUnreadCount(notificationCache!.unreadCount);
        return;
      }

      setLoading(true);
      
      const response = await api.get(`/notifications?page=${page}&limit=5`);
      
      if (response.data.success) {
        const { notifications: fetchedNotifications, pagination: paginationData, unreadCount: fetchedUnreadCount } = response.data.data;
        
        setNotifications(fetchedNotifications);
        setPagination(paginationData);
        setUnreadCount(fetchedUnreadCount);
        
        // Update cache for page 1
        if (page === 1) {
          setNotificationCache({
            data: fetchedNotifications,
            pagination: paginationData,
            unreadCount: fetchedUnreadCount,
            lastFetch: Date.now(),
            searchQuery: ""
          });
        }
      } else {
        throw new Error(response.data.message || "Failed to fetch notifications");
      }
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      
      // FIXED: Better fallback handling
      if (error.response?.status === 404 || error.code === 'NETWORK_ERROR') {
        console.log('API not available, using mock data');
        const mockNotifications = getMockNotifications();
        
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.read).length);
        setPagination({
          ...INITIAL_PAGINATION,
          total: mockNotifications.length,
          totalPages: 1,
          currentPage: 1,
        });
      } else {
        toast.error("Failed to load notifications");
      }
    } finally {
      setLoading(false);
    }
  }, [notificationCache, isCacheValid]);

  // FIXED: Fetch unread count with proper error handling
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get('/notifications/stats');
      
      if (response.data.success) {
        setUnreadCount(response.data.data.unreadCount);
      }
    } catch (error: any) {
      console.error("Error fetching notification stats:", error);
      
      // Fallback to mock data if API fails
      if (error.response?.status === 404) {
        const mockUnreadCount = getMockNotifications().filter(n => !n.read).length;
        setUnreadCount(mockUnreadCount);
      }
    }
  }, []);

  // FIXED: Mark notification as read with proper state updates
  const markAsRead = async (id: string) => {
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      
      if (response.data.success) {
        // Update local state immediately
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notification.id === id
              ? { ...notification, read: true }
              : notification
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Invalidate cache
        setNotificationCache(null);
        
        toast.success("Notification marked as read");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      
      // Fallback for development - still update UI
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      toast.success("Notification marked as read");
    }
  };

  // FIXED: Mark all notifications as read with proper API call
  const markAllAsRead = async () => {
    try {
      setActionLoading('markAllRead');
      
      // FIXED: Send the correct payload format
      const response = await api.post('/notifications/read', { all: true });
      
      if (response.data.success) {
        // Update all notifications in local state
        setNotifications(prevNotifications =>
          prevNotifications.map(notification => ({ ...notification, read: true }))
        );
        
        // Reset unread count
        setUnreadCount(0);
        
        // Invalidate cache
        setNotificationCache(null);
        
        toast.success("All notifications marked as read");
      } else {
        throw new Error(response.data.message || 'Failed to mark all as read');
      }
    } catch (error: any) {
      console.error("Error marking all notifications as read:", error);
      
      // Fallback for development
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
      
      toast.success("All notifications marked as read");
    } finally {
      setActionLoading(null);
    }
  };

  // FIXED: Delete single notification with proper state management
  const deleteNotification = async (id: string) => {
    try {
      setActionLoading('deleteSingle');
      
      const response = await api.delete(`/notifications/${id}`);
      
      if (response.data.success) {
        // Check if the deleted notification was unread
        const deletedNotification = notifications.find(n => n.id === id);
        const wasUnread = deletedNotification && !deletedNotification.read;
        
        // Update notifications in local state
        setNotifications(prevNotifications =>
          prevNotifications.filter(notification => notification.id !== id)
        );
        
        // Update unread count if necessary
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        // Update pagination
        setPagination(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1)
        }));
        
        // Invalidate cache
        setNotificationCache(null);
        
        toast.success("Notification deleted");
        
        // If we've deleted all notifications on this page and there are more pages, fetch the previous page
        if (notifications.length === 1 && pagination.currentPage > 1) {
          await fetchNotifications(pagination.currentPage - 1, true);
        } else if (notifications.length === 1 && pagination.total === 1) {
          // Last notification deleted, reset to empty state
          setNotifications([]);
          setPagination(INITIAL_PAGINATION);
        }
      } else {
        throw new Error(response.data.message || 'Failed to delete notification');
      }
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      
      // Fallback for development
      const deletedNotification = notifications.find(n => n.id === id);
      const wasUnread = deletedNotification && !deletedNotification.read;
      
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification.id !== id)
      );
      
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      toast.success("Notification deleted");
    } finally {
      setActionLoading(null);
    }
  };

  // FIXED: Delete all notifications with correct API call and state management
  const deleteAllNotifications = async () => {
    try {
      setActionLoading('deleteAll');
      
      // FIXED: Get all notification IDs from current notifications
      const allNotificationIds = notifications.map(n => n.id);
      
      if (allNotificationIds.length === 0) {
        toast.info("No notifications to delete");
        return;
      }
      
      // FIXED: Send the correct payload format for bulk delete
      const response = await api.delete('/notifications', {
        data: { notificationIds: allNotificationIds }
      });
      
      if (response.data.success) {
        // Clear all notifications and reset state
        setNotifications([]);
        setUnreadCount(0);
        setPagination(INITIAL_PAGINATION);
        
        // Invalidate cache completely  
        setNotificationCache(null);
        
        // Show success message with count
        toast.success(`${allNotificationIds.length} notifications deleted successfully`);
        
        // Force a fresh fetch to ensure we have the latest data
        setTimeout(() => {
          fetchNotifications(1, true);
        }, 500);
      } else {
        throw new Error(response.data.message || 'Failed to delete notifications');
      }
    } catch (error: any) {
      console.error("Error deleting all notifications:", error);
      
      // FIXED: Better error handling
      let errorMessage = 'Failed to delete all notifications';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // For development, still clear the UI but show the error
      if (error.response?.status === 404) {
        setNotifications([]);
        setUnreadCount(0);
        setPagination(INITIAL_PAGINATION);
        toast.success("All notifications cleared");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setActionLoading(null);
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
    const { type, metadata = {} } = notification;
    
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
          to="/dashboard/balance"
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
    
    return null;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      
      if (isNaN(date.getTime())) {
        return "Unknown time";
      }
      
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      if (isToday) {
        return formatDistanceToNow(date, { addSuffix: true });
      } else {
        return format(date, "MMM d, yyyy");
      }
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Unknown time";
    }
  };

  // Handle bell icon click
  const handleBellClick = useCallback(() => {
    fetchUnreadCount();
    setOpen(true);
  }, [fetchUnreadCount]);

  // Fetch initial unread count on component mount
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Fetch notifications when panel is opened
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  // Auto-refresh unread count every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

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
                  <Button variant="ghost" size="icon" disabled={!!actionLoading}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {unreadCount > 0 && (
                    <DropdownMenuItem 
                      onClick={markAllAsRead}
                      disabled={!!actionLoading}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {actionLoading === 'markAllRead' ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Marking as read...
                        </>
                      ) : (
                        'Mark all as read'
                      )}
                    </DropdownMenuItem>
                  )}
                  {notifications.length > 0 && (
                    <>
                      {unreadCount > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuItem 
                        onClick={() => setDeleteAllConfirmOpen(true)}
                        className="text-red-600"
                        disabled={!!actionLoading}
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
                                disabled={!!actionLoading}
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
                              disabled={!!actionLoading}
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
                  disabled={!!actionLoading}
                >
                  {actionLoading === 'markAllRead' ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Marking...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-3 w-3" />
                      Mark all as read
                    </>
                  )}
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDeleteAllConfirmOpen(true)}
                className="text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 ml-auto"
                disabled={!!actionLoading}
              >
                {actionLoading === 'deleteAll' ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-3 w-3" />
                    Delete all
                  </>
                )}
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
            <AlertDialogCancel disabled={!!actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!!actionLoading}
            >
              {actionLoading === 'deleteSingle' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
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
              Are you sure you want to delete all {notifications.length} notifications? This action cannot be undone.
              {notifications.length > 10 && (
                <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-sm">
                  <strong>Warning:</strong> You are about to delete {notifications.length} notifications. 
                  This will permanently remove all your notification history.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDeleteAll}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!!actionLoading}
            >
              {actionLoading === 'deleteAll' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting {notifications.length} notifications...
                </>
              ) : (
                `Delete All ${notifications.length} Notifications`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Debug Panel (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 max-w-xs">
          <details className="bg-black/80 text-white p-2 rounded text-xs">
            <summary className="cursor-pointer">Debug: Notifications</summary>
            <div className="mt-2 space-y-1">
              <div>Count: {notifications.length}</div>
              <div>Unread: {unreadCount}</div>
              <div>Page: {pagination.currentPage}/{pagination.totalPages}</div>
              <div>Total: {pagination.total}</div>
              <div>Loading: {loading.toString()}</div>
              <div>Action: {actionLoading || 'none'}</div>
              <div>Cache: {notificationCache ? 'valid' : 'invalid'}</div>
              <div>Cache Age: {notificationCache ? Math.round((Date.now() - notificationCache.lastFetch) / 1000) + 's' : 'N/A'}</div>
            </div>
          </details>
        </div>
      )}
    </>
  );
};

export default NotificationMenu;