/**
 * Runtime API Server Configuration
 * 
 * Environment-based configuration for the lightweight API server.
 */

import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3001'),
  environment: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  
  // GitHub Pages configuration
  githubPagesUrl: process.env.GITHUB_PAGES_URL || 'https://freya.github.io/sciencehabits-content-api',
  
  // Authentication
  adminApiKey: process.env.ADMIN_API_KEY || 'dev-admin-key',
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret',
  
  // CORS configuration
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'https://localhost:3000',
    'https://sciencehabits.app',
    'https://staging.sciencehabits.app'
  ],
  
  // Cache configuration
  cache: {
    defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || '300'), // 5 minutes
    maxKeys: parseInt(process.env.CACHE_MAX_KEYS || '1000'),
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD || '120') // 2 minutes
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESS === 'true'
  },
  
  // Monitoring
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    webhookUrl: process.env.MONITORING_WEBHOOK_URL,
    alertThresholds: {
      errorRate: parseFloat(process.env.ALERT_ERROR_RATE || '0.05'), // 5%
      responseTime: parseInt(process.env.ALERT_RESPONSE_TIME || '2000'), // 2 seconds
      availability: parseFloat(process.env.ALERT_AVAILABILITY || '0.95') // 95%
    }
  },
  
  // Feature flags
  features: {
    caching: process.env.FEATURE_CACHING !== 'false',
    compression: process.env.FEATURE_COMPRESSION !== 'false',
    rateLimit: process.env.FEATURE_RATE_LIMIT !== 'false',
    metrics: process.env.FEATURE_METRICS !== 'false',
    adminEndpoints: process.env.FEATURE_ADMIN_ENDPOINTS !== 'false'
  },
  
  // Deployment configuration
  deployment: {
    platform: process.env.DEPLOYMENT_PLATFORM || 'generic',
    region: process.env.DEPLOYMENT_REGION || 'us-east-1',
    version: process.env.APP_VERSION || '1.0.0',
    buildId: process.env.BUILD_ID || 'dev'
  }
};

// Validate required configuration
const requiredEnvVars = [
  'GITHUB_PAGES_URL'
];

if (config.environment === 'production') {
  requiredEnvVars.push(
    'ADMIN_API_KEY',
    'JWT_SECRET'
  );
}

const missingVars = requiredEnvVars.filter(varName => 
  !process.env[varName] || process.env[varName] === ''
);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  if (config.environment === 'production') {
    process.exit(1);
  }
}

// Log configuration (excluding secrets)
console.log('🔧 Runtime API Configuration:');
console.log(`  Environment: ${config.environment}`);
console.log(`  Port: ${config.port}`);
console.log(`  GitHub Pages: ${config.githubPagesUrl}`);
console.log(`  Allowed Origins: ${config.allowedOrigins.length} configured`);
console.log(`  Features: ${Object.entries(config.features).filter(([_, enabled]) => enabled).map(([name]) => name).join(', ')}`);
console.log(`  Deployment: ${config.deployment.platform} (${config.deployment.region})`);

export default config;