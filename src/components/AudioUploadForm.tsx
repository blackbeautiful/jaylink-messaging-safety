
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, Upload, Save, Copy, FileText } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const AudioUploadForm = () => {
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState("single");
  const [formData, setFormData] = useState({
    audioFile: null as File | null,
    audioFiles: [] as File[],
    description: "",
    reference: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multipleFileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
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

  const handleMultipleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setFormData({
        ...formData,
        audioFiles: filesArray,
      });
      
      toast.success(`${filesArray.length} audio files selected`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (uploadMode === "single" && !formData.audioFile) {
      toast.error("Please select an audio file to upload");
      setLoading(false);
      return;
    }

    if (uploadMode === "bulk" && formData.audioFiles.length === 0) {
      toast.error("Please select audio files to upload");
      setLoading(false);
      return;
    }

    setTimeout(() => {
      setLoading(false);
      
      const referenceId = `audio-${Math.random().toString(36).substring(2, 10)}`;
      
      toast.success(
        uploadMode === "single" 
          ? "Audio file uploaded successfully!" 
          : `${formData.audioFiles.length} audio files uploaded successfully!`
      );
      
      setFormData({
        ...formData,
        reference: referenceId,
        audioFile: null,
        audioFiles: [],
        description: "",
      });
      
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (multipleFileInputRef.current) multipleFileInputRef.current.value = "";
    }, 1500);
  };

  const copyReferenceToClipboard = () => {
    if (formData.reference) {
      navigator.clipboard.writeText(formData.reference);
      toast.success("Reference ID copied to clipboard");
    }
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
          Upload Audio
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Bulk Upload</span>
          <Switch 
            checked={uploadMode === "bulk"} 
            onCheckedChange={(checked) => setUploadMode(checked ? "bulk" : "single")}
            aria-label="Toggle bulk upload" 
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {uploadMode === "single" ? (
          <div>
            <Label htmlFor="audioFile">Select Audio File</Label>
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
                Selected file: {formData.audioFile.name}
              </p>
            )}
          </div>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Multiple Audio Files</CardTitle>
              <CardDescription>
                Upload multiple audio files at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mt-1 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6">
                <div className="space-y-2 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label
                      htmlFor="audioFiles"
                      className="relative cursor-pointer rounded-md font-medium text-jaylink-600 hover:text-jaylink-700"
                    >
                      <span>Select multiple audio files</span>
                      <Input
                        id="audioFiles"
                        name="audioFiles"
                        type="file"
                        accept="audio/*"
                        multiple
                        ref={multipleFileInputRef}
                        onChange={handleMultipleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">MP3, WAV up to 10MB each</p>
                </div>
              </div>
              {formData.audioFiles.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Selected {formData.audioFiles.length} files
                  </p>
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    {formData.audioFiles.map((file, index) => (
                      <p key={index} className="text-xs text-gray-500">
                        {file.name}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Enter a description for your audio file"
            value={formData.description}
            onChange={handleInputChange}
            className="mt-1"
            rows={3}
          />
        </div>

        {formData.reference && (
          <Card className="bg-gray-50 dark:bg-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Audio Reference ID</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <code className="bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded text-sm font-mono">
                  {formData.reference}
                </code>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={copyReferenceToClipboard}
                >
                  <Copy size={16} />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Use this reference ID when creating voice calls with this audio
              </p>
            </CardContent>
          </Card>
        )}

        <Button
          type="submit"
          className="w-full bg-jaylink-600 hover:bg-jaylink-700 flex items-center justify-center"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {uploadMode === "single" ? "Upload Audio File" : "Upload Audio Files"}
        </Button>
      </form>
    </motion.div>
  );
};

export default AudioUploadForm;
