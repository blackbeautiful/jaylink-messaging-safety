
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Upload, Loader2, Send, FileText, HelpCircle, Calendar } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const MessageForm = () => {
  const [loading, setLoading] = useState(false);
  const [messageType, setMessageType] = useState("sms");
  const [bulkMode, setBulkMode] = useState(false);
  const [scheduledMessage, setScheduledMessage] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    recipients: "",
    message: "",
    senderId: "",
    audioFile: null as File | null,
    csvFile: null as File | null,
    recipientCount: 0,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
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
      toast.error("Please upload a CSV file for bulk messaging");
      setLoading(false);
      return;
    }

    if (!bulkMode && !formData.recipients) {
      toast.error("Please enter at least one recipient");
      setLoading(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success(
        bulkMode 
          ? `Bulk ${messageType === "sms" ? "SMS" : messageType === "voice" ? "voice calls" : "audio messages"} initiated for ${formData.recipientCount} recipients!`
          : messageType === "sms"
            ? "SMS message sent successfully!"
            : messageType === "voice"
              ? "Voice call initiated successfully!"
              : "Audio message sent successfully!"
      );
      
      // Reset form
      setFormData({
        recipients: "",
        message: "",
        senderId: "",
        audioFile: null,
        csvFile: null,
        recipientCount: 0,
      });
      
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (csvInputRef.current) csvInputRef.current.value = "";
      setScheduledMessage(false);
      setScheduledDate("");
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-subtle"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Send Message
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

      <Tabs defaultValue="sms" onValueChange={(value) => setMessageType(value)}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="voice">Voice Call</TabsTrigger>
          <TabsTrigger value="audio">Audio Message</TabsTrigger>
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
              <div>
                <Label htmlFor="recipients">Recipients</Label>
                <Input
                  id="recipients"
                  name="recipients"
                  placeholder="Enter phone numbers separated by commas"
                  value={formData.recipients}
                  onChange={handleInputChange}
                  required={!bulkMode}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: +234800123456, +234800123457
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="senderId">Sender ID</Label>
              <Select
                value={formData.senderId}
                onValueChange={(value) => handleSelectChange("senderId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sender ID" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JayLink">JayLink</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="INFO">INFO</SelectItem>
                  <SelectItem value="ALERT">ALERT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="sms" className="mt-0">
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Type your message here"
                  rows={4}
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    Character count: {formData.message.length} | Messages: {Math.ceil(formData.message.length / 160)}
                  </p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center cursor-pointer">
                          <HelpCircle size={14} className="text-gray-400" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">160 characters per SMS</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="voice" className="mt-0">
              <div>
                <Label htmlFor="message">Voice Message (Text-to-Speech)</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Type your message to be converted to speech"
                  rows={4}
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                />
              </div>
            </TabsContent>

            <TabsContent value="audio" className="mt-0">
              <div>
                <Label htmlFor="audioFile">Upload Audio File</Label>
                <div className="mt-1 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6">
                  <div className="space-y-2 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
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
              {bulkMode ? `Send Bulk ${messageType.toUpperCase()}` : 
                messageType === "sms"
                  ? "Send SMS"
                  : messageType === "voice"
                    ? "Start Voice Call"
                    : "Send Audio Message"}
            </Button>
          </div>
        </form>
      </Tabs>
    </motion.div>
  );
};

export default MessageForm;
