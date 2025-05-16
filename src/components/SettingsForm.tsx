// src/components/SettingsForm.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun, Monitor } from "lucide-react";
import {
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";

// Define form schema for profile settings
const profileFormSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  company: z.string().optional(),
  phone: z.string().min(10, { message: "Please enter a valid phone number" }),
});

// Define form schema for notification settings
const notificationFormSchema = z.object({
  emailAlerts: z.boolean().default(true),
  lowBalanceAlerts: z.boolean().default(true),
  deliveryReports: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
});

// Define form schema for security settings
const securityFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string().min(8, { message: "Please confirm your new password" }),
  twoFactorAuth: z.boolean().default(false),
});

// Define form schema for appearance settings
const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  reducedMotion: z.boolean().default(false),
  compactView: z.boolean().default(false),
  highContrast: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;
type SecurityFormValues = z.infer<typeof securityFormSchema>;
type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;

const SettingsForm = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { theme, setTheme } = useTheme();
  
  // Initialize forms with default values
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      company: "Example Corp",
      phone: "2348012345678",
    },
  });
  
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailAlerts: true,
      lowBalanceAlerts: true,
      deliveryReports: true,
      marketingEmails: false,
    },
  });
  
  const securityForm = useForm<SecurityFormValues>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      twoFactorAuth: false,
    },
  });
  
  const appearanceForm = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: theme as "light" | "dark" | "system",
      reducedMotion: false,
      compactView: false,
      highContrast: false,
    },
  });
  
  // Handle profile form submission
  const onProfileSubmit = async (data: ProfileFormValues) => {
    try {
      setIsUpdating(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Updating profile:", data);
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update profile",
        description: "There was a problem updating your profile",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle notification form submission
  const onNotificationSubmit = async (data: NotificationFormValues) => {
    try {
      setIsUpdating(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Updating notification settings:", data);
      
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update notifications",
        description: "There was a problem updating your notification settings",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle security form submission
  const onSecuritySubmit = async (data: SecurityFormValues) => {
    try {
      setIsUpdating(true);
      
      // Basic validation for password match
      if (data.newPassword !== data.confirmPassword) {
        throw new Error("New password and confirmation do not match");
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Updating security settings:", data);
      
      toast({
        title: "Security settings updated",
        description: data.twoFactorAuth 
          ? "Your password has been updated and email 2FA has been enabled" 
          : "Your password has been updated",
      });
      
      // Reset password fields
      securityForm.reset({
        ...data,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update security settings",
        description: error instanceof Error ? error.message : "There was a problem updating your security settings",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle appearance form submission
  const onAppearanceSubmit = async (data: AppearanceFormValues) => {
    try {
      setIsUpdating(true);
      
      // Update theme immediately
      setTheme(data.theme);
      
      // Simulate API call for other settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Updating appearance settings:", data);
      
      toast({
        title: "Appearance settings updated",
        description: "Your interface preferences have been saved",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update appearance settings",
        description: "There was a problem updating your appearance settings",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList className="grid grid-cols-4 w-full md:w-auto">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="appearance">Appearance</TabsTrigger>
      </TabsList>
      
      {/* Profile Settings */}
      <TabsContent value="profile" className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-subtle">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Personal Information
          </h3>
          
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={profileForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormDescription>
                      We'll use this for communication and account recovery
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={profileForm.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={profileForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="bg-jaylink-600 hover:bg-jaylink-700"
                disabled={isUpdating}
              >
                {isUpdating ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </Form>
        </div>
      </TabsContent>
      
      {/* Notification Settings */}
      <TabsContent value="notifications" className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-subtle">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Email Notification Preferences
          </h3>
          
          <Form {...notificationForm}>
            <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
              <FormField
                control={notificationForm.control}
                name="emailAlerts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Email Alerts</FormLabel>
                      <FormDescription>
                        Receive email notifications for important events
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
              
              <FormField
                control={notificationForm.control}
                name="lowBalanceAlerts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Low Balance Alerts</FormLabel>
                      <FormDescription>
                        Receive alerts when your account balance is low
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
              
              <FormField
                control={notificationForm.control}
                name="deliveryReports"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Delivery Reports</FormLabel>
                      <FormDescription>
                        Receive email reports for message delivery status
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
              
              <FormField
                control={notificationForm.control}
                name="marketingEmails"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Marketing Emails</FormLabel>
                      <FormDescription>
                        Receive updates about new features and promotions
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
              
              <Button 
                type="submit" 
                className="bg-jaylink-600 hover:bg-jaylink-700"
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save Preferences"}
              </Button>
            </form>
          </Form>
        </div>
      </TabsContent>
      
      {/* Security Settings */}
      <TabsContent value="security" className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-subtle">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Password & Security
          </h3>
          
          <Form {...securityForm}>
            <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
              <FormField
                control={securityForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={securityForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormDescription>
                      Password must be at least 8 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={securityForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={securityForm.control}
                name="twoFactorAuth"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Email Two-Factor Authentication</FormLabel>
                      <FormDescription>
                        Add an extra layer of security with email verification
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
              
              <Button 
                type="submit" 
                className="bg-jaylink-600 hover:bg-jaylink-700"
                disabled={isUpdating}
              >
                {isUpdating ? "Updating..." : "Update Security Settings"}
              </Button>
            </form>
          </Form>
        </div>
      </TabsContent>
      
      {/* Appearance Settings */}
      <TabsContent value="appearance" className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-subtle">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Interface Appearance
          </h3>
          
          <Form {...appearanceForm}>
            <form onSubmit={appearanceForm.handleSubmit(onAppearanceSubmit)} className="space-y-6">
              <FormField
                control={appearanceForm.control}
                name="theme"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Theme</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-3 gap-4"
                      >
                        <FormItem>
                          <FormLabel className="[&:has([data-state=checked])>div]:border-jaylink-600 [&:has([data-state=checked])>div]:text-jaylink-600 dark:[&:has([data-state=checked])>div]:border-jaylink-400 dark:[&:has([data-state=checked])>div]:text-jaylink-400">
                            <FormControl>
                              <RadioGroupItem value="light" className="sr-only" />
                            </FormControl>
                            <div className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:border-jaylink-400 cursor-pointer">
                              <Sun className="mb-3 h-6 w-6" />
                              <span className="text-sm font-medium">Light</span>
                            </div>
                          </FormLabel>
                        </FormItem>
                        <FormItem>
                          <FormLabel className="[&:has([data-state=checked])>div]:border-jaylink-600 [&:has([data-state=checked])>div]:text-jaylink-600 dark:[&:has([data-state=checked])>div]:border-jaylink-400 dark:[&:has([data-state=checked])>div]:text-jaylink-400">
                            <FormControl>
                              <RadioGroupItem value="dark" className="sr-only" />
                            </FormControl>
                            <div className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-gray-900 text-white p-4 hover:border-jaylink-400 cursor-pointer">
                              <Moon className="mb-3 h-6 w-6" />
                              <span className="text-sm font-medium">Dark</span>
                            </div>
                          </FormLabel>
                        </FormItem>
                        <FormItem>
                          <FormLabel className="[&:has([data-state=checked])>div]:border-jaylink-600 [&:has([data-state=checked])>div]:text-jaylink-600 dark:[&:has([data-state=checked])>div]:border-jaylink-400 dark:[&:has([data-state=checked])>div]:text-jaylink-400">
                            <FormControl>
                              <RadioGroupItem value="system" className="sr-only" />
                            </FormControl>
                            <div className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-gray-50 dark:bg-gray-800 p-4 hover:border-jaylink-400 cursor-pointer">
                              <Monitor className="mb-3 h-6 w-6" />
                              <span className="text-sm font-medium">System</span>
                            </div>
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>
                      Choose a theme for your interface
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={appearanceForm.control}
                name="reducedMotion"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Reduced Motion</FormLabel>
                      <FormDescription>
                        Minimize animation effects throughout the interface
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
              
              <FormField
                control={appearanceForm.control}
                name="compactView"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Compact View</FormLabel>
                      <FormDescription>
                        Display more content with smaller spacing
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
              
              <FormField
                control={appearanceForm.control}
                name="highContrast"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">High Contrast</FormLabel>
                      <FormDescription>
                        Increase color contrast for better visibility
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
              
              <Button 
                type="submit" 
                className="bg-jaylink-600 hover:bg-jaylink-700"
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save Appearance Settings"}
              </Button>
            </form>
          </Form>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default SettingsForm;