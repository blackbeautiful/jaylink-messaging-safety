import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Check, Clock, MessageSquare, Music, Phone, SendHorizontal, X } from "lucide-react";

interface MessageDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: any; // We'll use any here, but in a real app you should define a proper type
}

const MessageDetailDialog = ({ open, onOpenChange, message }: MessageDetailProps) => {
  // Format the recipients for display
  const formatRecipients = (recipients: string | string[]) => {
    try {
      const parsedRecipients = Array.isArray(recipients) 
        ? recipients 
        : JSON.parse(recipients);
      
      return parsedRecipients;
    } catch (error) {
      return [];
    }
  };

  // Get icon for message type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sms':
        return <MessageSquare className="h-5 w-5" />;
      case 'voice':
        return <Phone className="h-5 w-5" />;
      case 'audio':
        return <Music className="h-5 w-5" />;
      default:
        return <MessageSquare className="h-5 w-5" />;
    }
  };
  
  // Get icon and color for message status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <Check className="h-3 w-3 mr-1" /> Delivered
          </Badge>
        );
      case 'sent':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            <SendHorizontal className="h-3 w-3 mr-1" /> Sent
          </Badge>
        );
      case 'queued':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            <Clock className="h-3 w-3 mr-1" /> Queued
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
            <X className="h-3 w-3 mr-1" /> Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            <Clock className="h-3 w-3 mr-1" /> {status}
          </Badge>
        );
    }
  };

  if (!message) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {getTypeIcon(message.type)}
            <span className="ml-2">Message Details</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Message status and type */}
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">Status:</span>
              {getStatusBadge(message.status)}
            </div>
            <div>
              <Badge variant="outline" className="capitalize">
                {message.type}
              </Badge>
            </div>
          </div>
          
          {/* Message content */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Content</h3>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
              {message.type === 'sms' ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : message.type === 'audio' ? (
                message.audioUrl ? (
                  <div>
                    <audio controls className="w-full">
                      <source src={message.audioUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                    <p className="text-xs text-gray-500 mt-2">Audio Message</p>
                  </div>
                ) : (
                  <p className="text-gray-500">Audio file not available</p>
                )
              ) : (
                <p className="text-gray-500">Content not available for this message type</p>
              )}
            </div>
          </div>
          
          <Separator />
          
          {/* Message details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Sent Date</h3>
              <p>{formatDateTime(message.createdAt)}</p>
            </div>
            {message.senderId && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Sender ID</h3>
                <p>{message.senderId}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Cost</h3>
              <p>${typeof message.cost === 'number' ? message.cost.toFixed(2) : '0.00'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Message ID</h3>
              <p className="text-xs font-mono">{message.messageId}</p>
            </div>
          </div>
          
          <Separator />
          
          {/* Recipients */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Recipients ({message.recipientCount || formatRecipients(message.recipients).length})
            </h3>
            <div className="mt-2 max-h-48 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
              <ul className="space-y-1">
                {formatRecipients(message.recipients).map((recipient: string, index: number) => (
                  <li key={index} className="text-sm">
                    {recipient}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MessageDetailDialog;
