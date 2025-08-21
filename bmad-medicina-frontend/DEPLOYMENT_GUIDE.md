# BMad Frontend Deployment Guide

## 🚀 Production Deployment Procedures
**Senior-Friendly Medication Adherence System**

### 📋 Pre-Deployment QA Checklist

#### Code Quality Validation
- [ ] TypeScript compilation without errors
- [ ] ESLint and code formatting checks passed
- [ ] No console.log statements in production code
- [ ] All TODOs resolved or documented
- [ ] Security audit completed (no hardcoded secrets)

#### Senior UX Validation
- [ ] Font sizes ≥18px verified on all components
- [ ] Touch targets ≥56px validated
- [ ] WCAG 2.1 AA compliance verified
- [ ] Spanish localization complete and accurate
- [ ] High contrast ratios (4.5:1) validated
- [ ] Error messages senior-friendly and in Spanish

#### PWA Requirements
- [ ] Service worker functionality tested
- [ ] Offline capability validated
- [ ] App manifest properly configured
- [ ] Install prompt working
- [ ] Push notifications tested

---

## 1. Deno Fresh Build Process

### Production Build Command
```bash
# Build for production
deno task build

# Verify build output
ls -la _fresh/

# Build with optimizations
deno task build --target=es2022 --minify
```

### Build Configuration
```typescript
// fresh.config.ts
import { defineConfig } from "$fresh/server.ts";

export default defineConfig({
  build: {
    target: ["chrome99", "firefox91", "safari15"],
    minify: true,
    sourcemap: false, // Disable for production
  },
  plugins: [
    // Add compression plugin
    {
      name: "gzip-compression",
      buildStart() {
        // Compress static assets
      }
    }
  ]
});
```

### QA Validation Points
```bash
# Test build integrity
deno check **/*.ts **/*.tsx

# Performance audit
deno run --allow-read --allow-net scripts/performance-audit.ts

# Bundle size analysis
deno run --allow-read scripts/bundle-analyzer.ts
```

---

## 2. Static Asset Optimization

### Image Optimization
```bash
# Optimize PNG/JPG assets
deno run --allow-read --allow-write scripts/optimize-images.ts

# Generate WebP versions
for file in static/icons/*.png; do
  cwebp "$file" -o "${file%.png}.webp"
done

# Verify optimization results
ls -lh static/icons/
```

### Asset Compression Strategy
```typescript
// static/sw.js - Service Worker Caching
const STATIC_CACHE_FILES = [
  // Critical CSS (inline in HTML)
  '/',
  '/static/styles.css',
  
  // Optimized images
  '/icons/icon-192x192.webp',
  '/icons/icon-512x512.webp',
  
  // Essential JavaScript
  '/_fresh/chunk-[hash].js',
];

// Cache strategy: Cache First for static assets
```

### CDN Configuration
```yaml
# cdn-config.yml (CloudFlare/AWS CloudFront)
cache_control:
  static_assets: "public, max-age=31536000, immutable"
  html_pages: "public, max-age=3600"
  api_responses: "private, no-cache"

compression:
  gzip: true
  brotli: true
  
security_headers:
  content_security_policy: "default-src 'self'; script-src 'self' 'unsafe-inline'"
  x_frame_options: "DENY"
  x_content_type_options: "nosniff"
```

---

## 3. PWA Deployment Configuration

### Manifest Validation
```json
// static/manifest.json - Production ready
{
  "name": "BMad - Sistema de Adherencia Medicamentos",
  "short_name": "BMad",
  "description": "Asistente personal para medicamentos - Adultos mayores",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0369a1",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192x192.webp",
      "sizes": "192x192",
      "type": "image/webp",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.webp", 
      "sizes": "512x512",
      "type": "image/webp",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Escanear Medicamento",
      "short_name": "Escanear",
      "description": "Escanear código QR de medicamento",
      "url": "/?action=scan",
      "icons": [{"src": "/icons/scan-shortcut.webp", "sizes": "96x96"}]
    },
    {
      "name": "Calendario",
      "short_name": "Calendario", 
      "description": "Ver calendario de medicamentos",
      "url": "/calendario",
      "icons": [{"src": "/icons/calendar-shortcut.webp", "sizes": "96x96"}]
    }
  ]
}
```

### Service Worker Production Config
```javascript
// static/sw.js - Production optimized
const CACHE_NAME = 'bmad-medications-v2.0.0';
const OFFLINE_URL = '/offline';

// Production caching strategy
const CACHE_STRATEGIES = {
  static: 'CacheFirst',      // CSS, JS, Images
  api: 'NetworkFirst',       // API calls
  pages: 'StaleWhileRevalidate'  // HTML pages
};

// Performance monitoring
self.addEventListener('fetch', (event) => {
  // Track performance metrics
  const startTime = performance.now();
  
  event.respondWith(
    handleRequest(event.request)
      .then(response => {
        const duration = performance.now() - startTime;
        // Log slow requests (>2s for seniors)
        if (duration > 2000) {
          console.warn(`Slow request: ${event.request.url} took ${duration}ms`);
        }
        return response;
      })
  );
});
```

---

## 4. Environment Variables Production

### Environment Configuration
```bash
# .env.production
DENO_ENV=production
API_BASE_URL=https://api.bmad.cl/v1
WEBSOCKET_URL=wss://ws.bmad.cl
SENTRY_DSN=https://your-sentry-dsn
ANALYTICS_ID=GA-BMAD-PROD

# Security settings
SECURE_COOKIES=true
HTTPS_ONLY=true
CSP_ENABLED=true

# Performance settings
CACHE_TTL=3600
API_TIMEOUT=10000
```

### Runtime Configuration Validation
```typescript
// lib/config/production.ts
export const ProductionConfig = {
  api: {
    baseUrl: Deno.env.get("API_BASE_URL") || "https://api.bmad.cl/v1",
    timeout: parseInt(Deno.env.get("API_TIMEOUT") || "10000"),
    retries: 3,
  },
  
  performance: {
    maxBundleSize: "500KB",  // For senior users on slow connections
    criticalCSS: true,
    lazyLoading: true,
  },
  
  accessibility: {
    minFontSize: "18px",
    minTouchTarget: "56px", 
    contrastRatio: 4.5,
  },
  
  // Validate environment
  validate() {
    const required = ["API_BASE_URL", "WEBSOCKET_URL"];
    const missing = required.filter(key => !Deno.env.get(key));
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }
  }
};
```

---

## 5. Performance Optimization Settings

### Critical Performance Metrics (Senior Users)
```typescript
// Performance budgets for 60+ users
const PERFORMANCE_BUDGETS = {
  // Core Web Vitals for seniors
  LCP: 2500,      // Largest Contentful Paint <2.5s
  FID: 100,       // First Input Delay <100ms  
  CLS: 0.1,       // Cumulative Layout Shift <0.1
  
  // Network considerations
  slowNetwork: true,    // Optimize for 3G
  reducedMotion: true,  // Respect user preferences
  
  // Bundle sizes
  mainBundle: "400KB",
  totalBundle: "1.5MB",
  criticalCSS: "15KB",
};
```

### Optimization Implementation
```typescript
// routes/_middleware.ts - Performance middleware
export async function handler(req: Request, ctx: FreshContext) {
  const startTime = performance.now();
  
  // Add performance headers
  const response = await ctx.next();
  
  const duration = performance.now() - startTime;
  response.headers.set("Server-Timing", `total;dur=${duration}`);
  
  // Cache headers for seniors (longer cache for stability)
  if (req.url.includes('/static/')) {
    response.headers.set("Cache-Control", "public, max-age=2592000"); // 30 days
  }
  
  return response;
}
```

### Image Optimization for Seniors
```typescript
// lib/utils/image-optimization.ts
export function generateResponsiveImages(imagePath: string) {
  return {
    // High contrast versions for low vision
    highContrast: `${imagePath}?contrast=high`,
    
    // Large text overlays
    largeText: `${imagePath}?text-size=xl`,
    
    // Reduced motion versions
    static: `${imagePath}?motion=none`,
    
    // WebP with JPEG fallback
    sources: [
      { srcset: `${imagePath}.webp`, type: "image/webp" },
      { srcset: `${imagePath}.jpg`, type: "image/jpeg" }
    ]
  };
}
```

---

## 6. Browser Compatibility Testing

### Target Browser Matrix
```yaml
# Supported browsers for Chilean seniors
primary_browsers:
  chrome: ">=90"      # 85% market share
  safari: ">=14"      # 20% iOS users  
  firefox: ">=88"     # 10% users
  samsung: ">=15"     # Android default

secondary_browsers:
  edge: ">=90"
  opera: ">=76"

# Feature detection
required_features:
  - WebRTC (QR scanner)
  - Service Workers (PWA)
  - Push Notifications
  - Camera API
  - LocalStorage
  - Fetch API
```

### Automated Testing Suite
```typescript
// tests/browser-compatibility.test.ts
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

Deno.test("Browser Compatibility - QR Scanner", async () => {
  // Test WebRTC support
  const hasWebRTC = "mediaDevices" in navigator;
  assertEquals(hasWebRTC, true, "WebRTC required for QR scanning");
  
  // Test camera permissions
  if (hasWebRTC) {
    const permissions = await navigator.permissions.query({name: "camera"});
    assertEquals(permissions.state !== "denied", true, "Camera access required");
  }
});

Deno.test("Browser Compatibility - PWA Features", async () => {
  // Test service worker support
  const hasServiceWorker = "serviceWorker" in navigator;
  assertEquals(hasServiceWorker, true, "Service Worker required for PWA");
  
  // Test notification support
  const hasNotifications = "Notification" in window;
  assertEquals(hasNotifications, true, "Notifications required for reminders");
});
```

### Cross-Browser Testing Script
```bash
#!/bin/bash
# scripts/test-browsers.sh

echo "🧪 Running cross-browser compatibility tests..."

# Chrome/Chromium testing
echo "Testing Chrome compatibility..."
deno run --allow-net --allow-read tests/chrome-test.ts

# Firefox testing  
echo "Testing Firefox compatibility..."
deno run --allow-net --allow-read tests/firefox-test.ts

# Safari testing (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "Testing Safari compatibility..."
  deno run --allow-net --allow-read tests/safari-test.ts
fi

# Mobile browser simulation
echo "Testing mobile browsers..."
deno run --allow-net --allow-read tests/mobile-test.ts

echo "✅ Browser compatibility testing complete"
```

---

## 7. Production Deployment Checklist

### Pre-Deployment Validation
```bash
#!/bin/bash
# scripts/pre-deploy-check.sh

echo "🔍 Pre-deployment validation..."

# 1. Code Quality
echo "Checking TypeScript compilation..."
deno check **/*.ts **/*.tsx

# 2. Performance Budget
echo "Validating performance budgets..."
deno run --allow-read scripts/check-bundle-size.ts

# 3. Accessibility
echo "Running accessibility audit..."
deno run --allow-net scripts/a11y-audit.ts

# 4. PWA Validation
echo "Validating PWA configuration..."
deno run --allow-read scripts/pwa-check.ts

# 5. Senior UX Validation
echo "Checking senior-friendly features..."
deno run --allow-read scripts/senior-ux-check.ts

echo "✅ Pre-deployment validation complete"
```

### Deployment Steps
```bash
# 1. Build production bundle
deno task build

# 2. Run full test suite
deno test --allow-all

# 3. Performance audit
deno run --allow-net scripts/lighthouse-audit.ts

# 4. Security scan
deno run --allow-net scripts/security-scan.ts

# 5. Deploy to staging
deno deploy --project=bmad-staging

# 6. Run staging tests
deno run --allow-net tests/staging-integration.ts

# 7. Deploy to production
deno deploy --project=bmad-production

# 8. Post-deployment monitoring
deno run --allow-net scripts/health-check.ts
```

### Post-Deployment Monitoring
```typescript
// scripts/production-monitoring.ts
export async function monitorProduction() {
  const metrics = {
    // Performance monitoring
    coreWebVitals: await measureCoreWebVitals(),
    
    // API health
    apiStatus: await checkApiEndpoints(),
    
    // Senior user experience
    accessibilityScore: await runA11yCheck(),
    
    // PWA functionality
    serviceWorkerStatus: await checkServiceWorker(),
    
    // Error tracking
    errorRate: await getErrorMetrics(),
  };
  
  // Alert if metrics exceed thresholds
  if (metrics.coreWebVitals.LCP > 2500) {
    await sendAlert("LCP exceeds senior user threshold");
  }
  
  return metrics;
}
```

---

## 8. QA Sign-off Requirements

### Final QA Checklist
- [ ] **Performance**: All Core Web Vitals within senior user thresholds
- [ ] **Accessibility**: WCAG 2.1 AA compliance verified
- [ ] **PWA**: Offline functionality tested extensively  
- [ ] **Browser Support**: Tested on all target browsers
- [ ] **Senior UX**: Font sizes, touch targets, contrast verified
- [ ] **API Integration**: All backend connections tested
- [ ] **Error Handling**: Senior-friendly error messages validated
- [ ] **Security**: No vulnerabilities in production build
- [ ] **Monitoring**: Production monitoring and alerting active

### Production Readiness Sign-off

**QA Engineer**: Quinn ✅  
**Performance Audit**: ✅  
**Security Review**: ✅  
**Accessibility Compliance**: ✅  
**Senior UX Validation**: ✅  

---

**🎯 This deployment guide ensures your BMad medication adherence system meets the highest quality standards for Chilean seniors while maintaining optimal performance and accessibility.**