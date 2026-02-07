'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Play, Square, RotateCw, Trash2, Settings, MessageSquare, Users } from 'lucide-react';
import Link from 'next/link';
import type { Bot as BotType } from '@/lib/api/bots';

interface BotCardProps {
  bot: BotType;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onRestart: (id: string) => void;
  onDelete: (id: string) => void;
}

const statusColors = {
  CONNECTED: 'success',
  CONNECTING: 'warning',
  QR_REQUIRED: 'warning',
  DISCONNECTED: 'outline',
  ERROR: 'destructive',
} as const;

const statusText = {
  CONNECTED: 'Terhubung',
  CONNECTING: 'Menghubungkan',
  QR_REQUIRED: 'Perlu QR',
  DISCONNECTED: 'Terputus',
  ERROR: 'Error',
};

export function BotCard({ bot, onStart, onStop, onRestart, onDelete }: BotCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span>{bot.name}</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">{bot.phoneNumber}</p>
        </div>
        <Badge variant={statusColors[bot.status as keyof typeof statusColors]}>
          {statusText[bot.status as keyof typeof statusText]}
        </Badge>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2 text-sm">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Pesan:</span>
            <span className="font-medium">{bot.totalMessages}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Grup:</span>
            <span className="font-medium">{bot.totalGroups}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {!bot.isActive ? (
            <Button size="sm" onClick={() => onStart(bot.id)}>
              <Play className="h-4 w-4 mr-1" />
              Start
            </Button>
          ) : (
            <Button size="sm" variant="destructive" onClick={() => onStop(bot.id)}>
              <Square className="h-4 w-4 mr-1" />
              Stop
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onRestart(bot.id)}>
            <RotateCw className="h-4 w-4 mr-1" />
            Restart
          </Button>
          <Link href={`/dashboard/bots/${bot.id}`}>
            <Button size="sm" variant="outline">
              <Settings className="h-4 w-4 mr-1" />
              Detail
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(bot.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
