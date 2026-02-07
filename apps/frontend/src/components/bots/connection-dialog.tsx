'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { botsApi } from '@/lib/api/bots';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, CheckCircle2, XCircle, Smartphone, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  botId: string;
  connectionType: 'pairing' | 'qr';
}

export function ConnectionDialog({ open, onOpenChange, botId, connectionType }: ConnectionDialogProps) {
  const [status, setStatus] = useState<'loading' | 'code' | 'connected' | 'error'>('loading');
  const [copied, setCopied] = useState(false);

  const { data: connectionData, isLoading, refetch } = useQuery({
    queryKey: ['bot-connection', botId],
    queryFn: () => botsApi.getQR(botId),
    enabled: open,
    refetchInterval: status === 'code' ? 2000 : status === 'loading' ? 1000 : false, // Poll every 1s while loading
  });

  useEffect(() => {
    if (!open) {
      setStatus('loading');
      setCopied(false);
      return;
    }

    if (isLoading) {
      setStatus('loading');
    } else if (connectionData) {
      // Check if connected
      if (connectionData.status === 'CONNECTED') {
        setStatus('connected');
        setTimeout(() => onOpenChange(false), 2000);
        return;
      }

      // Check if we have connection data
      if (connectionData.qrCode) {
        // For pairing: qrCode is the 8-digit code (short string)
        // For QR: qrCode is base64 data URL (long string)
        const isPairingCode = connectionData.qrCode.length < 20; // Pairing codes are short
        
        if (connectionType === 'pairing' && isPairingCode) {
          setStatus('code');
        } else if (connectionType === 'qr' && !isPairingCode) {
          setStatus('code');
        } else {
          setStatus('loading'); // Still waiting for correct type
        }
      } else {
        setStatus('loading');
      }
    } else {
      setStatus('error');
    }
  }, [connectionData, isLoading, open, onOpenChange, connectionType]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {connectionType === 'pairing' ? 'Enter Pairing Code' : 'Scan QR Code'}
          </DialogTitle>
          <DialogDescription>
            {connectionType === 'pairing' 
              ? 'Enter this code in WhatsApp to link your device'
              : 'Open WhatsApp and scan this QR code to connect your bot'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          {status === 'loading' && (
            <div className="space-y-4 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {connectionType === 'pairing' ? 'Generating pairing code...' : 'Generating QR code...'}
              </p>
            </div>
          )}

          {status === 'code' && connectionData?.qrCode && (
            <div className="space-y-6 w-full">
              {connectionType === 'pairing' && connectionData.qrCode.length < 20 ? (
                // Pairing Code Display
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted p-6 text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Smartphone className="h-6 w-6 text-primary" />
                      <p className="text-sm font-medium">Pairing Code</p>
                    </div>
                    <div className="text-4xl font-bold tracking-widest my-4 font-mono">
                      {connectionData.qrCode}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(connectionData.qrCode)}
                      className="mt-2"
                    >
                      {copied ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Code
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="text-left space-y-2">
                    <p className="text-sm font-medium">Steps:</p>
                    <ol className="space-y-1 text-sm text-muted-foreground">
                      <li>1. Open WhatsApp on your phone</li>
                      <li>2. Tap Menu (⋮) → Linked Devices</li>
                      <li>3. Tap "Link a Device"</li>
                      <li>4. Tap "Link with phone number instead"</li>
                      <li>5. Enter the code above</li>
                    </ol>
                  </div>
                </div>
              ) : connectionData.qrCode.startsWith('data:image') ? (
                // QR Code Display (base64 image)
                <div className="space-y-4">
                  <div className="rounded-lg bg-white p-4 mx-auto w-fit">
                    <img 
                      src={connectionData.qrCode} 
                      alt="QR Code"
                      className="w-64 h-64"
                    />
                  </div>
                  <div className="text-left space-y-2">
                    <p className="text-sm font-medium">Steps:</p>
                    <ol className="space-y-1 text-sm text-muted-foreground">
                      <li>1. Open WhatsApp on your phone</li>
                      <li>2. Tap Menu (⋮) or Settings</li>
                      <li>3. Tap "Linked Devices"</li>
                      <li>4. Tap "Link a Device"</li>
                      <li>5. Point your phone at this screen</li>
                    </ol>
                  </div>
                </div>
              ) : (
                // Fallback: Try to render as QR if it's a plain string
                <div className="space-y-4">
                  <div className="rounded-lg bg-white p-4 mx-auto w-fit">
                    <QRCodeSVG value={connectionData.qrCode} size={256} level="H" />
                  </div>
                  <div className="text-left space-y-2">
                    <p className="text-sm font-medium">Steps:</p>
                    <ol className="space-y-1 text-sm text-muted-foreground">
                      <li>1. Open WhatsApp on your phone</li>
                      <li>2. Tap Menu (⋮) or Settings</li>
                      <li>3. Tap "Linked Devices"</li>
                      <li>4. Tap "Link a Device"</li>
                      <li>5. Point your phone at this screen</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}

          {status === 'connected' && (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
              <div>
                <p className="font-semibold text-lg">Connected!</p>
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
              <Button onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
