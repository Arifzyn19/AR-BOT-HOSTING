'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

export function BackendStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [error, setError] = useState('');

  useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = async () => {
    try {
      setStatus('checking');
      // Try to hit a public endpoint (adjust if needed)
      await apiClient.get('/health', { timeout: 3000 });
      setStatus('connected');
    } catch (err) {
      console.error('Backend check failed:', err);
      setStatus('error');
      setError('Backend tidak dapat dijangkau. Pastikan backend berjalan di port 3001.');
    }
  };

  if (status === 'checking') {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Checking backend...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Backend Offline</p>
            <p className="text-xs text-destructive/80 mt-1">{error}</p>
            <button
              onClick={checkBackend}
              className="text-xs underline text-destructive mt-2"
            >
              Coba lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-green-600">
      <CheckCircle className="h-4 w-4" />
      <span>Backend terhubung</span>
    </div>
  );
}
