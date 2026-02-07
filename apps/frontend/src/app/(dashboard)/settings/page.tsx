'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { User, Bot, Bell, Shield, Save, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/store/auth-store';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [currentTab, setCurrentTab] = useState('profile');

  // User Profile
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
  });

  // Bot Settings
  const { data: bot } = useQuery({
    queryKey: ['bots'],
    queryFn: async () => {
      const response = await apiClient.get('/bots');
      return response.data[0];
    },
  });

  const { data: botSettings } = useQuery({
    queryKey: ['bot-settings', bot?.id],
    queryFn: async () => {
      if (!bot?.id) return null;
      const response = await apiClient.get(`/bots/${bot.id}`);
      return response.data.settings;
    },
    enabled: !!bot?.id,
  });

  const [settings, setSettings] = useState({
    autoReply: botSettings?.autoReply || false,
    autoReplyMessage: botSettings?.autoReplyMessage || '',
    commandPrefix: botSettings?.commandPrefix || '!',
    enableCommands: botSettings?.enableCommands || true,
    notifyOnMessage: botSettings?.notifyOnMessage || true,
    notifyOnCommand: botSettings?.notifyOnCommand || true,
    notifyOnError: botSettings?.notifyOnError || true,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      const response = await apiClient.patch('/users/profile', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  // Update bot settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: typeof settings) => {
      if (!bot?.id) throw new Error('No bot found');
      const response = await apiClient.patch(`/bots/${bot.id}/settings`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-settings'] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and bot preferences</p>
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="bot">
            <Bot className="mr-2 h-4 w-4" />
            Bot
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  placeholder="Username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  disabled
                  className="opacity-50"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <Button
                onClick={() => updateProfileMutation.mutate(profileData)}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bot Tab */}
        <TabsContent value="bot" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bot Configuration</CardTitle>
              <CardDescription>Configure bot behavior and responses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Reply</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically reply to incoming messages
                  </p>
                </div>
                <Switch
                  checked={settings.autoReply}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, autoReply: checked })
                  }
                />
              </div>

              {settings.autoReply && (
                <div className="space-y-2">
                  <Label htmlFor="autoReplyMessage">Auto Reply Message</Label>
                  <Input
                    id="autoReplyMessage"
                    value={settings.autoReplyMessage}
                    onChange={(e) =>
                      setSettings({ ...settings, autoReplyMessage: e.target.value })
                    }
                    placeholder="Thank you for your message..."
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Commands</Label>
                  <p className="text-sm text-muted-foreground">Allow command execution</p>
                </div>
                <Switch
                  checked={settings.enableCommands}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, enableCommands: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commandPrefix">Command Prefix</Label>
                <Input
                  id="commandPrefix"
                  value={settings.commandPrefix}
                  onChange={(e) =>
                    setSettings({ ...settings, commandPrefix: e.target.value })
                  }
                  placeholder="!"
                  maxLength={1}
                />
                <p className="text-xs text-muted-foreground">
                  Commands will start with this prefix (e.g., !help)
                </p>
              </div>

              <Button
                onClick={() => updateSettingsMutation.mutate(settings)}
                disabled={updateSettingsMutation.isPending || !bot}
              >
                {updateSettingsMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" />
                Save Bot Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new messages arrive
                  </p>
                </div>
                <Switch
                  checked={settings.notifyOnMessage}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, notifyOnMessage: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Command Execution</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when commands are executed
                  </p>
                </div>
                <Switch
                  checked={settings.notifyOnCommand}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, notifyOnCommand: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Errors & Warnings</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about bot errors
                  </p>
                </div>
                <Switch
                  checked={settings.notifyOnError}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, notifyOnError: checked })
                  }
                />
              </div>

              <Button
                onClick={() => updateSettingsMutation.mutate(settings)}
                disabled={updateSettingsMutation.isPending || !bot}
              >
                {updateSettingsMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Password & Security</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" placeholder="••••••••" />
              </div>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Update Password
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Role</span>
                <span className="text-sm font-medium">{user?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">User ID</span>
                <span className="text-sm font-medium font-mono">{user?.id}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
