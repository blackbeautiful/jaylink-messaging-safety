/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Send, Calendar, UsersRound, FileText } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import ContactSelector, { Contact } from "./contacts/ContactSelector";
import GroupSelector, { Group } from "./groups/GroupSelector";
import { api } from "@/contexts/AuthContext";

const MessageForm = () => {
  const [loading, setLoading] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [scheduledMessage, setScheduledMessage] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [openContactsDialog, setOpenContactsDialog] = useState(false);
  const [openGroupsDialog, setOpenGroupsDialog] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  
  // Selected contacts/groups state
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  
  const [formData, setFormData] = useState({
    recipientType: "direct", // "direct", "contacts", "group"
    recipients: "",
    message: "",
    senderId: "",
    csvFile: null as File | null,
    recipientCount: 0,
  });
  
  // Fetch groups on component mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await api.get('/groups');
        if (response.data.success) {
          // Transform the groups to match the expected format
          const formattedGroups = response.data.data.groups.map((group: any) => ({
            id: group.id,
            name: group.name,
            description: group.description || "",
            members: group.contactCount
          }));
          setGroups(formattedGroups);
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };
    
    fetchGroups();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Limit senderId to 11 characters
    if (name === "senderId" && value.length > 11) {
      return;
    }
    
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleContactsSelected = (contacts: Contact[]) => {
    setSelectedContacts(contacts);
    // Join phone numbers with commas
    const phoneNumbers = contacts.map(c => c.phone).join(", ");
    setFormData({
      ...formData,
      recipientType: "contacts",
      recipients: phoneNumbers,
      recipientCount: contacts.length,
    });
    setOpenContactsDialog(false);
  };
  
  const handleGroupSelected = (group: Group) => {
    setSelectedGroup(group);
    setFormData({
      ...formData,
      recipientType: "group",
      recipients: `group_${group.id}`,
      recipientCount: group.members,
    });
    setOpenGroupsDialog(false);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Simple validation for CSV
      if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
        toast.error("Please upload a valid CSV file");
        return;
      }
      
      setFormData({
        ...formData,
        csvFile: file,
        recipientCount: 0 // We don't know how many recipients until we process the file
      });
      
      toast.success(`CSV file loaded: ${file.name}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (bulkMode && !formData.csvFile) {
        toast.error("Please upload a CSV file for bulk messaging");
        setLoading(false);
        return;
      }

      if (!bulkMode && !formData.recipients && formData.recipientType === "direct") {
        toast.error("Please enter at least one recipient");
        setLoading(false);
        return;
      }

      if (!formData.message) {
        toast.error("Please enter a message");
        setLoading(false);
        return;
      }

      if (bulkMode) {
        // Handle bulk SMS with CSV file
        const formDataObj = new FormData();
        formDataObj.append('message', formData.message);
        
        if (formData.senderId) {
          formDataObj.append('senderId', formData.senderId);
        }
        
        if (scheduledMessage && scheduledDate) {
          formDataObj.append('scheduled', scheduledDate);
        }
        
        if (formData.csvFile) {
          formDataObj.append('file', formData.csvFile);
        }
        
        const response = await api.post('/sms/bulk-send', formDataObj, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.success) {
          const result = response.data.data;
          
          if (result.status === 'scheduled') {
            toast.success(`Message scheduled for ${new Date(result.scheduledAt).toLocaleString()}`);
          } else {
            toast.success(`Message sent to ${result.recipients} recipient(s)`);
          }
          
          // Reset form
          resetForm();
        } else {
          toast.error(response.data.message || 'Failed to send message');
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
          
          // Reset form
          resetForm();
        } else {
          toast.error(response.data.message || 'Failed to send message');
        }
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.response?.data?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      recipientType: "direct",
      recipients: "",
      message: "",
      senderId: "",
      csvFile: null,
      recipientCount: 0,
    });
    
    if (csvInputRef.current) {
      csvInputRef.current.value = '';
    }
    
    setSelectedContacts([]);
    setSelectedGroup(null);
    setScheduledMessage(false);
    setScheduledDate("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-subtle"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Compose Message
        </h2>
        <div className="flex items-center space-x-2">
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
                <CardTitle className="text-base">Bulk Recipients</CardTitle>
                <CardDescription>
                  Upload a CSV file with phone numbers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mt-1 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6">
                  <div className="space-y-2 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label
                        htmlFor="csvFile"
                        className="relative cursor-pointer rounded-md font-medium text-jaylink-600 hover:text-jaylink-700"
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
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">CSV format with one phone number per line</p>
                  </div>
                </div>
                {formData.csvFile && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      File: {formData.csvFile.name}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Regular Mode Recipient Selection */
            <div className="space-y-4">
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                <div className="space-y-1">
                  <Label htmlFor="recipientType">Recipient Type</Label>
                  <Select 
                    value={formData.recipientType} 
                    onValueChange={(value) => handleSelectChange("recipientType", value)}
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

                <div className="space-y-1">
                  <Label htmlFor="senderId">Sender ID</Label>
                  <Input
                    id="senderId"
                    name="senderId"
                    placeholder="Enter Sender ID (max 11 characters)"
                    value={formData.senderId}
                    onChange={handleInputChange}
                    className="mt-1"
                    maxLength={11}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum 11 characters
                  </p>
                </div>
              </div>

              {formData.recipientType === "direct" && (
                <div>
                  <Label htmlFor="recipients">Recipients</Label>
                  <Input
                    id="recipients"
                    name="recipients"
                    placeholder="Enter phone numbers separated by commas"
                    value={formData.recipients}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
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
                    showCount={false}
                  />
                  
                  {selectedContacts.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Selected {selectedContacts.length} contact(s)
                    </div>
                  )}
                </div>
              )}

              {formData.recipientType === "group" && (
                <div className="space-y-2">
                  <Label>Select Group</Label>
                  <GroupSelector 
                    groups={groups} 
                    onGroupSelected={handleGroupSelected}
                    buttonText={selectedGroup ? selectedGroup.name : "Select Group"}
                  />
                  
                  {selectedGroup && (
                    <div className="text-sm text-muted-foreground">
                      Group with {selectedGroup.members} member(s)
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sender ID for Bulk Mode */}
          {bulkMode && (
            <div className="space-y-1">
              <Label htmlFor="senderId">Sender ID</Label>
              <Input
                id="senderId"
                name="senderId"
                placeholder="Enter Sender ID (max 11 characters)"
                value={formData.senderId}
                onChange={handleInputChange}
                className="mt-1"
                maxLength={11}
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum 11 characters
              </p>
            </div>
          )}

          {/* Message Content (Common for Both Modes) */}
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Type your message here..."
              rows={4}
              value={formData.message}
              onChange={handleInputChange}
              className="mt-1"
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-500">
                Character count: {formData.message.length}
              </p>
              <p className="text-xs text-gray-500">
                {Math.ceil(formData.message.length / 160)} SMS unit(s)
              </p>
            </div>
          </div>

          {/* Schedule Controls (Common for Both Modes) */}
          <div className="flex items-center space-x-2">
            <Switch 
              id="scheduledMessage"
              checked={scheduledMessage} 
              onCheckedChange={setScheduledMessage}
            />
            <Label htmlFor="scheduledMessage" className="cursor-pointer">Schedule for later</Label>
          </div>

          {scheduledMessage && (
            <div>
              <Label htmlFor="scheduledDate">Schedule Date & Time</Label>
              <div className="flex items-center">
                <Input
                  id="scheduledDate"
                  name="scheduledDate"
                  type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required={scheduledMessage}
                  className="mt-1"
                />
                <Calendar className="ml-2 text-gray-400" size={20} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Messages will be sent at the scheduled time
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-jaylink-600 hover:bg-jaylink-700 flex items-center justify-center"
            disabled={loading}
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
    </motion.div>
  );
};

export default MessageForm;