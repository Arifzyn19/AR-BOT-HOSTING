'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, MessageSquare, Users, Activity, TrendingUp, ArrowRight } from 'lucide-react';
import { botsApi } from '@/lib/api/bots';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const { data: bots } = useQuery({
    queryKey: ['bots'],
    queryFn: botsApi.getAll,
  });

  const bot = bots?.[0];

  const { data: userStats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/users/stats');
      return response.data;
    },
  });

  const stats = [
    {
      title: 'Bot Status',
      value: bot?.isActive ? 'Active' : 'Inactive',
      icon: Bot,
      description: bot ? bot.name : 'No bot yet',
      color: bot?.isActive ? 'text-green-500' : 'text-gray-500',
      href: '/dashboard/bot',
    },
    {
      title: 'Total Messages',
      value: bot?.totalMessages || 0,
      icon: MessageSquare,
      description: 'Messages received',
      color: 'text-blue-500',
      href: '/dashboard/messages',
    },
    {
      title: 'Commands',
      value: bot?.totalCommands || 0,
      icon: Activity,
      description: 'Commands executed',
      color: 'text-purple-500',
      href: '/dashboard/analytics',
    },
    {
      title: 'Groups',
      value: bot?.totalGroups || 0,
      icon: Users,
      description: 'Groups joined',
      color: 'text-orange-500',
      href: '/dashboard/bot',
    },
  ];

  const statusColors = {
    CONNECTED: 'success',
    CONNECTING: 'warning',
    QR_REQUIRED: 'warning',
    DISCONNECTED: 'outline',
    ERROR: 'destructive',
  } as const;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your bot overview.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Bot Overview */}
      {bot ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Bot Overview</CardTitle>
              <Badge variant={statusColors[bot.status as keyof typeof statusColors]}>
                {bot.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Bot Name</p>
                  <p className="text-2xl font-bold">{bot.name}</p>
                </div>
                <Link href="/dashboard/bot">
                  <Button>
                    Manage Bot
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-medium">{bot.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{new Date(bot.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{bot.isActive ? 'Online' : 'Offline'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Bot Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your WhatsApp bot to start automating conversations
              </p>
              <Link href="/dashboard/bot">
                <Button>Create Your Bot</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/messages">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                View Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Check all incoming messages from your bot
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/analytics">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                View Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                See detailed insights and statistics
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/settings">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Bot Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure bot behavior and preferences
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
