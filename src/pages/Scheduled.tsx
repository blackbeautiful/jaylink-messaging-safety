import { useEffect, useState } from 'react';
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

const Scheduled = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [messageType, setMessageType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
    hasNext: false,
    hasPrev: false,
  });
  const [cancelingId, setCancelingId] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchScheduledMessages();
  }, [messageType]);

  const fetchScheduledMessages = async (page = 1) => {
    try {
      setLoading(true);
      
      let queryParams = `?page=${page}&limit=${pagination.limit}`;
      
      if (messageType) {
        queryParams += `&type=${messageType}`;
      }
      
      const response = await api.get(`/scheduled${queryParams}`);
      
      if (response.data.success) {
        setScheduledMessages(response.data.data.messages || []);
        setPagination(response.data.data.pagination || {
          total: 0,
          totalPages: 0,
          currentPage: 1,
          limit: 10,
          hasNext: false,
          hasPrev: false,
        });
      } else {
        toast.error('Failed to load scheduled messages');
      }
    } catch (error) {
      console.error('Error fetching scheduled messages:', error);
      toast.error('Failed to load scheduled messages. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      setCancelingId(id);
      
      const response = await api.delete(`/scheduled/${id}`);
      
      if (response.data.success) {
        toast.success('Scheduled message cancelled successfully');
        // Remove the cancelled message from the list
        setScheduledMessages(scheduledMessages.filter(message => message.id !== id));
      } else {
        toast.error('Failed to cancel the scheduled message');
      }
    } catch (error) {
      console.error('Error cancelling scheduled message:', error);
      toast.error('Failed to cancel the scheduled message. Please try again later.');
    } finally {
      setCancelingId(null);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Client-side filtering for search (the backend doesn't support search for scheduled messages)
  const filteredMessages = searchTerm 
    ? scheduledMessages.filter(msg => 
        (msg.message?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (msg.recipients?.some && msg.recipients.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()))))
    : scheduledMessages;

  // Format date nicely
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  // Check if scheduled time is in the past
  const isScheduledInPast = (scheduledAt) => {
    return new Date(scheduledAt) < new Date();
  };

  // Get recipients display text
  const getRecipientsText = (recipients) => {
    try {
      if (!recipients) return 'No recipients';
      
      if (typeof recipients === 'string') {
        try {
          recipients = JSON.parse(recipients);
        } catch (e) {
          return recipients; // Return as is if not JSON
        }
      }
      
      if (!Array.isArray(recipients)) return 'Unknown format';
      
      if (recipients.length === 0) return 'No recipients';
      if (recipients.length === 1) return recipients[0];
      return `${recipients[0]} +${recipients.length - 1} more`;
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
            <div className="w-full md:w-auto">
              <Select value={messageType} onValueChange={setMessageType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="sms">SMS Messages</SelectItem>
                  <SelectItem value="voice">Voice Calls</SelectItem>
                  <SelectItem value="audio">Audio Messages</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Upcoming Scheduled Messages</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="animate-spin h-8 w-8 text-jaylink-600" />
                </div>
              ) : filteredMessages.length > 0 ? (
                <div className="space-y-4">
                  {filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm"
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
              
              {/* Pagination if needed */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={!pagination.hasPrev}
                      onClick={() => fetchScheduledMessages(pagination.currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {[...Array(pagination.totalPages)].map((_, i) => (
                        <Button
                          key={i}
                          variant={pagination.currentPage === i + 1 ? "default" : "outline"}
                          size="sm"
                          onClick={() => fetchScheduledMessages(i + 1)}
                          className="w-8 h-8 p-0"
                        >
                          {i + 1}
                        </Button>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={!pagination.hasNext}
                      onClick={() => fetchScheduledMessages(pagination.currentPage + 1)}
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