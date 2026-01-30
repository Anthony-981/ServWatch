import { performance, monitorEventLoopDelay } from 'perf_hooks';

/**
 * Application Performance Collector
 * Collects Node.js application metrics
 */
export class AppCollector {
  constructor() {
    this.eventLoopDelayMonitor = monitorEventLoopDelay({ resolution: 10 });
    this.baseline = performance.eventLoopUtilization();
    this.history = {
      eventLoopDelay: [],
      heapUsage: []
    };
    this.maxHistorySize = 60;
  }

  /**
   * Collect all application metrics
   */
  collectAll() {
    try {
      const memory = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const resourceUsage = process.resourceUsage?.() || {};

      // Get event loop metrics
      const eventLoopDelay = this.eventLoopDelayMonitor.mean;
      const eventLoopUtilization = performance.eventLoopUtilization(this.baseline);

      // Store history
      this.history.eventLoopDelay.push({
        timestamp: Date.now(),
        value: eventLoopDelay / 1000000 // Convert to milliseconds
      });
      if (this.history.eventLoopDelay.length > this.maxHistorySize) {
        this.history.eventLoopDelay.shift();
      }

      this.history.heapUsage.push({
        timestamp: Date.now(),
        value: memory.heapUsed
      });
      if (this.history.heapUsage.length > this.maxHistorySize) {
        this.history.heapUsage.shift();
      }

      return {
        eventLoop: {
          delay: eventLoopDelay / 1000000, // Convert to ms
          utilization: eventLoopUtilization.utilization
        },
        heap: {
          used: memory.heapUsed,
          total: memory.heapTotal,
          limit: memory.heapTotal || 512000000, // 512MB default
          external: memory.external,
          arrayBuffers: memory.arrayBuffers
        },
        memory: {
          rss: memory.rss,
          heapTotal: memory.heapTotal,
          heapUsed: memory.heapUsed,
          external: memory.external,
          arrayBuffers: memory.arrayBuffers
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        handles: {
          active: process._getActiveHandles?.() || 0,
          requests: process._getActiveRequests?.() || 0
        },
        uptime: process.uptime(),
        resourceUsage: resourceUsage
      };
    } catch (error) {
      console.error('Error collecting app metrics:', error);
      return this.getEmptyMetrics();
    }
  }

  /**
   * Get empty metrics on error
   */
  getEmptyMetrics() {
    return {
      eventLoop: { delay: 0, utilization: 0 },
      heap: { used: 0, total: 0, limit: 512000000 },
      memory: { rss: 0, heapTotal: 0, heapUsed: 0 },
      cpu: { user: 0, system: 0 },
      handles: { active: 0, requests: 0 },
      uptime: process.uptime()
    };
  }

  /**
   * Get event loop delay history
   */
  getEventLoopHistory() {
    return this.history.eventLoopDelay;
  }

  /**
   * Get heap usage history
   */
  getHeapHistory() {
    return this.history.heapUsage;
  }

  /**
   * Get formatted metrics for agent transmission
   */
  getMetrics() {
    const appMetrics = this.collectAll();
    return {
      app: {
        eventLoopDelay: appMetrics.eventLoop.delay,
        eventLoopUtilization: appMetrics.eventLoop.utilization * 100, // Convert to percentage
        heapUsed: appMetrics.heap.used,
        heapTotal: appMetrics.heap.total,
        heapPercentage: (appMetrics.heap.used / appMetrics.heap.limit) * 100,
        activeHandles: appMetrics.handles.active,
        uptime: appMetrics.uptime
      }
    };
  }

  /**
   * Reset baseline
   */
  resetBaseline() {
    this.baseline = performance.eventLoopUtilization();
  }
}

export default AppCollector;
