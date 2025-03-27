
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

const VoiceCallForm = () => {
  const [loading, setLoading] = useState(false);
  const [callType, setCallType] = useState("tts");
  const [bulkMode, setBulkMode] = useState(false);
  const [scheduledCall, setScheduledCall] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
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
      toast.error("Please upload a CSV file for bulk calling");
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
          ? `Bulk ${callType === "tts" ? "Text-to-Speech" : "Audio"} calls initiated for ${formData.recipientCount} recipients!`
          : callType === "tts"
            ? "Voice call with Text-to-Speech initiated successfully!"
            : "Voice call with audio file initiated successfully!"
      );
      
      // Reset form
      setFormData({
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
              <Label htmlFor="callerID">Caller ID</Label>
              <Select
                value={formData.callerID}
                onValueChange={(value) => handleSelectChange("callerID", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select caller ID" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+2348012345678">+234 801 234 5678</SelectItem>
                  <SelectItem value="+2348023456789">+234 802 345 6789</SelectItem>
                  <SelectItem value="+2347034567890">+234 703 456 7890</SelectItem>
                </SelectContent>
              </Select>
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
