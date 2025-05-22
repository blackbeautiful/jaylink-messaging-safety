/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Loader2, 
  Send, 
  Calendar, 
  FileText, 
  X, 
  AlertCircle,
  DollarSign,
  Users,
  MessageSquare
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import ContactSelector, { Contact } from "./contacts/ContactSelector";
import { GroupSelector, Group } from "./groups/GroupSelector";
import { api } from "@/contexts/AuthContext";

interface MessageFormData {
  recipientType: "direct" | "contacts" | "group";
  recipients: string;
  message: string;
  senderId: string;
  scheduled?: string;
  recipientCount: number;
}

interface BulkMessageData {
  message: string;
  senderId: string;
  scheduled?: string;
  file?: File;
}

interface CostEstimate {
  recipientCount: number;
  messageUnits: number;
  estimatedCost: number;
  currency: string;
  currencySymbol: string;
}

const MessageForm = () => {
  const [loading, setLoading] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [scheduledMessage, setScheduledMessage] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const csvInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  
  // Form state
  const [formData, setFormData] = useState<MessageFormData>({
    recipientType: "direct",
    recipients: "",
    message: "",
    senderId: "",
    recipientCount: 0,
  });

  const [bulkFormData, setBulkFormData] = useState<BulkMessageData>({
    message: "",
    senderId: "",
  });

  // Selected contacts/groups state
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Cost estimation state
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [estimatingCost, setEstimatingCost] = useState(false);

  // Balance state
  const [userBalance, setUserBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(true);

  // Confirmation state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any>(null);

  // Fetch user balance
  const fetchBalance = useCallback(async () => {
    try {
      setBalanceLoading(true);
      const response = await api.get('/balance');
      
      if (response.data.success) {
        setUserBalance(response.data.data.balance);
      }
    } catch (error: any) {
      console.error('Error fetching balance:', error);
      toast.error('Failed to fetch account balance');
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  // Initial balance fetch
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Update cost estimate when relevant data changes
  useEffect(() => {
    const message = bulkMode ? bulkFormData.message : formData.message;
    const count = bulkMode ? 
      (csvFile ? 0 : 0) : // We don't know CSV count until processed
      formData.recipientCount;
  }, [
    bulkMode, 
    formData.message, 
    formData.recipientCount, 
    bulkFormData.message, 
    csvFile
  ]);

  const handleInputChange = (field: keyof MessageFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBulkInputChange = (field: keyof BulkMessageData, value: string) => {
    setBulkFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const handleContactsSelected = (contacts: Contact[]) => {
    setSelectedContacts(contacts);
    const phoneNumbers = contacts.map(c => c.phone).join(", ");
    setFormData(prev => ({
      ...prev,
      recipientType: "contacts",
      recipients: phoneNumbers,
      recipientCount: contacts.length,
    }));
  };
  
  const handleGroupSelected = (group: Group) => {
    setSelectedGroup(group);
    setFormData(prev => ({
      ...prev,
      recipientType: "group",
      recipients: `group_${group.id}`,
      recipientCount: group.contactCount,
    }));
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.name.toLowerCase().endsWith('.csv') && file.type !== "text/csv") {
        toast.error("Please upload a valid CSV file");
        return;
      }
      
      setCsvFile(file);
      toast.success(`CSV file loaded: ${file.name}`);
    }
  };

  const handleDirectRecipientsChange = (value: string) => {
    handleInputChange("recipients", value);
    
    // Count recipients for cost estimation
    if (value.trim()) {
      const phoneNumbers = value.split(/[,;]/).map(r => r.trim()).filter(Boolean);
      setFormData(prev => ({
        ...prev,
        recipientCount: phoneNumbers.length,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        recipientCount: 0,
      }));
    }
  };

  const validateForm = () => {
    if (bulkMode) {
      if (!bulkFormData.message.trim()) {
        toast.error("Please enter a message");
        return false;
      }
      if (!csvFile) {
        toast.error("Please upload a CSV file for bulk messaging");
        return false;
      }
    } else {
      if (!formData.message.trim()) {
        toast.error("Please enter a message");
        return false;
      }
      
      if (formData.recipientType === "direct" && !formData.recipients.trim()) {
        toast.error("Please enter at least one recipient");
        return false;
      }
      
      if (formData.recipientType === "contacts" && selectedContacts.length === 0) {
        toast.error("Please select at least one contact");
        return false;
      }
      
      if (formData.recipientType === "group" && !selectedGroup) {
        toast.error("Please select a group");
        return false;
      }
    }

    if (scheduledMessage && !scheduledDate) {
      toast.error("Please select a scheduled date and time");
      return false;
    }

    // Validate scheduled date is in the future
    if (scheduledMessage && scheduledDate) {
      const scheduledAt = new Date(scheduledDate);
      if (scheduledAt <= new Date()) {
        toast.error("Scheduled time must be in the future");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Check balance before sending
    if (costEstimate && costEstimate.estimatedCost > userBalance) {
      toast.error("Insufficient balance to send this message");
      return;
    }

    // Show confirmation dialog for cost confirmation
    if (costEstimate && costEstimate.estimatedCost > 0) {
      setConfirmationData({
        cost: costEstimate.estimatedCost,
        recipients: costEstimate.recipientCount,
        messageUnits: costEstimate.messageUnits,
        currency: costEstimate.currencySymbol,
      });
      setShowConfirmation(true);
      return;
    }

    await sendMessage();
  };

  const sendMessage = async () => {
    try {
      setLoading(true);

      if (bulkMode) {
        // Handle bulk SMS with CSV file
        const formDataObj = new FormData();
        formDataObj.append('message', bulkFormData.message);
        
        if (bulkFormData.senderId) {
          formDataObj.append('senderId', bulkFormData.senderId);
        }
        
        if (scheduledMessage && scheduledDate) {
          formDataObj.append('scheduled', scheduledDate);
        }
        
        if (csvFile) {
          formDataObj.append('file', csvFile);
        }
        
        const response = await api.post('/sms/bulk-send', formDataObj, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.success) {
          const result = response.data.data;
          
          if (result.status === 'scheduled') {
            toast.success(`Bulk message scheduled for ${new Date(result.scheduledAt).toLocaleString()}`);
          } else {
            toast.success(`Bulk message sent to ${result.recipients} recipient(s)`);
          }
          
          resetForm();
          fetchBalance(); // Refresh balance
        } else {
          throw new Error(response.data.message || 'Failed to send bulk message');
        }
      } else {
        // Handle regular SMS
        const payload = {
          recipients: formData.recipients,
          message: formData.message,
          senderId: formData.senderId || undefined,
          scheduled: scheduledMessage ? scheduledDate : undefined
        };
        
        const response = await api.post('/sms/send', payload);
        
        if (response.data.success) {
          const result = response.data.data;
          
          if (result.status === 'scheduled') {
            toast.success(`Message scheduled for ${new Date(result.scheduledAt).toLocaleString()}`);
          } else {
            toast.success(`Message sent to ${result.recipients} recipient(s)`);
          }
          
          resetForm();
          fetchBalance(); // Refresh balance
        } else {
          throw new Error(response.data.message || 'Failed to send message');
        }
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to send message";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      recipientType: "direct",
      recipients: "",
      message: "",
      senderId: "",
      recipientCount: 0,
    });

    setBulkFormData({
      message: "",
      senderId: "",
    });
    
    if (csvInputRef.current) {
      csvInputRef.current.value = '';
    }
    
    setCsvFile(null);
    setSelectedContacts([]);
    setSelectedGroup(null);
    setScheduledMessage(false);
    setScheduledDate("");
    setCostEstimate(null);
  };

  const getMessageCount = (message: string) => {
    return Math.ceil(message.length / 160);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-subtle"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            Compose Message
          </h2>
          {/* {!balanceLoading && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Balance: <span className="font-medium">${userBalance.toFixed(2)}</span>
            </p>
          )} */}
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">Bulk Mode</span>
          <Switch 
            checked={bulkMode} 
            onCheckedChange={setBulkMode}
            aria-label="Toggle bulk mode" 
          />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Bulk Mode CSV Upload */}
          {bulkMode ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Bulk Recipients
                </CardTitle>
                <CardDescription>
                  Upload a CSV file with phone numbers (one per row or in a 'phone' column)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mt-1 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6">
                  <div className="space-y-3 text-center w-full">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label
                        htmlFor="csvFile"
                        className="relative cursor-pointer rounded-md font-medium text-jaylink-600 hover:text-jaylink-700 mx-auto"
                      >
                        <span>Upload CSV file</span>
                        <Input
                          id="csvFile"
                          name="csvFile"
                          type="file"
                          accept=".csv"
                          ref={csvInputRef}
                          onChange={handleCsvUpload}
                          className="sr-only"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      CSV format with phone numbers. Maximum file size: 5MB
                    </p>
                    {csvFile && (
                      <div className="mt-3 flex items-center justify-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-800 dark:text-green-200">
                          {csvFile.name} ({Math.round(csvFile.size / 1024)} KB)
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCsvFile(null);
                            if (csvInputRef.current) {
                              csvInputRef.current.value = '';
                            }
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Regular Mode Recipient Selection */
            <div className="space-y-4">
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                <div className="space-y-2">
                  <Label htmlFor="recipientType">Recipient Type</Label>
                  <Select 
                    value={formData.recipientType} 
                    onValueChange={(value: "direct" | "contacts" | "group") => {
                      setFormData(prev => ({
                        ...prev,
                        recipientType: value,
                        recipients: "",
                        recipientCount: 0,
                      }));
                      setSelectedContacts([]);
                      setSelectedGroup(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direct Entry</SelectItem>
                      <SelectItem value="contacts">From Contacts</SelectItem>
                      <SelectItem value="group">From Group</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senderId">Sender ID</Label>
                  <Input
                    id="senderId"
                    placeholder="Enter Sender ID (max 11 characters)"
                    value={formData.senderId}
                    onChange={(e) => handleInputChange("senderId", e.target.value)}
                    maxLength={11}
                  />
                  <p className="text-xs text-gray-500">
                    Optional. Max 11 characters.
                  </p>
                </div>
              </div>

              {/* Recipient Input Based on Type */}
              {formData.recipientType === "direct" && (
                <div className="space-y-2">
                  <Label htmlFor="recipients">Recipients</Label>
                  <Textarea
                    id="recipients"
                    placeholder="Enter phone numbers separated by commas"
                    value={formData.recipients}
                    onChange={(e) => handleDirectRecipientsChange(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    Format: +234800123456, +234800123457
                  </p>
                </div>
              )}

              {formData.recipientType === "contacts" && (
                <div className="space-y-2">
                  <Label>Select Contacts</Label>
                  <ContactSelector 
                    onContactsSelected={handleContactsSelected}
                    buttonText={selectedContacts.length > 0 ? `${selectedContacts.length} Contacts Selected` : "Select Contacts"}
                    preSelectedContacts={selectedContacts}
                    showCount={true}
                  />
                  
                  {selectedContacts.length > 0 && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Selected {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}

              {formData.recipientType === "group" && (
                <div className="space-y-2">
                  <Label>Select Group</Label>
                  <GroupSelector 
                    onGroupSelected={handleGroupSelected}
                    buttonText={selectedGroup ? selectedGroup.name : "Select Group"}
                    selectedGroup={selectedGroup}
                  />
                  
                  {selectedGroup && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Group with {selectedGroup.contactCount} member{selectedGroup.contactCount !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sender ID for Bulk Mode */}
          {bulkMode && (
            <div className="space-y-2">
              <Label htmlFor="bulkSenderId">Sender ID</Label>
              <Input
                id="bulkSenderId"
                placeholder="Enter Sender ID (max 11 characters)"
                value={bulkFormData.senderId}
                onChange={(e) => handleBulkInputChange("senderId", e.target.value)}
                maxLength={11}
              />
              <p className="text-xs text-gray-500">
                Optional. Max 11 characters.
              </p>
            </div>
          )}

          {/* Message Content */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              rows={4}
              value={bulkMode ? bulkFormData.message : formData.message}
              onChange={(e) => {
                if (bulkMode) {
                  handleBulkInputChange("message", e.target.value);
                } else {
                  handleInputChange("message", e.target.value);
                }
              }}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                Characters: {(bulkMode ? bulkFormData.message : formData.message).length}
              </span>
              <span>
                SMS units: {getMessageCount(bulkMode ? bulkFormData.message : formData.message)}
              </span>
            </div>
          </div>

          {/* Cost Estimate */}
          {costEstimate && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Cost Estimate</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Recipients:</span>
                      <span className="ml-2 font-medium">{costEstimate.recipientCount}</span>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">SMS Units:</span>
                      <span className="ml-2 font-medium">{costEstimate.messageUnits}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-blue-700 dark:text-blue-300">Estimated Cost:</span>
                      <span className="ml-2 font-medium text-lg">
                        {costEstimate.currencySymbol}{costEstimate.estimatedCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {costEstimate.estimatedCost > userBalance && (
                    <div className="mt-2 flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Insufficient balance</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Schedule Controls */}
          <div className="flex items-center space-x-3">
            <Switch 
              id="scheduledMessage"
              checked={scheduledMessage} 
              onCheckedChange={setScheduledMessage}
            />
            <Label htmlFor="scheduledMessage" className="cursor-pointer">Schedule for later</Label>
          </div>

          {scheduledMessage && (
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Schedule Date & Time</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="scheduledDate"
                  type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required={scheduledMessage}
                  className="flex-1"
                />
                <Calendar className="text-gray-400" size={20} />
              </div>
              <p className="text-xs text-gray-500">
                Messages will be sent at the scheduled time
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-jaylink-600 hover:bg-jaylink-700 flex items-center justify-center"
            disabled={
              loading || 
              estimatingCost ||
              (costEstimate && costEstimate.estimatedCost > userBalance) ||
              (!bulkMode && formData.recipientCount === 0) ||
              (bulkMode && !csvFile)
            }
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {bulkMode 
              ? scheduledMessage ? "Schedule Bulk Messages" : "Send Bulk Messages"
              : scheduledMessage ? "Schedule Message" : "Send Message"
            }
          </Button>
        </div>
      </form>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Message Send</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Please confirm the details of your message:</p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Recipients:</span>
                    <span className="font-medium">{confirmationData?.recipients}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SMS Units:</span>
                    <span className="font-medium">{confirmationData?.messageUnits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Cost:</span>
                    <span className="font-medium text-lg">
                      {confirmationData?.currency}{confirmationData?.cost.toFixed(2)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  This amount will be deducted from your account balance.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={sendMessage}
              disabled={loading}
              className="bg-jaylink-600 hover:bg-jaylink-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Confirm & Send'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default MessageForm;