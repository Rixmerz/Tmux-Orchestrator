# 🚀 BMad Medication Adherence System - Deployment Guide

**Project**: Sistema Adherencia Medicamentos MVP  
**Stack**: Deno Fresh + DenoKV  
**Target Platform**: Deno Deploy (Edge Computing)  
**Date**: July 24, 2025

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Database Configuration](#database-configuration)
6. [Security Configuration](#security-configuration)
7. [Monitoring Setup](#monitoring-setup)
8. [Performance Optimization](#performance-optimization)
9. [Rollback Procedures](#rollback-procedures)
10. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Tools
```bash
# Install Deno (v2.0 or higher)
curl -fsSL https://deno.land/install.sh | sh

# Install Deno Deploy CLI
deno install --allow-all --global https://deno.land/x/deploy/deployctl.ts

# Verify installations
deno --version
deployctl --version
```

### Required Accounts
- ✅ **Deno Deploy Account**: [dash.deno.com](https://dash.deno.com)
- ✅ **GitHub Repository**: For source code management
- ✅ **Domain Registration**: For custom domain (optional)

### System Requirements
- **Minimum**: 512MB RAM, 1 CPU core
- **Recommended**: 2GB RAM, 2 CPU cores
- **Storage**: 10GB available space
- **Network**: Stable internet connection

---

## 🌍 Environment Setup

### Environment Variables

#### Backend Environment (.env)
```bash
# Server Configuration
PORT=8080
DENO_ENV=production
API_VERSION=1.0.0

# Database Configuration
DENO_KV_URL=https://api.deno.com/databases/{DATABASE_ID}/connect
DENO_KV_ACCESS_TOKEN=your_kv_access_token

# Security Configuration
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters
ENCRYPTION_KEY=your_aes256_encryption_key_exactly_32_bytes
HASH_SALT=your_bcrypt_salt_rounds_12_recommended

# Chilean Regulatory Compliance
LEY_19628_COMPLIANCE=true
DATA_RETENTION_DAYS=2555  # 7 years as per Chilean law
AUDIT_LOG_ENABLED=true

# External APIs
CHILE_PHARMACY_API_KEY=your_pharmacy_api_key
ISP_MEDICATION_API_KEY=your_isp_api_key
```

#### Frontend Environment (.env)
```bash
# API Configuration
API_BASE_URL=https://your-api-domain.deno.dev
API_VERSION=v1

# PWA Configuration
PWA_NAME="Adherencia Medicamentos"
PWA_SHORT_NAME="AdherenciaMed"
PWA_DESCRIPTION="Sistema de adherencia medicamentos para adultos mayores"

# Feature Flags
QR_SCANNER_ENABLED=true
VOICE_ALERTS_ENABLED=true
FAMILY_DASHBOARD_ENABLED=true

# Performance
CACHE_DURATION=3600
CDN_URL=https://your-cdn-domain.com
```

---

## 🖥️ Backend Deployment

### Step 1: Prepare Backend Code
```bash
# Navigate to backend directory
cd bmad-medicina-backend

# Verify project structure
tree src/
```

### Step 2: Configure Deno Deploy Project
```bash
# Login to Deno Deploy
deployctl login

# Create new project
deployctl projects create bmad-medicina-api

# Link repository
deployctl link --project=bmad-medicina-api --prod-branch=main
```

### Step 3: Deploy Backend
```bash
# Deploy from local (for testing)
deployctl deploy --project=bmad-medicina-api src/main.ts

# Or deploy from GitHub (recommended for production)
deployctl deploy --project=bmad-medicina-api \
  --prod-branch=main \
  --entry-point=src/main.ts
```

### Step 4: Configure Environment Variables
```bash
# Set environment variables in Deno Deploy dashboard
# Or via CLI:
deployctl env set --project=bmad-medicina-api \
  JWT_SECRET="your_super_secure_jwt_secret" \
  ENCRYPTION_KEY="your_32_byte_encryption_key" \
  DENO_ENV="production"
```

### Step 5: Verify Backend Deployment
```bash
# Check deployment URL (provided by Deno Deploy)
curl https://bmad-medicina-api-{unique-id}.deno.dev/health

# Expected response:
# {"status":"ok","timestamp":"2025-07-24T...","version":"1.0.0"}
```

---

## 🌐 Frontend Deployment

### Step 1: Prepare Frontend Code
```bash
# Navigate to frontend directory
cd bmad-medicina-frontend

# Update API endpoint in configuration
# Edit deno.json or env file with production API URL
```

### Step 2: Build Frontend for Production
```bash
# Build static assets
deno task build

# Optimize assets
deno task optimize

# Generate fresh manifest
deno task manifest
```

### Step 3: Configure Deno Deploy Project
```bash
# Create frontend project
deployctl projects create bmad-medicina-app

# Link repository
deployctl link --project=bmad-medicina-app --prod-branch=main
```

### Step 4: Deploy Frontend
```bash
# Deploy frontend
deployctl deploy --project=bmad-medicina-app \
  --prod-branch=main \
  --entry-point=main.ts
```

### Step 5: Configure PWA Settings
```bash
# Verify PWA manifest.json
cat static/manifest.json

# Verify service worker
cat static/sw.js

# Test PWA installation
# Open deployed URL in browser and test "Add to Home Screen"
```

---

## 🗄️ Database Configuration

### DenoKV Setup

#### Step 1: Create DenoKV Database
```bash
# Create database via Deno Deploy dashboard
# Or via CLI:
deployctl kv create --name=bmad-medicina-db
```

#### Step 2: Configure Database Connection
```bash
# Get KV database URL from dashboard
DENO_KV_URL="https://api.deno.com/databases/{DATABASE_ID}/connect"

# Set environment variable in backend deployment
deployctl env set --project=bmad-medicina-api \
  DENO_KV_URL="your_kv_database_url"
```

#### Step 3: Initialize Database Schema
```bash
# Run initialization script
deno run --allow-net --allow-env scripts/init-database.ts
```

#### Step 4: Seed Initial Data
```bash
# Load Chilean medications database
deno run --allow-net --allow-env scripts/seed-medications.ts

# Create admin user
deno run --allow-net --allow-env scripts/create-admin.ts
```

### Database Migration Strategy
```typescript
// Example migration script
// scripts/migrate-v1-to-v2.ts
import { openKv } from "https://deno.land/x/deno_kv@0.1.0/mod.ts";

const kv = await openKv();

// Migration logic here
console.log("Migration completed successfully");
```

---

## 🔒 Security Configuration

### SSL/TLS Setup
```bash
# Deno Deploy provides automatic HTTPS
# Custom domain configuration:
deployctl domains add --project=bmad-medicina-app \
  --domain=medicamentos.tu-dominio.cl
```

### Security Headers Configuration
```typescript
// In your main.ts file
const security_headers = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'",
  "Referrer-Policy": "strict-origin-when-cross-origin"
};
```

### API Security
```typescript
// Rate limiting configuration
const rateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP"
};

// CORS configuration for production
const corsOptions = {
  origin: [
    "https://your-frontend-domain.deno.dev",
    "https://medicamentos.tu-dominio.cl"
  ],
  credentials: true
};
```

### Data Encryption
```typescript
// Ley 19.628 compliance encryption
import { AES } from "https://deno.land/x/crypto/aes.ts";

const encryptSensitiveData = (data: string): string => {
  const key = Deno.env.get("ENCRYPTION_KEY");
  return AES.encrypt(data, key).toString();
};
```

---

## 📊 Monitoring Setup

### Health Check Endpoints
```typescript
// Health check configuration
app.get("/health", (req, res) => {
  return Response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: Deno.env.get("DENO_ENV"),
    database: "connected", // Add DB connection check
    uptime: process.uptime()
  });
});

// Detailed health check
app.get("/health/detailed", (req, res) => {
  return Response.json({
    status: "ok",
    services: {
      database: await checkDatabaseConnection(),
      external_apis: await checkExternalAPIs(),
      memory_usage: Deno.memoryUsage(),
      cpu_usage: await getCPUUsage()
    }
  });
});
```

### Logging Configuration
```typescript
// Structured logging for production
import { logger } from "./infrastructure/logging/logger.ts";

// Log levels: ERROR, WARN, INFO, DEBUG
logger.info("Application started", {
  version: "1.0.0",
  environment: Deno.env.get("DENO_ENV"),
  timestamp: new Date().toISOString()
});
```

### Performance Monitoring
```bash
# Add monitoring endpoints
GET /metrics              # Application metrics
GET /metrics/performance  # Performance metrics
GET /metrics/security     # Security audit logs
```

---

## ⚡ Performance Optimization

### Backend Optimization
```typescript
// Connection pooling for external APIs
const connectionPool = new Map();

// Response caching
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Compression middleware
app.use(compression({
  threshold: 1024,
  level: 6
}));
```

### Frontend Optimization
```bash
# Build with optimizations
deno task build --minify --compress

# Enable asset compression
deno task compress-assets

# Configure CDN for static assets
# Update static file URLs to point to CDN
```

### Database Optimization
```typescript
// DenoKV optimization strategies
const optimizedQuery = {
  // Use atomic operations for consistency
  atomic: await kv.atomic()
    .set(["users", userId], userData)
    .set(["users_by_email", email], userId)
    .commit(),
  
  // Batch operations
  batch: await kv.getMany([
    ["medications", medicationId],
    ["interactions", medicationId],
    ["compliance", userId, medicationId]
  ])
};
```

---

## 🔄 Rollback Procedures

### Quick Rollback Strategy
```bash
# Rollback to previous deployment
deployctl rollback --project=bmad-medicina-api --revision=previous

# Rollback to specific revision
deployctl rollback --project=bmad-medicina-api --revision=abc123

# Verify rollback
curl https://bmad-medicina-api-{id}.deno.dev/health
```

### Database Rollback
```bash
# Database backup before deployment
deno run scripts/backup-database.ts

# Restore from backup if needed
deno run scripts/restore-database.ts --backup-id=backup_20250724_123456
```

### Blue-Green Deployment
```bash
# Deploy to staging slot
deployctl deploy --project=bmad-medicina-api-staging src/main.ts

# Test staging deployment
curl https://bmad-medicina-api-staging-{id}.deno.dev/health

# Swap staging to production
deployctl promote --project=bmad-medicina-api --from=staging
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Deployment Failures
```bash
# Check deployment logs
deployctl logs --project=bmad-medicina-api --tail

# Common fixes:
# - Verify all environment variables are set
# - Check Deno.json configuration
# - Ensure all imports use absolute URLs
```

#### 2. Database Connection Issues
```bash
# Test KV connection
deno run --allow-env --allow-net scripts/test-kv-connection.ts

# Common fixes:
# - Verify DENO_KV_URL is correct
# - Check access tokens are valid
# - Ensure database exists in correct region
```

#### 3. Performance Issues
```bash
# Monitor performance
curl https://your-api.deno.dev/metrics/performance

# Common fixes:
# - Enable response compression
# - Implement caching strategy
# - Optimize database queries
# - Use CDN for static assets
```

#### 4. SSL Certificate Issues
```bash
# Check certificate status
openssl s_client -connect your-domain.cl:443 -servername your-domain.cl

# Renew certificate if needed
deployctl ssl renew --domain=your-domain.cl
```

### Debugging Commands
```bash
# View application logs
deployctl logs --project=bmad-medicina-api --follow

# Check resource usage
deployctl stats --project=bmad-medicina-api

# Test endpoints
curl -v https://your-api.deno.dev/health
curl -v https://your-api.deno.dev/api/v1/medications
```

---

## 📋 Pre-Deployment Checklist

### Backend Checklist
- [ ] Environment variables configured in Deno Deploy
- [ ] Database connection tested and working
- [ ] All API endpoints returning correct responses
- [ ] Security headers properly configured
- [ ] Rate limiting implemented
- [ ] Logging configured for production
- [ ] Health check endpoints working
- [ ] SSL certificate installed and valid

### Frontend Checklist
- [ ] Production API URL configured
- [ ] PWA manifest.json configured correctly
- [ ] Service worker registered and functional
- [ ] Static assets optimized and compressed
- [ ] Accessibility compliance verified (WCAG 2.1 AA)
- [ ] Senior-friendly UX tested on multiple devices
- [ ] QR scanner functionality tested
- [ ] Offline mode working correctly

### Security Checklist
- [ ] All sensitive data encrypted (Ley 19.628 compliance)
- [ ] Audit logging enabled for medical data access
- [ ] User consent mechanisms implemented
- [ ] Data retention policies configured (7 years)
- [ ] HTTPS enforced for all connections
- [ ] API authentication and authorization working
- [ ] Input validation implemented for all endpoints
- [ ] Security headers configured

### Performance Checklist
- [ ] API response times under 200ms
- [ ] Frontend load times under 3s on 3G
- [ ] Database queries optimized
- [ ] Caching implemented where appropriate
- [ ] CDN configured for static assets
- [ ] Compression enabled for API responses
- [ ] Resource usage monitored and within limits

---

## 📞 Support & Maintenance

### Monitoring Endpoints
```bash
# Health monitoring
curl https://your-api.deno.dev/health

# Performance monitoring
curl https://your-api.deno.dev/metrics

# Security audit
curl https://your-api.deno.dev/audit-log
```

### Backup Procedures
```bash
# Daily database backup (recommended cron job)
0 2 * * * deno run scripts/backup-database.ts

# Weekly full system backup
0 3 * * 0 deno run scripts/full-backup.ts
```

### Update Procedures
```bash
# Update dependencies
deno run --allow-write scripts/update-deps.ts

# Deploy updates
git push origin main  # Triggers automatic deployment

# Verify deployment
curl https://your-api.deno.dev/health
```

---

## 🎯 Post-Deployment Verification

### Functional Testing
```bash
# Test complete user flow
npm run test:e2e:production

# Test API endpoints
npm run test:api:production

# Test accessibility
npm run test:accessibility:production
```

### Performance Testing
```bash
# Load testing
deno run scripts/load-test.ts --target=https://your-api.deno.dev

# Performance monitoring
curl https://your-api.deno.dev/metrics/performance
```

### Security Verification
```bash
# Security scan
deno run scripts/security-scan.ts

# Compliance check
deno run scripts/ley-19628-compliance-check.ts
```

---

**Deployment Guide Version**: 1.0  
**Compatible with**: BMad Medication Adherence System MVP v1.0.0  
**Last Updated**: July 24, 2025  
**Support**: Refer to BMAD_PROJECT_DOCUMENTATION.md for complete project details

---

*This deployment guide ensures full production deployment of the BMad Medication Adherence System with Chilean regulatory compliance (Ley 19.628) and optimal performance for elderly users.*