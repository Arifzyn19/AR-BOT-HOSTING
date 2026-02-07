'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, FileText, AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { format } from 'date-fns';

interface Log {
  id: string;
  level: string;
  event: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export default function LogsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');

  const { data: bot } = useQuery({
    queryKey: ['bots'],
    queryFn: async () => {
      const response = await apiClient.get('/bots');
      return response.data[0];
    },
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ['logs', bot?.id],
    queryFn: async () => {
      if (!bot?.id) return [];
      const response = await apiClient.get(`/bots/${bot.id}/logs?limit=100`);
      return response.data;
    },
    enabled: !!bot?.id,
    refetchInterval: 5000,
  });

  const filteredLogs = logs?.filter((log: Log) => {
    const matchesSearch = log.message.toLowerCase().includes(search.toLowerCase()) ||
                         log.event.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = filter === 'all' ? true : log.level === filter;

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: logs?.length || 0,
    info: logs?.filter((l: Log) => l.level === 'info').length || 0,
    warn: logs?.filter((l: Log) => l.level === 'warn').length || 0,
    error: logs?.filter((l: Log) => l.level === 'error').length || 0,
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getLevelBadge = (level: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      info: 'default',
      warn: 'secondary',
      error: 'destructive',
    };
    return <Badge variant={variants[level] || 'outline'}>{level.toUpperCase()}</Badge>;
  };

  if (!bot) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Bot Found</h3>
          <p className="text-muted-foreground">Create a bot first to view logs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Activity Logs</h1>
        <p className="text-muted-foreground">Monitor bot activity and events</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Info</CardTitle>
            <Info className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.info}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.warn}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.error}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'info' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('info')}
              >
                <Info className="mr-2 h-4 w-4" />
                Info
              </Button>
              <Button
                variant={filter === 'warn' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('warn')}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Warn
              </Button>
              <Button
                variant={filter === 'error' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('error')}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Error
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredLogs && filteredLogs.length > 0 ? (
            <div className="space-y-3">
              {filteredLogs.map((log: Log) => (
                <div
                  key={log.id}
                  className="flex items-start space-x-4 rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="pt-0.5">{getLevelIcon(log.level)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getLevelBadge(log.level)}
                        <span className="text-sm font-medium">{log.event}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.message}</p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Show metadata
                        </summary>
                        <pre className="mt-2 rounded bg-muted p-2 overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No logs yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
