/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/SettingsForm.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { useEnhancedSettings } from '@/hooks/use-enhanced-settings';
import { Moon, Sun, Monitor } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { api, apiUtils } from '@/config/api';

// Define form schema for profile settings
const profileFormSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  company: z.string().optional(),
  phone: z.string().min(10, { message: 'Please enter a valid phone number' }),
});

// Define form schema for notification settings
const notificationFormSchema = z.object({
  emailAlerts: z.boolean().default(true),
  lowBalanceAlerts: z.boolean().default(true),
  deliveryReports: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
});

// Define form schema for security settings
const securityFormSchema = z
  .object({
    currentPassword: z.string().min(1, { message: 'Current password is required' }),
    newPassword: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/, {
        message:
          'Password must include at least one uppercase letter, one lowercase letter, and one number',
      }),
    confirmPassword: z.string().min(8, { message: 'Please confirm your new password' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Define form schema for appearance settings
const appearanceFormSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
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
  const { settings: enhancedSettings, updateSettings } = useEnhancedSettings();
  const { user, updateProfile } = useAuth();
  const [userSettings, setUserSettings] = useState<any>({
    notifications: {
      emailAlerts: true,
      lowBalanceAlerts: true,
      deliveryReports: true,
      marketingEmails: false,
    },
    appearance: {
      theme: theme as 'light' | 'dark' | 'system',
      reducedMotion: enhancedSettings.reducedMotion,
      compactView: enhancedSettings.compactView,
      highContrast: enhancedSettings.highContrast,
    },
  });

  useEffect(() => {
    // Fetch user settings from API
    const fetchSettings = async () => {
      try {
        const response = await api.get(apiUtils.endpoints.user.settings);
        if (response.data.success) {
          setUserSettings(response.data.data.settings);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load settings',
          description: 'There was a problem loading your settings',
        });
      }
    };

    fetchSettings();
  }, []);

  // Initialize forms with user data and settings
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      company: user?.company || '',
      phone: user?.phone || '',
    },
  });

  // Update profile form when user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        company: user.company || '',
        phone: user.phone || '',
      });
    }
  }, [user, profileForm]);

  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailAlerts: userSettings?.notifications?.emailAlerts || true,
      lowBalanceAlerts: userSettings?.notifications?.lowBalanceAlerts || true,
      deliveryReports: userSettings?.notifications?.deliveryReports || true,
      marketingEmails: userSettings?.notifications?.marketingEmails || false,
    },
  });

  // Update notification form when settings change
  useEffect(() => {
    if (userSettings?.notifications) {
      notificationForm.reset({
        emailAlerts: userSettings.notifications.emailAlerts,
        lowBalanceAlerts: userSettings.notifications.lowBalanceAlerts,
        deliveryReports: userSettings.notifications.deliveryReports,
        marketingEmails: userSettings.notifications.marketingEmails,
      });
    }
  }, [userSettings, notificationForm]);

  const securityForm = useForm<SecurityFormValues>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const appearanceForm = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: (userSettings?.appearance?.theme || theme) as 'light' | 'dark' | 'system',
      reducedMotion: enhancedSettings.reducedMotion,
      compactView: enhancedSettings.compactView,
      highContrast: enhancedSettings.highContrast,
    },
  });

  // Update appearance form when settings or enhanced settings change
  useEffect(() => {
    appearanceForm.reset({
      theme: (userSettings?.appearance?.theme || theme) as 'light' | 'dark' | 'system',
      reducedMotion: enhancedSettings.reducedMotion,
      compactView: enhancedSettings.compactView,
      highContrast: enhancedSettings.highContrast,
    });
  }, [userSettings, enhancedSettings, theme, appearanceForm]);

  // Handle profile form submission
  const onProfileSubmit = async (data: ProfileFormValues) => {
    try {
      setIsUpdating(true);

      // Update user profile through AuthContext
      await updateProfile(data);

      toast({
        title: 'Profile updated',
        description: 'Your profile information has been updated successfully',
      });
    } catch (error) {
      console.error('Update profile error:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update profile',
        description: 'There was a problem updating your profile',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle notification form submission
  const onNotificationSubmit = async (data: NotificationFormValues) => {
    try {
      setIsUpdating(true);

      // Update notification settings via API
      const response = await api.put(apiUtils.endpoints.user.settings, {
        notifications: data,
      });

      if (response.data.success) {
        setUserSettings((prev) => ({
          ...prev,
          notifications: data,
        }));

        toast({
          title: 'Notification settings updated',
          description: 'Your notification preferences have been saved',
        });
      } else {
        throw new Error(response.data.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Update notifications error:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update notifications',
        description: apiUtils.handleError(
          error,
          'There was a problem updating your notification settings'
        ),
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
        throw new Error('New password and confirmation do not match');
      }

      // Update password via API
      const response = await api.put(apiUtils.endpoints.user.password, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (response.data.success) {
        toast({
          title: 'Security settings updated',
          description: data.currentPassword
            ? 'Your password has been updated successfully'
            : 'Your security settings have been updated',
        });

        // Reset password fields
        securityForm.reset({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        throw new Error(response.data.message || 'Failed to update security settings');
      }
    } catch (error) {
      console.error('Security update error:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update security settings',
        description: apiUtils.handleError(
          error,
          'There was a problem updating your security settings'
        ),
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle appearance form submission
  const onAppearanceSubmit = async (data: AppearanceFormValues) => {
    try {
      setIsUpdating(true);

      // Extract appearance settings and enhanced settings
      const { theme: newTheme, ...enhancedSettingsData } = data;

      // Update theme immediately
      setTheme(newTheme);

      // Update enhanced settings (local state management)
      updateSettings(enhancedSettingsData);

      // Update appearance settings via API
      const response = await api.put(apiUtils.endpoints.user.settings, {
        appearance: data,
      });

      if (response.data.success) {
        setUserSettings((prev) => ({
          ...prev,
          appearance: data,
        }));

        toast({
          title: 'Appearance settings updated',
          description: 'Your interface preferences have been saved',
        });
      } else {
        throw new Error(response.data.message || 'Failed to update appearance settings');
      }
    } catch (error) {
      console.error('Update appearance error:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update appearance settings',
        description: apiUtils.handleError(
          error,
          'There was a problem updating your appearance settings'
        ),
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="settings-container">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <div className="settings-card">
            <h3 className="settings-card-title">Personal Information</h3>

            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="settings-form">
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

                <Button type="submit" className="settings-submit-btn" disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </Form>
          </div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="settings-card">
            <h3 className="settings-card-title">Email Notification Preferences</h3>

            <Form {...notificationForm}>
              <form
                onSubmit={notificationForm.handleSubmit(onNotificationSubmit)}
                className="settings-form"
              >
                <FormField
                  control={notificationForm.control}
                  name="emailAlerts"
                  render={({ field }) => (
                    <FormItem className="settings-switch-item">
                      <div className="settings-switch-content">
                        <FormLabel className="settings-switch-label">Email Alerts</FormLabel>
                        <FormDescription>
                          Receive email notifications for important events
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={notificationForm.control}
                  name="lowBalanceAlerts"
                  render={({ field }) => (
                    <FormItem className="settings-switch-item">
                      <div className="settings-switch-content">
                        <FormLabel className="settings-switch-label">Low Balance Alerts</FormLabel>
                        <FormDescription>
                          Receive alerts when your account balance is low
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={notificationForm.control}
                  name="deliveryReports"
                  render={({ field }) => (
                    <FormItem className="settings-switch-item">
                      <div className="settings-switch-content">
                        <FormLabel className="settings-switch-label">Delivery Reports</FormLabel>
                        <FormDescription>
                          Receive email reports for message delivery status
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={notificationForm.control}
                  name="marketingEmails"
                  render={({ field }) => (
                    <FormItem className="settings-switch-item">
                      <div className="settings-switch-content">
                        <FormLabel className="settings-switch-label">Marketing Emails</FormLabel>
                        <FormDescription>
                          Receive updates about new features and promotions
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="settings-submit-btn" disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : 'Save Preferences'}
                </Button>
              </form>
            </Form>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <div className="settings-card">
            <h3 className="settings-card-title">Password & Security</h3>

            <Form {...securityForm}>
              <form
                onSubmit={securityForm.handleSubmit(onSecuritySubmit)}
                className="settings-form"
              >
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
                        Password must be at least 8 characters with at least one uppercase letter,
                        one lowercase letter, and one number
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

                <Button type="submit" className="settings-submit-btn" disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </Form>
          </div>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <div className="settings-card">
            <h3 className="settings-card-title">Interface Appearance</h3>

            <Form {...appearanceForm}>
              <form
                onSubmit={appearanceForm.handleSubmit(onAppearanceSubmit)}
                className="settings-form"
              >
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
                          className="theme-radio-group"
                        >
                          <FormItem>
                            <FormLabel className="theme-option light-theme">
                              <FormControl>
                                <RadioGroupItem value="light" className="sr-only" />
                              </FormControl>
                              <div className="theme-option-content">
                                <Sun className="theme-icon" />
                                <span className="theme-label">Light</span>
                              </div>
                            </FormLabel>
                          </FormItem>
                          <FormItem>
                            <FormLabel className="theme-option dark-theme">
                              <FormControl>
                                <RadioGroupItem value="dark" className="sr-only" />
                              </FormControl>
                              <div className="theme-option-content">
                                <Moon className="theme-icon" />
                                <span className="theme-label">Dark</span>
                              </div>
                            </FormLabel>
                          </FormItem>
                          <FormItem>
                            <FormLabel className="theme-option system-theme">
                              <FormControl>
                                <RadioGroupItem value="system" className="sr-only" />
                              </FormControl>
                              <div className="theme-option-content">
                                <Monitor className="theme-icon" />
                                <span className="theme-label">System</span>
                              </div>
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>Choose a theme for your interface</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={appearanceForm.control}
                  name="reducedMotion"
                  render={({ field }) => (
                    <FormItem className="settings-switch-item">
                      <div className="settings-switch-content">
                        <FormLabel className="settings-switch-label">Reduced Motion</FormLabel>
                        <FormDescription>
                          Minimize animation effects throughout the interface
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={appearanceForm.control}
                  name="compactView"
                  render={({ field }) => (
                    <FormItem className="settings-switch-item">
                      <div className="settings-switch-content">
                        <FormLabel className="settings-switch-label">Compact View</FormLabel>
                        <FormDescription>
                          Display more content with smaller spacing and reduced padding
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={appearanceForm.control}
                  name="highContrast"
                  render={({ field }) => (
                    <FormItem className="settings-switch-item">
                      <div className="settings-switch-content">
                        <FormLabel className="settings-switch-label">High Contrast</FormLabel>
                        <FormDescription>
                          Increase color contrast for better visibility and accessibility
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="settings-submit-btn" disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : 'Save Appearance Settings'}
                </Button>
              </form>
            </Form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsForm;
