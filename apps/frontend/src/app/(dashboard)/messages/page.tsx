'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, MessageSquare, User, Users, Calendar } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { format } from 'date-fns';

interface Message {
  id: string;
  from: string;
  content: string;
  isGroup: boolean;
  timestamp: string;
  type: string;
}

export default function MessagesPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'private' | 'group'>('all');

  const { data: bot } = useQuery({
    queryKey: ['bots'],
    queryFn: async () => {
      const response = await apiClient.get('/bots');
      return response.data[0]; // Get first bot
    },
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', bot?.id],
    queryFn: async () => {
      if (!bot?.id) return [];
      const response = await apiClient.get(`/bots/${bot.id}/messages`);
      return response.data;
    },
    enabled: !!bot?.id,
    refetchInterval: 5000, // Refresh every 5s
  });

  const filteredMessages = messages?.filter((msg: Message) => {
    const matchesSearch = msg.content.toLowerCase().includes(search.toLowerCase()) ||
                         msg.from.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'private' ? !msg.isGroup :
      filter === 'group' ? msg.isGroup : true;

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: messages?.length || 0,
    private: messages?.filter((m: Message) => !m.isGroup).length || 0,
    group: messages?.filter((m: Message) => m.isGroup).length || 0,
  };

  if (!bot) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Bot Found</h3>
          <p className="text-muted-foreground">Create a bot first to view messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground">View all incoming messages</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Private Chats</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.private}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Group Chats</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.group}</div>
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
                placeholder="Search messages..."
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
                variant={filter === 'private' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('private')}
              >
                <User className="mr-2 h-4 w-4" />
                Private
              </Button>
              <Button
                variant={filter === 'group' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('group')}
              >
                <Users className="mr-2 h-4 w-4" />
                Groups
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredMessages && filteredMessages.length > 0 ? (
            <div className="space-y-4">
              {filteredMessages.map((message: Message) => (
                <div
                  key={message.id}
                  className="flex items-start space-x-4 rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    {message.isGroup ? (
                      <Users className="h-5 w-5 text-primary" />
                    ) : (
                      <User className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{message.from}</p>
                        {message.isGroup && (
                          <Badge variant="outline" className="text-xs">
                            Group
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(message.timestamp), 'MMM dd, HH:mm')}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No messages yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
