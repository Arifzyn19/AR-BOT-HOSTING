import Link from 'next/link';
import { Bot } from 'lucide-react';
import { LoginForm } from '@/components/auth/login-form';
import { BackendStatus } from '@/components/shared/backend-status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center space-x-2">
            <Bot className="h-10 w-10 text-primary" />
            <span className="text-2xl font-bold">BotHosting</span>
          </Link>
        </div>

        <BackendStatus />

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Masuk ke akun Anda untuk mengelola bot WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Belum punya akun? </span>
              <Link href="/register" className="text-primary hover:underline">
                Daftar sekarang
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
