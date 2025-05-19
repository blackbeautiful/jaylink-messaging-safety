import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardStats from '@/components/DashboardStats';
import MessageForm from '@/components/MessageForm';
import { api } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [balance, setBalance] = useState(null);
  const [recentMessages, setRecentMessages] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch SMS analytics
      const analyticsResponse = await api.get('/sms/analytics');
      
      // Fetch recent messages
      const messagesResponse = await api.get('/sms/history?limit=5');
      
      if (analyticsResponse.data.success) {
        setAnalytics(analyticsResponse.data.data);
      }
      
      if (messagesResponse.data.success) {
        setRecentMessages(messagesResponse.data.data.messages);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout title="Dashboard" currentPath={location.pathname}>
      <div className="flex flex-col space-y-6">
        {/* Dashboard Stats */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Overview</h2>
          <DashboardStats analytics={analytics} loading={loading} />
        </section>
        
        {/* Quick Actions */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <MessageForm />
        </section>
        
        {/* Recent Messages */}
        <section className="mb-0 pb-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Recent Messages</h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-subtle"
          >
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-jaylink-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading messages...</span>
              </div>
            ) : recentMessages.length > 0 ? (
              <div className="w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
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
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {recentMessages.map((message) => (
                      <tr key={message.id}>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(message.createdAt)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {message.recipients && typeof message.recipients === 'object' && message.recipients.length > 0 
                            ? message.recipients[0] + (message.recipients.length > 1 ? ` +${message.recipients.length - 1} more` : '')
                            : 'Multiple recipients'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              message.type === 'sms'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                : message.type === 'voice'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                            }`}
                          >
                            {message.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              message.status === 'delivered'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : message.status === 'sent'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                : message.status === 'queued' 
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}
                          >
                            {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                <p>No messages sent yet. Use the form above to send your first message.</p>
              </div>
            )}
            
            <div className="mt-4 flex justify-center">
              <Link to="/sms/history">
                <Button
                  variant="outline"
                  className="border-jaylink-200 text-jaylink-700 hover:bg-jaylink-50"
                >
                  View All Messages
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;