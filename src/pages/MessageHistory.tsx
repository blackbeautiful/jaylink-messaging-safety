/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/MessageHistory.tsx - Enhanced with full backend integration
import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/contexts/AuthContext";
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, 
  Search, 
  RefreshCw,
  Check,
  X,
  Clock,
  Send as SendIcon,
  MessageSquare,
  Phone,
  Music,
  Trash2,
  Download,
  Filter,
  MoreHorizontal,
  Eye,
  AlertCircle,
  Calendar,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import MessageDetailDialog from "@/components/messages/MessageDetailDialog";
import Pagination from "@/components/Pagination";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Types
interface Message {
  id: string;
  messageId: string;
  type: 'sms' | 'voice' | 'audio';
  content: string;
  senderId?: string;
  recipients: string[] | string;
  recipientCount: number;
  cost: number;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  scheduled: boolean;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface MessageHistoryData {
  messages: Message[];
  pagination: PaginationInfo;
}

interface FilterState {
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  search: string;
}

// Data cache for optimization
interface MessageCache {
  data: Message[];
  pagination: PaginationInfo;
  filters: FilterState;
  lastFetch: number;
}

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache for messages
const CURRENCY_SYMBOL = '₦'; // Nigerian Naira

const MessageHistory = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 20,
    hasNext: false,
    hasPrev: false,
  });
  
  // Cache management
  const [messageCache, setMessageCache] = useState<MessageCache | null>(null);
  
  // UI State
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [isBatchDelete, setIsBatchDelete] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    type: "all",
    status: "all",
    startDate: "",
    endDate: "",
    search: "",
  });

  // Debounced search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Currency configuration
const [currencyConfig, setCurrencyConfig] = useState({
    symbol: CURRENCY_SYMBOL,
    code: 'NGN'
  });

  // Memoized stats
  const stats = useMemo(() => {
    return {
      total: pagination.total,
      delivered: messages.filter(m => m.status === 'delivered').length,
      failed: messages.filter(m => m.status === 'failed').length,
      totalCost: messages.reduce((sum, m) => sum + (m.cost || 0), 0),
    };
  }, [messages, pagination.total]);

  // Check if cache is valid
  const isCacheValid = useCallback((cache: MessageCache | null, currentFilters: FilterState): boolean => {
    if (!cache) return false;
    
    const isExpired = Date.now() - cache.lastFetch > CACHE_DURATION;
    const filtersChanged = JSON.stringify(cache.filters) !== JSON.stringify(currentFilters);
    
    return !isExpired && !filtersChanged;
  }, []);

  // Fetch messages with caching
  const fetchMessages = useCallback(async (
    page = 1, 
    currentFilters = filters, 
    showLoader = true, 
    forceRefresh = false
  ) => {
    try {
      // Check cache first unless force refresh
      if (!forceRefresh && page === 1 && isCacheValid(messageCache, currentFilters)) {
        setMessages(messageCache!.data);
        setPagination(messageCache!.pagination);
        return;
      }

      if (showLoader) setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      // Add filters
      if (currentFilters.type && currentFilters.type !== "all") {
        params.append('type', currentFilters.type);
      }
      
      if (currentFilters.status && currentFilters.status !== "all") {
        params.append('status', currentFilters.status);
      }
      
      if (currentFilters.startDate) {
        params.append('startDate', new Date(currentFilters.startDate).toISOString());
      }
      
      if (currentFilters.endDate) {
        params.append('endDate', new Date(currentFilters.endDate).toISOString());
      }

      if (currentFilters.search.trim()) {
        params.append('search', currentFilters.search.trim());
      }

      const response = await api.get(`/sms/history?${params.toString()}`);
      
      if (response.data.success) {
        const { messages: fetchedMessages, pagination: paginationData } = response.data.data;
        
        // Process messages to ensure proper data types
        const processedMessages = fetchedMessages.map((message: any) => ({
          ...message,
          cost: typeof message.cost === 'number' ? message.cost : parseFloat(message.cost) || 0,
          recipients: Array.isArray(message.recipients) 
            ? message.recipients 
            : (typeof message.recipients === 'string' 
                ? JSON.parse(message.recipients || '[]') 
                : []),
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
        }));

        setMessages(processedMessages);
        setPagination(paginationData);

        // Update cache for page 1
        if (page === 1) {
          setMessageCache({
            data: processedMessages,
            pagination: paginationData,
            filters: currentFilters,
            lastFetch: Date.now(),
          });
        }
      } else {
        throw new Error(response.data.message || 'Failed to fetch messages');
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch messages';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [filters, messageCache, isCacheValid, pagination.limit]);

  // Debounced search handler
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      if (searchQuery !== filters.search) {
        setFilters(prev => ({ ...prev, search: searchQuery }));
      }
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [searchQuery, filters.search]);

  // Fetch messages when filters change
  useEffect(() => {
    fetchMessages(1, filters);
  }, [filters]);

  // Initial load
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchMessages(1, filters);
    
    // Fetch currency config
    const fetchCurrencyConfig = async () => {
      try {
        const response = await api.get('/');
        if (response.data.currency) {
          setCurrencyConfig({
            symbol: response.data.currency === 'NGN' ? '₦' : '$',
            code: response.data.currency
          });
        }
      } catch (error) {
        console.error('Failed to fetch currency config:', error);
      }
    };
    
    fetchCurrencyConfig();
  }, []);

  // Filter handlers
  const handleFilterChange = (name: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyFilters = () => {
    setMessageCache(null); // Invalidate cache
    fetchMessages(1, filters);
    setIsFilterOpen(false);
  };

  const resetFilters = () => {
    const resetFilters = {
      type: "all",
      status: "all",
      startDate: "",
      endDate: "",
      search: "",
    };
    
    setFilters(resetFilters);
    setSearchQuery("");
    setMessageCache(null); // Invalidate cache
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchQuery }));
  };
  
  // Get icon for message type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'voice':
        return <Phone className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };
  
  // Get icon and color for message status
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'delivered':
        return {
          icon: <Check className="h-4 w-4" />,
          color: 'text-green-600',
          bgColor: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
        };
      case 'sent':
        return {
          icon: <SendIcon className="h-4 w-4" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
        };
      case 'queued':
        return {
          icon: <Clock className="h-4 w-4" />,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
        };
      case 'failed':
        return {
          icon: <X className="h-4 w-4" />,
          color: 'text-red-600',
          bgColor: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
        };
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
        };
    }
  };
  
  // Get recipients text
  const getRecipientsText = (recipients: string[] | string, count: number) => {
    try {
      let recipientArray: string[] = [];
      
      if (Array.isArray(recipients)) {
        recipientArray = recipients;
      } else if (typeof recipients === 'string' && recipients.trim()) {
        recipientArray = JSON.parse(recipients);
      }
      
      if (recipientArray.length === 0) return `${count} recipient(s)`;
      
      if (recipientArray.length === 1) return recipientArray[0];
      
      return `${recipientArray[0]} +${recipientArray.length - 1} more`;
    } catch (error) {
      return `${count} recipient(s)`;
    }
  };

  // Message operations
  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    setIsDetailOpen(true);
  };

  const handleDeleteMessage = (message: Message) => {
    setMessageToDelete(message);
    setIsBatchDelete(false);
    setDeleteDialogOpen(true);
  };

  const handleBatchDelete = () => {
    if (selectedItems.length === 0) {
      toast.error("No messages selected");
      return;
    }
    
    setIsBatchDelete(true);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setActionLoading('delete');
      
      if (isBatchDelete) {
        // Batch delete API call
        const response = await api.post('/sms/batch-delete', { 
          messageIds: selectedItems 
        });
        
        if (response.data.success) {
          toast.success(`${selectedItems.length} messages deleted successfully`);
          setSelectedItems([]);
          setSelectAll(false);
          
          // Invalidate cache and refresh
          setMessageCache(null);
          await fetchMessages(pagination.currentPage, filters, false, true);
        } else {
          throw new Error(response.data.message || 'Failed to delete messages');
        }
      } else if (messageToDelete) {
        // Single delete API call
        const response = await api.delete(`/sms/delete/${messageToDelete.id}`);
        
        if (response.data.success) {
          toast.success("Message deleted successfully");
          
          // Remove message from list locally
          setMessages(prev => prev.filter(m => m.id !== messageToDelete.id));
          setPagination(prev => ({ ...prev, total: prev.total - 1 }));
        } else {
          throw new Error(response.data.message || 'Failed to delete message');
        }
      }
    } catch (error: any) {
      console.error("Error deleting message(s):", error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete message(s)';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    }
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(messages.map(message => message.id));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelectItem = (messageId: string) => {
    setSelectedItems(prev => {
      const newSelection = prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId];
      
      setSelectAll(newSelection.length === messages.length);
      return newSelection;
    });
  };

  // Export functionality
  const exportData = async () => {
    try {
      setActionLoading('export');
      
      // Prepare export parameters, converting "all" to empty strings
      const exportParams = {
        ...filters,
        type: filters.type === 'all' ? '' : filters.type,
        status: filters.status === 'all' ? '' : filters.status,
      };
      
      const response = await api.get('/sms/export', {
        params: exportParams,
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `message-history-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Message data exported successfully");
    } catch (error: any) {
      console.error("Export error:", error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to export data';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // Pagination handler
  const handlePageChange = (page: number) => {
    fetchMessages(page, filters);
  };

  // Refresh handler
  const handleRefresh = () => {
    setMessageCache(null);
    fetchMessages(pagination.currentPage, filters, true, true);
  };

  return (
    <DashboardLayout
      title="Message History"
      backLink="/dashboard"
      currentPath={location.pathname}
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Messages</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Delivered</p>
                  <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
                </div>
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
                <X className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Cost</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats.totalCost, currencyConfig.symbol)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error display */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Message History</CardTitle>
                <CardDescription>
                  View your sent messages and their delivery status
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportData}
                  disabled={!!actionLoading}
                >
                  {actionLoading === 'export' ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-1" />
                  )}
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                {selectedItems.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBatchDelete}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === 'delete' ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-1" />
                    )}
                    Delete ({selectedItems.length})
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search messages or phone numbers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                </div>
                <Button 
                  onClick={handleSearch}
                  className="bg-jaylink-600 hover:bg-jaylink-700"
                  disabled={loading}
                >
                  Search
                </Button>
              </div>
              
              {isFilterOpen && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="type">Message Type</Label>
                      <Select
                        value={filters.type}
                        onValueChange={(value) => handleFilterChange("type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="voice">Voice</SelectItem>
                          <SelectItem value="audio">Audio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={filters.status}
                        onValueChange={(value) => handleFilterChange("status", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="queued">Queued</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange("startDate", e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange("endDate", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={resetFilters}
                    >
                      Reset Filters
                    </Button>
                    <Button 
                      onClick={applyFilters}
                      className="bg-jaylink-600 hover:bg-jaylink-700"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Messages Table */}
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-jaylink-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading messages...</span>
              </div>
            ) : messages.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox 
                          checked={selectAll} 
                          onCheckedChange={toggleSelectAll} 
                          aria-label="Select all" 
                        />
                      </TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.map((message) => {
                      const statusDisplay = getStatusDisplay(message.status);
                      
                      return (
                        <TableRow 
                          key={message.id}
                          className={selectedItems.includes(message.id) ? "bg-muted/50" : ""}
                        >
                          <TableCell>
                            <Checkbox 
                              checked={selectedItems.includes(message.id)} 
                              onCheckedChange={() => toggleSelectItem(message.id)} 
                              aria-label={`Select message ${message.id}`} 
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div>
                              <div>{formatDate(message.createdAt)}</div>
                              {message.scheduled && message.scheduledAt && (
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Scheduled: {formatDate(message.scheduledAt)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(message.type)}
                              <span className="capitalize">{message.type}</span>
                              {message.senderId && (
                                <Badge variant="outline" className="text-xs">
                                  {message.senderId}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {getRecipientsText(message.recipients, message.recipientCount)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {message.recipientCount} recipient(s)
                              </div>
                            </div>
                            </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={statusDisplay.color}>
                                {statusDisplay.icon}
                              </span>
                              <Badge className={statusDisplay.bgColor}>
                                {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(message.cost, currencyConfig.symbol)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleViewMessage(message)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteMessage(message)}
                                  disabled={!!actionLoading}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No messages found</p>
                <p className="mb-4">
                  {Object.values(filters).some(f => f && f !== 'all') 
                    ? 'No messages match your current filters' 
                    : 'You haven\'t sent any messages yet'}
                </p>
                <Button
                  variant="outline"
                  onClick={resetFilters}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {Object.values(filters).some(f => f && f !== 'all') ? 'Clear Filters' : 'Refresh'}
                </Button>
              </div>
            )}
            
            {/* Pagination */}
            {!loading && messages.length > 0 && (
              <div className="mt-6">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                  totalItems={pagination.total}
                  itemsPerPage={pagination.limit}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Message details dialog */}
      <MessageDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        message={selectedMessage}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isBatchDelete 
                ? `Delete ${selectedItems.length} messages?` 
                : "Delete this message?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete 
              {isBatchDelete 
                ? ` the selected ${selectedItems.length} messages` 
                : " this message"} 
              from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={!!actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading === 'delete' ? (
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
    </DashboardLayout>
  );
};

export default MessageHistory;