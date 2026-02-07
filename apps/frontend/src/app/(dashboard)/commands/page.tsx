'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Command, Activity, Search, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface CommandData {
  id: string;
  name: string;
  description: string;
  category: string;
  aliases: string[];
  isActive: boolean;
  adminOnly: boolean;
  groupOnly: boolean;
  usageCount: number;
  lastUsed: Date | null;
}

export default function CommandsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: bot } = useQuery({
    queryKey: ['bots'],
    queryFn: async () => {
      const res = await apiClient.get('/bots');
      return res.data[0];
    },
  });

  const { data: commands, isLoading } = useQuery({
    queryKey: ['commands', bot?.id],
    queryFn: async () => {
      if (!bot) return [];
      const res = await apiClient.get(`/bots/${bot.id}/commands`);
      return res.data as CommandData[];
    },
    enabled: !!bot,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiClient.patch(`/bots/${bot?.id}/commands/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commands'] });
    },
  });

  const reloadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/bots/${bot?.id}/reload-plugins`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commands'] });
    },
  });

  const filteredCommands = commands?.filter((cmd) => {
    const matchesSearch = cmd.name.toLowerCase().includes(search.toLowerCase()) ||
                         cmd.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || cmd.category === filter;
    return matchesSearch && matchesFilter;
  });

  const categories = Array.from(new Set(commands?.map(c => c.category) || []));

  const categoryColors: Record<string, string> = {
    admin: 'destructive',
    group: 'default',
    general: 'secondary',
    utility: 'outline',
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Commands</h1>
          <p className="text-muted-foreground">Manage bot commands</p>
        </div>
        <Button
          onClick={() => reloadMutation.mutate()}
          disabled={reloadMutation.isPending}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${reloadMutation.isPending ? 'animate-spin' : ''}`} />
          Reload Plugins
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commands</CardTitle>
            <Command className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{commands?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {commands?.filter(c => c.isActive).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {commands?.reduce((sum, c) => sum + c.usageCount, 0) || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Command className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search commands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={filter === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commands List */}
      <div className="grid gap-4">
        {filteredCommands?.map((cmd) => (
          <Card key={cmd.id}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">!{cmd.name}</h3>
                  <Badge variant={categoryColors[cmd.category] as any}>
                    {cmd.category}
                  </Badge>
                  {cmd.adminOnly && <Badge variant="destructive">Admin</Badge>}
                  {cmd.groupOnly && <Badge variant="outline">Group Only</Badge>}
                  {cmd.aliases.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      Aliases: {cmd.aliases.join(', ')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{cmd.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Used {cmd.usageCount} times</span>
                  {cmd.lastUsed && (
                    <span>Last used: {new Date(cmd.lastUsed).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Switch
                  checked={cmd.isActive}
                  onCheckedChange={(checked) => 
                    toggleMutation.mutate({ id: cmd.id, isActive: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCommands?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No commands found</p>
        </div>
      )}
    </div>
  );
}
