# 🤖 WhatsApp Bot Hosting Platform

Platform hosting WhatsApp bot modern yang memungkinkan pengguna membuat, mengelola, dan memonitor instance bot WhatsApp mereka sendiri.

## 📋 Tech Stack

### Backend
- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL + Redis
- **ORM:** Prisma
- **Authentication:** Passport.js dengan JWT
- **Real-time:** Socket.IO
- **Queue:** Bull
- **WhatsApp Client:** @whiskeysockets/baileys

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **UI:** shadcn/ui + Tailwind CSS
- **State:** Zustand
- **Forms:** React Hook Form + Zod
- **API:** TanStack Query

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL
- Redis

### Installation

1. **Clone repository**
```bash
git clone <repository-url>
cd bot-hosting-platform
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Setup environment variables**

Backend (\`apps/backend/.env\`):
```bash
cp apps/backend/.env.example apps/backend/.env
# Edit .env dengan konfigurasi Anda
```

Frontend (\`apps/frontend/.env.local\`):
```bash
cp apps/frontend/.env.example apps/frontend/.env.local
```

4. **Setup database**
```bash
cd apps/backend
pnpm prisma generate
pnpm prisma migrate dev
```

5. **Run development servers**
```bash
# Dari root directory
pnpm dev
```

Backend akan berjalan di: http://localhost:3001
Frontend akan berjalan di: http://localhost:3000
API Documentation: http://localhost:3001/api/docs

## 📁 Project Structure

```
bot-hosting-platform/
├── apps/
│   ├── backend/          # NestJS Backend
│   └── frontend/         # Next.js Frontend
├── packages/
│   ├── shared-types/     # Shared TypeScript types
│   └── shared-utils/     # Shared utilities
├── docker/               # Docker configurations
└── .github/              # CI/CD workflows
```

## 🛠️ Development

### Backend Commands
```bash
cd apps/backend

# Development
pnpm dev

# Build
pnpm build

# Test
pnpm test

# Prisma
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:studio
```

### Frontend Commands
```bash
cd apps/frontend

# Development
pnpm dev

# Build
pnpm build

# Lint
pnpm lint
```

## 📚 API Documentation

Setelah menjalankan backend, akses dokumentasi API Swagger di:
http://localhost:3001/api/docs

## 🔐 Authentication

Platform menggunakan JWT untuk autentikasi. Tersedia metode login:
- Email & Password
- Google OAuth (konfigurasi diperlukan)
- GitHub OAuth (konfigurasi diperlukan)

## 🎨 UI Theme

- **Style:** Modern, clean, minimalist
- **Color Scheme:** Dark theme
  - Background: #0a0a0a
  - Surface: #1a1a1a
  - Accent: #3b82f6
- **NO GRADIENTS** - solid colors only
- **Typography:** Inter font

## 📦 Features

- ✅ User authentication (local + OAuth)
- ✅ Create dan manage WhatsApp bots
- ✅ QR code authentication
- ✅ Real-time updates via WebSocket
- ✅ Role-based access control
- ✅ Subscription management
- ✅ Admin panel
- ✅ Bot statistics & analytics
- ✅ Logs viewer

## 🔄 Development Workflow

1. **Buat branch baru**
```bash
git checkout -b feature/nama-fitur
```

2. **Kembangkan fitur**
3. **Test**
4. **Commit**
```bash
git commit -m "feat: deskripsi fitur"
```

5. **Push dan buat PR**
```bash
git push origin feature/nama-fitur
```

## 📝 License

MIT License

## 🙏 Acknowledgments

- NestJS
- Next.js
- Baileys WhatsApp Client
- shadcn/ui
