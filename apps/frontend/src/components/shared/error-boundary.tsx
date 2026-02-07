'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error('Error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle>Oops! Terjadi Kesalahan</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Maaf, ada yang tidak beres. Silakan coba lagi.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs font-mono text-destructive">{error.message}</p>
            </div>
          )}
          <div className="flex space-x-2">
            <Button onClick={reset} className="flex-1">
              Coba Lagi
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = '/')}>
              Kembali ke Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
