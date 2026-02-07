import Link from 'next/link';
import { Bot, Zap, Shield, BarChart } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Bot className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">BotHosting</span>
          </div>
          <div className="flex space-x-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm hover:text-primary transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Host Your WhatsApp Bots
          <br />
          <span className="text-primary">With Ease</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Create, manage, and monitor your WhatsApp bot instances with our modern hosting platform.
          Real-time updates, comprehensive analytics, and powerful automation.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            href="/register"
            className="px-8 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Start Free Trial
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 border border-border rounded-md hover:bg-secondary transition-colors"
          >
            View Demo
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="p-6 border border-border rounded-lg bg-card">
            <Bot className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Easy Setup</h3>
            <p className="text-muted-foreground">
              Create and deploy WhatsApp bots in minutes with our simple QR code authentication.
            </p>
          </div>
          <div className="p-6 border border-border rounded-lg bg-card">
            <Zap className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Real-time Updates</h3>
            <p className="text-muted-foreground">
              Monitor your bots with live status updates and instant notifications.
            </p>
          </div>
          <div className="p-6 border border-border rounded-lg bg-card">
            <Shield className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Secure & Reliable</h3>
            <p className="text-muted-foreground">
              Enterprise-grade security with encrypted sessions and reliable uptime.
            </p>
          </div>
          <div className="p-6 border border-border rounded-lg bg-card">
            <BarChart className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Analytics</h3>
            <p className="text-muted-foreground">
              Track messages, commands, and performance with detailed analytics.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2024 BotHosting Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
