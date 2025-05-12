import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import RecordButton from "@/components/audio/RecordButton";
import TTSButton from "@/components/audio/TTSButton";
import UploadButton from "@/components/audio/UploadButton";
import AudioFileList from "@/components/audio/AudioFileList";
import { toast } from "@/hooks/use-toast";
import { smsApiService } from "@/utils/apiService";
import { AudioFile } from "@/types/audio";

// Define the schema for the upload form
const uploadFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional(),
  file: z.instanceof(FileList).optional(),
});

type UploadFormValues = z.infer<typeof uploadFormSchema>;

// Define the schema for the TTS form
const ttsFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  text: z.string().min(1, { message: "Text is required" }),
});

type TTSFormValues = z.infer<typeof ttsFormSchema>;

// Sample audio files for demonstration
const sampleAudioFiles: AudioFile[] = [
  {
    id: "1",
    name: "Welcome Message",
    duration: 22, // Changed from string to number
    type: "mp3",
    created: "2023-06-15",
    url: "#"
  },
  {
    id: "2",
    name: "Product Launch",
    duration: 45,
    type: "mp3",
    created: "2023-06-14",
    url: "#"
  },
  {
    id: "3",
    name: "Holiday Greetings",
    duration: 18,
    type: "wav",
    created: "2023-06-10",
    url: "#"
  },
  {
    id: "4",
    name: "Meeting Reminder",
    duration: 12,
    type: "mp3",
    created: "2023-06-08",
    url: "#"
  }
];

const AudioUploadForm = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>(sampleAudioFiles);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Upload form using react-hook-form
  const uploadForm = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });
  
  // TTS form using react-hook-form
  const ttsForm = useForm<TTSFormValues>({
    resolver: zodResolver(ttsFormSchema),
    defaultValues: {
      name: "",
      text: "",
    },
  });
  
  // Handle audio file upload
  const handleFileUpload = async (data: UploadFormValues) => {
    try {
      setIsSubmitting(true);
      
      if (!data.file || data.file.length === 0) {
        throw new Error("Please select a file to upload");
      }
      
      const file = data.file[0];
      console.log("Uploading file:", file.name);
      
      // Here we would call an API to upload the file
      // For now, we'll simulate a successful upload
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Add the new file to the list
      const newFile: AudioFile = {
        id: `new-${Date.now()}`,
        name: data.name,
        duration: 30, // Placeholder duration
        type: file.type.split('/')[1],
        created: new Date().toISOString().split('T')[0],
        url: URL.createObjectURL(file)
      };
      
      setAudioFiles([newFile, ...audioFiles]);
      
      toast({
        title: "Audio uploaded successfully",
        description: `${file.name} has been uploaded`,
      });
      
      uploadForm.reset();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error uploading audio:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle TTS conversion
  const handleTTSConversion = async (data: TTSFormValues) => {
    try {
      setIsSubmitting(true);
      
      console.log("Converting text to speech:", data.text);
      
      // Here we would call an API to convert text to speech
      // For now, we'll simulate a successful conversion
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add the new TTS file to the list
      const newFile: AudioFile = {
        id: `tts-${Date.now()}`,
        name: data.name,
        duration: Math.floor(data.text.length / 5), // Rough estimate based on text length
        type: "mp3",
        created: new Date().toISOString().split('T')[0],
      };
      
      setAudioFiles([newFile, ...audioFiles]);
      
      toast({
        title: "Text-to-Speech conversion complete",
        description: `${data.name} has been created`,
      });
      
      ttsForm.reset();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error in TTS conversion:", error);
      toast({
        variant: "destructive",
        title: "TTS conversion failed",
        description: error instanceof Error ? error.message : "An error occurred during conversion",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle recording completion
  const handleRecordingComplete = (blob: Blob, duration: number, name: string) => {
    const newFile: AudioFile = {
      id: `rec-${Date.now()}`,
      name,
      duration,
      type: "webm",
      created: new Date().toISOString().split('T')[0],
      url: URL.createObjectURL(blob)
    };
    
    setAudioFiles([newFile, ...audioFiles]);
    
    toast({
      title: "Recording saved",
      description: `${name} has been saved (${Math.round(duration)} seconds)`,
    });
    
    setIsDialogOpen(false);
  };
  
  // Handle audio file deletion
  const handleDeleteAudio = (id: string) => {
    setAudioFiles(audioFiles.filter(file => file.id !== id));
    
    toast({
      title: "Audio deleted",
      description: "The audio file has been deleted",
    });
  };
  
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
  };

  // Handle file change for UploadButton
  const handleFileChange = (files: File[]) => {
    if (files && files.length > 0) {
      const file = files[0];
      uploadForm.setValue("file", {
        0: file,
        length: 1,
        item: (index: number) => file,
      } as unknown as FileList);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Audio Files</h2>
          <p className="text-muted-foreground">
            Upload, record, or generate audio for voice messages.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button variant="default">Add New Audio</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="record">Record</TabsTrigger>
                <TabsTrigger value="tts">Text to Speech</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload">
                <Card className="p-6">
                  <h3 className="text-lg font-medium mb-4">Upload Audio File</h3>
                  <Form {...uploadForm}>
                    <form onSubmit={uploadForm.handleSubmit(handleFileUpload)} className="space-y-4">
                      <FormField
                        control={uploadForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter a name for this audio" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={uploadForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Add a description" {...field} />
                            </FormControl>
                            <FormDescription>
                              This helps you identify the purpose of the audio file.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={uploadForm.control}
                        name="file"
                        render={({ field: { value, onChange, ...fieldProps } }) => (
                          <FormItem>
                            <FormLabel>File</FormLabel>
                            <FormControl>
                              <UploadButton onChange={handleFileChange} />
                            </FormControl>
                            <FormDescription>
                              Upload MP3 or WAV files (max 10MB)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Uploading..." : "Upload Audio"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </Card>
              </TabsContent>
              
              <TabsContent value="record">
                <Card className="p-6">
                  <h3 className="text-lg font-medium mb-4">Record Audio</h3>
                  <div className="flex flex-col items-center justify-center py-10">
                    <RecordButton onRecordingComplete={handleRecordingComplete} />
                    <p className="text-sm text-muted-foreground mt-4">
                      Click to start/stop recording. Max duration: 5 minutes.
                    </p>
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="tts">
                <Card className="p-6">
                  <h3 className="text-lg font-medium mb-4">Text to Speech Conversion</h3>
                  <Form {...ttsForm}>
                    <form onSubmit={ttsForm.handleSubmit(handleTTSConversion)} className="space-y-4">
                      <FormField
                        control={ttsForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter a name for this audio" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={ttsForm.control}
                        name="text"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Text to Convert</FormLabel>
                            <FormControl>
                              <Input placeholder="Type your text here" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Converting..." : "Generate Audio"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
      
      <AudioFileList 
        files={audioFiles}
        onDelete={handleDeleteAudio}
      />
    </div>
  );
};

export default AudioUploadForm;
