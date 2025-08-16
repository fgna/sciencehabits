/**
 * ScienceHabits Runtime API Server
 * 
 * Lightweight, edge-deployable API server designed for $5/month deployment.
 * Provides hybrid architecture support with GitHub Pages fallback.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';
import { config } from './config';
import { githubPagesProxy } from './services/githubPagesProxy';
import { healthService } from './services/healthService';
import { metricsService } from './services/metricsService';
import { authMiddleware } from './middleware/auth';
import { loggingMiddleware } from './middleware/logging';
import { errorHandler } from './middleware/errorHandler';

const app: express.Application = express();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minute default TTL

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.github.com", "https://*.github.io"]
    }
  }
}));

app.use(cors({
  origin: config.allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.isDevelopment ? 1000 : 100, // requests per window
  message: {
    error: 'Too many requests',
    retryAfter: '15 minutes'
  }
});
app.use(limiter);

// Logging middleware
app.use(loggingMiddleware);

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  const health = healthService.getHealthStatus();
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

// Metrics endpoint (admin auth required)
app.get('/metrics', authMiddleware, (req, res) => {
  const metrics = metricsService.getMetrics();
  res.json(metrics);
});

// API routes with caching
app.get('/api/:type/:language?', async (req, res) => {
  const { type, language = 'en' } = req.params;
  const cacheKey = `${type}_${language}_${JSON.stringify(req.query)}`;
  
  try {
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      metricsService.recordRequest(req.path, 200, 'cache');
      res.json({
        success: true,
        data: cached,
        source: 'cache',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // Validate request type
    const validTypes = ['habits', 'research', 'goals', 'translations'];
    if (!validTypes.includes(type)) {
      metricsService.recordRequest(req.path, 400, 'validation_error');
      res.status(400).json({
        success: false,
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      });
      return;
    }
    
    // Validate language
    const validLanguages = ['en', 'de', 'fr', 'es'];
    if (!validLanguages.includes(language)) {
      metricsService.recordRequest(req.path, 400, 'validation_error');
      res.status(400).json({
        success: false,
        error: `Invalid language. Must be one of: ${validLanguages.join(', ')}`
      });
      return;
    }
    
    // Fetch from GitHub Pages
    const result = await githubPagesProxy.fetchContent(type, language, req.query);
    
    if (result.success) {
      // Cache successful responses
      const ttl = getTTLForType(type);
      cache.set(cacheKey, result.data, ttl);
      
      metricsService.recordRequest(req.path, 200, 'github_pages');
      res.json({
        success: true,
        data: result.data,
        source: 'github_pages',
        timestamp: new Date().toISOString()
      });
    } else {
      metricsService.recordRequest(req.path, 500, 'server_error');
      res.status(500).json({
        success: false,
        error: result.error,
        source: 'github_pages',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('API request error:', error);
    metricsService.recordRequest(req.path, 500, 'server_error');
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Cache management endpoints (admin auth required)
app.post('/admin/cache/clear', authMiddleware, (req, res) => {
  cache.flushAll();
  res.json({
    success: true,
    message: 'Cache cleared',
    timestamp: new Date().toISOString()
  });
});

app.get('/admin/cache/stats', authMiddleware, (req, res) => {
  const stats = cache.getStats();
  res.json({
    success: true,
    stats,
    timestamp: new Date().toISOString()
  });
});

// Configuration endpoint (admin auth required)
app.get('/admin/config', authMiddleware, (req, res) => {
  res.json({
    success: true,
    config: {
      environment: config.environment,
      githubPagesUrl: config.githubPagesUrl,
      cacheEnabled: true,
      rateLimitEnabled: true,
      allowedOrigins: config.allowedOrigins
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  metricsService.recordRequest(req.path, 404, 'not_found');
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use(errorHandler);

// Helper function to get TTL for different content types
function getTTLForType(type: string): number {
  const ttls = {
    habits: 600,      // 10 minutes
    research: 1800,   // 30 minutes
    goals: 3600,      // 1 hour
    translations: 300 // 5 minutes
  };
  return ttls[type as keyof typeof ttls] || 600;
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

const port = config.port;
app.listen(port, () => {
  console.log(`🚀 ScienceHabits Runtime API Server running on port ${port}`);
  console.log(`📊 Environment: ${config.environment}`);
  console.log(`🔗 GitHub Pages URL: ${config.githubPagesUrl}`);
  console.log(`⚡ Cache enabled with ${cache.getStats().keys} keys`);
  
  // Record server start
  metricsService.recordEvent('server_started', {
    port,
    environment: config.environment,
    timestamp: new Date().toISOString()
  });
});

export default app;