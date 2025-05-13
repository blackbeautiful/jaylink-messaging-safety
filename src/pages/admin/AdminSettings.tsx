
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

const AdminSettings = () => {
  // Mock settings data
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "JayLink SMS",
    contactEmail: "support@jaylink.com",
    supportPhone: "+1 (555) 123-4567",
    maxFileSize: "10"
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    lowBalanceAlert: true,
    lowBalanceThreshold: "25",
    systemNotifications: true,
    newUserNotifications: true
  });
  
  const [securitySettings, setSecuritySettings] = useState({
    requireMFA: false,
    sessionTimeout: "60",
    passwordPolicy: "medium"
  });
  
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  const [isUpdating, setIsUpdating] = useState(false);

  const handleGeneralSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setGeneralSettings({
      ...generalSettings,
      [e.target.name]: e.target.value
    });
  };

  const handleNotificationSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNotificationSettings({
      ...notificationSettings,
      [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value
    });
  };

  const handleSecuritySettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSecuritySettings({
      ...securitySettings,
      [e.target.name]: e.target.value
    });
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    if (name === "lowBalanceAlert" || name === "systemNotifications" || name === "newUserNotifications") {
      setNotificationSettings({
        ...notificationSettings,
        [name]: checked
      });
    } else if (name === "requireMFA") {
      setSecuritySettings({
        ...securitySettings,
        [name]: checked
      });
    } else if (name === "maintenanceMode") {
      setMaintenanceMode(checked);
    }
  };

  const handleSaveSettings = (settingType: string) => {
    setIsUpdating(true);
    
    // Simulate API call to save settings
    setTimeout(() => {
      toast({
        title: "Settings updated",
        description: `${settingType} settings have been saved successfully.`,
      });
      setIsUpdating(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Settings</h2>
        <p className="text-muted-foreground">
          Configure system-wide settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>
        
        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic settings for the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    name="siteName"
                    value={generalSettings.siteName}
                    onChange={handleGeneralSettingsChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={generalSettings.contactEmail}
                    onChange={handleGeneralSettingsChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportPhone">Support Phone</Label>
                  <Input
                    id="supportPhone"
                    name="supportPhone"
                    value={generalSettings.supportPhone}
                    onChange={handleGeneralSettingsChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                  <Input
                    id="maxFileSize"
                    name="maxFileSize"
                    type="number"
                    min="1"
                    max="100"
                    value={generalSettings.maxFileSize}
                    onChange={handleGeneralSettingsChange}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={() => handleSaveSettings("General")} 
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure system notifications and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="lowBalanceAlert">Low Balance Alert</Label>
                  <p className="text-sm text-muted-foreground">
                    Alert users when their balance drops below the threshold
                  </p>
                </div>
                <Switch
                  id="lowBalanceAlert"
                  name="lowBalanceAlert"
                  checked={notificationSettings.lowBalanceAlert}
                  onCheckedChange={(checked) => handleSwitchChange("lowBalanceAlert", checked)}
                />
              </div>
              
              {notificationSettings.lowBalanceAlert && (
                <div className="space-y-2">
                  <Label htmlFor="lowBalanceThreshold">Low Balance Threshold ($)</Label>
                  <Input
                    id="lowBalanceThreshold"
                    name="lowBalanceThreshold"
                    type="number"
                    min="0"
                    value={notificationSettings.lowBalanceThreshold}
                    onChange={handleNotificationSettingsChange}
                  />
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="systemNotifications">System Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about system events and updates
                  </p>
                </div>
                <Switch
                  id="systemNotifications"
                  name="systemNotifications"
                  checked={notificationSettings.systemNotifications}
                  onCheckedChange={(checked) => handleSwitchChange("systemNotifications", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="newUserNotifications">New User Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications when new users register
                  </p>
                </div>
                <Switch
                  id="newUserNotifications"
                  name="newUserNotifications"
                  checked={notificationSettings.newUserNotifications}
                  onCheckedChange={(checked) => handleSwitchChange("newUserNotifications", checked)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={() => handleSaveSettings("Notification")} 
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security options for the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="requireMFA">Require MFA for Admin</Label>
                  <p className="text-sm text-muted-foreground">
                    Require multi-factor authentication for admin access
                  </p>
                </div>
                <Switch
                  id="requireMFA"
                  name="requireMFA"
                  checked={securitySettings.requireMFA}
                  onCheckedChange={(checked) => handleSwitchChange("requireMFA", checked)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  name="sessionTimeout"
                  type="number"
                  min="5"
                  max="240"
                  value={securitySettings.sessionTimeout}
                  onChange={handleSecuritySettingsChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="passwordPolicy">Password Policy</Label>
                <select
                  id="passwordPolicy"
                  name="passwordPolicy"
                  value={securitySettings.passwordPolicy}
                  onChange={handleSecuritySettingsChange}
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="low">Low (8+ characters)</option>
                  <option value="medium">Medium (8+ chars, mixed case, numbers)</option>
                  <option value="high">High (12+ chars, mixed case, numbers, symbols)</option>
                </select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={() => handleSaveSettings("Security")} 
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Maintenance Mode */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Mode</CardTitle>
              <CardDescription>
                Configure system maintenance settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenanceMode">Enable Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Put the site in maintenance mode (only admins can access)
                  </p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={maintenanceMode}
                  onCheckedChange={(checked) => handleSwitchChange("maintenanceMode", checked)}
                />
              </div>
              
              {maintenanceMode && (
                <div className="space-y-2">
                  <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                  <Textarea
                    id="maintenanceMessage"
                    placeholder="Enter a message to display to users during maintenance..."
                    className="min-h-[120px]"
                  />
                </div>
              )}
              
              <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">
                      Warning
                    </h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <p>
                        Enabling maintenance mode will prevent all non-admin users from accessing the platform. Make sure to schedule maintenance during off-peak hours.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={() => handleSaveSettings("Maintenance")} 
                disabled={isUpdating}
                variant={maintenanceMode ? "destructive" : "default"}
              >
                {isUpdating ? "Saving..." : (maintenanceMode ? "Enable Maintenance Mode" : "Save Settings")}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
