
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

const AdminSettings = () => {
  const [emailSettings, setEmailSettings] = useState({
    notifyOnNewUser: true,
    notifyOnLowBalance: true,
    dailySummary: false,
    weeklyReport: true
  });
  
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: "30",
    maxLoginAttempts: "5"
  });

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    minBalanceThreshold: "10"
  });

  const handleSaveEmailSettings = () => {
    toast({
      title: "Email Settings Updated",
      description: "Your notification preferences have been saved."
    });
  };

  const handleSaveSecuritySettings = () => {
    toast({
      title: "Security Settings Updated",
      description: "Your security settings have been saved."
    });
  };

  const handleSaveSystemSettings = () => {
    toast({
      title: "System Settings Updated",
      description: "The system settings have been updated."
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Settings</h2>
        <p className="text-muted-foreground">
          Configure system-wide settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 md:grid-cols-4 h-auto">
          <TabsTrigger value="email">Email Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="email" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notification Settings</CardTitle>
              <CardDescription>
                Configure when the system should send you email notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="notify-new-user" className="flex-1">
                  Notify on new user registration
                </Label>
                <Switch
                  id="notify-new-user"
                  checked={emailSettings.notifyOnNewUser}
                  onCheckedChange={(checked) => 
                    setEmailSettings(prev => ({ ...prev, notifyOnNewUser: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="notify-low-balance" className="flex-1">
                  Notify on user low balance
                </Label>
                <Switch
                  id="notify-low-balance"
                  checked={emailSettings.notifyOnLowBalance}
                  onCheckedChange={(checked) => 
                    setEmailSettings(prev => ({ ...prev, notifyOnLowBalance: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="daily-summary" className="flex-1">
                  Send daily summary report
                </Label>
                <Switch
                  id="daily-summary"
                  checked={emailSettings.dailySummary}
                  onCheckedChange={(checked) => 
                    setEmailSettings(prev => ({ ...prev, dailySummary: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="weekly-report" className="flex-1">
                  Send weekly analytics report
                </Label>
                <Switch
                  id="weekly-report"
                  checked={emailSettings.weeklyReport}
                  onCheckedChange={(checked) => 
                    setEmailSettings(prev => ({ ...prev, weeklyReport: checked }))
                  }
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveEmailSettings}>
                Save Email Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security settings for the admin portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="two-factor-auth" className="flex-1">
                  Require two-factor authentication
                </Label>
                <Switch
                  id="two-factor-auth"
                  checked={securitySettings.twoFactorAuth}
                  onCheckedChange={(checked) => 
                    setSecuritySettings(prev => ({ ...prev, twoFactorAuth: checked }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="session-timeout">Session timeout (minutes)</Label>
                <Input
                  id="session-timeout"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => 
                    setSecuritySettings(prev => ({ ...prev, sessionTimeout: e.target.value }))
                  }
                  type="number"
                  min="5"
                  max="120"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="max-login-attempts">Maximum login attempts</Label>
                <Input
                  id="max-login-attempts"
                  value={securitySettings.maxLoginAttempts}
                  onChange={(e) => 
                    setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: e.target.value }))
                  }
                  type="number"
                  min="3"
                  max="10"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSecuritySettings}>
                Save Security Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="system" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure system-wide settings and thresholds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="maintenance-mode" className="flex-1">
                  Maintenance mode
                  <p className="text-sm text-muted-foreground mt-1">
                    When enabled, only admins can access the platform
                  </p>
                </Label>
                <Switch
                  id="maintenance-mode"
                  checked={systemSettings.maintenanceMode}
                  onCheckedChange={(checked) => 
                    setSystemSettings(prev => ({ ...prev, maintenanceMode: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="registration-enabled" className="flex-1">
                  Allow new user registration
                </Label>
                <Switch
                  id="registration-enabled"
                  checked={systemSettings.registrationEnabled}
                  onCheckedChange={(checked) => 
                    setSystemSettings(prev => ({ ...prev, registrationEnabled: checked }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="min-balance">Minimum balance threshold ($)</Label>
                <Input
                  id="min-balance"
                  value={systemSettings.minBalanceThreshold}
                  onChange={(e) => 
                    setSystemSettings(prev => ({ ...prev, minBalanceThreshold: e.target.value }))
                  }
                  type="number"
                  min="0"
                  step="0.01"
                />
                <p className="text-sm text-muted-foreground">
                  Users will be alerted when their balance falls below this threshold
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSystemSettings}>
                Save System Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of the admin portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="theme-toggle" className="flex-1">
                  Theme Mode
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose between light, dark, or system theme
                  </p>
                </Label>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
