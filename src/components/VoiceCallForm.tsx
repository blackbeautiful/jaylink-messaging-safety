
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
import { Loader2, Phone, Mic } from "lucide-react";

const VoiceCallForm = () => {
  const [loading, setLoading] = useState(false);
  const [callType, setCallType] = useState("tts");
  const [formData, setFormData] = useState({
    recipients: "",
    message: "",
    callerID: "",
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
        callType === "tts"
          ? "Voice call with Text-to-Speech initiated successfully!"
          : "Voice call with audio file initiated successfully!"
      );
      
      // Reset form
      setFormData({
        recipients: "",
        message: "",
        callerID: "",
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
        Make Voice Call
      </h2>

      <Tabs defaultValue="tts" onValueChange={(value) => setCallType(value)}>
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="tts">Text-to-Speech</TabsTrigger>
          <TabsTrigger value="audio">Audio File</TabsTrigger>
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
                  required
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
                <Phone className="mr-2 h-4 w-4" />
              )}
              Start Voice Call
            </Button>
          </div>
        </form>
      </Tabs>
    </motion.div>
  );
};

export default VoiceCallForm;
