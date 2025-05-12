
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { AudioFile } from "@/types/audio";
import { smsApiService } from "@/utils/apiService";
import { useIsMobile } from "@/hooks/use-mobile";
import ContactSelector, { Contact } from "@/components/contacts/ContactSelector";
import GroupSelector, { Group } from "@/components/groups/GroupSelector";

// Form schema for audio message
const messageFormSchema = z.object({
  recipients: z.string().min(1, { message: "Please enter at least one recipient" }),
  senderId: z.string().min(1, { message: "Sender ID is required" }),
  audioId: z.string().optional(),
  schedule: z.boolean().default(false),
  scheduledDate: z.date().optional(),
  recipientType: z.string().default("direct"),
});

type MessageFormValues = z.infer<typeof messageFormSchema>;

// Sample audio files for demonstration
const sampleAudioFiles: AudioFile[] = [
  {
    id: "1",
    name: "Welcome Message",
    duration: 22,
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

// Sample contacts for demo
const mockContacts: Contact[] = [
  { id: "1", name: "John Smith", phone: "+1 (555) 123-4567", email: "john.smith@example.com" },
  { id: "2", name: "Sarah Johnson", phone: "+1 (555) 987-6543", email: "sarah.j@example.com" },
  { id: "3", name: "Michael Brown", phone: "+1 (555) 456-7890", email: "michael.b@example.com" },
  { id: "4", name: "Emma Wilson", phone: "+1 (555) 789-0123", email: "emma.w@example.com" },
  { id: "5", name: "David Lee", phone: "+1 (555) 234-5678", email: "david.lee@example.com" },
];

// Sample groups for demo
const mockGroups: Group[] = [
  { id: "1", name: "Customers", description: "All paying customers", members: 128 },
  { id: "2", name: "Employees", description: "Internal staff members", members: 42 },
  { id: "3", name: "Subscribers", description: "Newsletter subscribers", members: 2156 },
  { id: "4", name: "VIP Clients", description: "Premium customers", members: 17 },
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
  const isMobile = useIsMobile();

  // Selected contacts/groups state
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // Form for audio message
  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      recipients: "",
      senderId: "",
      schedule: false,
      recipientType: "direct",
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
        selectedContacts: data.recipientType === "contacts" ? selectedContacts : [],
        selectedGroup: data.recipientType === "group" ? selectedGroup : null,
      });
      
      // Format recipients based on type
      let recipients = "";
      if (data.recipientType === "direct") {
        recipients = data.recipients;
      } else if (data.recipientType === "contacts") {
        recipients = selectedContacts.map(c => c.phone).join(',');
      } else if (data.recipientType === "group" && selectedGroup) {
        recipients = `Group: ${selectedGroup.name} (${selectedGroup.members} contacts)`;
      }
      
      // Here we would call the API to send the audio message
      // For now, we'll simulate a successful send
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Audio message scheduled",
        description: data.recipientType === "group" && selectedGroup 
          ? `Message will be delivered to ${selectedGroup.members} contacts in ${selectedGroup.name}`
          : `Message will be delivered to ${data.recipientType === "contacts" ? selectedContacts.length : recipients.split(',').length} recipient(s)`,
      });
      
      form.reset();
      setSelectedAudio(null);
      setSelectedContacts([]);
      setSelectedGroup(null);
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

  // Handle recording completion - not actually implemented in this UI
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
  
  // Handle contacts selection
  const handleContactsSelected = (contacts: Contact[]) => {
    setSelectedContacts(contacts);
    form.setValue("recipients", contacts.map(c => c.phone).join(", "));
  };
  
  // Handle group selection
  const handleGroupSelected = (group: Group) => {
    setSelectedGroup(group);
    form.setValue("recipients", `Group: ${group.name} (${group.members} contacts)`);
  };

  return (
    <AppLayout title="Audio Messages" currentPath="/audio-message">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Audio selection panel */}
        <Card className="col-span-1 md:col-span-1 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Audio Library</h2>
            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
              Add New
            </Button>
          </div>
          
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {audioFiles.map(file => (
              <div
                key={file.id}
                className={`p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                  selectedAudio?.id === file.id ? "bg-gray-100 dark:bg-gray-700 border-jaylink-500" : ""
                }`}
                onClick={() => handleSelectAudio(file)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-white">{file.name}</span>
                    <span className="text-sm text-gray-500">
                      {file.duration} seconds • {file.type.toUpperCase()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAudio(file.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Message form */}
        <Card className="col-span-1 md:col-span-2 p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">Send Audio Message</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="recipientType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Reset other fields
                        if (value !== "contacts") setSelectedContacts([]);
                        if (value !== "group") setSelectedGroup(null);
                        if (value !== "direct") form.setValue("recipients", "");
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select how to add recipients" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="direct">Direct Entry</SelectItem>
                        <SelectItem value="contacts">From Contacts</SelectItem>
                        <SelectItem value="group">From Group</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {form.watch("recipientType") === "direct" && (
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
              )}
              
              {form.watch("recipientType") === "contacts" && (
                <div className="space-y-2">
                  <FormLabel>Select Contacts</FormLabel>
                  <ContactSelector 
                    contacts={mockContacts}
                    onContactsSelected={handleContactsSelected}
                    buttonText={selectedContacts.length > 0 ? `${selectedContacts.length} Contacts Selected` : "Select Contacts"}
                  />
                  {selectedContacts.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedContacts.length} contact(s) selected
                    </p>
                  )}
                </div>
              )}
              
              {form.watch("recipientType") === "group" && (
                <div className="space-y-2">
                  <FormLabel>Select Group</FormLabel>
                  <GroupSelector
                    groups={mockGroups}
                    onGroupSelected={handleGroupSelected}
                    buttonText={selectedGroup ? selectedGroup.name : "Select Group"}
                  />
                  {selectedGroup && (
                    <p className="text-sm text-muted-foreground">
                      Group with {selectedGroup.members} member(s)
                    </p>
                  )}
                </div>
              )}
              
              <FormField
                control={form.control}
                name="senderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caller ID</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select caller ID" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="+2348012345678">+234 801 234 5678</SelectItem>
                        <SelectItem value="+2348023456789">+234 802 345 6789</SelectItem>
                        <SelectItem value="+2347034567890">+234 703 456 7890</SelectItem>
                      </SelectContent>
                    </Select>
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
                              variant="outline"
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

      {/* Dialog for adding new audio (simplified) */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className={isMobile ? "w-[95vw] max-w-[95vw]" : "sm:max-w-[600px]"}>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="record">Record</TabsTrigger>
              <TabsTrigger value="tts">Text to Speech</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload">
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Upload Audio File</h3>
                <div className="mt-1 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6">
                  <div className="space-y-2 text-center">
                    <div className="text-center">
                      <p className="text-muted-foreground mb-2">Upload file feature</p>
                      <p className="text-sm">This feature is available in the full version</p>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="record">
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Record Audio</h3>
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">Record audio feature</p>
                    <p className="text-sm">This feature is available in the full version</p>
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="tts">
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Text to Speech Conversion</h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">Text to speech feature</p>
                    <p className="text-sm">This feature is available in the full version</p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default AudioMessage;
