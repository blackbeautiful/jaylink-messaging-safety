
import { useState } from "react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Loader2, Send, Calendar, UsersRound } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import ContactSelector, { Contact } from "./contacts/ContactSelector";
import GroupSelector, { Group } from "./groups/GroupSelector";
import { smsApiService } from "@/utils/apiService";

// Mock data for development
const mockContacts = [
  { id: "1", name: "John Smith", phone: "+1 (555) 123-4567", email: "john.smith@example.com" },
  { id: "2", name: "Sarah Johnson", phone: "+1 (555) 987-6543", email: "sarah.j@example.com" },
  { id: "3", name: "Michael Brown", phone: "+1 (555) 456-7890", email: "michael.b@example.com" },
  { id: "4", name: "Emma Wilson", phone: "+1 (555) 789-0123", email: "emma.w@example.com" },
  { id: "5", name: "David Lee", phone: "+1 (555) 234-5678", email: "david.lee@example.com" },
];

const mockGroups = [
  { id: "1", name: "Customers", description: "All paying customers", members: 128 },
  { id: "2", name: "Employees", description: "Internal staff members", members: 42 },
  { id: "3", name: "Subscribers", description: "Newsletter subscribers", members: 2156 },
  { id: "4", name: "VIP Clients", description: "Premium customers", members: 17 },
];

const MessageForm = () => {
  const [loading, setLoading] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [scheduledMessage, setScheduledMessage] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const isMobile = useIsMobile();
  
  // Selected contacts/groups state
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  
  const [formData, setFormData] = useState({
    recipientType: "direct", // "direct", "contacts", "group"
    recipients: "",
    message: "",
    senderId: "",
    csvFile: null as File | null,
    recipientCount: 0,
  });

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
  };
  
  const handleGroupSelected = (group: Group) => {
    setSelectedGroup(group);
    setFormData({
      ...formData,
      recipientType: "group",
      recipients: `Group: ${group.name}`,
      recipientCount: group.members,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate before submitting
    if (!formData.recipients && formData.recipientType === "direct") {
      toast.error("Please enter at least one recipient");
      setLoading(false);
      return;
    }

    if (!formData.message) {
      toast.error("Please enter a message");
      setLoading(false);
      return;
    }

    try {
      // Prepare the recipients based on the type
      let recipients;
      
      if (formData.recipientType === "direct") {
        recipients = formData.recipients;
      } else if (formData.recipientType === "contacts") {
        recipients = selectedContacts.map(c => c.phone).join(",");
      } else if (formData.recipientType === "group" && selectedGroup) {
        // In a real app, you would fetch all contacts in this group
        // For now, we'll just use the group's id or name
        recipients = `group_${selectedGroup.id}`;
      }

      // Call the API with proper arguments
      await smsApiService.sendSMS({
        recipients,
        message: formData.message,
        senderId: formData.senderId,
        scheduled: scheduledMessage ? scheduledDate : undefined
      });

      toast.success(
        scheduledMessage
          ? `Message scheduled to ${formData.recipientCount || '1+'} recipient(s)`
          : `Message sent to ${formData.recipientCount || '1+'} recipient(s)`
      );
      
      // Reset form
      setFormData({
        recipientType: "direct",
        recipients: "",
        message: "",
        senderId: "",
        csvFile: null,
        recipientCount: 0,
      });
      setSelectedContacts([]);
      setSelectedGroup(null);
      setScheduledMessage(false);
      setScheduledDate("");
    } catch (error) {
      toast.error("Failed to send message");
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
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
                contacts={mockContacts} 
                onContactsSelected={handleContactsSelected}
                buttonText={selectedContacts.length > 0 ? `${selectedContacts.length} Contacts Selected` : "Select Contacts"}
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
                groups={mockGroups} 
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
            {scheduledMessage ? "Schedule Message" : "Send Message"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default MessageForm;
