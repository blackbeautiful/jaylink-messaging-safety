import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useTheme } from "@/components/ThemeProvider";
import { useEnhancedSettings } from "@/hooks/use-enhanced-settings";

const SettingsForm = () => {
  // Theme settings
  const { theme, setTheme } = useTheme();
  
  // Enhanced settings
  const { settings, updateSettings } = useEnhancedSettings();
  
  // User settings
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    balanceAlerts: true,
    messageReceipts: true,
    marketingEmails: false
  });

  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  
  // Load user data (simulated)
  useEffect(() => {
    // Simulate loading user data
    const timeout = setTimeout(() => {
      setFormData({
        name: "Demo User",
        email: "user@example.com",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    }, 500);
    
    return () => clearTimeout(timeout);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNotificationChange = (setting: string, checked: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: checked
    }));
  };

  const handleEnhancedSettingChange = (setting: keyof typeof settings, checked: boolean) => {
    updateSettings({ [setting]: checked });
    toast.success(`${setting} setting updated`);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    
    setSaving(true);
    
    try {
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Password updated successfully");
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Update your personal information.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveProfile}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        {/* Password Tab */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Change your password.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSavePassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input 
                    id="current-password" 
                    name="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    placeholder="Enter your current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input 
                    id="new-password" 
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Enter your new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input 
                    id="confirm-password" 
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your new password"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Updating...' : 'Update Password'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure how you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="email-notifications" className="flex-1">
                  Email Notifications
                  <p className="text-sm text-muted-foreground mt-1">
                    Receive email notifications for important updates.
                  </p>
                </Label>
                <Switch
                  id="email-notifications"
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="balance-alerts" className="flex-1">
                  Balance Alerts
                  <p className="text-sm text-muted-foreground mt-1">
                    Get notified when your balance is low.
                  </p>
                </Label>
                <Switch
                  id="balance-alerts"
                  checked={notificationSettings.balanceAlerts}
                  onCheckedChange={(checked) => handleNotificationChange('balanceAlerts', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="message-receipts" className="flex-1">
                  Message Delivery Receipts
                  <p className="text-sm text-muted-foreground mt-1">
                    Receive confirmations when messages are delivered.
                  </p>
                </Label>
                <Switch
                  id="message-receipts"
                  checked={notificationSettings.messageReceipts}
                  onCheckedChange={(checked) => handleNotificationChange('messageReceipts', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="marketing-emails" className="flex-1">
                  Marketing Emails
                  <p className="text-sm text-muted-foreground mt-1">
                    Receive promotional offers and updates.
                  </p>
                </Label>
                <Switch
                  id="marketing-emails"
                  checked={notificationSettings.marketingEmails}
                  onCheckedChange={(checked) => handleNotificationChange('marketingEmails', checked)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => toast.success("Notification preferences saved")}>
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how JayLink looks and feels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Theme</h3>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred color theme.
                  </p>
                  <div className="flex items-center space-x-4 mt-4">
                    <Button 
                      variant={theme === 'light' ? 'default' : 'outline'} 
                      onClick={() => setTheme('light')}
                      className="flex-1 justify-start"
                    >
                      <div className="w-4 h-4 rounded-full bg-white border mr-2"></div>
                      Light
                    </Button>
                    <Button 
                      variant={theme === 'dark' ? 'default' : 'outline'} 
                      onClick={() => setTheme('dark')}
                      className="flex-1 justify-start"
                    >
                      <div className="w-4 h-4 rounded-full bg-gray-900 border mr-2"></div>
                      Dark
                    </Button>
                    <Button 
                      variant={theme === 'system' ? 'default' : 'outline'} 
                      onClick={() => setTheme('system')}
                      className="flex-1 justify-start"
                    >
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-white to-gray-900 border mr-2"></div>
                      System
                    </Button>
                  </div>
                </div>
                
                <div className="pt-4">
                  <h3 className="text-lg font-medium">Accessibility</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Adjust these settings to improve your experience.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="reduced-motion" className="flex-1">
                        Reduced Motion
                        <p className="text-sm text-muted-foreground mt-1">
                          Minimize animations throughout the interface.
                        </p>
                      </Label>
                      <Switch
                        id="reduced-motion"
                        checked={settings.reducedMotion}
                        onCheckedChange={(checked) => handleEnhancedSettingChange('reducedMotion', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="compact-view" className="flex-1">
                        Compact View
                        <p className="text-sm text-muted-foreground mt-1">
                          Use a more compact layout with less whitespace.
                        </p>
                      </Label>
                      <Switch
                        id="compact-view"
                        checked={settings.compactView}
                        onCheckedChange={(checked) => handleEnhancedSettingChange('compactView', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="high-contrast" className="flex-1">
                        High Contrast
                        <p className="text-sm text-muted-foreground mt-1">
                          Increase contrast for better visibility.
                        </p>
                      </Label>
                      <Switch
                        id="high-contrast"
                        checked={settings.highContrast}
                        onCheckedChange={(checked) => handleEnhancedSettingChange('highContrast', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsForm;
