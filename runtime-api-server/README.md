# ScienceHabits Runtime API Server

A lightweight, edge-deployable API server designed for cost-effective deployment (~$5/month) that provides enhanced content delivery, caching, and monitoring for the ScienceHabits PWA.

## Overview

This runtime API server acts as an intelligent proxy and enhancement layer between the main ScienceHabits app and the GitHub Pages Content API. It provides:

- **GitHub Pages Proxy**: Intelligent caching and fallback strategies
- **Performance Monitoring**: Comprehensive metrics and health checks
- **Security**: Authentication, rate limiting, and security headers
- **Admin Endpoints**: Content management and system monitoring
- **Edge Deployment**: Optimized for low-cost cloud deployment

## Architecture

```
ScienceHabits PWA
       ↓
Runtime API Server (This Server)
       ↓
GitHub Pages Content API
```

## Features

### Core Functionality
- ✅ GitHub Pages content proxy with intelligent caching
- ✅ Authentication middleware for admin endpoints
- ✅ Comprehensive request/response logging
- ✅ Error handling with user-friendly responses
- ✅ Health monitoring and metrics collection
- ✅ Prometheus-compatible metrics export

### Performance & Monitoring
- ✅ Response time tracking
- ✅ Cache hit rate monitoring
- ✅ Error rate alerting
- ✅ Memory usage monitoring
- ✅ Circuit breaker patterns for resilience

### Security
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Authentication via API keys
- ✅ Request validation

## Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Server runs on http://localhost:3005
```

### Production Build
```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

### Environment Configuration
Create a `.env` file:
```env
NODE_ENV=production
PORT=3005
GITHUB_PAGES_URL=https://your-username.github.io/sciencehabits-content-api
ADMIN_API_KEY=your-secure-api-key-here
CORS_ORIGIN=https://your-app-domain.com
MONITORING_ENABLED=true
MONITORING_WEBHOOK_URL=https://your-webhook-url.com/alerts
```

## API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/metrics` - Prometheus metrics
- `GET /api/:type/:language?` - Content proxy (habits, research, goals, translations)

### Admin Endpoints (Requires Authentication)
- `GET /admin/health` - Detailed health status
- `GET /admin/metrics` - Detailed metrics
- `GET /admin/stats` - System statistics
- `POST /admin/cache/clear` - Clear cache

### Authentication
Admin endpoints require an `Authorization` header:
```
Authorization: Bearer your-api-key
# or
Authorization: ApiKey your-api-key
```

## Deployment Options

### 1. Railway (~$5/month)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway deploy
```

### 2. Render (~$7/month)
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Configure environment variables

### 3. DigitalOcean App Platform (~$5/month)
```yaml
# .do/app.yaml
name: sciencehabits-runtime-api
services:
- name: api
  source_dir: /
  github:
    repo: your-username/sciencehabits
    branch: main
  build_command: npm run build
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
```

### 4. Vercel (Serverless - Free tier available)
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.ts"
    }
  ]
}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `3005` |
| `GITHUB_PAGES_URL` | GitHub Pages API base URL | Required |
| `ADMIN_API_KEY` | API key for admin endpoints | Required |
| `CORS_ORIGIN` | Allowed CORS origins | `*` |
| `MONITORING_ENABLED` | Enable monitoring and alerts | `false` |
| `MONITORING_WEBHOOK_URL` | Webhook URL for alerts | Optional |

### Feature Flags
The server supports configuration via the `config.ts` file for:
- Cache TTL settings
- Rate limiting rules
- Monitoring thresholds
- Security policies

## Monitoring & Alerts

### Health Checks
- **Server Health**: Uptime and restart detection
- **Memory Health**: Heap usage monitoring with warnings
- **GitHub Pages Health**: Periodic connectivity checks
- **Cache Health**: Cache performance monitoring

### Metrics Collection
- Request count and response times
- Error rates and status code distribution
- Cache hit rates and performance
- Memory usage and system health

### Alerting
Configurable alerts for:
- High error rates (>5% default)
- Memory usage (>75% warning, >90% critical)
- GitHub Pages connectivity issues
- Slow response times

## Performance Targets

- **API Response Time**: <200ms (excluding GitHub Pages latency)
- **Memory Usage**: <100MB under normal load
- **Cache Hit Rate**: >80% for repeated requests
- **Uptime**: >99.9% availability

## Security Considerations

### Implemented
- Helmet.js security headers
- CORS configuration
- Rate limiting (100 requests/15 minutes default)
- API key authentication
- Input validation and sanitization
- Error message sanitization

### Recommendations
- Use HTTPS in production
- Rotate API keys regularly
- Monitor for suspicious activity
- Implement IP whitelisting if needed
- Use environment variables for secrets

## Development

### Project Structure
```
src/
├── server.ts              # Main server entry point
├── config.ts              # Configuration management
├── middleware/            # Express middleware
│   ├── auth.ts           # Authentication
│   ├── logging.ts        # Request/response logging
│   └── errorHandler.ts   # Error handling
└── services/             # Business logic
    ├── githubPagesProxy.ts # GitHub Pages proxy
    ├── healthService.ts    # Health monitoring
    └── metricsService.ts   # Metrics collection
```

### Adding New Features
1. Create service in `src/services/`
2. Add route in `src/server.ts`
3. Add middleware if needed
4. Update configuration in `src/config.ts`
5. Add tests and documentation

### Testing
```bash
# Run all tests
npm test

# Test with coverage
npm run test:coverage

# Integration tests
npm run test:integration
```

## Troubleshooting

### Common Issues

**Server won't start**
- Check PORT environment variable
- Verify Node.js version (16+ required)
- Check for port conflicts

**GitHub Pages connectivity issues**
- Verify GITHUB_PAGES_URL is correct
- Check GitHub Pages deployment status
- Review network/firewall settings

**High memory usage**
- Check for memory leaks in metrics cleanup
- Review cache size configuration
- Monitor garbage collection

**Authentication failures**
- Verify ADMIN_API_KEY is set correctly
- Check Authorization header format
- Review CORS configuration

### Logs and Debugging
```bash
# Enable debug logging
DEBUG=* npm start

# View specific service logs
DEBUG=metrics:* npm start
DEBUG=proxy:* npm start
```

## License

This runtime API server is part of the ScienceHabits project and follows the same license terms.