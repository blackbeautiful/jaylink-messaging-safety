import { useState, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Phone, Mic, FileText, Calendar } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import ContactSelector, { Contact } from "./contacts/ContactSelector";
import GroupSelector, { Group } from "./groups/GroupSelector";

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

const VoiceCallForm = () => {
  const [loading, setLoading] = useState(false);
  const [callType, setCallType] = useState("tts");
  const [bulkMode, setBulkMode] = useState(false);
  const [scheduledCall, setScheduledCall] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  
  // Selected contacts/groups state
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  
  const [formData, setFormData] = useState({
    recipientType: "direct", // "direct", "contacts", "group"
    recipients: "",
    message: "",
    callerID: "",
    audioFile: null as File | null,
    csvFile: null as File | null,
    recipientCount: 0,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Limit callerID to 11 characters
    if (name === "callerID" && value.length > 11) {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        audioFile: e.target.files[0],
      });
    }
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

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Simple validation for CSV
      if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
        toast.error("Please upload a valid CSV file");
        return;
      }
      
      // Read file to count recipients
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          const content = event.target.result as string;
          const lines = content.split('\n').filter(line => line.trim());
          
          setFormData({
            ...formData,
            csvFile: file,
            recipientCount: lines.length
          });
          
          toast.success(`CSV file loaded with ${lines.length} recipient(s)`);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate before submitting
    if (bulkMode && !formData.csvFile) {
      toast.error("Please upload a CSV file for bulk calling");
      setLoading(false);
      return;
    }

    if (!bulkMode && !formData.recipients && formData.recipientType === "direct") {
      toast.error("Please enter at least one recipient");
      setLoading(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success(
        bulkMode 
          ? `Bulk ${callType === "tts" ? "Text-to-Speech" : "Audio"} calls initiated for ${formData.recipientCount} recipients!`
          : callType === "tts"
            ? "Voice call with Text-to-Speech initiated successfully!"
            : "Voice call with audio file initiated successfully!"
      );
      
      // Reset form
      setFormData({
        recipientType: "direct",
        recipients: "",
        message: "",
        callerID: "",
        audioFile: null,
        csvFile: null,
        recipientCount: 0,
      });
      
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (csvInputRef.current) csvInputRef.current.value = "";
      setScheduledCall(false);
      setScheduledDate("");
      setSelectedContacts([]);
      setSelectedGroup(null);
    }, 1500);
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
          Make Voice Call
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

      <Tabs defaultValue="tts" onValueChange={(value) => setCallType(value)}>
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="tts">Text-to-Speech</TabsTrigger>
          <TabsTrigger value="audio">Audio File</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Recipients: {formData.recipientCount}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div>
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

                {formData.recipientType === "direct" && (
                  <div>
                    <Label htmlFor="recipients">Recipients</Label>
                    <Input
                      id="recipients"
                      name="recipients"
                      placeholder="Enter phone numbers separated by commas"
                      value={formData.recipients}
                      onChange={handleInputChange}
                      required={!bulkMode && formData.recipientType === "direct"}
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
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="callerID">Caller ID</Label>
              <Input
                id="callerID"
                name="callerID"
                placeholder="Enter Caller ID (max 11 characters)"
                value={formData.callerID}
                onChange={handleInputChange}
                className="mt-1"
                maxLength={11}
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum 11 characters
              </p>
            </div>

            <TabsContent value="tts" className="mt-0">
              <div>
                <Label htmlFor="message">Message (Text-to-Speech)</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Type your message to be converted to speech"
                  rows={4}
                  value={formData.message}
                  onChange={handleInputChange}
                  required={callType === "tts"}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Character count: {formData.message.length} | Estimated call duration: {Math.ceil(formData.message.length / 20)} seconds
                </p>
              </div>
            </TabsContent>

            <TabsContent value="audio" className="mt-0">
              <div>
                <Label htmlFor="audioFile">Upload Audio File</Label>
                <div className="mt-1 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6">
                  <div className="space-y-2 text-center">
                    <Mic className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex flex-wrap justify-center text-sm text-gray-600 dark:text-gray-400">
                      <label
                        htmlFor="audioFile"
                        className="relative cursor-pointer rounded-md font-medium text-jaylink-600 hover:text-jaylink-700"
                      >
                        <span>Upload an audio file</span>
                        <Input
                          id="audioFile"
                          name="audioFile"
                          type="file"
                          accept="audio/*"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">MP3, WAV up to 10MB</p>
                  </div>
                </div>
                {formData.audioFile && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    File: {formData.audioFile.name}
                  </p>
                )}
              </div>
            </TabsContent>

            <div className="flex items-center space-x-2">
              <Switch 
                id="scheduledCall"
                checked={scheduledCall} 
                onCheckedChange={setScheduledCall}
              />
              <Label htmlFor="scheduledCall" className="cursor-pointer">Schedule for later</Label>
            </div>

            {scheduledCall && (
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
                    required={scheduledCall}
                    className="mt-1"
                  />
                  <Calendar className="ml-2 text-gray-400" size={20} />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Calls will be initiated at the scheduled time
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
                <Phone className="mr-2 h-4 w-4" />
              )}
              {bulkMode ? `Start Bulk ${callType === "tts" ? "TTS" : "Audio"} Calls` : "Start Voice Call"}
            </Button>
          </div>
        </form>
      </Tabs>
    </motion.div>
  );
};

export default VoiceCallForm;