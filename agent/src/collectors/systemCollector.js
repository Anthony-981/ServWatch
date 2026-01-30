import si from 'systeminformation';
import { getSimulatedConfig, enhanceGPUData, enhanceCPUData, enhanceMemoryData, enhanceDiskData } from './simulatedData.js';

/**
 * System Metrics Collector
 * Collects CPU, Memory, Disk, and Network metrics
 */
export class SystemCollector {
  constructor(simulationMode = false) {
    this.cpuHistory = [];
    this.maxHistorySize = 60;
    this.simulationMode = simulationMode || process.env.SIMULATION_MODE === 'true';
    // 从环境变量或基于时间生成模拟索引
    this.simIndex = parseInt(process.env.SIM_INDEX || '0');
    this.simConfig = this.simulationMode ? getSimulatedConfig(this.simIndex) : null;
  }

  /**
   * Collect all system metrics
   */
  async collectAll() {
    try {
      const [cpu, memory, disk, network, gpu, temperatures, processes] = await Promise.all([
        this.collectCPU(),
        this.collectMemory(),
        this.collectDisk(),
        this.collectNetwork(),
        this.collectGPU(),
        this.collectTemperatures(),
        this.collectProcesses()
      ]);

      return {
        timestamp: Date.now(),
        cpu,
        memory,
        disk,
        network,
        gpu,
        temperatures,
        processes
      };
    } catch (error) {
      console.error('Error collecting system metrics:', error);
      return null;
    }
  }

  /**
   * Collect CPU metrics
   */
  async collectCPU() {
    try {
      const [load, cpuTemp, currentLoad] = await Promise.all([
        si.cpu(),
        si.cpuTemperature(),
        si.currentLoad()
      ]);

      return {
        usage: currentLoad.currentLoad,
        loadAverage: currentLoad.cpus.map(c => c.load),
        cores: load.cores,
        model: load.model,
        manufacturer: load.manufacturer,
        speed: load.speed,
        temperature: cpuTemp.main || cpuTemp.cores?.[0] || null
      };
    } catch (error) {
      console.error('Error collecting CPU metrics:', error);
      return { usage: 0, cores: 0 };
    }
  }

  /**
   * Collect Memory metrics
   */
  async collectMemory() {
    try {
      const mem = await si.mem();

      return {
        total: mem.total,
        used: mem.active,
        free: mem.available,
        swapTotal: mem.swaptotal,
        swapUsed: mem.swapused,
        percentage: (mem.active / mem.total) * 100
      };
    } catch (error) {
      console.error('Error collecting memory metrics:', error);
      return { total: 0, used: 0, percentage: 0 };
    }
  }

  /**
   * Collect Disk metrics
   */
  async collectDisk() {
    try {
      const [fsSize, diskIO] = await Promise.all([
        si.fsSize(),
        si.disksIO()
      ]);

      const drives = fsSize.map(drive => ({
        fs: drive.fs,
        type: drive.type,
        size: drive.size,
        used: drive.used,
        usePercent: drive.use,
        mount: drive.mount
      }));

      return {
        drives,
        io: diskIO ? {
          rIO: diskIO.rIO,
          wIO: diskIO.wIO,
          tIO: diskIO.tIO,
          rIO_sec: diskIO.rIO_sec,
          wIO_sec: diskIO.wIO_sec,
          tIO_sec: diskIO.tIO_sec
        } : null
      };
    } catch (error) {
      console.error('Error collecting disk metrics:', error);
      return { drives: [], io: {} };
    }
  }

  /**
   * Collect Network metrics
   */
  async collectNetwork() {
    try {
      const [interfaces, networkStats] = await Promise.all([
        si.networkInterfaces(),
        si.networkStats()
      ]);

      const activeInterfaces = interfaces
        .filter(iface => iface.operstate === 'up' && !iface.internal)
        .map(iface => ({
          iface: iface.iface,
          ip4: iface.ip4,
          ip6: iface.ip6,
          mac: iface.mac,
          type: iface.type,
          speed: iface.speed,
          operstate: iface.operstate
        }));

      return {
        interfaces: activeInterfaces,
        stats: networkStats.map(stat => ({
          iface: stat.iface,
          rx_sec: stat.rx_sec,
          tx_sec: stat.tx_sec,
          rx_bytes: stat.rx_bytes,
          tx_bytes: stat.tx_bytes
        })),
        totalRx: networkStats.reduce((sum, s) => sum + s.rx_sec, 0),
        totalTx: networkStats.reduce((sum, s) => sum + s.tx_sec, 0)
      };
    } catch (error) {
      console.error('Error collecting network metrics:', error);
      return { interfaces: [], stats: [], totalRx: 0, totalTx: 0 };
    }
  }

  /**
   * Collect GPU metrics (NVIDIA/AMD/Intel)
   */
  async collectGPU() {
    try {
      const graphics = await si.graphics();
      const controllersArray = graphics.controllers || graphics.gfx || [];

      const controllers = controllersArray.map(gpu => ({
        vendor: gpu.vendor,
        model: gpu.model,
        vram: gpu.vram || 0,
        vramUsed: gpu.vramDynamic || 0,
        vramFree: (gpu.vram || 0) - (gpu.vramDynamic || 0),
        usage: gpu.usage || 0,
        temperature: gpu.temperature || 0,
        powerUsage: gpu.powerDraw || 0,
        fanSpeed: gpu.fanSpeed || 0,
        clockSpeed: gpu.clockSpeed || 0
      }));

      const totalVRAM = controllers.reduce((sum, g) => sum + g.vram, 0);
      const totalVRAMUsed = controllers.reduce((sum, g) => sum + g.vramUsed, 0);
      const avgUsage = controllers.length > 0
        ? controllers.reduce((sum, g) => sum + g.usage, 0) / controllers.length
        : 0;
      const maxTemp = controllers.length > 0
        ? Math.max(...controllers.map(g => g.temperature).filter(t => t > 0))
        : 0;

      const baseData = {
        controllers,
        totalVRAM,
        totalVRAMUsed,
        totalVRAMFree: totalVRAM - totalVRAMUsed,
        vramPercentage: totalVRAM > 0 ? (totalVRAMUsed / totalVRAM) * 100 : 0,
        avgUsage,
        maxTemperature: maxTemp,
        count: controllers.length
      };

      // 如果是模拟模式或没有真实 GPU，使用模拟数据
      if (this.simulationMode || controllers.length === 0) {
        return enhanceGPUData(baseData, this.simConfig);
      }

      return baseData;
    } catch (error) {
      console.error('Error collecting GPU metrics:', error);
      // 模拟模式下返回模拟数据
      if (this.simulationMode) {
        return enhanceGPUData(null, this.simConfig);
      }
      return { controllers: [], count: 0, avgUsage: 0, vramPercentage: 0, maxTemperature: 0 };
    }
  }

  /**
   * Collect temperature sensors
   */
  async collectTemperatures() {
    try {
      const [cpuTemp, graphics, mem] = await Promise.all([
        si.cpuTemperature(),
        si.graphics(),
        si.mem()
      ]);

      const controllersArray = graphics.controllers || graphics.gfx || [];
      const gpuTemps = controllersArray.map(g => g.temperature).filter(t => t > 0);

      return {
        cpu: cpuTemp.main || cpuTemp.cores?.[0]?.main || 0,
        cores: cpuTemp.cores?.map(c => c.main) || [],
        gpu: gpuTemps,
        max: Math.max(
          cpuTemp.main || 0,
          ...(cpuTemp.cores?.map(c => c.main) || []),
          ...gpuTemps
        ) || 0,
        coresCount: cpuTemp.cores?.length || 0
      };
    } catch (error) {
      console.error('Error collecting temperature metrics:', error);
      return { cpu: 0, cores: [], gpu: [], max: 0 };
    }
  }

  /**
   * Collect top processes
   */
  async collectProcesses() {
    try {
      const processes = await si.processes();

      return {
        total: processes.all,
        running: processes.running,
        blocked: processes.blocked,
        sleeping: processes.sleeping,
        topByCPU: processes.list
          .sort((a, b) => b.cpu - a.cpu)
          .slice(0, 5)
          .map(p => ({
            pid: p.pid,
            name: p.name,
            cpu: p.cpu,
            cpuu: p.cpuu,
            mem: p.mem,
            memFormatted: this.formatBytes(p.mem),
            user: p.user,
            state: p.state
          })),
        topByMemory: processes.list
          .sort((a, b) => b.mem - a.mem)
          .slice(0, 5)
          .map(p => ({
            pid: p.pid,
            name: p.name,
            cpu: p.cpu,
            mem: p.mem,
            memFormatted: this.formatBytes(p.mem),
            user: p.user
          }))
      };
    } catch (error) {
      console.error('Error collecting process metrics:', error);
      return { total: 0, topByCPU: [], topByMemory: [] };
    }
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  }

  /**
   * Get static system info (collected once)
   */
  async getSystemInfo() {
    try {
      const [osInfo, cpu, mem, time, system] = await Promise.all([
        si.osInfo(),
        si.cpu(),
        si.mem(),
        si.time(),
        si.system()
      ]);

      return {
        hostname: osInfo.hostname,
        platform: osInfo.platform,
        distro: osInfo.distro,
        release: osInfo.release,
        arch: osInfo.arch,
        cpu: {
          manufacturer: cpu.manufacturer,
          brand: cpu.brand,
          cores: cpu.cores,
          physicalCores: cpu.physicalCores,
          speed: cpu.speed
        },
        totalMemory: mem.total,
        totalSwap: mem.swaptotal,
        uptime: time.uptime,
        system: {
          manufacturer: system.manufacturer,
          model: system.model,
          version: system.version,
          serial: system.serial
        }
      };
    } catch (error) {
      console.error('Error getting system info:', error);
      return {};
    }
  }
}

export default SystemCollector;
