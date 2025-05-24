/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Check, 
  Clock, 
  MessageSquare, 
  Music, 
  Phone, 
  SendHorizontal, 
  X, 
  Copy,
  Download,
  RefreshCw,
  Calendar,
  User,
  Hash,
  DollarSign,
  Users,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Volume2,
  Eye,
  Smartphone
} from "lucide-react";
import { formatDate, formatCurrency, formatPhoneNumber } from "@/lib/utils";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface MessageDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: any;
}

interface StatusConfig {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  label: string;
}

const MessageDetailDialog = ({ open, onOpenChange, message }: MessageDetailProps) => {
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [showAllRecipients, setShowAllRecipients] = useState(false);
  const isMobile = useIsMobile();

  // Format recipients with error handling
  const formatRecipients = useCallback((recipients: string | string[]) => {
    try {
      if (Array.isArray(recipients)) {
        return recipients;
      }
      if (typeof recipients === 'string') {
        return JSON.parse(recipients || '[]');
      }
      return [];
    } catch (error) {
      console.error('Error parsing recipients:', error);
      return [];
    }
  }, []);

  // Get type configuration
  const getTypeConfig = (type: string) => {
    const configs = {
      sms: {
        icon: <MessageSquare className="h-5 w-5" />,
        color: "text-blue-600",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
        label: "SMS Message"
      },
      voice: {
        icon: <Phone className="h-5 w-5" />,
        color: "text-purple-600",
        bgColor: "bg-purple-100 dark:bg-purple-900/30",
        label: "Voice Call"
      },
      audio: {
        icon: <Music className="h-5 w-5" />,
        color: "text-green-600",
        bgColor: "bg-green-100 dark:bg-green-900/30",
        label: "Audio Message"
      },
    };
    return configs[type as keyof typeof configs] || configs.sms;
  };

  // Get status configuration
  const getStatusConfig = (status: string): StatusConfig => {
    const configs = {
      delivered: {
        icon: <Check className="h-4 w-4" />,
        color: "text-green-700",
        bgColor: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        label: "Delivered"
      },
      sent: {
        icon: <SendHorizontal className="h-4 w-4" />,
        color: "text-blue-700",
        bgColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        label: "Sent"
      },
      queued: {
        icon: <Clock className="h-4 w-4" />,
        color: "text-yellow-700",
        bgColor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
        label: "Queued"
      },
      failed: {
        icon: <X className="h-4 w-4" />,
        color: "text-red-700",
        bgColor: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        label: "Failed"
      },
      processing: {
        icon: <RefreshCw className="h-4 w-4 animate-spin" />,
        color: "text-blue-700",
        bgColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        label: "Processing"
      }
    };
    return configs[status as keyof typeof configs] || {
      icon: <AlertCircle className="h-4 w-4" />,
      color: "text-gray-700",
      bgColor: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      label: status || "Unknown"
    };
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  // Handle audio playback
  const toggleAudioPlayback = () => {
    setAudioPlaying(!audioPlaying);
    // In a real implementation, you'd control the actual audio element
  };

  if (!message) return null;

  const typeConfig = getTypeConfig(message.type);
  const statusConfig = getStatusConfig(message.status);
  const recipients = formatRecipients(message.recipients);
  const displayedRecipients = showAllRecipients ? recipients : recipients.slice(0, 5);

  // Dynamic classes for responsive design
  const getDialogClasses = () => {
    if (isMobile) {
      return "w-full h-full max-w-none max-h-none m-0 rounded-none";
    }
    return "max-w-4xl w-full h-[85vh] max-h-[85vh]";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${getDialogClasses()} p-0 overflow-hidden flex flex-col`}>
        {/* Add DialogDescription for accessibility */}
        <DialogDescription className="sr-only">
          Detailed view of {typeConfig.label.toLowerCase()} sent on {formatDate(message.createdAt)} with status {statusConfig.label.toLowerCase()}
        </DialogDescription>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="h-full flex flex-col min-h-0"
        >
          {/* Header - Fixed */}
          <DialogHeader className={`flex-shrink-0 px-4 ${isMobile ? 'py-3' : 'py-4'} border-b bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900`}>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${typeConfig.bgColor}`}>
                  <span className={typeConfig.color}>
                    {typeConfig.icon}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 dark:text-white`}>
                    {typeConfig.label}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(message.createdAt)}
                  </p>
                </div>
              </DialogTitle>
              
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Badge className={`${statusConfig.bgColor} ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {statusConfig.icon}
                  <span className="ml-1">{statusConfig.label}</span>
                </Badge>
              </div>
            </div>
          </DialogHeader>

          {/* Content - Scrollable with proper height */}
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full w-full">
              <div className={`${isMobile ? 'px-4 py-3 pb-6' : 'px-6 py-4 pb-8'} space-y-6`}>
                
                {/* Message Content */}
                <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                  <CardContent className={isMobile ? 'p-3' : 'p-4'}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        Message Content
                      </h3>
                      {message.content && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(message.content, 'Message content')}
                          className="h-8 px-2"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    
                    <AnimatePresence mode="wait">
                      {message.type === 'sms' && message.content ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <p className="whitespace-pre-wrap text-gray-900 dark:text-gray-100 leading-relaxed text-sm">
                            {message.content}
                          </p>
                          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{message.content.length} characters</span>
                              <span>{Math.ceil(message.content.length / 160)} SMS units</span>
                            </div>
                          </div>
                        </motion.div>
                      ) : message.type === 'audio' && message.audioUrl ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center space-x-4'}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={toggleAudioPlayback}
                              className="flex items-center space-x-2"
                            >
                              {audioPlaying ? (
                                <PauseCircle className="h-4 w-4" />
                              ) : (
                                <PlayCircle className="h-4 w-4" />
                              )}
                              <span>{audioPlaying ? 'Pause' : 'Play'}</span>
                            </Button>
                            
                            <div className="flex-1">
                              <audio controls className="w-full h-8">
                                <source src={message.audioUrl} type="audio/mpeg" />
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a href={message.audioUrl} download>
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </motion.div>
                      ) : message.type === 'voice' ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-center"
                        >
                          <Volume2 className="h-12 w-12 mx-auto text-purple-500 mb-3" />
                          <p className="text-gray-600 dark:text-gray-400">Voice call message</p>
                          {message.duration && (
                            <p className="text-sm text-gray-500 mt-1">Duration: {message.duration}s</p>
                          )}
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center"
                        >
                          <AlertCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-500">No content available</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>

                {/* Message Details Grid - Responsive */}
                <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                  {/* Cost */}
                  <Card className="border-0 shadow-sm">
                    <CardContent className={isMobile ? 'p-3' : 'p-4'}>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Cost
                          </p>
                          <p className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 dark:text-white`}>
                            {formatCurrency(message.cost || 0, '₦')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recipients Count */}
                  <Card className="border-0 shadow-sm">
                    <CardContent className={isMobile ? 'p-3' : 'p-4'}>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Recipients
                          </p>
                          <p className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 dark:text-white`}>
                            {message.recipientCount || recipients.length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Message ID */}
                  <Card className={`border-0 shadow-sm ${isMobile ? '' : 'sm:col-span-2 lg:col-span-1'}`}>
                    <CardContent className={isMobile ? 'p-3' : 'p-4'}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                            <Hash className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              Message ID
                            </p>
                            <p className="text-sm font-mono text-gray-900 dark:text-white truncate">
                              {message.messageId}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(message.messageId, 'Message ID')}
                          className="h-8 px-2 flex-shrink-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sender ID */}
                  {message.senderId && (
                    <Card className="border-0 shadow-sm">
                      <CardContent className={isMobile ? 'p-3' : 'p-4'}>
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                            <User className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              Sender ID
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {message.senderId}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Scheduled Info */}
                  {message.scheduled && message.scheduledAt && (
                    <Card className="border-0 shadow-sm">
                      <CardContent className={isMobile ? 'p-3' : 'p-4'}>
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                            <Calendar className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              Scheduled
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatDate(message.scheduledAt)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Recipients List */}
                {recipients.length > 0 && (
                  <Card className="border-0 shadow-sm">
                    <CardContent className={isMobile ? 'p-3' : 'p-4'}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                          Recipients ({recipients.length})
                        </h3>
                        {recipients.length > 5 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAllRecipients(!showAllRecipients)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            {showAllRecipients ? 'Show Less' : `Show All (${recipients.length})`}
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                        <AnimatePresence>
                          {displayedRecipients.map((recipient: string, index: number) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={{ delay: index * 0.02 }}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                            >
                              <div className="flex items-center space-x-3 min-w-0 flex-1">
                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors">
                                  <Smartphone className="h-3 w-3 text-blue-600" />
                                </div>
                                <span className="font-mono text-sm text-gray-900 dark:text-white truncate">
                                  {formatPhoneNumber(recipient)}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(recipient, 'Phone number')}
                                className="h-7 px-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                      
                      {!showAllRecipients && recipients.length > 5 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                          <p className="text-sm text-gray-500 mb-2">
                            And {recipients.length - 5} more recipients...
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAllRecipients(true)}
                            className="text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View All Recipients
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Footer - Fixed with gradient shadow */}
          <div className={`flex-shrink-0 border-t bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm ${isMobile ? 'flex-col space-y-3 p-4' : 'flex items-center justify-between px-6 py-4'}`}>
            <div className={`flex items-center space-x-2 text-xs text-gray-500 ${isMobile ? 'justify-center' : ''}`}>
              <Calendar className="h-3 w-3" />
              <span>Created: {formatDate(message.createdAt, { format: isMobile ? 'short' : 'long' })}</span>
            </div>
            
            <div className={`flex space-x-3 ${isMobile ? 'w-full' : ''}`}>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className={`${isMobile ? 'flex-1' : 'min-w-[100px]'} hover:bg-gray-100 dark:hover:bg-gray-700`}
              >
                Close
              </Button>
              
              {/* Additional actions */}
              {message.status === 'failed' && (
                <Button
                  variant="default"
                  className={`bg-jaylink-600 hover:bg-jaylink-700 shadow-md ${isMobile ? 'flex-1' : ''}`}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resend
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageDetailDialog;