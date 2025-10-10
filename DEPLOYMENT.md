# 🚀 Production Deployment Guide

Complete guide for deploying the AI Drive-Thru system to production.

## 📋 Pre-Deployment Checklist

### Required
- [ ] OpenAI API key with GPT-4o Realtime access
- [ ] Production domain (e.g., drivethru.yourdomain.com)
- [ ] SSL certificate for secure WebSocket (WSS)
- [ ] Database setup (PostgreSQL/MongoDB)
- [ ] Payment gateway (if accepting payments)

### Recommended
- [ ] Error tracking service (Sentry, LogRocket)
- [ ] Analytics (Google Analytics, Plausible)
- [ ] CDN for static assets (Cloudflare, Vercel)
- [ ] Uptime monitoring (UptimeRobot, Pingdom)

## 🌐 Deployment Options

### Option 1: Vercel + Railway (Recommended)

**Best for**: Quick deployment with minimal setup

#### Step 1: Deploy Next.js to Vercel

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure build settings:
     ```
     Framework Preset: Next.js
     Build Command: npm run build
     Output Directory: .next
     Install Command: npm install
     ```

3. **Add Environment Variables**:
   ```
   NEXT_PUBLIC_OPENAI_API_KEY=sk-...
   NEXT_PUBLIC_WS_URL=wss://your-ws-server.railway.app
   NODE_ENV=production
   ```

4. **Deploy**: Click "Deploy"

#### Step 2: Deploy WebSocket Server to Railway

1. **Create Railway Account**: [railway.app](https://railway.app)

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Service**:
   - Add `railway.json` to your project:
   ```json
   {
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "cd server && bun run websocket-server.ts",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

4. **Add Environment Variables**:
   ```
   WS_PORT=3001
   NODE_ENV=production
   ```

5. **Get Public URL**:
   - Railway will provide a public URL
   - Copy it (e.g., `your-ws-server.railway.app`)
   - Update Vercel's `NEXT_PUBLIC_WS_URL` to `wss://your-ws-server.railway.app`

### Option 2: AWS (Full Control)

**Best for**: Enterprise deployments with custom requirements

#### Architecture

```
┌─────────────────┐
│  CloudFront CDN │
└────────┬────────┘
         │
┌────────▼────────┐
│   Application   │
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│  ECS  │ │  ECS  │  (Next.js containers)
└───┬───┘ └───────┘
    │
┌───▼───────────┐
│  WebSocket    │
│    Server     │  (EC2 or ECS)
└───┬───────────┘
    │
┌───▼───────────┐
│      RDS      │  (PostgreSQL)
└───────────────┘
```

#### Setup Steps

1. **Create ECR Repository**:
```bash
aws ecr create-repository --repository-name drive-thru-ai
```

2. **Build and Push Docker Image**:
```bash
# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
EOF

# Build and push
docker build -t drive-thru-ai .
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag drive-thru-ai:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/drive-thru-ai:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/drive-thru-ai:latest
```

3. **Create ECS Task Definition**:
```json
{
  "family": "drive-thru-ai",
  "containerDefinitions": [
    {
      "name": "nextjs",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/drive-thru-ai:latest",
      "memory": 2048,
      "cpu": 1024,
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NEXT_PUBLIC_OPENAI_API_KEY",
          "value": "your-key"
        },
        {
          "name": "NEXT_PUBLIC_WS_URL",
          "value": "wss://ws.yourdomain.com"
        }
      ]
    }
  ]
}
```

4. **Deploy WebSocket Server** (EC2):
```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@your-instance

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone <your-repo>
cd drive-thru-ai/server
npm install
npm install -g pm2

# Start with PM2
pm2 start websocket-server.ts --name ws-server
pm2 startup
pm2 save

# Setup Nginx reverse proxy
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/websocket
```

Nginx config:
```nginx
upstream websocket {
    server localhost:3001;
}

server {
    listen 80;
    server_name ws.yourdomain.com;

    location / {
        proxy_pass http://websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Option 3: Docker Compose (Self-Hosted)

**Best for**: On-premise deployments, local servers

#### docker-compose.yml

```yaml
version: '3.8'

services:
  nextjs:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_OPENAI_API_KEY=${OPENAI_API_KEY}
      - NEXT_PUBLIC_WS_URL=ws://localhost:3001
      - NODE_ENV=production
    depends_on:
      - websocket
      - postgres
    restart: unless-stopped

  websocket:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - WS_PORT=3001
      - NODE_ENV=production
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=drivethru
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=drivethru
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - nextjs
      - websocket
    restart: unless-stopped

volumes:
  postgres_data:
```

Deploy:
```bash
docker-compose up -d
```

## 🔒 Security Hardening

### 1. SSL/TLS Configuration

**Get SSL Certificate** (Let's Encrypt):
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d ws.yourdomain.com
```

### 2. Environment Variables

**Never commit**:
- API keys
- Database credentials
- Session secrets

Use secrets management:
- AWS Secrets Manager
- Vercel Environment Variables
- Docker Secrets

### 3. Rate Limiting

Add to Next.js middleware:

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const rateLimit = new Map()

export function middleware(request: NextRequest) {
  const ip = request.ip ?? 'anonymous'
  const limit = rateLimit.get(ip) ?? 0
  
  if (limit > 100) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }
  
  rateLimit.set(ip, limit + 1)
  setTimeout(() => rateLimit.delete(ip), 60000)
  
  return NextResponse.next()
}
```

### 4. CORS Configuration

```typescript
// src/app/api/orders/route.ts
const allowedOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com'
]

// Add CORS headers to API responses
```

### 5. Database Security

- Use connection pooling
- Enable SSL for database connections
- Regular backups
- Encrypt sensitive data

## 📊 Monitoring Setup

### Sentry (Error Tracking)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Configure:
```javascript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

### Vercel Analytics

```bash
npm install @vercel/analytics
```

```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Custom Logging

```typescript
// src/lib/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data)
    // Send to logging service
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error)
    // Send to error tracking
  }
}
```

## 🗄️ Database Migration

### PostgreSQL Setup

```sql
-- Create tables
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(10) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL,
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  language VARCHAR(5) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

### Connection Setup

```typescript
// src/lib/db.ts
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

export default pool
```

## 🚀 Performance Optimization

### 1. Enable Next.js Output Standalone

```javascript
// next.config.js
module.exports = {
  output: 'standalone',
  compress: true,
  images: {
    domains: ['images.unsplash.com'],
  },
}
```

### 2. CDN Configuration

Use Cloudflare or Vercel Edge Network for:
- Static assets
- Images
- CSS/JS bundles

### 3. Caching Strategy

```typescript
// API Route caching
export const revalidate = 60 // Revalidate every 60 seconds

// Component caching
export const dynamic = 'force-dynamic'
```

## 📈 Scaling

### Horizontal Scaling

- Use load balancer (ALB, Nginx)
- Multiple Next.js instances
- Separate WebSocket server cluster
- Database read replicas

### Vertical Scaling

- Increase instance size
- Add more CPU/RAM
- Optimize database queries

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 20
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📱 Domain Configuration

1. **Purchase domain** (Namecheap, GoDaddy)
2. **Configure DNS**:
   ```
   A     @              your-server-ip
   CNAME www            yourdomain.com
   CNAME ws             your-ws-server
   ```
3. **Wait for propagation** (up to 48 hours)

## ✅ Post-Deployment Checklist

- [ ] SSL certificate installed and working
- [ ] Environment variables configured
- [ ] Database migrated and seeded
- [ ] Error tracking setup (Sentry)
- [ ] Analytics installed
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] Backup strategy in place
- [ ] Monitoring alerts configured
- [ ] Load testing completed
- [ ] Security audit performed
- [ ] Documentation updated

## 🆘 Rollback Procedure

### Vercel
```bash
vercel rollback
```

### Docker
```bash
docker-compose down
git checkout previous-commit
docker-compose up -d
```

### AWS ECS
```bash
aws ecs update-service --cluster your-cluster --service your-service --task-definition previous-version
```

## 📞 Support

Production issues? Check:
1. Server logs
2. Error tracking dashboard (Sentry)
3. Database connection
4. API rate limits
5. SSL certificate expiry

---

**Ready for production deployment!** 🎉

For questions, open a GitHub issue or contact support.