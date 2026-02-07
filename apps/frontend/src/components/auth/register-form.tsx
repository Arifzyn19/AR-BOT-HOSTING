'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/auth-store';
import { Loader2, AlertCircle } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  username: z.string().min(3, 'Username minimal 3 karakter').optional().or(z.literal('')),
  name: z.string().min(2, 'Nama minimal 2 karakter').optional().or(z.literal('')),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError('');

    try {
      console.log('📝 Attempting registration...', { email: data.email });
      const { confirmPassword, ...registerData } = data;
      
      // Remove empty optional fields
      const cleanData = {
        email: registerData.email,
        password: registerData.password,
        ...(registerData.username && { username: registerData.username }),
        ...(registerData.name && { name: registerData.name }),
      };
      
      const response = await authApi.register(cleanData);
      console.log('✅ Registration successful!', response.user);
      
      setAuth(response.user, response.accessToken, response.refreshToken);
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        router.push('/dashboard');
      }, 100);
    } catch (err: unknown) {
      console.error('❌ Registration failed:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Registrasi gagal. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="nama@example.com"
          disabled={isLoading}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username (Opsional)</Label>
        <Input
          id="username"
          type="text"
          placeholder="username"
          disabled={isLoading}
          {...register('username')}
        />
        {errors.username && (
          <p className="text-sm text-destructive">{errors.username.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nama (Opsional)</Label>
        <Input
          id="name"
          type="text"
          placeholder="Nama Lengkap"
          disabled={isLoading}
          {...register('name')}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          disabled={isLoading}
          {...register('password')}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          disabled={isLoading}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      {error && (
        <div className="flex items-start space-x-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? 'Memproses...' : 'Daftar'}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Pastikan backend sudah berjalan di port 3001
      </p>
    </form>
  );
}
