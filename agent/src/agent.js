import config from './config/config.js';
import { SystemCollector } from './collectors/systemCollector.js';
import { AppCollector } from './collectors/appCollector.js';
import { APICollector } from './collectors/apiCollector.js';
import { WSTransmitter } from './transmitters/wsTransmitter.js';

/**
 * ServWatch Agent
 * Collects system and application metrics and transmits them to the backend server
 */
class ServWatchAgent {
  constructor() {
    this.config = config;
    this.systemCollector = new SystemCollector();
    this.appCollector = new AppCollector();
    this.apiCollector = new APICollector();
    this.transmitter = new WSTransmitter(
      this.config.server.url,
      this.config.agent.id
    );

    this.collectTimer = null;
    this.transmitTimer = null;
    this.running = false;
    this.systemInfo = null;
  }

  /**
   * Start the agent
   */
  async start() {
    if (this.running) {
      console.log('Agent is already running');
      return;
    }

    console.log('Starting ServWatch Agent...');
    console.log(`Agent ID: ${this.config.agent.id}`);
    console.log(`Server: ${this.config.server.url}`);

    // Connect to server
    this.transmitter.connect();

    // Get system info
    this.systemInfo = await this.systemCollector.getSystemInfo();
    console.log('System:', this.systemInfo.hostname || 'Unknown');

    // Start collection timer
    this.collectTimer = setInterval(() => {
      this.collectAndTransmit();
    }, this.config.agent.collectInterval);

    this.running = true;
    console.log('Agent started successfully');
  }

  /**
   * Stop the agent
   */
  stop() {
    if (!this.running) return;

    console.log('Stopping ServWatch Agent...');

    if (this.collectTimer) {
      clearInterval(this.collectTimer);
      this.collectTimer = null;
    }

    if (this.transmitTimer) {
      clearInterval(this.transmitTimer);
      this.transmitTimer = null;
    }

    this.transmitter.disconnect();
    this.running = false;

    console.log('Agent stopped');
  }

  /**
   * Collect and transmit metrics
   */
  async collectAndTransmit() {
    try {
      // Collect system metrics
      const systemMetrics = await this.systemCollector.collectAll();

      // Collect application metrics
      const appMetrics = this.appCollector.getMetrics();

      // Get API stats if available
      const apiMetrics = this.apiCollector.getMetrics();

      // Combine all metrics into plain object (avoid circular references)
      const metrics = JSON.parse(JSON.stringify({
        cpu: systemMetrics?.cpu || { usage: 0, loadAverage: [0, 0, 0], cores: 0, temperature: 0 },
        memory: systemMetrics?.memory || { used: 0, total: 0, percentage: 0, swapTotal: 0, swapUsed: 0, swapPercentage: 0 },
        disk: systemMetrics?.disk || { usage: 0, readRate: 0, writeRate: 0, io: null, drives: [] },
        network: systemMetrics?.network || { rxRate: 0, txRate: 0, interfaces: [], stats: [] },
        gpu: systemMetrics?.gpu || { controllers: [], count: 0, avgUsage: 0, vramPercentage: 0, maxTemperature: 0 },
        temperatures: systemMetrics?.temperatures || { cpu: 0, cores: [], gpu: [], max: 0 },
        processes: systemMetrics?.processes || { total: 0, running: 0, topByCPU: [], topByMemory: [] },
        app: {
          eventLoopDelay: appMetrics?.eventLoop?.delay || 0,
          eventLoopUtilization: appMetrics?.eventLoop?.utilization || 0,
          heapUsed: appMetrics?.heap?.used || 0,
          heapTotal: appMetrics?.heap?.total || 0,
          heapPercentage: appMetrics?.heap?.percentage || 0
        },
        api: {
          avgResponseTime: apiMetrics?.avgResponseTime || 0,
          p95: apiMetrics?.p95 || 0,
          p99: apiMetrics?.p99 || 0,
          errorRate: apiMetrics?.errorRate || 0,
          requestRate: apiMetrics?.requestRate || 0
        },
        agentId: this.config.agent.id,
        hostname: this.systemInfo?.hostname || 'unknown',
        platform: this.systemInfo?.platform || 'unknown',
        uptime: this.systemInfo?.uptime || 0,
        timestamp: Date.now()
      }));

      if (systemMetrics) {
        // Transmit to server
        this.transmitter.transmit(metrics);

        // Log summary (always log for debugging)
        const cpu = metrics.cpu?.usage || 0;
        const mem = metrics.memory?.percentage || 0;
        const gpu = metrics.gpu?.count > 0 ? `${metrics.gpu.count}x ${metrics.gpu.avgUsage.toFixed(1)}%` : 'N/A';
        const temp = metrics.temperatures?.max > 0 ? `${metrics.temperatures.max.toFixed(0)}°C` : 'N/A';
        const processes = metrics.processes?.total || 0;
        const api = metrics.api?.avgResponseTime || 0;
        const eventLoop = metrics.app?.eventLoopDelay || 0;

        console.log(`Metrics transmitted: CPU ${cpu.toFixed(1)}%, ` +
          `Memory ${mem.toFixed(1)}%, ` +
          `GPU ${gpu}, ` +
          `Temp ${temp}, ` +
          `Procs ${processes}, ` +
          `API ${api.toFixed(0)}ms, ` +
          `Event Loop ${eventLoop.toFixed(2)}ms`);
      }
    } catch (error) {
      console.error('Error in collect and transmit:', error);
    }
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      running: this.running,
      agentId: this.config.agent.id,
      connected: this.transmitter.isConnected(),
      bufferSize: this.transmitter.getBufferSize(),
      systemInfo: this.systemInfo
    };
  }
}

// Main execution
const agent = new ServWatchAgent();

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\\nReceived SIGINT, shutting down gracefully...');
  agent.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\\nReceived SIGTERM, shutting down gracefully...');
  agent.stop();
  process.exit(0);
});

// Start agent
agent.start().catch(error => {
  console.error('Failed to start agent:', error);
  process.exit(1);
});

export default agent;
