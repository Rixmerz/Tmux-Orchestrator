import { chromium, Browser, Page } from "playwright";
import { assertEquals, assert } from "@std/assert";
import { describe, it, beforeAll, afterAll } from "@std/testing/bdd";

/**
 * Performance Tests for Critical Healthcare Application
 * Focus on Core Web Vitals and senior user device constraints
 */

describe("Performance Benchmarks & Core Web Vitals", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    
    // Simulate senior user device constraints
    await page.emulateDevice({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X)',
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });
    
    // Simulate slower network (3G)
    await page.context().setThrottling({
      downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
      uploadThroughput: 750 * 1024 / 8,           // 750 Kbps
      latency: 300                                 // 300ms latency
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  it("should meet LCP (Largest Contentful Paint) < 2.5s", async () => {
    const startTime = Date.now();
    
    await page.goto('http://localhost:8000', { waitUntil: 'networkidle' });
    
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Fallback timeout
        setTimeout(() => resolve(Date.now() - performance.timeOrigin), 3000);
      });
    });

    const lcpSeconds = lcp / 1000;
    assert(lcpSeconds < 2.5, `LCP ${lcpSeconds.toFixed(2)}s exceeds 2.5s threshold for seniors`);
  });

  it("should meet FID (First Input Delay) < 100ms", async () => {
    await page.goto('http://localhost:8000');
    
    // Wait for page to be ready
    await page.waitForLoadState('networkidle');
    
    // Simulate user interaction
    const startTime = performance.now();
    await page.click('[data-testid="main-menu-button"]');
    const endTime = performance.now();
    
    const fid = endTime - startTime;
    assert(fid < 100, `FID ${fid.toFixed(2)}ms exceeds 100ms threshold`);
  });

  it("should meet CLS (Cumulative Layout Shift) < 0.1", async () => {
    await page.goto('http://localhost:8000');
    
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Wait for layout to stabilize
        setTimeout(() => resolve(clsValue), 3000);
      });
    });

    assert(cls < 0.1, `CLS ${cls.toFixed(3)} exceeds 0.1 threshold`);
  });

  it("should load medication database quickly", async () => {
    const startTime = Date.now();
    
    await page.goto('http://localhost:8000/medications');
    await page.waitForSelector('[data-testid="medication-list"]');
    
    const loadTime = Date.now() - startTime;
    assert(loadTime < 3000, `Medication database load time ${loadTime}ms exceeds 3s limit`);
  });

  it("should handle offline medication alerts efficiently", async () => {
    await page.goto('http://localhost:8000');
    
    // Go offline
    await page.context().setOffline(true);
    
    const startTime = Date.now();
    
    // Trigger offline alert
    await page.evaluate(() => {
      // Simulate scheduled medication alert
      window.dispatchEvent(new CustomEvent('medicationAlert', {
        detail: { medication: 'Paracetamol 500mg', time: '08:00' }
      }));
    });
    
    await page.waitForSelector('[data-testid="medication-alert"]');
    const alertTime = Date.now() - startTime;
    
    assert(alertTime < 1000, `Offline alert response time ${alertTime}ms exceeds 1s`);
    
    // Restore online
    await page.context().setOffline(false);
  });

  it("should optimize QR scanner camera access", async () => {
    await page.goto('http://localhost:8000/scanner');
    
    const startTime = Date.now();
    
    // Mock camera access
    await page.evaluate(() => {
      navigator.mediaDevices.getUserMedia = () => 
        Promise.resolve(new MediaStream());
    });
    
    await page.click('[data-testid="start-qr-scanner"]');
    await page.waitForSelector('[data-testid="camera-preview"]');
    
    const cameraStartTime = Date.now() - startTime;
    assert(cameraStartTime < 2000, `Camera access time ${cameraStartTime}ms exceeds 2s`);
  });

  it("should maintain performance with multiple medications", async () => {
    await page.goto('http://localhost:8000');
    
    // Add multiple medications to test performance
    const medications = [
      'Paracetamol 500mg', 'Losartán 50mg', 'Metformina 850mg',
      'Atorvastatina 20mg', 'Omeprazol 20mg', 'Aspirina 100mg',
      'Furosemida 40mg', 'Captopril 25mg', 'Glibenclamida 5mg'
    ];
    
    const startTime = Date.now();
    
    for (const med of medications) {
      await page.click('[data-testid="add-medication"]');
      await page.fill('[data-testid="medication-name"]', med);
      await page.click('[data-testid="save-medication"]');
    }
    
    // Test rendering performance
    await page.waitForSelector(`[data-medication="${medications[medications.length - 1]}"]`);
    
    const totalTime = Date.now() - startTime;
    const averageTimePerMedication = totalTime / medications.length;
    
    assert(averageTimePerMedication < 500, 
      `Average medication add time ${averageTimePerMedication.toFixed(0)}ms exceeds 500ms`);
  });

  it("should optimize B2B dashboard data loading", async () => {
    await page.goto('http://localhost:8000/dashboard');
    
    const startTime = Date.now();
    
    // Wait for dashboard data to load
    await page.waitForSelector('[data-testid="patient-count"]');
    await page.waitForSelector('[data-testid="adherence-chart"]');
    await page.waitForSelector('[data-testid="medication-alerts"]');
    
    const dashboardLoadTime = Date.now() - startTime;
    assert(dashboardLoadTime < 4000, 
      `Dashboard load time ${dashboardLoadTime}ms exceeds 4s for B2B users`);
  });

  it("should handle peak usage scenarios", async () => {
    // Simulate multiple concurrent users (medication reminder time)
    const concurrentRequests = 50;
    const promises = [];
    
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        page.evaluate(() => 
          fetch('/api/medications/reminder', { method: 'POST' })
            .then(r => r.json())
        )
      );
    }
    
    const startTime = Date.now();
    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    
    const successfulRequests = results.filter(r => r.success).length;
    const averageResponseTime = totalTime / concurrentRequests;
    
    assert(successfulRequests >= concurrentRequests * 0.95, 
      `Only ${successfulRequests}/${concurrentRequests} requests succeeded`);
    assert(averageResponseTime < 1000, 
      `Average response time ${averageResponseTime.toFixed(0)}ms under load exceeds 1s`);
  });

  it("should validate memory usage efficiency", async () => {
    await page.goto('http://localhost:8000');
    
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Perform memory-intensive operations
    await page.evaluate(() => {
      // Simulate medication data processing
      const medications = new Array(1000).fill(0).map((_, i) => ({
        id: i,
        name: `Medication ${i}`,
        dosage: '500mg',
        schedule: ['08:00', '20:00']
      }));
      
      // Process the data
      medications.forEach(med => {
        JSON.stringify(med);
        JSON.parse(JSON.stringify(med));
      });
    });
    
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    const memoryIncrease = finalMemory - initialMemory;
    const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
    
    assert(memoryIncreaseMB < 50, 
      `Memory increase ${memoryIncreaseMB.toFixed(2)}MB exceeds 50MB limit`);
  });
});