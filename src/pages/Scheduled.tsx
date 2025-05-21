/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Calendar, Clock, Trash2, Search, Loader2 } from 'lucide-react';
import { api } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/use-debounce';

type MessageType = 'sms' | 'voice' | 'audio' | 'all';
type MessageStatus = 'pending' | 'processing' | 'sent' | 'cancelled' | 'failed';

interface ScheduledMessage {
  id: string;
  userId: string;
  type: 'sms' | 'voice' | 'audio';
  message: string;
  senderId: string;
  recipients: string | string[];
  recipientCount: number;
  scheduledAt: string;
  status: MessageStatus;
  audioUrl?: string;
  errorMessage?: string;
}

interface Pagination {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface ScheduledMessagesResponse {
  messages: ScheduledMessage[];
  pagination: Pagination;
}

const Scheduled = () => {
  const location = useLocation();
  const [loading, setLoading] = useState<boolean>(true);
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [messageType, setMessageType] = useState<MessageType>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
    hasNext: false,
    hasPrev: false,
  });
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchScheduledMessages = useCallback(async (page: number = 1, limit: number = pagination.limit) => {
    try {
      setLoading(page === 1);
      setIsRefreshing(page !== 1);
      
      let queryParams = `?page=${page}&limit=${limit}`;
      
      if (messageType && messageType !== 'all') {
        queryParams += `&type=${messageType}`;
      }
      
      if (debouncedSearchTerm) {
        queryParams += `&search=${encodeURIComponent(debouncedSearchTerm)}`;
      }
      
      const response = await api.get<ApiResponse<ScheduledMessagesResponse>>(`/scheduled${queryParams}`);
      
      if (response.data.success) {
        setScheduledMessages(response.data.data.messages || []);
        setPagination(response.data.data.pagination || {
          total: 0,
          totalPages: 0,
          currentPage: page,
          limit,
          hasNext: false,
          hasPrev: false,
        });
      } else {
        toast.error(response.data.message || 'Failed to load scheduled messages');
      }
    } catch (error: any) {
      console.error('Error fetching scheduled messages:', error);
      toast.error(error.response?.data?.message || 'Failed to load scheduled messages. Please try again later.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [messageType, debouncedSearchTerm, pagination.limit]);

  // Initial fetch and when filters change
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchScheduledMessages(1);
  }, [messageType, debouncedSearchTerm, fetchScheduledMessages]);

  const handleCancel = async (id: string) => {
    try {
      setCancelingId(id);
      
      const response = await api.delete<ApiResponse<{ success: boolean }>>(`/scheduled/${id}`);
      
      if (response.data.success) {
        toast.success('Scheduled message cancelled successfully');
        // Optimistically update UI
        setScheduledMessages(prev => prev.filter(msg => msg.id !== id));
        setPagination(prev => ({
          ...prev,
          total: prev.total - 1,
          totalPages: Math.ceil((prev.total - 1) / prev.limit)
        }));
      } else {
        toast.error(response.data.message || 'Failed to cancel the scheduled message');
      }
    } catch (error: any) {
      console.error('Error cancelling scheduled message:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel the scheduled message. Please try again later.');
    } finally {
      setCancelingId(null);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage !== pagination.currentPage) {
      fetchScheduledMessages(newPage);
    }
  };

  const handleRefresh = () => {
    fetchScheduledMessages(pagination.currentPage);
  };

  const formatDate = (dateString: string): string => {
    try {
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Date(dateString).toLocaleString('en-US', options);
    } catch (e) {
      return dateString;
    }
  };

  const isScheduledInPast = (scheduledAt: string): boolean => {
    return new Date(scheduledAt) < new Date();
  };

  const getRecipientsText = (recipients: string | string[]): string => {
    try {
      if (!recipients) return 'No recipients';
      
      let recipientArray: string[];
      
      if (typeof recipients === 'string') {
        try {
          recipientArray = JSON.parse(recipients) as string[];
        } catch (e) {
          return recipients;
        }
      } else {
        recipientArray = recipients;
      }
      
      if (!Array.isArray(recipientArray)) return 'Unknown format';
      
      if (recipientArray.length === 0) return 'No recipients';
      if (recipientArray.length === 1) return recipientArray[0];
      return `${recipientArray[0]} +${recipientArray.length - 1} more`;
    } catch (e) {
      return 'Error parsing recipients';
    }
  };

  return (
    <DashboardLayout
      title="Scheduled Messages"
      backLink="/dashboard"
      currentPath={location.pathname}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="w-full md:w-1/2">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <Input
                  type="text"
                  placeholder="Search scheduled messages..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={messageType} onValueChange={(value: MessageType) => setMessageType(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sms">SMS Messages</SelectItem>
                  <SelectItem value="voice">Voice Calls</SelectItem>
                  <SelectItem value="audio">Audio Messages</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>Refresh</span>
                )}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Upcoming Scheduled Messages</CardTitle>
                {pagination.total > 0 && (
                  <span className="text-sm text-gray-500">
                    Showing {scheduledMessages.length} of {pagination.total}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="animate-spin h-8 w-8 text-jaylink-600" />
                </div>
              ) : scheduledMessages.length > 0 ? (
                <div className="space-y-4">
                  {scheduledMessages.map((message) => (
                    <div
                      key={message.id}
                      className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row justify-between mb-3">
                        <div className="flex items-center mb-2 md:mb-0">
                          {message.type === 'sms' ? (
                            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded text-xs font-medium mr-2">
                              SMS
                            </span>
                          ) : message.type === 'voice' ? (
                            <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-1 rounded text-xs font-medium mr-2">
                              Voice
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-1 rounded text-xs font-medium mr-2">
                              Audio
                            </span>
                          )}
                          <span className="text-sm text-gray-500">
                            • {message.recipientCount} recipient(s)
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="mr-1" size={14} />
                          <span>{formatDate(message.scheduledAt)}</span>
                          {message.status === 'pending' && isScheduledInPast(message.scheduledAt) && (
                            <span className="ml-2 text-amber-500 text-xs">
                              (processing soon)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Message:
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {message.type === 'audio' ? (
                            <span className="italic">Audio file: {message.audioUrl || 'Not available'}</span>
                          ) : (
                            message.message
                          )}
                        </p>
                      </div>
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Recipients:
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {getRecipientsText(message.recipients)}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {message.type === 'sms' ? 'Sender ID:' : 'Caller ID:'}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {message.senderId || 'Default'}
                          </p>
                        </div>
                        <div className="text-right sm:text-left">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 border-red-200 hover:bg-red-50"
                                disabled={message.status !== 'pending' || cancelingId === message.id}
                              >
                                {cancelingId === message.id ? (
                                  <Loader2 size={14} className="mr-1 animate-spin" />
                                ) : (
                                  <Trash2 size={14} className="mr-1" />
                                )}
                                Cancel
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Scheduled Message</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel this scheduled message? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>No, Keep It</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleCancel(message.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Yes, Cancel Message
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No scheduled messages found</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Schedule messages or calls by enabling the "Schedule for later" option.
                  </p>
                </div>
              )}
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={!pagination.hasPrev || loading}
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center text-sm text-gray-500">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={!pagination.hasNext || loading}
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Scheduled;