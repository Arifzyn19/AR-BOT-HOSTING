'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      // Get user info
      apiClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
        .then((res) => {
          setAuth(res.data, accessToken, refreshToken);
          router.push('/dashboard');
        })
        .catch(() => {
          router.push('/login?error=auth_failed');
        });
    } else {
      router.push('/login?error=no_tokens');
    }
  }, [searchParams, setAuth, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}
