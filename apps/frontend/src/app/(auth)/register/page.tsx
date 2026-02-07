import Link from 'next/link';
import { Bot } from 'lucide-react';
import { RegisterForm } from '@/components/auth/register-form';
import { BackendStatus } from '@/components/shared/backend-status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterPage() {
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
            <CardTitle>Daftar</CardTitle>
            <CardDescription>
              Buat akun baru untuk memulai hosting bot WhatsApp Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Sudah punya akun? </span>
              <Link href="/login" className="text-primary hover:underline">
                Login disini
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
