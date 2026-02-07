# 🚀 Production Deployment Guide

## Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Domain name (optional but recommended)
- VPS/Cloud server (Ubuntu 22.04 recommended)

---

## 1. Server Setup (Ubuntu 22.04)

### Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pnpm pm2
```

### Install PostgreSQL
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql
CREATE DATABASE bothosting;
CREATE USER botuser WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE bothosting TO botuser;
\q
```

### Install Nginx
```bash
sudo apt install nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 2. Clone & Setup Project

```bash
cd /var/www
sudo git clone https://github.com/yourusername/bot-hosting-platform.git
cd bot-hosting-platform
sudo chown -R $USER:$USER .

pnpm install
```

---

## 3. Environment Configuration

### Backend (.env)
```bash
cd apps/backend
nano .env
```

```env
# Database
DATABASE_URL="postgresql://botuser:your_secure_password@localhost:5432/bothosting"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV="production"
FRONTEND_URL="https://yourdomain.com"

# Google OAuth (Get from https://console.cloud.google.com)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="https://api.yourdomain.com/api/v1/auth/google/callback"

# GitHub OAuth (Get from https://github.com/settings/developers)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GITHUB_CALLBACK_URL="https://api.yourdomain.com/api/v1/auth/github/callback"
```

### Frontend (.env.local)
```bash
cd ../frontend
nano .env.local
```

```env
NEXT_PUBLIC_API_URL="https://api.yourdomain.com/api/v1"
```

---

## 4. Build Applications

```bash
# Build backend
cd apps/backend
pnpm prisma:generate
pnpm prisma:migrate deploy
pnpm build

# Build frontend
cd ../frontend
pnpm build
```

---

## 5. Setup PM2 (Process Manager)

### Create ecosystem file
```bash
cd /var/www/bot-hosting-platform
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'bot-backend',
      script: 'apps/backend/dist/main.js',
      cwd: '/var/www/bot-hosting-platform',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/var/log/pm2/bot-backend-error.log',
      out_file: '/var/log/pm2/bot-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'bot-frontend',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: '/var/www/bot-hosting-platform/apps/frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/pm2/bot-frontend-error.log',
      out_file: '/var/log/pm2/bot-frontend-out.log',
    },
  ],
};
```

### Start applications
```bash
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 6. Nginx Configuration

### Backend API (api.yourdomain.com)
```bash
sudo nano /etc/nginx/sites-available/bot-api
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### Frontend (yourdomain.com)
```bash
sudo nano /etc/nginx/sites-available/bot-frontend
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Enable sites
```bash
sudo ln -s /etc/nginx/sites-available/bot-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/bot-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 7. SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx

# Get certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo systemctl status certbot.timer
```

---

## 8. Firewall Setup

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 9. OAuth Setup

### Google OAuth
1. Go to https://console.cloud.google.com
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI:
   - `https://api.yourdomain.com/api/v1/auth/google/callback`
6. Copy Client ID & Secret to `.env`

### GitHub OAuth
1. Go to https://github.com/settings/developers
2. New OAuth App
3. Authorization callback URL:
   - `https://api.yourdomain.com/api/v1/auth/github/callback`
4. Copy Client ID & Secret to `.env`

---

## 10. Monitoring & Logs

### View PM2 logs
```bash
pm2 logs
pm2 logs bot-backend
pm2 logs bot-frontend
```

### View Nginx logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Monitor processes
```bash
pm2 status
pm2 monit
```

---

## 11. Updates & Maintenance

### Update application
```bash
cd /var/www/bot-hosting-platform
git pull
pnpm install

# Rebuild
cd apps/backend && pnpm build
cd apps/frontend && pnpm build

# Restart
pm2 restart all
```

### Database migrations
```bash
cd apps/backend
pnpm prisma:migrate deploy
pm2 restart bot-backend
```

---

## 12. Backup Strategy

### Database backup
```bash
# Create backup script
sudo nano /usr/local/bin/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -U botuser bothosting > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

```bash
sudo chmod +x /usr/local/bin/backup-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-db.sh
```

---

## 13. Performance Optimization

### Enable Gzip in Nginx
```bash
sudo nano /etc/nginx/nginx.conf
```

Add:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### PM2 Cluster Mode
Backend already configured for 2 instances in `ecosystem.config.js`

---

## 14. Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secret
- [ ] Enable firewall
- [ ] Install fail2ban
- [ ] Regular security updates
- [ ] Database backups automated
- [ ] SSL certificates auto-renew
- [ ] Environment variables secured
- [ ] Rate limiting enabled
- [ ] CORS configured properly

---

## 15. Troubleshooting

### Backend won't start
```bash
pm2 logs bot-backend
cd apps/backend && pnpm start
```

### Frontend 502 error
```bash
pm2 restart bot-frontend
sudo systemctl restart nginx
```

### Database connection failed
```bash
sudo systemctl status postgresql
psql -U botuser -d bothosting -h localhost
```

### Check disk space
```bash
df -h
du -sh /var/www/bot-hosting-platform/*
```

---

## 16. Quick Commands Reference

```bash
# PM2
pm2 list               # List all processes
pm2 restart all        # Restart all
pm2 stop all          # Stop all
pm2 delete all        # Delete all
pm2 save              # Save current list

# Nginx
sudo systemctl restart nginx
sudo nginx -t         # Test configuration

# PostgreSQL
sudo systemctl restart postgresql
psql -U botuser -d bothosting

# Logs
pm2 logs
tail -f /var/log/nginx/error.log
```

---

## Support

For issues:
1. Check logs: `pm2 logs`
2. Check system: `pm2 monit`
3. Check nginx: `sudo nginx -t`
4. Check database: `psql -U botuser -d bothosting`

---

🎉 **Your bot hosting platform is now live in production!**

Access: https://yourdomain.com
API: https://api.yourdomain.com
Docs: https://api.yourdomain.com/api/docs
