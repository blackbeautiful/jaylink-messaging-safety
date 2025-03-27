
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, ChevronDown, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import apiService from "@/utils/apiService";

// Define the form schema
const messageFormSchema = z.object({
  recipients: z.string().min(1, { message: "Please enter at least one recipient" }),
  message: z.string().min(1, { message: "Message is required" }).max(918, {
    message: "Message cannot be longer than 918 characters (6 concatenated SMS)",
  }),
  senderId: z.string().min(1, { message: "Sender ID is required" }).max(11, {
    message: "Sender ID cannot be longer than 11 characters",
  }),
  schedule: z.boolean().default(false),
  scheduledDate: z.date().optional(),
});

// Extending the schema for bulk SMS
const bulkMessageFormSchema = messageFormSchema.extend({
  csvFile: z.instanceof(FileList).refine((files) => files.length > 0, {
    message: "Please upload a CSV file",
  }),
});

type MessageFormValues = z.infer<typeof messageFormSchema>;
type BulkMessageFormValues = z.infer<typeof bulkMessageFormSchema>;

const MessageForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTab, setSelectedTab] = useState("single");
  const [characterCount, setCharacterCount] = useState(0);
  const [smsCount, setSmsCount] = useState(1);
  
  // Form for single SMS
  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      recipients: "",
      message: "",
      senderId: "",
      schedule: false,
    },
  });
  
  // Form for bulk SMS
  const bulkForm = useForm<BulkMessageFormValues>({
    resolver: zodResolver(bulkMessageFormSchema),
    defaultValues: {
      recipients: "",
      message: "",
      senderId: "",
      schedule: false,
      csvFile: undefined,
    },
  });
  
  // Calculate SMS count based on message length
  const calculateSMSCount = (message: string) => {
    const length = message.length;
    setCharacterCount(length);
    
    if (length <= 160) {
      setSmsCount(1);
    } else {
      // For concatenated SMS, each part can only hold 153 characters
      // due to the need for header information
      setSmsCount(Math.ceil(length / 153));
    }
  };
  
  // Handle form submission for single SMS
  const onSubmit = async (data: MessageFormValues) => {
    try {
      setIsSubmitting(true);
      
      console.log("Sending message with data:", data);
      
      // Format the recipients as comma-separated list for the API
      const recipients = data.recipients.split(',').map(r => r.trim()).join(',');
      
      // Call the API service to send the SMS
      const response = await apiService.sendSMS(
        recipients,
        data.message,
        data.senderId,
        data.schedule && data.scheduledDate ? format(data.scheduledDate, "yyyy-MM-dd HH:mm") : undefined
      );
      
      // Check if the API response indicates an error
      if ("error" in response) {
        throw new Error(response.error);
      }
      
      // Show success toast
      toast({
        title: "Message sent successfully",
        description: `Sent to ${recipients.split(',').length} recipient(s)`,
      });
      
      // Reset the form
      form.reset();
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Show error toast
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle form submission for bulk SMS
  const onBulkSubmit = async (data: BulkMessageFormValues) => {
    try {
      setIsSubmitting(true);
      
      console.log("Sending bulk message with data:", data);
      
      // Get the CSV file
      const csvFile = data.csvFile?.[0];
      
      if (!csvFile) {
        throw new Error("Please upload a CSV file");
      }
      
      // Call the API service to send the bulk SMS
      const response = await apiService.sendBulkSMS(
        csvFile,
        data.message,
        data.senderId,
        data.schedule && data.scheduledDate ? format(data.scheduledDate, "yyyy-MM-dd HH:mm") : undefined
      );
      
      // Check if the API response indicates an error
      if ("error" in response) {
        throw new Error(response.error);
      }
      
      // Show success toast
      toast({
        title: "Bulk message sent successfully",
        description: "Your message is being processed for delivery",
      });
      
      // Reset the form
      bulkForm.reset();
    } catch (error) {
      console.error("Error sending bulk message:", error);
      
      // Show error toast
      toast({
        variant: "destructive",
        title: "Failed to send bulk message",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-subtle p-6">
      <Tabs defaultValue="single" onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="single">Single SMS</TabsTrigger>
          <TabsTrigger value="bulk">Bulk SMS</TabsTrigger>
        </TabsList>
        
        <TabsContent value="single">
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
                    <FormLabel>Sender ID</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Your Brand Name or ID (Max 11 characters)" 
                        {...field} 
                        maxLength={11}
                      />
                    </FormControl>
                    <FormDescription>
                      This will appear as the sender of the message (max 11 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Type your message here" 
                        className="min-h-[120px]" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          calculateSMSCount(e.target.value);
                        }}
                      />
                    </FormControl>
                    <div className="flex justify-between items-center mt-2">
                      <FormDescription>
                        {characterCount} characters | {smsCount} SMS
                      </FormDescription>
                      {smsCount > 3 && (
                        <FormDescription className="text-amber-500">
                          Long message (6 SMS max)
                        </FormDescription>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="schedule"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Schedule message</FormLabel>
                      <FormDescription>
                        Send this message at a later time
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
                        Your message will be sent at this time
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-jaylink-600 hover:bg-jaylink-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="bulk">
          <Form {...bulkForm}>
            <form onSubmit={bulkForm.handleSubmit(onBulkSubmit)} className="space-y-6">
              <FormField
                control={bulkForm.control}
                name="csvFile"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Upload contacts (CSV)</FormLabel>
                    <FormControl>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                        <Input
                          type="file"
                          accept=".csv"
                          className="hidden"
                          id="csv-file"
                          onChange={(event) => {
                            onChange(event.target.files);
                          }}
                          {...fieldProps}
                        />
                        <label htmlFor="csv-file" className="cursor-pointer w-full flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {value && value.length > 0 ? value[0].name : 'Click to upload CSV file'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            CSV file with a column for phone numbers
                          </span>
                        </label>
                      </div>
                    </FormControl>
                    <FormDescription>
                      <a 
                        href="/sample-contacts.csv" 
                        className="text-jaylink-600 hover:text-jaylink-700"
                        download
                      >
                        Download sample CSV template
                      </a>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={bulkForm.control}
                name="senderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sender ID</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Your Brand Name or ID (Max 11 characters)" 
                        {...field} 
                        maxLength={11}
                      />
                    </FormControl>
                    <FormDescription>
                      This will appear as the sender of the message (max 11 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={bulkForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Type your message here" 
                        className="min-h-[120px]" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          calculateSMSCount(e.target.value);
                        }}
                      />
                    </FormControl>
                    <div className="flex justify-between items-center mt-2">
                      <FormDescription>
                        {characterCount} characters | {smsCount} SMS
                      </FormDescription>
                      {smsCount > 3 && (
                        <FormDescription className="text-amber-500">
                          Long message (6 SMS max)
                        </FormDescription>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={bulkForm.control}
                name="schedule"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Schedule message</FormLabel>
                      <FormDescription>
                        Send this message at a later time
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
              
              {bulkForm.watch("schedule") && (
                <FormField
                  control={bulkForm.control}
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
                        Your message will be sent at this time
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-jaylink-600 hover:bg-jaylink-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Bulk Message"}
              </Button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MessageForm;
