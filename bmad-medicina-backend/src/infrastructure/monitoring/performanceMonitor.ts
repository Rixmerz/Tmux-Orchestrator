import { logger } from "../logging/logger.ts";

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  memoryUsage: number;
  userAgent?: string;
  origin?: string;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 1000; // Keep only last 1000 requests

  recordRequest(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow requests
    if (metrics.responseTime > 500) {
      logger.warn(`Slow request detected: ${metrics.endpoint} - ${metrics.responseTime}ms`, {
        endpoint: metrics.endpoint,
        method: metrics.method,
        responseTime: metrics.responseTime,
        statusCode: metrics.statusCode,
      });
    }

    // Log frontend integration requests
    if (metrics.origin) {
      logger.info(`Frontend request: ${metrics.method} ${metrics.endpoint} - ${metrics.responseTime}ms`, {
        origin: metrics.origin,
        statusCode: metrics.statusCode,
        responseTime: metrics.responseTime,
      });
    }
  }

  getAverageResponseTime(endpoint?: string): number {
    let relevantMetrics = this.metrics;
    
    if (endpoint) {
      relevantMetrics = this.metrics.filter(m => m.endpoint === endpoint);
    }

    if (relevantMetrics.length === 0) return 0;

    const total = relevantMetrics.reduce((sum, m) => sum + m.responseTime, 0);
    return Math.round(total / relevantMetrics.length);
  }

  getErrorRate(timeWindowMinutes: number = 5): number {
    const cutoff = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoff);
    
    if (recentMetrics.length === 0) return 0;

    const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length;
    return Math.round((errorCount / recentMetrics.length) * 100);
  }

  getHealthReport(): {
    averageResponseTime: number;
    errorRate: number;
    totalRequests: number;
    slowRequests: number;
    topEndpoints: Array<{ endpoint: string; count: number; avgTime: number }>;
  } {
    const slowRequests = this.metrics.filter(m => m.responseTime > 500).length;
    
    // Calculate top endpoints
    const endpointStats = new Map<string, { count: number; totalTime: number }>();
    
    this.metrics.forEach(m => {
      const key = `${m.method} ${m.endpoint}`;
      const existing = endpointStats.get(key) || { count: 0, totalTime: 0 };
      endpointStats.set(key, {
        count: existing.count + 1,
        totalTime: existing.totalTime + m.responseTime,
      });
    });

    const topEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        avgTime: Math.round(stats.totalTime / stats.count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      averageResponseTime: this.getAverageResponseTime(),
      errorRate: this.getErrorRate(),
      totalRequests: this.metrics.length,
      slowRequests,
      topEndpoints,
    };
  }

  clearMetrics(): void {
    this.metrics = [];
    logger.info("Performance metrics cleared");
  }
}

export const performanceMonitor = new PerformanceMonitor();