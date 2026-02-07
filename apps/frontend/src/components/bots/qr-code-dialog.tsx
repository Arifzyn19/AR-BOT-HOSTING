'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { botsApi } from '@/lib/api/bots';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  botId: string;
}

export function QRCodeDialog({ open, onOpenChange, botId }: QRCodeDialogProps) {
  const [status, setStatus] = useState<'loading' | 'qr' | 'connected' | 'error'>('loading');

  const { data: qrData, isLoading, refetch } = useQuery({
    queryKey: ['bot-qr', botId],
    queryFn: () => botsApi.getQR(botId),
    enabled: open,
    refetchInterval: status === 'qr' ? 2000 : false, // Poll every 2s when showing QR
  });

  useEffect(() => {
    if (!open) {
      setStatus('loading');
      return;
    }

    if (isLoading) {
      setStatus('loading');
    } else if (qrData?.qrCode) {
      setStatus('qr');
    } else if (qrData?.status === 'CONNECTED') {
      setStatus('connected');
      setTimeout(() => onOpenChange(false), 2000); // Auto-close after 2s
    } else {
      setStatus('error');
    }
  }, [qrData, isLoading, open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan QR Code</DialogTitle>
          <DialogDescription>
            Open WhatsApp on your phone and scan this QR code to connect your bot
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          {status === 'loading' && (
            <div className="space-y-4 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating QR code...</p>
            </div>
          )}

          {status === 'qr' && qrData?.qrCode && (
            <div className="space-y-4">
              <div className="rounded-lg bg-white p-4">
                <QRCodeSVG value={qrData.qrCode} size={256} level="H" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Steps to connect:</p>
                <ol className="mt-2 space-y-1 text-left text-sm text-muted-foreground">
                  <li>1. Open WhatsApp on your phone</li>
                  <li>2. Tap Menu or Settings</li>
                  <li>3. Tap Linked Devices</li>
                  <li>4. Tap Link a Device</li>
                  <li>5. Point your phone at this screen</li>
                </ol>
              </div>
            </div>
          )}

          {status === 'connected' && (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
              <div>
                <p className="font-semibold">Connected!</p>
                <p className="text-sm text-muted-foreground">Your bot is now connected to WhatsApp</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4 text-center">
              <XCircle className="mx-auto h-16 w-16 text-destructive" />
              <div>
                <p className="font-semibold">Connection Failed</p>
                <p className="text-sm text-muted-foreground">Please try again</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
