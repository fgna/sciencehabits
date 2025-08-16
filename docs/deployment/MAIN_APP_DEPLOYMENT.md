# 🚀 ScienceHabits Main Application Deployment Guide

> **Complete production deployment guide for the ScienceHabits Progressive Web Application**

## 📋 Overview

This guide covers the complete deployment of the ScienceHabits main application from development to production, including multi-cloud hosting options, CI/CD automation, and performance optimization.

**🎯 Deployment Options:**
- ✅ **Netlify** (Recommended) - Automatic deployments, edge functions
- ✅ **Vercel** - Next.js optimized, serverless functions
- ✅ **AWS S3 + CloudFront** - Enterprise-grade, full control
- ✅ **GitHub Pages** - Free hosting, limited features
- ✅ **Self-hosted** - Docker containers, full customization

## 🏗️ Application Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │───▶│   Build System   │───▶│  Static Assets  │
│ (PWA + TypeScript) │  │ (Webpack/CRA)   │    │   (Optimized)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌──────────────────┐             │
         └─────────────▶│   Service Worker │◀────────────┘
                        │  (Offline Cache) │
                        └──────────────────┘
                                 │
                    ┌──────────────────────────┐
                    │     CDN Distribution     │
                    │ (Global Edge Caching)   │
                    └──────────────────────────┘
```

## 🚀 Prerequisites

### Development Environment
- **Node.js** 18+ and npm
- **Git** version control
- **Code editor** (VS Code recommended)
- **Chrome/Firefox** for PWA testing

### Production Requirements
- **Domain name** (optional but recommended)
- **SSL certificate** (automatic with modern hosts)
- **CI/CD platform** account (GitHub Actions, Netlify, etc.)

## 📦 Step 1: Pre-Deployment Preparation

### 1.1 Production Build Optimization

```bash
# Navigate to project directory
cd sciencehabits

# Install production dependencies
npm ci --only=production

# Run comprehensive tests
npm run test:coverage
npm run test:a11y
npm run test:integration

# Content validation
npm run validate-content

# TypeScript compilation check
npm run type-check

# Security audit
npm audit --audit-level=high
```

### 1.2 Environment Configuration

Create production environment files:

```bash
# Create production environment file
cat > .env.production << 'EOF'
# Production Configuration
REACT_APP_ENV=production
REACT_APP_VERSION=$npm_package_version

# Content API Configuration
REACT_APP_CONTENT_API_URL=https://your-org.github.io/sciencehabits-content-api
REACT_APP_CONTENT_API_KEY=your-production-api-key

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_PWA=true
REACT_APP_ENABLE_OFFLINE=true

# Multi-Language Configuration
REACT_APP_DEFAULT_LANGUAGE=en
REACT_APP_SUPPORTED_LANGUAGES=en,de,fr,es

# Performance Configuration
REACT_APP_LAZY_LOADING=true
REACT_APP_IMAGE_OPTIMIZATION=true
REACT_APP_BUNDLE_ANALYZER=false

# Security Configuration
REACT_APP_CSP_ENABLED=true
REACT_APP_SECURE_HEADERS=true
EOF
```

### 1.3 Build Optimization

Update `package.json` build scripts:

```json
{
  "scripts": {
    "build": "react-scripts build",
    "build:production": "NODE_ENV=production npm run build",
    "build:analyze": "npm run build && npx webpack-bundle-analyzer build/static/js/*.js",
    "prebuild": "npm run test:coverage && npm run type-check && npm run validate-content",
    "postbuild": "npm run build:verify",
    "build:verify": "node scripts/verify-build.js"
  }
}
```

Create build verification script (`scripts/verify-build.js`):

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const gzipSize = require('gzip-size');

class BuildVerifier {
  constructor() {
    this.buildDir = path.join(__dirname, '../build');
    this.thresholds = {
      maxBundleSize: 2 * 1024 * 1024, // 2MB
      maxGzipSize: 500 * 1024,        // 500KB
      maxAssets: 50,
      minPWAScore: 90
    };
  }

  async verify() {
    console.log('🔍 Verifying production build...');
    
    try {
      await this.checkBuildExists();
      await this.checkBundleSize();
      await this.checkPWAManifest();
      await this.checkServiceWorker();
      await this.checkAssetOptimization();
      
      console.log('✅ Build verification completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Build verification failed:', error.message);
      process.exit(1);
    }
  }

  async checkBuildExists() {
    if (!fs.existsSync(this.buildDir)) {
      throw new Error('Build directory not found');
    }
    
    const indexPath = path.join(this.buildDir, 'index.html');
    if (!fs.existsSync(indexPath)) {
      throw new Error('index.html not found in build');
    }
    
    console.log('✅ Build directory and index.html found');
  }

  async checkBundleSize() {
    const staticDir = path.join(this.buildDir, 'static/js');
    const jsFiles = fs.readdirSync(staticDir).filter(f => f.endsWith('.js'));
    
    let totalSize = 0;
    let totalGzipSize = 0;
    
    for (const file of jsFiles) {
      const filePath = path.join(staticDir, file);
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath);
      const gzipSizeValue = await gzipSize(content);
      
      totalSize += stats.size;
      totalGzipSize += gzipSizeValue;
      
      console.log(`📦 ${file}: ${(stats.size / 1024).toFixed(1)}KB (${(gzipSizeValue / 1024).toFixed(1)}KB gzipped)`);
    }
    
    if (totalSize > this.thresholds.maxBundleSize) {
      throw new Error(`Bundle size ${(totalSize / 1024 / 1024).toFixed(1)}MB exceeds threshold ${(this.thresholds.maxBundleSize / 1024 / 1024).toFixed(1)}MB`);
    }
    
    if (totalGzipSize > this.thresholds.maxGzipSize) {
      throw new Error(`Gzipped size ${(totalGzipSize / 1024).toFixed(1)}KB exceeds threshold ${(this.thresholds.maxGzipSize / 1024).toFixed(1)}KB`);
    }
    
    console.log(`✅ Bundle size OK: ${(totalSize / 1024 / 1024).toFixed(1)}MB (${(totalGzipSize / 1024).toFixed(1)}KB gzipped)`);
  }

  async checkPWAManifest() {
    const manifestPath = path.join(this.buildDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error('PWA manifest.json not found');
    }
    
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'theme_color', 'icons'];
    for (const field of requiredFields) {
      if (!manifest[field]) {
        throw new Error(`PWA manifest missing required field: ${field}`);
      }
    }
    
    console.log('✅ PWA manifest validation passed');
  }

  async checkServiceWorker() {
    const swPath = path.join(this.buildDir, 'service-worker.js');
    if (!fs.existsSync(swPath)) {
      console.warn('⚠️ Service worker not found (PWA offline functionality disabled)');
      return;
    }
    
    const swContent = fs.readFileSync(swPath, 'utf8');
    if (!swContent.includes('precache') || !swContent.includes('workbox')) {
      throw new Error('Service worker appears invalid or missing precaching');
    }
    
    console.log('✅ Service worker validation passed');
  }

  async checkAssetOptimization() {
    const staticDir = path.join(this.buildDir, 'static');
    const allFiles = this.getAllFiles(staticDir);
    
    const imageFiles = allFiles.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
    const oversizedImages = imageFiles.filter(f => {
      const stats = fs.statSync(f);
      return stats.size > 500 * 1024; // 500KB threshold
    });
    
    if (oversizedImages.length > 0) {
      console.warn(`⚠️ Found ${oversizedImages.length} large images that could be optimized`);
      oversizedImages.forEach(img => {
        const stats = fs.statSync(img);
        console.warn(`  - ${path.basename(img)}: ${(stats.size / 1024).toFixed(1)}KB`);
      });
    } else {
      console.log('✅ Image optimization check passed');
    }
  }

  getAllFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        files.push(...this.getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    
    return files;
  }
}

// Run verification
if (require.main === module) {
  const verifier = new BuildVerifier();
  verifier.verify();
}

module.exports = BuildVerifier;
```

## 🌐 Step 2: Deployment Options

### Option 1: Netlify Deployment (Recommended)

#### 2.1.1 Automatic Deployment via Git

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init

# Configure netlify.toml
cat > netlify.toml << 'EOF'
[build]
  publish = "build"
  command = "npm run build:production"

[build.environment]
  NODE_VERSION = "18"
  NPM_FLAGS = "--prefix=/dev/null"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.github.com https://*.github.io;"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/manifest.json"
  [headers.values]
    Cache-Control = "public, max-age=86400"

[[headers]]
  for = "/service-worker.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[dev]
  command = "npm start"
  port = 3000
  publish = "build"
EOF
```

#### 2.1.2 Deploy to Netlify

```bash
# Deploy to preview
netlify deploy

# Deploy to production
netlify deploy --prod

# Set environment variables
netlify env:set REACT_APP_CONTENT_API_URL "https://your-org.github.io/sciencehabits-content-api"
netlify env:set REACT_APP_CONTENT_API_KEY "your-production-api-key"
```

### Option 2: Vercel Deployment

#### 2.2.1 Vercel Configuration

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Initialize project
vercel

# Configure vercel.json
cat > vercel.json << 'EOF'
{
  "version": 2,
  "buildCommand": "npm run build:production",
  "outputDirectory": "build",
  "devCommand": "npm start",
  "framework": "create-react-app",
  "installCommand": "npm ci",
  "regions": ["iad1", "sfo1", "fra1"],
  "routes": [
    {
      "src": "/static/(.*)",
      "headers": {
        "cache-control": "public, max-age=31536000, immutable"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
EOF
```

#### 2.2.2 Deploy to Vercel

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add REACT_APP_CONTENT_API_URL production
vercel env add REACT_APP_CONTENT_API_KEY production
```

### Option 3: AWS S3 + CloudFront

#### 2.3.1 AWS Infrastructure Setup

```bash
# Install AWS CLI
pip install awscli

# Configure AWS credentials
aws configure

# Create S3 bucket
BUCKET_NAME="sciencehabits-production"
aws s3 mb s3://$BUCKET_NAME

# Configure S3 for static website hosting
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html

# Set bucket policy for public read
cat > bucket-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::sciencehabits-production/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json
```

#### 2.3.2 CloudFront Distribution

```bash
# Create CloudFront distribution
cat > cloudfront-config.json << 'EOF'
{
  "CallerReference": "sciencehabits-$(date +%s)",
  "Aliases": {
    "Quantity": 1,
    "Items": ["app.sciencehabits.com"]
  },
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-sciencehabits-production",
        "DomainName": "sciencehabits-production.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-sciencehabits-production",
    "ViewerProtocolPolicy": "redirect-to-https",
    "MinTTL": 0,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {"Forward": "none"}
    }
  },
  "Comment": "ScienceHabits Production Distribution",
  "Enabled": true
}
EOF

aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

#### 2.3.3 Deployment Script

```bash
#!/bin/bash
# deploy-aws.sh

set -e

echo "🚀 Deploying ScienceHabits to AWS..."

# Build the app
npm run build:production

# Sync to S3
aws s3 sync build/ s3://$BUCKET_NAME --delete --cache-control "public, max-age=31536000" --exclude "*.html" --exclude "service-worker.js" --exclude "manifest.json"

# Upload HTML files with shorter cache
aws s3 sync build/ s3://$BUCKET_NAME --delete --cache-control "public, max-age=0, must-revalidate" --include "*.html" --include "service-worker.js" --include "manifest.json"

# Get CloudFront distribution ID
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='ScienceHabits Production Distribution'].Id" --output text)

# Create invalidation
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

echo "✅ Deployment completed successfully"
echo "🌐 CloudFront URL: https://$DISTRIBUTION_ID.cloudfront.net"
```

## 🔄 Step 3: CI/CD Automation

### 3.1 GitHub Actions Workflow

Create `.github/workflows/deploy-production.yml`:

```yaml
name: 🚀 Production Deployment

on:
  push:
    branches: [main]
    paths-ignore: ['docs/**', '*.md']
  
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
  test-and-validate:
    name: 🧪 Test & Validate
    runs-on: ubuntu-latest
    
    steps:
      - name: 📥 Checkout Code
        uses: actions/checkout@v4
        
      - name: 🔧 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: 📦 Install Dependencies
        run: npm ci
        
      - name: 🧪 Run Tests
        run: |
          npm run test:coverage
          npm run test:a11y
          
      - name: 🔍 TypeScript Check
        run: npm run type-check
        
      - name: 📋 Validate Content
        run: npm run validate-content
        
      - name: 🔒 Security Audit
        run: npm audit --audit-level=high
        
      - name: 📊 Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  build-and-deploy:
    name: 🏗️ Build & Deploy
    needs: test-and-validate
    runs-on: ubuntu-latest
    environment: 
      name: ${{ github.event.inputs.environment || 'production' }}
      url: ${{ steps.deploy.outputs.url }}
    
    steps:
      - name: 📥 Checkout Code
        uses: actions/checkout@v4
        
      - name: 🔧 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: 📦 Install Dependencies
        run: npm ci --only=production
        
      - name: 🏗️ Build Application
        run: npm run build:production
        env:
          REACT_APP_CONTENT_API_URL: ${{ secrets.REACT_APP_CONTENT_API_URL }}
          REACT_APP_CONTENT_API_KEY: ${{ secrets.REACT_APP_CONTENT_API_KEY }}
          REACT_APP_VERSION: ${{ github.sha }}
          
      - name: 🔍 Verify Build
        run: npm run build:verify
        
      - name: 📊 Analyze Bundle
        run: |
          npm install -g webpack-bundle-analyzer
          npx webpack-bundle-analyzer build/static/js/*.js --report --mode static --report build/bundle-report.html
          
      - name: 📤 Upload Build Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: |
            build/
            !build/**/*.map
          retention-days: 30
          
      # Netlify Deployment
      - name: 🚀 Deploy to Netlify
        if: github.ref == 'refs/heads/main'
        uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: './build'
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions - ${{ github.sha }}"
          enable-pull-request-comment: true
          enable-commit-comment: true
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}

  lighthouse-audit:
    name: 🔍 Lighthouse Audit
    needs: build-and-deploy
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: 📥 Checkout Code
        uses: actions/checkout@v4
        
      - name: 🔍 Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://sciencehabits.netlify.app
            https://sciencehabits.netlify.app/#today
            https://sciencehabits.netlify.app/#habits
          configPath: './lighthouserc.json'
          uploadArtifacts: true
          temporaryPublicStorage: true
          
  notify-deployment:
    name: 📬 Notify Deployment
    needs: [build-and-deploy, lighthouse-audit]
    runs-on: ubuntu-latest
    if: always()
    
    steps:
      - name: 📧 Send Slack Notification
        if: env.SLACK_WEBHOOK_URL != ''
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
          fields: repo,message,commit,author,action,eventName,ref,workflow
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 3.2 Lighthouse Configuration

Create `lighthouserc.json`:

```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "startServerCommand": "npm run serve",
      "url": [
        "http://localhost:3000",
        "http://localhost:3000/#today",
        "http://localhost:3000/#habits"
      ]
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.85}],
        "categories:accessibility": ["error", {"minScore": 0.95}],
        "categories:best-practices": ["error", {"minScore": 0.90}],
        "categories:seo": ["error", {"minScore": 0.90}],
        "categories:pwa": ["error", {"minScore": 0.85}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

## 🔐 Step 4: Security Configuration

### 4.1 Content Security Policy

Update `public/index.html`:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  font-src 'self' data:;
  connect-src 'self' https://api.github.com https://*.github.io;
  manifest-src 'self';
  worker-src 'self';
">
```

### 4.2 Security Headers

For Netlify (`netlify.toml`):

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
```

### 4.3 Environment Variables Security

```bash
# Production secrets (set in hosting platform)
REACT_APP_CONTENT_API_KEY=prod_key_here  # Content API access
REACT_APP_SENTRY_DSN=sentry_dsn_here     # Error tracking
REACT_APP_GA_TRACKING_ID=ga_id_here      # Analytics (optional)

# Development/staging only
REACT_APP_DEBUG_MODE=false               # Debug features
REACT_APP_MOCK_API=false                 # API mocking
```

## 📊 Step 5: Performance Optimization

### 5.1 Bundle Optimization

Update `package.json`:

```json
{
  "scripts": {
    "analyze": "npm run build && npx webpack-bundle-analyzer build/static/js/*.js",
    "build:production": "NODE_ENV=production GENERATE_SOURCEMAP=false npm run build"
  }
}
```

### 5.2 Code Splitting Implementation

```typescript
// src/components/LazyComponents.tsx
import { lazy } from 'react';

export const AdminDashboard = lazy(() => 
  import('./admin/AdminDashboard').then(module => ({
    default: module.AdminDashboard
  }))
);

export const UserTestingDashboard = lazy(() => 
  import('./testing/UserTestingDashboard').then(module => ({
    default: module.UserTestingDashboard
  }))
);

export const Analytics = lazy(() => 
  import('./analytics/Analytics').then(module => ({
    default: module.Analytics
  }))
);
```

### 5.3 Service Worker Optimization

Create `public/sw-template.js`:

```javascript
// Custom Service Worker for enhanced caching
const CACHE_NAME = 'sciencehabits-v1';
const RUNTIME_CACHE = 'runtime-cache-v1';

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event - precache critical assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => 
        Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map(name => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch event - cache strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Handle API requests with network-first strategy
  if (request.url.includes('/api/') || request.url.includes('github.io')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE)
            .then(cache => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }
  
  // Handle static assets with cache-first strategy
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) return response;
        
        return fetch(request)
          .then(response => {
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(RUNTIME_CACHE)
                .then(cache => cache.put(request, responseClone));
            }
            return response;
          });
      })
  );
});
```

## 🎯 Step 6: Monitoring & Analytics

### 6.1 Error Tracking with Sentry

```bash
# Install Sentry
npm install @sentry/react @sentry/tracing
```

```typescript
// src/services/monitoring.ts
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';

export function initializeMonitoring() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      integrations: [
        new Integrations.BrowserTracing(),
      ],
      tracesSampleRate: 0.1,
      environment: process.env.REACT_APP_ENV || 'production',
      beforeSend(event) {
        // Filter out non-critical errors
        if (event.exception) {
          const error = event.exception.values?.[0];
          if (error?.type === 'ChunkLoadError') {
            // Handle chunk loading errors gracefully
            window.location.reload();
            return null;
          }
        }
        return event;
      }
    });
  }
}
```

### 6.2 Performance Monitoring

```typescript
// src/utils/performance.ts
export class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();
  
  startTiming(label: string) {
    this.metrics.set(label, performance.now());
  }
  
  endTiming(label: string) {
    const startTime = this.metrics.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.reportMetric(label, duration);
      this.metrics.delete(label);
    }
  }
  
  private reportMetric(label: string, duration: number) {
    // Report to analytics service
    if (duration > 1000) {
      console.warn(`Performance issue: ${label} took ${duration.toFixed(2)}ms`);
    }
    
    // Send to monitoring service
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: label,
        value: Math.round(duration)
      });
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

## ✅ Step 7: Production Checklist

### Pre-Deployment Checklist

- [ ] **Code Quality**
  - [ ] All tests passing (unit, integration, a11y)
  - [ ] TypeScript compilation successful
  - [ ] ESLint warnings resolved
  - [ ] Security audit passed
  
- [ ] **Content Validation**
  - [ ] Content validation script passes
  - [ ] All required content files present
  - [ ] Multi-language content validated
  
- [ ] **Performance**
  - [ ] Bundle size under 2MB
  - [ ] Lighthouse score > 85 for all categories
  - [ ] Service worker functional
  - [ ] PWA manifest valid
  
- [ ] **Security**
  - [ ] Environment variables configured
  - [ ] CSP headers implemented
  - [ ] HTTPS enforced
  - [ ] No sensitive data in build
  
- [ ] **Configuration**
  - [ ] Production environment file created
  - [ ] CI/CD pipeline configured
  - [ ] Domain and DNS configured
  - [ ] Monitoring and error tracking set up

### Post-Deployment Verification

- [ ] **Functionality**
  - [ ] Application loads correctly
  - [ ] All routes accessible
  - [ ] Multi-language switching works
  - [ ] Offline functionality tested
  
- [ ] **Performance**
  - [ ] Page load time < 3 seconds
  - [ ] API response time < 200ms
  - [ ] PWA installation works
  - [ ] Service worker caching active
  
- [ ] **Monitoring**
  - [ ] Error tracking operational
  - [ ] Performance metrics collecting
  - [ ] Uptime monitoring active
  - [ ] Alert notifications configured

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm cache clean --force
   npm install
   npm run build
   ```

2. **Routing Issues (404 on refresh)**
   ```bash
   # Ensure SPA routing configured
   # Netlify: _redirects file or netlify.toml
   # Apache: .htaccess file
   # Nginx: try_files directive
   ```

3. **Environment Variables Not Loading**
   ```bash
   # Check variable names start with REACT_APP_
   # Verify deployment platform environment settings
   # Restart build after setting variables
   ```

4. **PWA Installation Issues**
   ```bash
   # Verify manifest.json is valid
   # Check service worker registration
   # Ensure HTTPS is enabled
   # Test on mobile devices
   ```

### Performance Issues

1. **Slow Initial Load**
   ```bash
   # Implement code splitting
   # Optimize images and assets
   # Enable compression (gzip/brotli)
   # Use CDN for static assets
   ```

2. **Bundle Size Too Large**
   ```bash
   # Analyze bundle with webpack-bundle-analyzer
   # Remove unused dependencies
   # Implement dynamic imports
   # Tree shake unused code
   ```

### Recovery Procedures

1. **Rollback Deployment**
   ```bash
   # Netlify: Revert to previous deploy
   netlify rollback
   
   # Vercel: Promote previous deployment
   vercel --target production
   
   # AWS: Update CloudFront to previous S3 version
   ```

2. **Emergency Maintenance**
   ```bash
   # Deploy maintenance page
   echo '<html><body><h1>Maintenance Mode</h1></body></html>' > maintenance.html
   # Upload to hosting platform
   ```

---

**🚀 Your ScienceHabits application is now ready for production deployment!**

Choose your preferred hosting platform and follow the corresponding deployment steps. For additional support, refer to the platform-specific documentation or create an issue in the repository.