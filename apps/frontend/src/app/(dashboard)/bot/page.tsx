'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Bot, Play, Square, RotateCw, QrCode, Settings as SettingsIcon,
  MessageSquare, Users, Activity, Trash2, Plus, Smartphone
} from 'lucide-react';
import { botsApi } from '@/lib/api/bots';
import { apiClient } from '@/lib/api/client';
import { CreateBotDialog } from '@/components/bots/create-bot-dialog';
import { ConnectionDialog } from '@/components/bots/connection-dialog';

export default function BotManagementPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [connectionOpen, setConnectionOpen] = useState(false);
  const [connectionType, setConnectionType] = useState<'pairing' | 'qr'>('pairing');
  const [currentTab, setCurrentTab] = useState('overview');
  const queryClient = useQueryClient();

  const { data: bots, isLoading } = useQuery({
    queryKey: ['bots'],
    queryFn: botsApi.getAll,
  });

  const bot = bots?.[0]; // Get first (and only) bot

  const startMutation = useMutation({
    mutationFn: async ({ botId, type }: { botId: string; type: 'pairing' | 'qr' }) => {
      const response = await apiClient.post(`/bots/${botId}/start`, {
        connectionType: type,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
      setConnectionOpen(true); // Auto-open connection dialog
    },
  });

  const stopMutation = useMutation({
    mutationFn: botsApi.stop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
    },
  });

  const restartMutation = useMutation({
    mutationFn: botsApi.restart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: botsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
    },
  });

  const handleStart = (type: 'pairing' | 'qr') => {
    if (!bot) return;
    setConnectionType(type);
    startMutation.mutate({ botId: bot.id, type });
  };

  const statusColors = {
    CONNECTED: 'default',
    CONNECTING: 'secondary',
    QR_REQUIRED: 'secondary',
    DISCONNECTED: 'outline',
    ERROR: 'destructive',
  } as const;

  const statusText = {
    CONNECTED: 'Connected',
    CONNECTING: 'Connecting',
    QR_REQUIRED: 'Waiting Connection',
    DISCONNECTED: 'Disconnected',
    ERROR: 'Error',
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // No bot exists
  if (!bot) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-muted p-6 mb-6">
          <Bot className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No Bot Yet</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Create your WhatsApp bot to start automating conversations and managing messages.
        </p>
        <Button onClick={() => setCreateOpen(true)} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Create Your Bot
        </Button>
        <CreateBotDialog open={createOpen} onOpenChange={setCreateOpen} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bot Management</h1>
          <p className="text-muted-foreground">Manage your WhatsApp bot</p>
        </div>
        <Badge variant={statusColors[bot.status as keyof typeof statusColors]} className="text-sm">
          {statusText[bot.status as keyof typeof statusText]}
        </Badge>
      </div>

      {/* Bot Info Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-6 w-6" />
                <span>{bot.name}</span>
              </CardTitle>
              <CardDescription>{bot.phoneNumber}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {!bot.isActive ? (
                <>
                  <Button
                    onClick={() => handleStart('pairing')}
                    disabled={startMutation.isPending}
                    className="flex-1 sm:flex-none"
                  >
                    <Smartphone className="mr-2 h-4 w-4" />
                    Start (Pairing)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStart('qr')}
                    disabled={startMutation.isPending}
                    className="flex-1 sm:flex-none"
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    Start (QR)
                  </Button>
                </>
              ) : (
                <Button
                  variant="destructive"
                  onClick={() => stopMutation.mutate(bot.id)}
                  disabled={stopMutation.isPending}
                  className="flex-1 sm:flex-none"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => restartMutation.mutate(bot.id)}
                disabled={restartMutation.isPending}
              >
                <RotateCw className="mr-2 h-4 w-4" />
                Restart
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-primary/10 p-3">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{bot.totalMessages || 0}</p>
                <p className="text-sm text-muted-foreground">Messages</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{bot.totalCommands || 0}</p>
                <p className="text-sm text-muted-foreground">Commands</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{bot.totalGroups || 0}</p>
                <p className="text-sm text-muted-foreground">Groups</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview" className="flex-1 sm:flex-none">Overview</TabsTrigger>
          <TabsTrigger value="settings" className="flex-1 sm:flex-none">Settings</TabsTrigger>
          <TabsTrigger value="danger" className="flex-1 sm:flex-none">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bot Status</CardTitle>
              <CardDescription>Real-time bot information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Status</Label>
                  <p className="text-sm font-medium">{statusText[bot.status as keyof typeof statusText]}</p>
                </div>
                <div>
                  <Label>Active</Label>
                  <p className="text-sm font-medium">{bot.isActive ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-sm font-medium">{new Date(bot.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Last Seen</Label>
                  <p className="text-sm font-medium">
                    {bot.isActive ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bot Settings</CardTitle>
              <CardDescription>Configure your bot behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Reply</Label>
                  <p className="text-sm text-muted-foreground">Automatically reply to messages</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Commands</Label>
                  <p className="text-sm text-muted-foreground">Allow command execution</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="space-y-2">
                <Label>Command Prefix</Label>
                <Input defaultValue="!" placeholder="!" maxLength={1} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notify on Message</Label>
                  <p className="text-sm text-muted-foreground">Get notifications for new messages</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger" className="space-y-4">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border border-destructive p-4">
                <div>
                  <h3 className="font-semibold">Delete Bot</h3>
                  <p className="text-sm text-muted-foreground">
                    This will permanently delete your bot and all its data.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Are you sure? This action cannot be undone.')) {
                      deleteMutation.mutate(bot.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Bot
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Connection Dialog */}
      {bot && (
        <ConnectionDialog 
          open={connectionOpen} 
          onOpenChange={setConnectionOpen} 
          botId={bot.id}
          connectionType={connectionType}
        />
      )}
    </div>
  );
}
