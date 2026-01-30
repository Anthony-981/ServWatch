import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useMetricsStore = defineStore('metrics', () => {
  // State
  const metrics = ref({
    cpu: { usage: 0, loadAverage: [0, 0, 0], cores: 0, temperature: 0 },
    memory: { used: 0, total: 0, percentage: 0, swapTotal: 0, swapUsed: 0, swapPercentage: 0 },
    disk: { usage: 0, readRate: 0, writeRate: 0, drives: [] },
    network: { rxRate: 0, txRate: 0, interfaces: [] },
    gpu: { controllers: [], count: 0, avgUsage: 0, vramPercentage: 0, maxTemperature: 0 },
    temperatures: { cpu: 0, cores: [], gpu: [], max: 0 },
    processes: { total: 0, running: 0, topByCPU: [], topByMemory: [] },
    app: {
      eventLoopDelay: 0,
      eventLoopUtilization: 0,
      heapUsed: 0,
      heapTotal: 0,
      heapPercentage: 0
    },
    api: {
      avgResponseTime: 0,
      p95: 0,
      p99: 0,
      errorRate: 0,
      requestRate: 0
    },
    uptime: 0
  });
  const history = ref({
    cpu: [],
    memory: [],
    disk: [],
    network: [],
    eventLoopDelay: [],
    apiResponseTime: [],
    gpu: [],
    temperature: []
  });
  const lastUpdate = ref(null);
  const hostname = ref(null);
  const platform = ref(null);

  const maxHistoryPoints = 60;

  // Actions
  function updateMetrics(newMetrics) {
    // Handle system metrics
    if (newMetrics.cpu) {
      metrics.value.cpu = {
        usage: newMetrics.cpu.usage || 0,
        loadAverage: newMetrics.cpu.loadAverage || [0, 0, 0],
        cores: newMetrics.cpu.cores || 0,
        temperature: newMetrics.cpu.temperature || 0
      };
    }

    if (newMetrics.memory) {
      metrics.value.memory = {
        used: newMetrics.memory.used || 0,
        total: newMetrics.memory.total || 0,
        percentage: newMetrics.memory.percentage || 0,
        swapTotal: newMetrics.memory.swapTotal || 0,
        swapUsed: newMetrics.memory.swapUsed || 0,
        swapPercentage: newMetrics.memory.swapPercentage || 0
      };
    }

    if (newMetrics.disk) {
      metrics.value.disk = {
        usage: newMetrics.disk.usage || 0,
        readRate: newMetrics.disk.readRate || 0,
        writeRate: newMetrics.disk.writeRate || 0,
        drives: newMetrics.disk.drives || []
      };
    }

    if (newMetrics.network) {
      metrics.value.network = {
        rxRate: newMetrics.network.totalRx || 0,
        txRate: newMetrics.network.totalTx || 0,
        interfaces: newMetrics.network.interfaces || []
      };
    }

    // Handle GPU metrics
    if (newMetrics.gpu) {
      metrics.value.gpu = {
        controllers: newMetrics.gpu.controllers || [],
        count: newMetrics.gpu.count || 0,
        avgUsage: newMetrics.gpu.avgUsage || 0,
        vramPercentage: newMetrics.gpu.vramPercentage || 0,
        maxTemperature: newMetrics.gpu.maxTemperature || 0
      };
    }

    // Handle temperature metrics
    if (newMetrics.temperatures) {
      metrics.value.temperatures = {
        cpu: newMetrics.temperatures.cpu || 0,
        cores: newMetrics.temperatures.cores || [],
        gpu: newMetrics.temperatures.gpu || [],
        max: newMetrics.temperatures.max || 0
      };
    }

    // Handle process metrics
    if (newMetrics.processes) {
      metrics.value.processes = {
        total: newMetrics.processes.total || 0,
        running: newMetrics.processes.running || 0,
        topByCPU: newMetrics.processes.topByCPU || [],
        topByMemory: newMetrics.processes.topByMemory || []
      };
    }

    // Handle application metrics
    if (newMetrics.app) {
      metrics.value.app = {
        eventLoopDelay: newMetrics.app.eventLoopDelay || 0,
        eventLoopUtilization: newMetrics.app.eventLoopUtilization || 0,
        heapUsed: newMetrics.app.heapUsed || 0,
        heapTotal: newMetrics.app.heapTotal || 0,
        heapPercentage: newMetrics.app.heapPercentage || 0
      };
    }

    // Handle API metrics
    if (newMetrics.api) {
      metrics.value.api = {
        avgResponseTime: newMetrics.api.avgResponseTime || 0,
        p95: newMetrics.api.p95 || 0,
        p99: newMetrics.api.p99 || 0,
        errorRate: newMetrics.api.errorRate || 0,
        requestRate: newMetrics.api.requestRate || 0
      };
    }

    if (newMetrics.hostname) {
      hostname.value = newMetrics.hostname;
    }

    if (newMetrics.platform) {
      platform.value = newMetrics.platform;
    }

    if (newMetrics.uptime) {
      metrics.value.uptime = newMetrics.uptime;
    }

    lastUpdate.value = new Date();

    // Add to history
    if (metrics.value.cpu.usage !== undefined) {
      history.value.cpu.push({
        timestamp: Date.now(),
        value: metrics.value.cpu.usage
      });
      if (history.value.cpu.length > maxHistoryPoints) {
        history.value.cpu.shift();
      }
    }

    if (metrics.value.memory.percentage !== undefined) {
      history.value.memory.push({
        timestamp: Date.now(),
        value: metrics.value.memory.percentage
      });
      if (history.value.memory.length > maxHistoryPoints) {
        history.value.memory.shift();
      }
    }

    // Add GPU usage to history
    if (metrics.value.gpu.avgUsage !== undefined) {
      history.value.gpu.push({
        timestamp: Date.now(),
        value: metrics.value.gpu.avgUsage
      });
      if (history.value.gpu.length > maxHistoryPoints) {
        history.value.gpu.shift();
      }
    }

    // Add max temperature to history
    if (metrics.value.temperatures.max !== undefined) {
      history.value.temperature.push({
        timestamp: Date.now(),
        value: metrics.value.temperatures.max
      });
      if (history.value.temperature.length > maxHistoryPoints) {
        history.value.temperature.shift();
      }
    }

    if (metrics.value.app.eventLoopDelay !== undefined) {
      history.value.eventLoopDelay.push({
        timestamp: Date.now(),
        value: metrics.value.app.eventLoopDelay
      });
      if (history.value.eventLoopDelay.length > maxHistoryPoints) {
        history.value.eventLoopDelay.shift();
      }
    }

    if (metrics.value.api.avgResponseTime !== undefined) {
      history.value.apiResponseTime.push({
        timestamp: Date.now(),
        value: metrics.value.api.avgResponseTime
      });
      if (history.value.apiResponseTime.length > maxHistoryPoints) {
        history.value.apiResponseTime.shift();
      }
    }
  }

  function getHistory(metricType) {
    return history.value[metricType] || [];
  }

  function clearHistory() {
    history.value = {
      cpu: [],
      memory: [],
      disk: [],
      network: [],
      eventLoopDelay: [],
      apiResponseTime: [],
      gpu: [],
      temperature: []
    };
  }

  // Getters - System
  const cpuUsage = computed(() => metrics.value.cpu.usage);
  const memoryUsage = computed(() => metrics.value.memory.percentage);
  const diskUsage = computed(() => metrics.value.disk.usage);
  const networkRxRate = computed(() => metrics.value.network.rxRate);
  const networkTxRate = computed(() => metrics.value.network.txRate);
  const cpuTemperature = computed(() => metrics.value.cpu.temperature);
  const maxTemperature = computed(() => metrics.value.temperatures.max);
  const swapPercentage = computed(() => metrics.value.memory.swapPercentage);
  const uptime = computed(() => metrics.value.uptime);

  // Getters - GPU
  const gpuCount = computed(() => metrics.value.gpu.count);
  const gpuUsage = computed(() => metrics.value.gpu.avgUsage);
  const gpuVramPercentage = computed(() => metrics.value.gpu.vramPercentage);
  const gpuMaxTemperature = computed(() => metrics.value.gpu.maxTemperature);
  const hasGPU = computed(() => metrics.value.gpu.count > 0);

  // Getters - Processes
  const processCount = computed(() => metrics.value.processes.total);
  const topCPUProcesses = computed(() => metrics.value.processes.topByCPU);
  const topMemoryProcesses = computed(() => metrics.value.processes.topByMemory);

  // Getters - Application
  const eventLoopDelay = computed(() => metrics.value.app.eventLoopDelay);
  const heapPercentage = computed(() => metrics.value.app.heapPercentage);

  // Getters - API
  const apiAvgResponseTime = computed(() => metrics.value.api.avgResponseTime);
  const apiP95 = computed(() => metrics.value.api.p95);
  const apiP99 = computed(() => metrics.value.api.p99);
  const apiErrorRate = computed(() => metrics.value.api.errorRate);
  const apiRequestRate = computed(() => metrics.value.api.requestRate);

  // Helper to check if metrics are available
  const hasAppMetrics = computed(() => metrics.value.app.eventLoopDelay > 0 || metrics.value.app.heapUsed > 0);
  const hasApiMetrics = computed(() => metrics.value.api.avgResponseTime > 0 || metrics.value.api.requestRate > 0);
  const hasGpuMetrics = computed(() => metrics.value.gpu.count > 0);
  const hasTemperatureMetrics = computed(() => metrics.value.temperatures.max > 0);

  return {
    // State
    metrics,
    history,
    lastUpdate,
    hostname,
    platform,
    // Actions
    updateMetrics,
    getHistory,
    clearHistory,
    // Getters - System
    cpuUsage,
    memoryUsage,
    diskUsage,
    networkRxRate,
    networkTxRate,
    cpuTemperature,
    maxTemperature,
    swapPercentage,
    uptime,
    // Getters - GPU
    gpuCount,
    gpuUsage,
    gpuVramPercentage,
    gpuMaxTemperature,
    hasGpuMetrics,
    // Getters - Processes
    processCount,
    topCPUProcesses,
    topMemoryProcesses,
    // Getters - Application
    eventLoopDelay,
    heapPercentage,
    hasAppMetrics,
    // Getters - API
    apiAvgResponseTime,
    apiP95,
    apiP99,
    apiErrorRate,
    apiRequestRate,
    hasApiMetrics,
    // Getters - Temperature
    hasTemperatureMetrics
  };
});
