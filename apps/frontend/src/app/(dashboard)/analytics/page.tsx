'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, MessageSquare, Activity, Users, Calendar } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  const { data: bot } = useQuery({
    queryKey: ['bots'],
    queryFn: async () => {
      const response = await apiClient.get('/bots');
      return response.data[0];
    },
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics', bot?.id, timeRange],
    queryFn: async () => {
      if (!bot?.id) return null;
      // Mock data - replace with real API
      return {
        messages: {
          total: 1247,
          change: 12.5,
          data: [
            { date: 'Mon', count: 156 },
            { date: 'Tue', count: 189 },
            { date: 'Wed', count: 178 },
            { date: 'Thu', count: 203 },
            { date: 'Fri', count: 234 },
            { date: 'Sat', count: 145 },
            { date: 'Sun', count: 142 },
          ],
        },
        commands: {
          total: 423,
          change: 8.2,
          data: [
            { date: 'Mon', count: 52 },
            { date: 'Tue', count: 61 },
            { date: 'Wed', count: 58 },
            { date: 'Thu', count: 67 },
            { date: 'Fri', count: 72 },
            { date: 'Sat', count: 56 },
            { date: 'Sun', count: 57 },
          ],
        },
        groups: {
          total: 24,
          change: 4.2,
        },
        topCommands: [
          { name: 'help', count: 156 },
          { name: 'info', count: 98 },
          { name: 'status', count: 67 },
          { name: 'ping', count: 45 },
          { name: 'menu', count: 34 },
        ],
      };
    },
    enabled: !!bot?.id,
  });

  if (!bot) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Bot Found</h3>
          <p className="text-muted-foreground">Create a bot first to view analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Bot performance insights</p>
        </div>
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
          <TabsList>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.messages.total}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analytics?.messages.change && analytics.messages.change > 0 ? (
                <>
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  <span className="text-green-500">+{analytics.messages.change}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                  <span className="text-red-500">{analytics?.messages.change}%</span>
                </>
              )}
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Commands Executed</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.commands.total}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500">+{analytics?.commands.change}%</span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.groups.total}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500">+{analytics?.groups.change}%</span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Messages Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Messages Over Time</CardTitle>
            <CardDescription>Daily message count</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.messages.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="date" stroke="#a0a0a0" />
                <YAxis stroke="#a0a0a0" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                  }}
                />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Commands Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Commands Over Time</CardTitle>
            <CardDescription>Daily command execution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.commands.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="date" stroke="#a0a0a0" />
                <YAxis stroke="#a0a0a0" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Commands */}
      <Card>
        <CardHeader>
          <CardTitle>Top Commands</CardTitle>
          <CardDescription>Most used commands</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics?.topCommands.map((cmd: { name: string; count: number }, index: number) => (
              <div key={cmd.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                  <span className="font-medium">!{cmd.name}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${(cmd.count / analytics.topCommands[0].count) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{cmd.count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
