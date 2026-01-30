import { performance } from 'perf_hooks';

/**
 * API Performance Collector
 * Tracks HTTP request/response times and statistics
 */
export class APICollector {
  constructor() {
    this.requests = [];
    this.maxHistorySize = 1000;
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      statusCodeCounts: {}
    };
  }

  /**
   * Middleware to track API requests
   */
  middleware() {
    return (req, res, next) => {
      const startTime = performance.now();

      // Capture original end function
      const originalEnd = res.end;

      // Override end function to capture response time
      res.end = (...args) => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        this.recordRequest({
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          responseTime: responseTime,
          timestamp: Date.now()
        });

        // Call original end
        originalEnd.apply(res, args);
      };

      next();
    };
  }

  /**
   * Record a request
   */
  recordRequest(data) {
    // Add to history
    this.requests.push(data);
    if (this.requests.length > this.maxHistorySize) {
      this.requests.shift();
    }

    // Update stats
    this.stats.totalRequests++;
    this.stats.totalResponseTime += data.responseTime;
    this.stats.minResponseTime = Math.min(this.stats.minResponseTime, data.responseTime);
    this.stats.maxResponseTime = Math.max(this.stats.maxResponseTime, data.responseTime);

    if (data.statusCode >= 200 && data.statusCode < 400) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
    }

    // Track status codes
    const code = data.statusCode;
    this.stats.statusCodeCounts[code] = (this.stats.statusCodeCounts[code] || 0) + 1;
  }

  /**
   * Get current statistics
   */
  getStats() {
    const avgResponseTime = this.stats.totalRequests > 0
      ? this.stats.totalResponseTime / this.stats.totalRequests
      : 0;

    // Calculate percentiles
    const sorted = this.requests
      .map(r => r.responseTime)
      .sort((a, b) => a - b);

    const p50 = this.getPercentile(sorted, 50);
    const p95 = this.getPercentile(sorted, 95);
    const p99 = this.getPercentile(sorted, 99);

    // Calculate error rate
    const errorRate = this.stats.totalRequests > 0
      ? (this.stats.failedRequests / this.stats.totalRequests) * 100
      : 0;

    // Calculate request rate (requests per second over last minute)
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentRequests = this.requests.filter(r => r.timestamp >= oneMinuteAgo);
    const requestRate = recentRequests.length / 60; // per second

    return {
      totalRequests: this.stats.totalRequests,
      successfulRequests: this.stats.successfulRequests,
      failedRequests: this.stats.failedRequests,
      avgResponseTime,
      minResponseTime: this.stats.minResponseTime === Infinity ? 0 : this.stats.minResponseTime,
      maxResponseTime: this.stats.maxResponseTime,
      p50,
      p95,
      p99,
      errorRate,
      requestRate,
      statusCodeCounts: { ...this.stats.statusCodeCounts }
    };
  }

  /**
   * Get percentile value
   */
  getPercentile(sortedArray, percentile) {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[index];
  }

  /**
   * Get slowest endpoints
   */
  getSlowestEndpoints(limit = 10) {
    const endpointStats = new Map();

    for (const req of this.requests) {
      const key = `${req.method} ${req.path}`;
      if (!endpointStats.has(key)) {
        endpointStats.set(key, {
          method: req.method,
          path: req.path,
          count: 0,
          totalTime: 0,
          maxTime: 0,
          errors: 0
        });
      }

      const stat = endpointStats.get(key);
      stat.count++;
      stat.totalTime += req.responseTime;
      stat.maxTime = Math.max(stat.maxTime, req.responseTime);
      if (req.statusCode >= 400) {
        stat.errors++;
      }
    }

    // Calculate averages and sort
    const sorted = Array.from(endpointStats.values())
      .map(stat => ({
        ...stat,
        avgTime: stat.totalTime / stat.count,
        errorRate: (stat.errors / stat.count) * 100
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, limit);

    return sorted;
  }

  /**
   * Get recent requests
   */
  getRecentRequests(limit = 50) {
    return this.requests.slice(-limit).reverse();
  }

  /**
   * Clear history
   */
  clear() {
    this.requests = [];
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      statusCodeCounts: {}
    };
  }

  /**
   * Get metrics for agent transmission
   */
  getMetrics() {
    const stats = this.getStats();
    return {
      api: {
        totalRequests: stats.totalRequests,
        avgResponseTime: stats.avgResponseTime,
        p95: stats.p95,
        p99: stats.p99,
        errorRate: stats.errorRate,
        requestRate: stats.requestRate
      }
    };
  }
}

export default APICollector;
