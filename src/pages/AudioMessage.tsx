
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import AppLayout from "@/components/layout/AppLayout";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { PhoneCall, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import RecordButton from "@/components/audio/RecordButton";
import TTSButton from "@/components/audio/TTSButton";
import UploadButton from "@/components/audio/UploadButton";
import AudioFileList from "@/components/audio/AudioFileList";
import { AudioFile } from "@/types/audio";
import { smsApiService } from "@/utils/apiService";

// Form schema for audio message
const messageFormSchema = z.object({
  recipients: z.string().min(1, { message: "Please enter at least one recipient" }),
  senderId: z.string().min(1, { message: "Sender ID is required" }),
  audioId: z.string().optional(),
  schedule: z.boolean().default(false),
  scheduledDate: z.date().optional(),
});

type MessageFormValues = z.infer<typeof messageFormSchema>;

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

const AudioMessage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [audioFiles, setAudioFiles] = useState<AudioFile[]>(sampleAudioFiles);
  const [selectedAudio, setSelectedAudio] = useState<AudioFile | null>(null);
  const [activeTab, setActiveTab] = useState("my-audios");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form for audio message
  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      recipients: "",
      senderId: "",
      schedule: false,
    },
  });

  // Handle form submission
  const onSubmit = async (data: MessageFormValues) => {
    try {
      setIsSubmitting(true);
      
      if (!selectedAudio) {
        throw new Error("Please select an audio file to send");
      }
      
      console.log("Sending audio message with data:", {
        ...data,
        audioFile: selectedAudio,
      });
      
      // Format the recipients as comma-separated list for the API
      const recipients = data.recipients.split(',').map(r => r.trim()).join(',');
      
      // Here we would call the API to send the audio message
      // For now, we'll simulate a successful send
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Audio message scheduled",
        description: `Message will be delivered to ${recipients.split(',').length} recipient(s)`,
      });
      
      form.reset();
      setSelectedAudio(null);
    } catch (error) {
      console.error("Error sending audio message:", error);
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "An unknown error occurred",
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
    setSelectedAudio(newFile);
    
    toast({
      title: "Recording saved",
      description: `${name} has been saved (${Math.round(duration)} seconds)`,
    });
    
    setIsDialogOpen(false);
  };

  // Handle audio selection
  const handleSelectAudio = (file: AudioFile) => {
    setSelectedAudio(file);
    toast({
      title: "Audio selected",
      description: `${file.name} has been selected for your message`,
    });
  };

  // Handle audio deletion
  const handleDeleteAudio = (id: string) => {
    // If the selected audio is being deleted, deselect it
    if (selectedAudio && selectedAudio.id === id) {
      setSelectedAudio(null);
    }
    
    setAudioFiles(audioFiles.filter(file => file.id !== id));
    
    toast({
      title: "Audio deleted",
      description: "The audio file has been deleted",
    });
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
  };

  return (
    <AppLayout title="Audio Messages" currentPath="/audio-message">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Audio selection panel */}
        <Card className="col-span-1 md:col-span-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Audio Library</h2>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">Add New</Button>
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
                      <div className="space-y-4">
                        <div>
                          <UploadButton onChange={(files) => console.log(files)} />
                        </div>
                      </div>
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
                      <div className="space-y-4">
                        <div>
                          <TTSButton />
                        </div>
                      </div>
                    </Card>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            <AudioFileList 
              files={audioFiles}
              onSelect={handleSelectAudio}
              onDelete={handleDeleteAudio}
              selectedId={selectedAudio?.id}
            />
          </div>
        </Card>
        
        {/* Message form */}
        <Card className="col-span-1 md:col-span-2 p-6">
          <h2 className="text-lg font-semibold mb-4">Send Audio Message</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="recipients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipients</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="2348030000000, 2348020000000" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Enter phone numbers separated by commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="senderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caller ID</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Your phone number or company number" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      This will appear as the caller's phone number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="border rounded-md p-4">
                <h3 className="text-md font-medium mb-3">Selected Audio</h3>
                {selectedAudio ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedAudio.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedAudio.duration} seconds • {selectedAudio.type.toUpperCase()}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedAudio(null)}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-2">No audio selected</p>
                    <p className="text-sm">Please select an audio file from the library</p>
                  </div>
                )}
              </div>
              
              <FormField
                control={form.control}
                name="schedule"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Schedule call</FormLabel>
                      <FormDescription>
                        Make this call at a later time
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {form.watch("schedule") && (
                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Scheduled date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP HH:mm")
                              ) : (
                                <span>Pick a date and time</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date()
                            }
                            initialFocus
                          />
                          <div className="p-3 border-t border-border">
                            <Input
                              type="time"
                              onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(':');
                                const newDate = field.value ? new Date(field.value) : new Date();
                                newDate.setHours(parseInt(hours, 10));
                                newDate.setMinutes(parseInt(minutes, 10));
                                field.onChange(newDate);
                              }}
                              value={field.value ? format(field.value, "HH:mm") : ''}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Your call will be made at this time
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <Button 
                type="submit" 
                className="w-full gap-2"
                disabled={isSubmitting || !selectedAudio}
              >
                <PhoneCall size={16} />
                {isSubmitting ? "Scheduling..." : "Schedule Voice Call"}
              </Button>
            </form>
          </Form>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AudioMessage;
