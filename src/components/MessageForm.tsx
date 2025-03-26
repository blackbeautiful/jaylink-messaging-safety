
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Loader2, Send } from "lucide-react";

const MessageForm = () => {
  const [loading, setLoading] = useState(false);
  const [messageType, setMessageType] = useState("sms");
  const [formData, setFormData] = useState({
    recipients: "",
    message: "",
    senderId: "",
    audioFile: null as File | null,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success(
        messageType === "sms"
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
      });
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-subtle"
    >
      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
        Send Message
      </h2>

      <Tabs defaultValue="sms" onValueChange={(value) => setMessageType(value)}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="voice">Voice Call</TabsTrigger>
          <TabsTrigger value="audio">Audio Message</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <Label htmlFor="recipients">Recipients</Label>
              <Input
                id="recipients"
                name="recipients"
                placeholder="Enter phone numbers separated by commas"
                value={formData.recipients}
                onChange={handleInputChange}
                required
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: +234800123456, +234800123457
              </p>
            </div>

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
                <p className="text-xs text-gray-500 mt-1">
                  Character count: {formData.message.length} | Messages: {Math.ceil(formData.message.length / 160)}
                </p>
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
              {messageType === "sms"
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
