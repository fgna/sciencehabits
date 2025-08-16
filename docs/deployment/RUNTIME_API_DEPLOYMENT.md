# ⚡ Runtime API Server Deployment Guide

> **Complete deployment guide for the ScienceHabits Runtime API Server - Hybrid Architecture Migration**

## 📋 Overview

The Runtime API Server provides a scalable backend foundation for future ScienceHabits features, enabling hybrid architecture migration from GitHub Pages to a full-stack application. This guide covers deployment for $5/month hosting solutions to enterprise-grade infrastructure.

**🎯 Deployment Benefits:**
- ✅ **Cost-effective** - Starting at $5/month (Railway, Render, DigitalOcean)
- ✅ **Scalable architecture** - Ready for high-traffic loads
- ✅ **Advanced features** - Real-time sync, user authentication, analytics
- ✅ **Hybrid migration** - Gradual transition from static to dynamic
- ✅ **Enterprise ready** - Production monitoring and security

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│  Runtime API     │───▶│   Database      │
│ (React + PWA)   │    │ (Express.js)     │    │ (PostgreSQL)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌──────────────────┐             │
         │              │   File Storage   │             │
         └─────────────▶│ (S3/CloudStorage)│◀────────────┘
                        └──────────────────┘
                                 │
                    ┌──────────────────────────┐
                    │    Monitoring Stack      │
                    │ (Logging, Metrics, APM)  │
                    └──────────────────────────┘
```

## 🚀 Prerequisites

### Development Environment
- **Node.js** 18+ and npm
- **Docker** and Docker Compose
- **Git** version control
- **Database client** (psql, MongoDB Compass, etc.)

### Production Requirements
- **Cloud hosting account** (Railway, Render, Heroku, AWS, etc.)
- **Domain name** (optional but recommended)
- **Database hosting** (included in many $5/month plans)
- **SSL certificate** (automatic with modern hosts)

## 📦 Step 1: Runtime API Server Setup

### 1.1 Project Structure

The runtime API server is already prepared in `runtime-api-server/`:

```
runtime-api-server/
├── src/
│   ├── server.ts              # Express server entry point
│   ├── middleware/            # Security and performance middleware
│   │   ├── auth.ts           # Authentication middleware
│   │   ├── cors.ts           # CORS configuration
│   │   ├── rateLimit.ts      # Rate limiting
│   │   ├── security.ts       # Security headers
│   │   └── validation.ts     # Request validation
│   ├── routes/               # API route handlers
│   │   ├── health.ts         # Health check endpoints
│   │   ├── content.ts        # Content API routes
│   │   ├── users.ts          # User management
│   │   └── sync.ts           # Data synchronization
│   ├── services/             # Business logic
│   │   ├── database.ts       # Database connection
│   │   ├── cache.ts          # Redis caching
│   │   └── storage.ts        # File storage
│   └── utils/                # Utility functions
│       ├── logger.ts         # Structured logging
│       └── metrics.ts        # Performance metrics
├── config/
│   ├── database.js           # Database configuration
│   └── docker-compose.yml    # Local development
├── Dockerfile                # Container configuration
├── package.json              # Dependencies and scripts
└── README.md                 # Runtime API documentation
```

### 1.2 Environment Configuration

Create production environment file (`runtime-api-server/.env.production`):

```bash
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
APP_NAME=sciencehabits-api
APP_VERSION=1.0.0

# Database Configuration (PostgreSQL)
DATABASE_URL=postgresql://username:password@hostname:5432/sciencehabits
DATABASE_SSL=true
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis Cache Configuration
REDIS_URL=redis://username:password@hostname:6379
REDIS_TTL=3600

# Security Configuration
JWT_SECRET=your-super-secure-jwt-secret-256-bits
API_RATE_LIMIT=100
CORS_ORIGIN=https://app.sciencehabits.com,https://sciencehabits.com
BCRYPT_ROUNDS=12

# Content API Integration
GITHUB_CONTENT_API_URL=https://your-org.github.io/sciencehabits-content-api
GITHUB_CONTENT_API_KEY=your-content-api-key

# File Storage (AWS S3 or compatible)
S3_BUCKET=sciencehabits-files
S3_REGION=us-east-1
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_ENDPOINT=https://s3.amazonaws.com

# Monitoring and Logging
LOG_LEVEL=info
SENTRY_DSN=https://your-sentry-dsn
METRICS_ENABLED=true
HEALTH_CHECK_INTERVAL=30000

# Feature Flags
ENABLE_USER_REGISTRATION=true
ENABLE_DATA_SYNC=true
ENABLE_ANALYTICS=true
ENABLE_RATE_LIMITING=true
```

### 1.3 Dependencies Installation

```bash
cd runtime-api-server

# Install production dependencies
npm ci --only=production

# Install development dependencies for building
npm install --only=dev

# Build TypeScript
npm run build

# Run tests
npm test
```

## 🌐 Step 2: Deployment Options

### Option 1: Railway Deployment ($5/month)

#### 2.1.1 Railway Setup

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Create railway.json configuration
cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build",
    "watchPatterns": ["src/**"]
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF
```

#### 2.1.2 Deploy to Railway

```bash
# Deploy to Railway
railway up

# Set environment variables
railway variables set NODE_ENV=production
railway variables set DATABASE_URL=$(railway variables get DATABASE_URL)
railway variables set JWT_SECRET=$(openssl rand -hex 32)

# Configure domain
railway domain add api.sciencehabits.com

# View logs
railway logs
```

### Option 2: Render Deployment ($5/month)

#### 2.2.1 Render Configuration

Create `render.yaml`:

```yaml
services:
  - type: web
    name: sciencehabits-api
    env: node
    plan: starter
    buildCommand: npm ci && npm run build
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: sciencehabits-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: REDIS_URL
        fromService:
          type: redis
          name: sciencehabits-cache
          property: connectionString
    
databases:
  - name: sciencehabits-db
    databaseName: sciencehabits
    user: sciencehabits
    plan: starter

services:
  - type: redis
    name: sciencehabits-cache
    plan: starter
```

#### 2.2.2 Deploy to Render

```bash
# Connect GitHub repository to Render
# Set up auto-deploy from main branch

# Manual deployment via CLI
curl -X POST \
  https://api.render.com/v1/services/your-service-id/deploys \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json"
```

### Option 3: DigitalOcean App Platform ($5/month)

#### 2.3.1 DigitalOcean Configuration

Create `.do/app.yaml`:

```yaml
name: sciencehabits-api
services:
- name: api
  source_dir: /
  github:
    repo: your-username/sciencehabits
    branch: main
  run_command: npm start
  build_command: npm ci && npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 3000
  health_check:
    http_path: /health
  envs:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    value: ${db.DATABASE_URL}
  - key: JWT_SECRET
    type: SECRET
    value: your-jwt-secret

databases:
- name: db
  engine: PG
  version: "13"
  size_slug: db-s-1vcpu-1gb
```

#### 2.3.2 Deploy to DigitalOcean

```bash
# Install doctl CLI
snap install doctl

# Authenticate
doctl auth init

# Create app
doctl apps create .do/app.yaml

# Get app info
doctl apps list

# View logs
doctl apps logs your-app-id
```

### Option 4: Docker Deployment (Self-hosted)

#### 2.4.1 Docker Configuration

The `Dockerfile` is already prepared:

```dockerfile
# Multi-stage build for optimized production image
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/
COPY tsconfig.json ./
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Security: Run as non-root
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

EXPOSE 3000

CMD ["npm", "start"]
```

#### 2.4.2 Docker Compose for Production

Create `docker-compose.production.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/sciencehabits
      - REDIS_URL=redis://cache:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
      - cache
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=sciencehabits
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  cache:
    image: redis:7-alpine
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

#### 2.4.3 Deploy with Docker

```bash
# Set environment variables
export JWT_SECRET=$(openssl rand -hex 32)
export DB_PASSWORD=$(openssl rand -hex 16)

# Deploy with Docker Compose
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose logs -f app

# Scale application
docker-compose up -d --scale app=3
```

## 🔐 Step 3: Security Configuration

### 3.1 Authentication Setup

The API server includes JWT-based authentication:

```typescript
// src/middleware/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

export async function generateToken(user: AuthUser): Promise<string> {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d', issuer: 'sciencehabits-api', audience: 'sciencehabits-app' }
  );
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  return bcrypt.hash(password, rounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 3.2 API Security Middleware

```typescript
// src/middleware/security.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export const securityMiddleware = [
  // Security headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.github.com"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }),

  // Rate limiting
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.API_RATE_LIMIT || '100'),
    message: {
      error: 'Too many requests',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
];
```

### 3.3 Database Security

```sql
-- Database initialization script (init.sql)
-- Create database users with limited privileges

-- Create application user
CREATE USER sciencehabits_app WITH PASSWORD 'secure_app_password';

-- Create read-only user for analytics
CREATE USER sciencehabits_analytics WITH PASSWORD 'secure_analytics_password';

-- Grant privileges
GRANT CONNECT ON DATABASE sciencehabits TO sciencehabits_app;
GRANT USAGE ON SCHEMA public TO sciencehabits_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sciencehabits_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sciencehabits_app;

-- Analytics user (read-only)
GRANT CONNECT ON DATABASE sciencehabits TO sciencehabits_analytics;
GRANT USAGE ON SCHEMA public TO sciencehabits_analytics;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO sciencehabits_analytics;

-- Enable row-level security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY user_isolation ON users FOR ALL TO sciencehabits_app USING (id = current_user_id());
CREATE POLICY habit_isolation ON user_habits FOR ALL TO sciencehabits_app USING (user_id = current_user_id());
CREATE POLICY progress_isolation ON user_progress FOR ALL TO sciencehabits_app USING (user_id = current_user_id());
```

## 📊 Step 4: Monitoring and Observability

### 4.1 Application Metrics

```typescript
// src/utils/metrics.ts
import { createPrometheusMetrics } from 'prom-client';

export class MetricsCollector {
  private httpRequestDuration: any;
  private httpRequestsTotal: any;
  private databaseConnectionsActive: any;
  private cacheHitRate: any;

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics() {
    const client = require('prom-client');
    
    // HTTP request duration
    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5]
    });

    // HTTP request count
    this.httpRequestsTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status']
    });

    // Database connections
    this.databaseConnectionsActive = new client.Gauge({
      name: 'database_connections_active',
      help: 'Number of active database connections'
    });

    // Cache hit rate
    this.cacheHitRate = new client.Gauge({
      name: 'cache_hit_rate',
      help: 'Cache hit rate percentage'
    });
  }

  recordHttpRequest(method: string, route: string, status: number, duration: number) {
    this.httpRequestDuration.observe({ method, route, status: status.toString() }, duration);
    this.httpRequestsTotal.inc({ method, route, status: status.toString() });
  }

  updateDatabaseConnections(count: number) {
    this.databaseConnectionsActive.set(count);
  }

  updateCacheHitRate(rate: number) {
    this.cacheHitRate.set(rate);
  }
}
```

### 4.2 Health Check Implementation

```typescript
// src/routes/health.ts
import { Router } from 'express';
import { DatabaseService } from '../services/database';
import { CacheService } from '../services/cache';

const router = Router();

interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthStatus;
    cache: HealthStatus;
    contentApi: HealthStatus;
    storage: HealthStatus;
  };
}

interface HealthStatus {
  status: 'up' | 'down';
  responseTime?: number;
  error?: string;
}

router.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const healthCheck: HealthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      uptime: process.uptime(),
      checks: {
        database: await checkDatabase(),
        cache: await checkCache(),
        contentApi: await checkContentApi(),
        storage: await checkStorage()
      }
    };

    // Determine overall status
    const allHealthy = Object.values(healthCheck.checks).every(check => check.status === 'up');
    healthCheck.status = allHealthy ? 'healthy' : 'unhealthy';

    const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthCheck);

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

async function checkDatabase(): Promise<HealthStatus> {
  const startTime = Date.now();
  try {
    await DatabaseService.query('SELECT 1');
    return {
      status: 'up',
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

async function checkCache(): Promise<HealthStatus> {
  const startTime = Date.now();
  try {
    await CacheService.ping();
    return {
      status: 'up',
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Cache connection failed'
    };
  }
}

export default router;
```

### 4.3 Logging Configuration

```typescript
// src/utils/logger.ts
import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'sciencehabits-api',
    version: process.env.APP_VERSION
  },
  transports: [
    // Console logging
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),

    // File logging for production
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error'
      }),
      new winston.transports.File({
        filename: 'logs/combined.log'
      })
    ] : [])
  ]
});

// Performance logging
export const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'sciencehabits-api-performance'
  },
  transports: [
    new winston.transports.File({
      filename: 'logs/performance.log'
    })
  ]
});
```

## ⚡ Step 5: Performance Optimization

### 5.1 Database Optimization

```sql
-- Database performance indexes
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_user_habits_user_id ON user_habits(user_id);
CREATE INDEX CONCURRENTLY idx_user_progress_user_id_habit_id ON user_progress(user_id, habit_id);
CREATE INDEX CONCURRENTLY idx_user_progress_date ON user_progress(date);

-- Partial indexes for active records
CREATE INDEX CONCURRENTLY idx_user_habits_active ON user_habits(user_id) WHERE is_active = true;

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_user_progress_stats ON user_progress(user_id, date DESC) INCLUDE (completed, streak_count);
```

### 5.2 Caching Strategy

```typescript
// src/services/cache.ts
import Redis from 'ioredis';

export class CacheService {
  private static redis: Redis;

  static initialize() {
    this.redis = new Redis(process.env.REDIS_URL!, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });
  }

  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      logger.error('Cache invalidation error:', error);
    }
  }

  // Cache warming for frequently accessed data
  static async warmCache(): Promise<void> {
    logger.info('Starting cache warming...');
    
    try {
      // Pre-load content data
      const contentKeys = ['habits:en', 'research:en', 'locales:en'];
      for (const key of contentKeys) {
        // Implementation would fetch and cache content
      }
      
      logger.info('Cache warming completed');
    } catch (error) {
      logger.error('Cache warming failed:', error);
    }
  }
}
```

### 5.3 API Response Optimization

```typescript
// src/middleware/compression.ts
import compression from 'compression';

export const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024, // Only compress responses larger than 1KB
  level: 6 // Balanced compression level
});

// Response caching middleware
export const cacheMiddleware = (ttl: number = 300) => {
  return (req: any, res: any, next: any) => {
    if (req.method === 'GET') {
      res.set('Cache-Control', `public, max-age=${ttl}`);
    }
    next();
  };
};
```

## 🔄 Step 6: CI/CD Automation

### 6.1 GitHub Actions Workflow

Create `.github/workflows/deploy-api.yml`:

```yaml
name: 🚀 Deploy Runtime API

on:
  push:
    branches: [main]
    paths: ['runtime-api-server/**']
  
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'production'
        type: choice
        options:
          - production
          - staging

env:
  NODE_VERSION: '18'
  
jobs:
  test-api:
    name: 🧪 Test API Server
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - name: 📥 Checkout Code
        uses: actions/checkout@v4
        
      - name: 🔧 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: runtime-api-server/package-lock.json
          
      - name: 📦 Install Dependencies
        working-directory: runtime-api-server
        run: npm ci
        
      - name: 🔍 Lint Code
        working-directory: runtime-api-server
        run: npm run lint
        
      - name: 🏗️ Build TypeScript
        working-directory: runtime-api-server
        run: npm run build
        
      - name: 🧪 Run Tests
        working-directory: runtime-api-server
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret
          NODE_ENV: test
          
      - name: 🔒 Security Audit
        working-directory: runtime-api-server
        run: npm audit --audit-level=high

  build-and-deploy:
    name: 🏗️ Build & Deploy API
    needs: test-api
    runs-on: ubuntu-latest
    environment: 
      name: ${{ github.event.inputs.environment || 'production' }}
    
    steps:
      - name: 📥 Checkout Code
        uses: actions/checkout@v4
        
      - name: 🔧 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: runtime-api-server/package-lock.json
          
      - name: 📦 Install Dependencies
        working-directory: runtime-api-server
        run: npm ci --only=production
        
      - name: 🏗️ Build Application
        working-directory: runtime-api-server
        run: npm run build
        
      # Railway Deployment
      - name: 🚂 Deploy to Railway
        if: github.ref == 'refs/heads/main'
        working-directory: runtime-api-server
        run: |
          npm install -g @railway/cli
          railway deploy
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
          
      # Docker deployment option
      - name: 🐳 Build Docker Image
        if: github.event.inputs.environment == 'production'
        working-directory: runtime-api-server
        run: |
          docker build -t sciencehabits-api:${{ github.sha }} .
          docker tag sciencehabits-api:${{ github.sha }} sciencehabits-api:latest

  health-check:
    name: 🔍 Health Check
    needs: build-and-deploy
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: 🔍 Check API Health
        run: |
          sleep 60  # Wait for deployment
          
          # Health check
          response=$(curl -s -o /dev/null -w "%{http_code}" https://api.sciencehabits.com/health)
          
          if [ $response -eq 200 ]; then
            echo "✅ API health check passed"
          else
            echo "❌ API health check failed (HTTP $response)"
            exit 1
          fi
          
      - name: 📊 Performance Check
        run: |
          # Response time check
          time=$(curl -w "@curl-format.txt" -o /dev/null -s https://api.sciencehabits.com/health)
          echo "Response time: $time"
```

## ✅ Step 7: Production Checklist

### Pre-Deployment Checklist

- [ ] **Code Quality**
  - [ ] TypeScript compilation successful
  - [ ] All tests passing
  - [ ] Security audit passed
  - [ ] Code linting passed
  
- [ ] **Configuration**
  - [ ] Production environment variables set
  - [ ] Database connection configured
  - [ ] Redis cache configured
  - [ ] SSL certificates ready
  
- [ ] **Security**
  - [ ] JWT secret generated (256-bit)
  - [ ] Database credentials secured
  - [ ] API rate limiting configured
  - [ ] CORS origins restricted
  
- [ ] **Infrastructure**
  - [ ] Database provisioned and initialized
  - [ ] Redis cache provisioned
  - [ ] File storage configured
  - [ ] Monitoring tools set up
  
- [ ] **Performance**
  - [ ] Database indexes created
  - [ ] Cache warming implemented
  - [ ] Compression enabled
  - [ ] Health checks functional

### Post-Deployment Verification

- [ ] **Functionality**
  - [ ] Health check endpoint responding
  - [ ] Authentication working
  - [ ] Database queries successful
  - [ ] Cache operations functional
  
- [ ] **Performance**
  - [ ] Response time < 200ms for simple queries
  - [ ] Database connections stable
  - [ ] Memory usage within limits
  - [ ] CPU utilization acceptable
  
- [ ] **Monitoring**
  - [ ] Metrics collection active
  - [ ] Log aggregation working
  - [ ] Alert notifications configured
  - [ ] Error tracking operational

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failures**
   ```bash
   # Check connection string
   echo $DATABASE_URL
   
   # Test database connectivity
   psql $DATABASE_URL -c "SELECT version();"
   
   # Check SSL requirements
   psql "$DATABASE_URL?sslmode=require" -c "SELECT 1;"
   ```

2. **Redis Cache Issues**
   ```bash
   # Test Redis connection
   redis-cli -u $REDIS_URL ping
   
   # Check Redis memory usage
   redis-cli -u $REDIS_URL info memory
   ```

3. **Performance Issues**
   ```bash
   # Check database performance
   SELECT query, calls, total_time, mean_time 
   FROM pg_stat_statements 
   ORDER BY total_time DESC 
   LIMIT 10;
   
   # Monitor API response times
   curl -w "@curl-format.txt" -o /dev/null -s https://api.sciencehabits.com/health
   ```

### Recovery Procedures

1. **Emergency Rollback**
   ```bash
   # Railway rollback
   railway rollback
   
   # Docker rollback
   docker service update --image sciencehabits-api:previous-tag api-service
   ```

2. **Database Recovery**
   ```bash
   # Restore from backup
   pg_restore -d $DATABASE_URL backup.sql
   
   # Run migrations
   npm run migrate:up
   ```

---

**⚡ Your Runtime API Server is now ready for production deployment!**

The server provides a solid foundation for future features and scales from $5/month hosting to enterprise infrastructure. Monitor the health endpoints and logs after deployment to ensure optimal performance.