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
import { toast } from 'sonner';
import { Calendar, Clock, Trash2, Search, Loader2 } from 'lucide-react';

// Mock data for scheduled messages
const mockScheduledMessages = [
  {
    id: 1,
    type: 'sms',
    recipients: '+234800123456, +234800123457, +234800123458',
    recipientCount: 3,
    message:
      "Good morning! Don't forget about our special promotion running today. Use code SPECIAL20 for 20% off.",
    sender: 'JayLink',
    scheduledDate: '2023-11-30 08:00:00',
    status: 'pending',
  },
  {
    id: 2,
    type: 'voice',
    recipients: '+234800123456',
    recipientCount: 1,
    message:
      'This is a reminder about your appointment tomorrow at 2 PM. Please confirm your attendance.',
    sender: '+2348012345678',
    scheduledDate: '2023-12-01 09:30:00',
    status: 'pending',
  },
  {
    id: 3,
    type: 'audio',
    recipients: '+234800123456, +234800123459',
    recipientCount: 2,
    message: 'Holiday announcement.mp3',
    sender: '+2348023456789',
    scheduledDate: '2023-12-24 10:00:00',
    status: 'pending',
  },
  {
    id: 4,
    type: 'sms',
    recipients: 'Customers Group (248 contacts)',
    recipientCount: 248,
    message:
      'Thank you for being our valued customer. We wish you happy holidays and a prosperous new year!',
    sender: 'INFO',
    scheduledDate: '2023-12-25 12:00:00',
    status: 'pending',
  },
];

const Scheduled = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageType, setMessageType] = useState('all');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filteredMessages = mockScheduledMessages.filter(
    (msg) =>
      (messageType === 'all' || msg.type === messageType) &&
      (msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.recipients.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCancel = (id: number) => {
    setLoading(true);

    // Simulate API call to cancel scheduled message
    setTimeout(() => {
      toast.success('Scheduled message has been cancelled');
      setLoading(false);
    }, 1000);
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-auto">
              <Select value={messageType} onValueChange={setMessageType}>
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
                          <span>{new Date(message.scheduledDate).toLocaleDateString()}</span>
                          <Clock className="ml-2 mr-1" size={14} />
                          <span>{new Date(message.scheduledDate).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Message:
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {message.type === 'audio' ? (
                            <span className="italic">Audio file: {message.message}</span>
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
                            {message.sender}
                          </p>
                        </div>
                        <div className="text-right sm:text-left">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 border-red-200 hover:bg-red-50"
                            onClick={() => handleCancel(message.id)}
                          >
                            <Trash2 size={14} className="mr-1" />
                            Cancel
                          </Button>
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
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Scheduled;
