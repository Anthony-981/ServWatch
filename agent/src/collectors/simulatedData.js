/**
 * Simulated Data Generator
 * 生成模拟的硬件数据以测试多 Agent 场景
 */

// 不同的 GPU 配置模拟
const simulatedGPUConfigs = [
  // 配置 1: 高性能工作站 (NVIDIA RTX)
  {
    vendor: 'NVIDIA',
    model: 'GeForce RTX 4090',
    vram: 24 * 1024 * 1024 * 1024, // 24GB
    controllers: [
      { usage: 45, temperature: 65, vramDynamic: 8 * 1024 * 1024 * 1024 },
      { usage: 35, temperature: 58, vramDynamic: 6 * 1024 * 1024 * 1024 }
    ]
  },
  // 配置 2: 数据中心 GPU (Tesla)
  {
    vendor: 'NVIDIA',
    model: 'Tesla A100',
    vram: 40 * 1024 * 1024 * 1024, // 40GB
    controllers: [
      { usage: 78, temperature: 72, vramDynamic: 32 * 1024 * 1024 * 1024 }
    ]
  },
  // 配置 3: 集成显卡 (Intel)
  {
    vendor: 'Intel',
    model: 'Iris Xe Graphics',
    vram: 4 * 1024 * 1024 * 1024, // 4GB (共享内存)
    controllers: [
      { usage: 15, temperature: 45, vramDynamic: 512 * 1024 * 1024 }
    ]
  },
  // 配置 4: AMD 显卡
  {
    vendor: 'AMD',
    model: 'Radeon RX 7900 XTX',
    vram: 24 * 1024 * 1024 * 1024, // 24GB
    controllers: [
      { usage: 55, temperature: 68, vramDynamic: 10 * 1024 * 1024 * 1024 }
    ]
  }
];

// 不同的 CPU 配置模拟
const simulatedCPUConfigs = [
  { cores: 32, model: 'AMD EPYC 7763', baseTemp: 45 },
  { cores: 16, model: 'Intel Xeon E5-2690', baseTemp: 52 },
  { cores: 8, model: 'Intel Core i9-13900K', baseTemp: 58 },
  { cores: 64, model: 'AMD EPYC 9654', baseTemp: 42 }
];

// 不同的内存配置模拟
const simulatedMemoryConfigs = [
  { total: 256 * 1024 * 1024 * 1024, name: '256GB DDR4 ECC' },  // 256GB
  { total: 64 * 1024 * 1024 * 1024, name: '64GB DDR5' },       // 64GB
  { total: 128 * 1024 * 1024 * 1024, name: '128GB DDR4' },     // 128GB
  { total: 512 * 1024 * 1024 * 1024, name: '512GB DDR4 ECC' }  // 512GB
];

// 不同的磁盘配置模拟
const simulatedDiskConfigs = [
  { drives: [
    { fs: 'C:', type: 'NTFS', size: 2 * 1024 * 1024 * 1024 * 1024, use: 65, mount: 'C:' },
    { fs: 'D:', type: 'NTFS', size: 4 * 1024 * 1024 * 1024 * 1024, use: 45, mount: 'D:' },
    { fs: 'E:', type: 'NTFS', size: 8 * 1024 * 1024 * 1024 * 1024, use: 30, mount: 'E:' }
  ]},
  { drives: [
    { fs: 'nvme0n1', type: 'ext4', size: 512 * 1024 * 1024 * 1024, use: 78, mount: '/' },
    { fs: 'sda1', type: 'ext4', size: 2 * 1024 * 1024 * 1024 * 1024, use: 55, mount: '/data' }
  ]},
  { drives: [
    { fs: 'rootfs', type: 'ext4', size: 256 * 1024 * 1024 * 1024, use: 85, mount: '/' }
  ]},
  { drives: [
    { fs: 'C:', type: 'NTFS', size: 1 * 1024 * 1024 * 1024 * 1024, use: 40, mount: 'C:' },
    { fs: 'D:', type: 'NTFS', size: 3 * 1024 * 1024 * 1024 * 1024, use: 25, mount: 'D:' },
    { fs: 'E:', type: 'NTFS', size: 10 * 1024 * 1024 * 1024 * 1024, use: 60, mount: 'E:' },
    { fs: 'F:', type: 'NTFS', size: 20 * 1024 * 1024 * 1024 * 1024, use: 15, mount: 'F:' }
  ]}
];

// 根据 Agent ID 或索引获取模拟配置
export function getSimulatedConfig(agentIndex) {
  const index = agentIndex % simulatedGPUConfigs.length;

  return {
    gpu: simulatedGPUConfigs[index],
    cpu: simulatedCPUConfigs[index],
    memory: simulatedMemoryConfigs[index],
    disk: simulatedDiskConfigs[index],
    // 添加随机波动
    variation: () => (Math.random() - 0.5) * 20  // -10% to +10%
  };
}

// 增强 GPU 数据（添加模拟数据）
export function enhanceGPUData(baseData, config) {
  if (!baseData || baseData.count === 0) {
    // 如果没有真实 GPU，返回模拟数据
    return {
      controllers: config.gpu.controllers.map((g, i) => ({
        vendor: config.gpu.vendor,
        model: config.gpu.model,
        vram: config.gpu.vram,
        vramUsed: g.vramDynamic,
        vramFree: config.gpu.vram - g.vramDynamic,
        usage: g.usage + (Math.random() - 0.5) * 10,
        temperature: g.temperature + (Math.random() - 0.5) * 10,
        powerUsage: 150 + Math.random() * 100,
        fanSpeed: 40 + Math.random() * 20,
        clockSpeed: 1500 + Math.random() * 500
      })),
      count: config.gpu.controllers.length,
      totalVRAM: config.gpu.vram * config.gpu.controllers.length,
      avgUsage: config.gpu.controllers.reduce((sum, g) => sum + g.usage, 0) / config.gpu.controllers.length,
      maxTemperature: Math.max(...config.gpu.controllers.map(g => g.temperature)),
      vramPercentage: (config.gpu.controllers.reduce((sum, g) => sum + g.vramDynamic, 0) /
                      (config.gpu.vram * config.gpu.controllers.length)) * 100
    };
  }

  // 如果有真实 GPU，添加波动
  return baseData;
}

// 增强 CPU 数据
export function enhanceCPUData(baseData, config) {
  const variation = config.variation();
  return {
    ...baseData,
    cores: config.cpu.cores,
    temperature: baseData.temperature || config.cpu.baseTemp + variation / 2,
    model: config.cpu.model
  };
}

// 增强内存数据
export function enhanceMemoryData(baseData, config) {
  const variation = config.variation();
  return {
    ...baseData,
    total: config.memory.total,
    used: Math.min(config.memory.total * (0.3 + Math.random() * 0.5), baseData.used || 0)
  };
}

// 增强磁盘数据
export function enhanceDiskData(baseData, config) {
  if (!baseData || !baseData.drives || baseData.drives.length === 0) {
    return config.disk;
  }

  return baseData;
}
