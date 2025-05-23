/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/Dashboard.tsx - Enhanced with proper time formatting and caching
import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardStats from '@/components/DashboardStats';
import MessageForm from '@/components/MessageForm';
import { api } from '@/contexts/AuthContext';
import { Loader2, RefreshCw, TrendingUp, Eye } from 'lucide-react';
import MessageDetailDialog from '@/components/messages/MessageDetailDialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatCurrency } from '@/lib/utils';

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

interface Analytics {
  totalCount: number;
  deliveredCount: number;
  failedCount: number;
  deliveryRate: number;
  types: {
    sms: number;
    voice: number;
    audio: number;
  };
  scheduledCount: number;
  recentMessages: Message[];
}

interface Balance {
  balance: number;
  currency: string;
  currencySymbol: string;
}

// Cache interfaces
interface DashboardCache {
  analytics: Analytics | null;
  balance: Balance | null;
  recentMessages: Message[];
  lastFetch: number;
}

const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes cache for dashboard data
const CURRENCY_SYMBOL = '₦'; // Nigerian Naira

const Dashboard = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Cache management
  const [dashboardCache, setDashboardCache] = useState<DashboardCache>({
    analytics: null,
    balance: null,
    recentMessages: [],
    lastFetch: 0,
  });
  
  // UI State
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Currency configuration
  const [currencyConfig, setCurrencyConfig] = useState({
    symbol: CURRENCY_SYMBOL,
    code: 'NGN'
  });

  // Check if cache is valid
  const isCacheValid = useCallback((cache: DashboardCache): boolean => {
    const isExpired = Date.now() - cache.lastFetch > CACHE_DURATION;
    return !isExpired && cache.analytics !== null && cache.balance !== null;
  }, []);

  // Memoized dashboard stats
  const dashboardStats = useMemo(() => {
    if (!analytics || !balance) return null;
    
    return {
      totalMessages: analytics.totalCount,
      deliveryRate: analytics.deliveryRate,
      balance: balance.balance,
      currencySymbol: balance.currencySymbol || currencyConfig.symbol,
      recentActivity: recentMessages.length,
      pendingScheduled: analytics.scheduledCount,
    };
  }, [analytics, balance, recentMessages.length, currencyConfig.symbol]);

  // Enhanced date formatting function
  const formatMessageDate = useCallback((dateString: string): string => {
    try {
      // Create date object from the string
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      // Format with proper timezone handling
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        // Use local timezone instead of UTC to avoid offset issues
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }).format(date);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  }, []);

  // Fetch dashboard data with caching
  const fetchDashboardData = useCallback(async (forceRefresh = false, showLoader = true) => {
    try {
      // Check cache first unless force refresh
      if (!forceRefresh && isCacheValid(dashboardCache)) {
        setAnalytics(dashboardCache.analytics);
        setBalance(dashboardCache.balance);
        setRecentMessages(dashboardCache.recentMessages);
        return;
      }

      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      // Fetch all data concurrently
      const [analyticsResponse, balanceResponse, messagesResponse, currencyResponse] = await Promise.allSettled([
        api.get('/sms/analytics'),
        api.get('/balance'),
        api.get('/sms/history?limit=5'),
        api.get('/')
      ]);

      // Process analytics response
      if (analyticsResponse.status === 'fulfilled' && analyticsResponse.value.data.success) {
        const analyticsData = analyticsResponse.value.data.data;
        setAnalytics(analyticsData);
      } else {
        console.error('Analytics fetch failed:', analyticsResponse.status === 'rejected' ? analyticsResponse.reason : 'Unknown error');
      }

      // Process balance response
      if (balanceResponse.status === 'fulfilled' && balanceResponse.value.data.success) {
        const balanceData = balanceResponse.value.data.data;
        setBalance({
          ...balanceData,
          currencySymbol: balanceData.currencySymbol || currencyConfig.symbol
        });
      } else {
        console.error('Balance fetch failed:', balanceResponse.status === 'rejected' ? balanceResponse.reason : 'Unknown error');
      }

      // Process messages response
      if (messagesResponse.status === 'fulfilled' && messagesResponse.value.data.success) {
        const messagesData = messagesResponse.value.data.data.messages || [];
        
        // Process messages to ensure proper data types and format
        const processedMessages = messagesData.map((message: any) => ({
          ...message,
          cost: typeof message.cost === 'number' ? message.cost : parseFloat(message.cost) || 0,
          recipients: Array.isArray(message.recipients) 
            ? message.recipients 
            : (typeof message.recipients === 'string' 
                ? JSON.parse(message.recipients || '[]') 
                : []),
          // Ensure dates are properly formatted
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
        }));
        
        setRecentMessages(processedMessages);
      } else {
        console.error('Messages fetch failed:', messagesResponse.status === 'rejected' ? messagesResponse.reason : 'Unknown error');
      }

      // Process currency config
      if (currencyResponse.status === 'fulfilled' && currencyResponse.value.data.currency) {
        setCurrencyConfig({
          symbol: currencyResponse.value.data.currency === 'NGN' ? '₦' : '$',
          code: currencyResponse.value.data.currency
        });
      }

      // Update cache with successful data
      const currentAnalytics = analyticsResponse.status === 'fulfilled' && analyticsResponse.value.data.success 
        ? analyticsResponse.value.data.data 
        : analytics;
      const currentBalance = balanceResponse.status === 'fulfilled' && balanceResponse.value.data.success 
        ? balanceResponse.value.data.data 
        : balance;
      const currentMessages = messagesResponse.status === 'fulfilled' && messagesResponse.value.data.success 
        ? messagesResponse.value.data.data.messages || []
        : recentMessages;

      if (currentAnalytics && currentBalance) {
        setDashboardCache({
          analytics: currentAnalytics,
          balance: currentBalance,
          recentMessages: currentMessages,
          lastFetch: Date.now(),
        });
      }

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load dashboard data';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dashboardCache, isCacheValid, analytics, balance, recentMessages, currencyConfig.symbol]);

  // Initial data fetch
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(false, false);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'queued':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  // Get type badge styling
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'sms':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'voice':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'audio':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  // Get recipients display text
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
      
      return `${recipientArray[0]} ${recipientArray.length > 1 ? `+${recipientArray.length - 1} more` : ''}`;
    } catch (error) {
      return `${count} recipient(s)`;
    }
  };

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    setIsDetailOpen(true);
  };

  const handleRefresh = () => {
    fetchDashboardData(true, false);
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard" currentPath={location.pathname}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-jaylink-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard" currentPath={location.pathname}>
      <div className="flex flex-col space-y-6">
        {/* Error Display */}
        {error && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-amber-800 dark:text-amber-200">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchDashboardData(true)}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Stats */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Overview</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <DashboardStats 
            analytics={analytics} 
            balance={balance} 
            loading={false}
          />
        </section>
        
        {/* Quick Actions */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <MessageForm />
        </section>
        
        {/* Recent Messages */}
        <section className="mb-0 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Messages</h2>
            {recentMessages.length > 0 && (
              <Link to="/sms/history">
                <Button variant="outline" size="sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </Link>
            )}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-subtle"
          >
            {recentMessages.length > 0 ? (
              <div className="space-y-4">
                {/* Mobile view */}
                <div className="md:hidden space-y-4">
                  {recentMessages.map((message) => (
                    <div
                      key={message.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getTypeBadge(message.type)}>
                            {message.type.toUpperCase()}
                          </Badge>
                          <Badge className={getStatusBadge(message.status)}>
                            {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewMessage(message)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {getRecipientsText(message.recipients, message.recipientCount)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatMessageDate(message.createdAt)}
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(message.cost, currencyConfig.symbol)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop view */}
                <div className="hidden md:block w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Recipient
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Cost
                        </th>
                        <th className="px-3 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {recentMessages.map((message) => (
                        <tr 
                          key={message.id} 
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                          onClick={() => handleViewMessage(message)}
                        >
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatMessageDate(message.createdAt)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {getRecipientsText(message.recipients, message.recipientCount)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">
                            <Badge className={getTypeBadge(message.type)}>
                              {message.type.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">
                            <Badge className={getStatusBadge(message.status)}>
                              {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(message.cost, currencyConfig.symbol)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewMessage(message);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                <p className="mb-4">No messages sent yet. Use the form above to send your first message.</p>
              </div>
            )}
            
            {recentMessages.length > 0 && (
              <div className="mt-6 flex justify-center">
                <Link to="/sms/history">
                  <Button
                    variant="outline"
                    className="border-jaylink-200 text-jaylink-700 hover:bg-jaylink-50"
                  >
                    View All Messages
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        </section>
      </div>
      
      {/* Message details dialog */}
      <MessageDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        message={selectedMessage}
      />
    </DashboardLayout>
  );
};

export default Dashboard;