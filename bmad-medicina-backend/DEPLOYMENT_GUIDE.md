# 🚀 BMad Medicina Backend - Production Deployment Guide

**Version**: 1.0.0  
**Target Platform**: Deno Deploy + DenoKV  
**Compliance**: Ley 19.628 Chilean Data Protection  
**Performance Target**: <200ms API responses, 99.9% uptime

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deno Deploy Setup](#deno-deploy-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup (DenoKV)](#database-setup-denokv)
5. [Security Configuration](#security-configuration)
6. [Monitoring & Health Checks](#monitoring--health-checks)
7. [Performance Optimization](#performance-optimization)
8. [Rollback Procedures](#rollback-procedures)
9. [Post-Deployment Verification](#post-deployment-verification)
10. [Troubleshooting](#troubleshooting)

---

## ✅ Pre-Deployment Checklist

### Development Environment Verification
- [ ] All tests passing: `deno task test`
- [ ] Code formatting: `deno task fmt`
- [ ] Type checking: `deno check src/main.ts`
- [ ] Security audit: Review sensitive data handling
- [ ] Performance baseline: Local load testing completed
- [ ] Documentation updated: API endpoints documented

### Code Quality Gates
```bash
# Run complete verification suite
deno task check    # Type checking + linting
deno task test     # Unit and integration tests
deno task fmt      # Code formatting
```

### Dependencies Audit
```bash
# Verify all dependencies are secure and up-to-date
deno info src/main.ts
```

---

## 🌐 Deno Deploy Setup

### Step 1: Account Setup
1. **Create Deno Deploy Account**: https://dash.deno.com
2. **Connect GitHub Repository**:
   ```bash
   # Ensure code is pushed to main branch
   git add -A
   git commit -m "Production-ready deployment"
   git push origin main
   ```

### Step 2: Project Configuration
1. **Create New Project** in Deno Deploy Dashboard
2. **Connect Repository**: Select your GitHub repository
3. **Configure Build Settings**:
   ```yaml
   Entry Point: src/main.ts
   Build Command: # Leave empty (Deno handles this)
   Environment: Production
   ```

### Step 3: Deployment Script
Create `deploy.ts` in project root:
```typescript
// deploy.ts - Production deployment configuration
import { serve } from "https://deno.land/std@0.216.0/http/server.ts";
import { Application } from "@oak/oak";

// Import your main application
import "./src/main.ts";

// Deno Deploy will automatically use this file
console.log("🚀 BMad Medicina Backend deploying to production...");
```

---

## 🔧 Environment Configuration

### Production Environment Variables

**CRITICAL**: Set these in Deno Deploy Dashboard → Project Settings → Environment Variables

#### Core Configuration
```bash
# Server Configuration
PORT=8080
ENVIRONMENT=production
LOG_LEVEL=info

# Security (MUST CHANGE IN PRODUCTION)
JWT_SECRET=your-super-secure-jwt-secret-256-bits-minimum
ENCRYPTION_KEY=your-aes-256-encryption-key-exactly-32-characters

# CORS Configuration
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

#### Database Configuration
```bash
# DenoKV (automatically configured in Deno Deploy)
# No additional configuration needed - Deno Deploy provides managed KV
```

#### External APIs (Chilean Integration)
```bash
# Chilean Pharmacy APIs
CHILEAN_PHARMACY_API_URL=https://api.farmacias.cl
CHILEAN_PHARMACY_API_KEY=your-chilean-pharmacy-api-key

# SMS Service (Chilean providers)
SMS_API_URL=https://api.sms.cl
SMS_API_KEY=your-sms-api-key

# Email Service
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USER=your-app-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
```

#### Monitoring & Analytics
```bash
# Performance Monitoring
PERFORMANCE_MONITORING=enabled
ERROR_TRACKING=enabled
HEALTH_CHECK_INTERVAL=30000

# Compliance Logging (Ley 19.628)
MEDICAL_DATA_LOGGING=enabled
PRIVACY_HASH_SALT=your-privacy-compliant-salt-key
```

### Environment File Template
Create `.env.production`:
```bash
# Copy this template and fill with production values
# DO NOT commit this file to repository

# === CRITICAL SECURITY SETTINGS ===
JWT_SECRET=CHANGE_THIS_TO_256_BIT_SECRET
ENCRYPTION_KEY=CHANGE_THIS_TO_32_CHAR_KEY_123

# === API CONFIGURATION ===
CHILEAN_PHARMACY_API_KEY=your_real_api_key_here
SMS_API_KEY=your_sms_key_here

# === PRODUCTION DOMAINS ===
CORS_ORIGINS=https://bmad-medicina.com,https://app.bmad-medicina.com
```

---

## 💾 Database Setup (DenoKV)

### Deno Deploy KV (Managed)
**✅ ADVANTAGE**: Fully managed, no setup required

```typescript
// KV is automatically available in Deno Deploy
const kv = await Deno.openKv(); // Automatically configured
```

### KV Schema Initialization
Add to `src/infrastructure/database/init.ts`:
```typescript
export async function initializeProductionKV(): Promise<void> {
  const kv = await Deno.openKv();
  
  // Verify KV connection
  try {
    await kv.set(["health_check"], "ok");
    const result = await kv.get(["health_check"]);
    
    if (result.value !== "ok") {
      throw new Error("KV health check failed");
    }
    
    await kv.delete(["health_check"]);
    console.log("✅ DenoKV production connection verified");
  } catch (error) {
    console.error("❌ DenoKV connection failed:", error);
    throw error;
  }
}
```

### Data Migration Script
Create `scripts/migrate.ts`:
```typescript
// Run this once after deployment for data migration
export async function migrateProductionData() {
  const kv = await Deno.openKv();
  
  console.log("🔄 Starting production data migration...");
  
  // Add any necessary data migrations here
  // Example: Create default admin user, load initial medications, etc.
  
  console.log("✅ Production data migration completed");
}

// Run with: deno run -A scripts/migrate.ts
if (import.meta.main) {
  await migrateProductionData();
}
```

---

## 🔐 Security Configuration

### Production Security Checklist

#### 🔒 Authentication & Authorization
```typescript
// src/infrastructure/security/production.ts
export const productionSecurityConfig = {
  jwt: {
    algorithm: "HS256",
    expiresIn: "15m", // Short-lived tokens in production
    refreshExpiresIn: "7d",
    issuer: "bmad-medicina-backend",
    audience: "bmad-medicina-app",
  },
  
  encryption: {
    algorithm: "AES-256-GCM",
    keyRotationDays: 90, // Rotate encryption keys every 90 days
  },
  
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    skipSuccessfulRequests: false,
  },
};
```

#### 🛡️ Input Validation & Sanitization
```typescript
// Enhanced validation for production
export function validateProductionInput(data: unknown): boolean {
  // Implement strict validation
  // - SQL injection prevention
  // - XSS prevention
  // - Path traversal prevention
  // - Command injection prevention
  
  return true; // After validation passes
}
```

#### 🇨🇱 Ley 19.628 Compliance
```typescript
// Medical data privacy compliance
export const privacyConfig = {
  dataRetentionYears: 7,
  encryptionAtRest: true,
  auditLogging: true,
  consentRequired: true,
  
  // Data subjects rights
  rightToAccess: true,
  rightToCorrection: true,
  rightToDeletion: true,
  rightToPortability: true,
};
```

### Security Headers Configuration
Add to main.ts:
```typescript
// Production security headers
app.use(async (ctx, next) => {
  // Security headers
  ctx.response.headers.set("X-Content-Type-Options", "nosniff");
  ctx.response.headers.set("X-Frame-Options", "DENY");
  ctx.response.headers.set("X-XSS-Protection", "1; mode=block");
  ctx.response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  ctx.response.headers.set("Content-Security-Policy", "default-src 'self'");
  ctx.response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  await next();
});
```

---

## 📊 Monitoring & Health Checks

### Health Check Endpoint Enhancement
Update `src/infrastructure/web/health.ts`:
```typescript
export async function enhancedHealthCheck(): Promise<{
  status: string;
  timestamp: string;
  version: string;
  environment: string;
  database: string;
  memory: number;
  uptime: number;
  checks: Record<string, boolean>;
}> {
  const checks = {
    database: await checkDatabaseHealth(),
    externalApis: await checkExternalApisHealth(),
    memoryUsage: checkMemoryUsage(),
    diskSpace: checkDiskSpace(),
  };

  return {
    status: Object.values(checks).every(Boolean) ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: Deno.env.get("ENVIRONMENT") || "unknown",
    database: "DenoKV",
    memory: Math.round(performance.memory?.usedJSHeapSize / 1024 / 1024) || 0,
    uptime: Math.round(performance.now() / 1000),
    checks,
  };
}
```

### External Monitoring Integration
```typescript
// src/infrastructure/monitoring/external.ts
export class ExternalMonitoring {
  static async reportToUptime(status: "up" | "down"): Promise<void> {
    // Integration with UptimeRobot, Pingdom, etc.
    try {
      await fetch("https://api.uptimerobot.com/v2/editMonitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: Deno.env.get("UPTIME_ROBOT_API_KEY"),
          id: Deno.env.get("UPTIME_ROBOT_MONITOR_ID"),
          status: status === "up" ? 2 : 9,
        }),
      });
    } catch (error) {
      console.error("Failed to report to external monitoring:", error);
    }
  }

  static async reportMetrics(metrics: PerformanceMetrics): Promise<void> {
    // Integration with DataDog, New Relic, etc.
    // Implementation depends on chosen monitoring service
  }
}
```

### Alerting Configuration
```typescript
// src/infrastructure/alerting/alerts.ts
export class AlertingSystem {
  static async sendCriticalAlert(message: string, details?: unknown): Promise<void> {
    // Email notification
    await this.sendEmailAlert(message, details);
    
    // SMS notification for critical issues
    if (message.includes("CRITICAL") || message.includes("DOWN")) {
      await this.sendSMSAlert(message);
    }
    
    // Slack notification
    await this.sendSlackAlert(message, details);
  }

  private static async sendEmailAlert(message: string, details?: unknown): Promise<void> {
    // Email implementation
  }

  private static async sendSMSAlert(message: string): Promise<void> {
    // SMS implementation using Chilean SMS provider
  }

  private static async sendSlackAlert(message: string, details?: unknown): Promise<void> {
    // Slack webhook implementation
  }
}
```

---

## ⚡ Performance Optimization

### Production Performance Configuration
```typescript
// src/infrastructure/performance/config.ts
export const productionPerformanceConfig = {
  // Response compression
  compression: {
    enabled: true,
    threshold: 1024, // Compress responses larger than 1KB
    algorithms: ["gzip", "deflate"],
  },
  
  // Caching strategy
  caching: {
    staticAssets: "1y", // Cache static assets for 1 year
    apiResponses: "5m", // Cache API responses for 5 minutes
    healthCheck: "30s", // Cache health check for 30 seconds
  },
  
  // Connection pooling
  database: {
    maxConnections: 100,
    idleTimeout: 300000, // 5 minutes
    acquireTimeout: 60000, // 1 minute
  },
  
  // Request limits
  limits: {
    jsonLimit: "10mb",
    urlLimit: "50kb",
    fieldLimit: 1000,
  },
};
```

### Response Caching Middleware
```typescript
// src/infrastructure/web/middleware/cache.ts
export function cacheMiddleware(ttl: number) {
  const cache = new Map<string, { data: unknown; expires: number }>();
  
  return async (ctx: Context, next: () => Promise<unknown>) => {
    const key = `${ctx.request.method}:${ctx.request.url.pathname}`;
    const cached = cache.get(key);
    
    if (cached && cached.expires > Date.now()) {
      ctx.response.body = cached.data;
      ctx.response.headers.set("X-Cache", "HIT");
      return;
    }
    
    await next();
    
    if (ctx.response.status === 200) {
      cache.set(key, {
        data: ctx.response.body,
        expires: Date.now() + ttl,
      });
      ctx.response.headers.set("X-Cache", "MISS");
    }
  };
}
```

### Database Query Optimization
```typescript
// src/infrastructure/database/optimized.ts
export class OptimizedKVOperations {
  static async batchGet<T>(keys: Deno.KvKey[]): Promise<(T | null)[]> {
    const kv = await Deno.openKv();
    const results = await Promise.all(
      keys.map(key => kv.get<T>(key))
    );
    return results.map(result => result.value);
  }
  
  static async batchSet<T>(entries: Array<{ key: Deno.KvKey; value: T }>): Promise<void> {
    const kv = await Deno.openKv();
    const atomic = kv.atomic();
    
    for (const entry of entries) {
      atomic.set(entry.key, entry.value);
    }
    
    const result = await atomic.commit();
    if (!result.ok) {
      throw new Error("Batch set operation failed");
    }
  }
}
```

---

## 🔄 Rollback Procedures

### Automated Rollback Strategy
```typescript
// scripts/rollback.ts
export class RollbackManager {
  static async rollbackToVersion(version: string): Promise<void> {
    console.log(`🔄 Starting rollback to version ${version}...`);
    
    try {
      // 1. Verify target version exists
      await this.verifyVersion(version);
      
      // 2. Create backup of current state
      await this.createBackup();
      
      // 3. Deploy previous version (via Deno Deploy API)
      await this.deployVersion(version);
      
      // 4. Verify rollback success
      await this.verifyDeployment();
      
      // 5. Update monitoring
      await this.notifyRollback(version);
      
      console.log(`✅ Rollback to version ${version} completed successfully`);
    } catch (error) {
      console.error(`❌ Rollback failed:`, error);
      await this.notifyRollbackFailure(version, error);
      throw error;
    }
  }
  
  private static async verifyVersion(version: string): Promise<void> {
    // Verify the target version exists and is valid
  }
  
  private static async createBackup(): Promise<void> {
    // Create backup of current KV data
    const kv = await Deno.openKv();
    const backup = new Map();
    
    // Backup critical data
    for await (const entry of kv.list({ prefix: [] })) {
      backup.set(entry.key, entry.value);
    }
    
    // Store backup with timestamp
    const backupKey = `backup_${Date.now()}`;
    await kv.set([backupKey], Object.fromEntries(backup));
  }
  
  private static async deployVersion(version: string): Promise<void> {
    // Use Deno Deploy API to deploy specific version
    const response = await fetch("https://api.deno.com/v1/projects/your-project/deployments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("DENO_DEPLOY_TOKEN")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entryPointUrl: `https://raw.githubusercontent.com/your-repo/your-project/${version}/src/main.ts`,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Deployment failed: ${response.statusText}`);
    }
  }
}
```

### Manual Rollback Steps
```bash
# Emergency Manual Rollback Procedure

# 1. Access Deno Deploy Dashboard
# https://dash.deno.com/projects/your-project

# 2. Go to Deployments tab
# 3. Find the last known good deployment
# 4. Click "Rollback" button
# 5. Confirm rollback

# 6. Verify rollback success
curl https://your-app.deno.dev/health

# 7. Check application functionality
curl https://your-app.deno.dev/api/v1/medications

# 8. Notify team of rollback
# Send notification to team channels
```

### Database Rollback
```typescript
// scripts/database-rollback.ts
export async function rollbackDatabase(backupTimestamp: string): Promise<void> {
  const kv = await Deno.openKv();
  
  try {
    // Retrieve backup
    const backup = await kv.get([`backup_${backupTimestamp}`]);
    if (!backup.value) {
      throw new Error(`Backup ${backupTimestamp} not found`);
    }
    
    // Clear current data (DANGEROUS - use with caution)
    console.log("⚠️  WARNING: Clearing current database...");
    for await (const entry of kv.list({ prefix: [] })) {
      if (!entry.key[0].toString().startsWith('backup_')) {
        await kv.delete(entry.key);
      }
    }
    
    // Restore backup data
    const backupData = backup.value as Record<string, unknown>;
    for (const [key, value] of Object.entries(backupData)) {
      await kv.set(JSON.parse(key), value);
    }
    
    console.log(`✅ Database rolled back to ${backupTimestamp}`);
  } catch (error) {
    console.error("❌ Database rollback failed:", error);
    throw error;
  }
}
```

---

## ✅ Post-Deployment Verification

### Automated Verification Suite
```bash
#!/bin/bash
# scripts/verify-deployment.sh

echo "🔍 Starting post-deployment verification..."

# 1. Health Check
echo "Checking health endpoint..."
HEALTH_STATUS=$(curl -s https://your-app.deno.dev/health | jq -r '.status')
if [ "$HEALTH_STATUS" != "healthy" ]; then
    echo "❌ Health check failed: $HEALTH_STATUS"
    exit 1
fi
echo "✅ Health check passed"

# 2. API Endpoints
echo "Testing API endpoints..."
API_RESPONSE=$(curl -s https://your-app.deno.dev/api/v1/medications | jq -r '.success')
if [ "$API_RESPONSE" != "true" ]; then
    echo "❌ API test failed"
    exit 1
fi
echo "✅ API endpoints working"

# 3. Database Connectivity
echo "Testing database connectivity..."
DB_TEST=$(curl -s -X POST https://your-app.deno.dev/api/v1/medications \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST","name":"Test Med","genericName":"Test","activeIngredient":"Test","concentration":"1mg","pharmaceuticalForm":"tablet","manufacturer":"Test","category":"other","prescriptionRequired":false,"instructions":"Test"}' | jq -r '.success')
if [ "$DB_TEST" != "true" ]; then
    echo "❌ Database test failed"
    exit 1
fi
echo "✅ Database connectivity working"

# 4. Performance Test
echo "Testing response times..."
RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" https://your-app.deno.dev/api/v1/medications)
if (( $(echo "$RESPONSE_TIME > 0.5" | bc -l) )); then
    echo "⚠️  Warning: Response time ${RESPONSE_TIME}s exceeds 500ms threshold"
fi
echo "✅ Performance test completed: ${RESPONSE_TIME}s"

# 5. Security Headers
echo "Checking security headers..."
SECURITY_HEADERS=$(curl -I -s https://your-app.deno.dev/health | grep -E "(X-Content-Type-Options|X-Frame-Options|Strict-Transport-Security)")
if [ -z "$SECURITY_HEADERS" ]; then
    echo "❌ Security headers missing"
    exit 1
fi
echo "✅ Security headers present"

echo "🎉 All verification checks passed!"
```

### Manual Verification Checklist
- [ ] **Health Endpoint**: `https://your-app.deno.dev/health` returns "healthy"
- [ ] **API Functionality**: All CRUD operations working
- [ ] **Database**: Data persistence verified
- [ ] **Authentication**: JWT tokens working
- [ ] **Error Handling**: Proper error responses
- [ ] **CORS**: Frontend can connect successfully
- [ ] **Performance**: Response times <200ms
- [ ] **Security**: Headers and validation working
- [ ] **Monitoring**: Alerts and logging active
- [ ] **Compliance**: Ley 19.628 privacy logging working

---

## 🛠️ Troubleshooting

### Common Deployment Issues

#### Issue: "Module not found" errors
```bash
# Solution: Check import paths and dependencies
deno info src/main.ts
# Ensure all imports use correct URLs and versions
```

#### Issue: Environment variables not loading
```bash
# Solution: Verify in Deno Deploy Dashboard
# Project Settings → Environment Variables
# Ensure all required variables are set
```

#### Issue: KV database connection fails
```typescript
// Debug KV connection
try {
  const kv = await Deno.openKv();
  console.log("KV connection successful");
} catch (error) {
  console.error("KV connection failed:", error);
  // Check Deno Deploy KV is enabled for your project
}
```

#### Issue: CORS errors from frontend
```typescript
// Verify CORS configuration
const corsOrigins = Deno.env.get("CORS_ORIGINS")?.split(",") || [];
console.log("Configured CORS origins:", corsOrigins);
// Ensure frontend domain is included
```

#### Issue: High response times
```bash
# Check performance metrics
curl -w "@curl-format.txt" -s https://your-app.deno.dev/api/v1/medications

# curl-format.txt content:
# time_namelookup: %{time_namelookup}\n
# time_connect: %{time_connect}\n
# time_appconnect: %{time_appconnect}\n
# time_pretransfer: %{time_pretransfer}\n
# time_redirect: %{time_redirect}\n
# time_starttransfer: %{time_starttransfer}\n
# time_total: %{time_total}\n
```

### Emergency Contacts & Procedures

#### Critical Issues (Production Down)
1. **Immediate Rollback**: Use Deno Deploy dashboard
2. **Alert Team**: Slack/Email notifications
3. **Status Page**: Update status.bmad-medicina.com
4. **Monitor**: Watch error rates and recovery

#### Performance Issues
1. **Check Metrics**: Response times and error rates
2. **Scale**: Deno Deploy auto-scales, but verify
3. **Cache**: Implement caching for high-traffic endpoints
4. **Database**: Check KV operation efficiency

#### Security Issues
1. **Rotate Keys**: JWT secrets and encryption keys
2. **Block IPs**: Use Cloudflare or similar for DDoS
3. **Audit Logs**: Check for suspicious activity
4. **Compliance**: Ensure Ley 19.628 compliance maintained

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks

#### Weekly
- [ ] Review error logs and fix issues
- [ ] Check performance metrics
- [ ] Update dependencies if needed
- [ ] Verify backup integrity

#### Monthly
- [ ] Security audit and dependency scan
- [ ] Performance optimization review
- [ ] Database cleanup and optimization
- [ ] Update monitoring and alerting rules

#### Quarterly
- [ ] Security key rotation
- [ ] Compliance audit (Ley 19.628)
- [ ] Disaster recovery testing
- [ ] Performance benchmarking

### Contact Information
- **Backend Developer**: [Your contact]
- **DevOps Team**: [DevOps contact]
- **Security Team**: [Security contact]
- **Compliance Officer**: [Compliance contact]

---

## 🎯 Deployment Checklist Summary

### Pre-Deployment ✅
- [ ] Code quality checks passed
- [ ] Security review completed
- [ ] Performance testing done
- [ ] Documentation updated

### Deployment ✅
- [ ] Deno Deploy project configured
- [ ] Environment variables set
- [ ] Database initialized
- [ ] Security headers configured
- [ ] Monitoring enabled

### Post-Deployment ✅
- [ ] Health checks passing
- [ ] API endpoints working
- [ ] Performance within targets
- [ ] Security verification complete
- [ ] Team notified of deployment

---

**📝 VERSION HISTORY**
- v1.0.0 - Initial production deployment guide
- Created: 2025-07-24
- Last Updated: 2025-07-24
- Next Review: 2025-08-24

**⚠️ SECURITY REMINDER**: Never commit secrets to repository. Always use environment variables for sensitive configuration.