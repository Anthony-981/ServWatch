/**
 * 模拟版 API 服务
 * 使用本地模拟数据，无需后端服务器
 */

// ========== 模拟数据 ==========

// 模拟用户数据
const mockUser = {
  id: '1',
  username: 'admin',
  email: 'admin@servwatch.local',
  firstName: 'System',
  lastName: 'Administrator',
  role: 'admin',
  avatar: null,
  isActive: true
};

// 模拟监控目标数据
const mockTargets = [
  { id: '1', name: 'Web-Server-01', type: 'host', host: '192.168.1.101', port: 3093, status: 'offline', description: 'FRONTEND server for production', tags: ['frontend', 'production'], metadata: { role: 'frontend', region: 'cn-north-1', version: '1.0.10' }, enabled: true },
  { id: '2', name: 'Web-Server-02', type: 'host', host: '192.168.1.102', port: 3093, status: 'online', description: 'FRONTEND server for production', tags: ['frontend', 'production'], metadata: { role: 'frontend', region: 'cn-north-1', version: '1.0.10' }, enabled: true },
  { id: '3', name: 'Web-Server-03', type: 'host', host: '192.168.1.103', port: 3093, status: 'online', description: 'FRONTEND server for production', tags: ['frontend', 'production'], metadata: { role: 'frontend', region: 'cn-north-1', version: '1.0.10' }, enabled: true },
  { id: '4', name: 'API-Gateway-01', type: 'application', host: '192.168.1.201', port: 8080, status: 'online', description: 'API Gateway server', tags: ['api', 'gateway'], metadata: { role: 'api', region: 'cn-north-1', version: '2.1.5' }, enabled: true },
  { id: '5', name: 'API-Gateway-02', type: 'application', host: '192.168.1.202', port: 8080, status: 'online', description: 'API Gateway server', tags: ['api', 'gateway'], metadata: { role: 'api', region: 'cn-north-1', version: '2.1.5' }, enabled: true },
  { id: '6', name: 'DB-Primary', type: 'host', host: '192.168.1.151', port: 5432, status: 'online', description: 'Primary PostgreSQL database', tags: ['database', 'postgres'], metadata: { role: 'database', region: 'cn-north-1', version: '14.2' }, enabled: true },
  { id: '7', name: 'DB-Replica', type: 'host', host: '192.168.1.152', port: 5432, status: 'online', description: 'Replica PostgreSQL database', tags: ['database', 'postgres'], metadata: { role: 'database', region: 'cn-north-1', version: '14.2' }, enabled: true },
  { id: '8', name: 'Cache-Redis', type: 'application', host: '192.168.1.161', port: 6379, status: 'offline', description: 'Redis cache server', tags: ['cache', 'redis'], metadata: { role: 'cache', region: 'cn-north-1', version: '7.0' }, enabled: false },
  { id: '9', name: 'Worker-Queue-01', type: 'host', host: '192.168.1.171', port: 3093, status: 'online', description: 'Background worker server', tags: ['worker', 'background'], metadata: { role: 'worker', region: 'cn-north-1', version: '1.5.2' }, enabled: true },
  { id: '10', name: 'Storage-NFS', type: 'host', host: '192.168.1.181', port: 2049, status: 'online', description: 'NFS storage server', tags: ['storage', 'nfs'], metadata: { role: 'storage', region: 'cn-north-1', version: '4.15' }, enabled: true }
];

// 模拟告警规则数据
const mockAlerts = [
  { id: '1', name: 'CPU使用率告警-Web服务器', targetId: '1', metricType: 'cpu', condition: 'greater_than', threshold: 80, severity: 'critical', enabled: true, triggerCount: 15, lastTriggered: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', name: '内存使用率告警-API网关', targetId: '4', metricType: 'memory', condition: 'greater_than', threshold: 85, severity: 'warning', enabled: true, triggerCount: 8, lastTriggered: new Date(Date.now() - 7200000).toISOString() },
  { id: '3', name: '磁盘空间告警-数据库', targetId: '6', metricType: 'disk', condition: 'greater_than', threshold: 90, severity: 'critical', enabled: true, triggerCount: 3, lastTriggered: new Date(Date.now() - 1800000).toISOString() },
  { id: '4', name: 'API响应时间告警', targetId: '4', metricType: 'api', condition: 'greater_than', threshold: 500, severity: 'warning', enabled: true, triggerCount: 22, lastTriggered: new Date(Date.now() - 900000).toISOString() },
  { id: '5', name: '网络流量告警', targetId: '2', metricType: 'network', condition: 'greater_than', threshold: 1000, severity: 'info', enabled: true, triggerCount: 45, lastTriggered: new Date(Date.now() - 300000).toISOString() },
  { id: '6', name: 'Redis连接数告警', targetId: '8', metricType: 'app', condition: 'greater_than', threshold: 10000, severity: 'warning', enabled: true, triggerCount: 0, lastTriggered: null },
  { id: '7', name: '数据库连接池告警', targetId: '6', metricType: 'app', condition: 'greater_than', threshold: 90, severity: 'critical', enabled: false, triggerCount: 12, lastTriggered: new Date(Date.now() - 86400000).toISOString() },
  { id: '8', name: 'Worker队列长度告警', targetId: '9', metricType: 'app', condition: 'greater_than', threshold: 1000, severity: 'warning', enabled: true, triggerCount: 5, lastTriggered: new Date(Date.now() - 1800000).toISOString() }
];

// 生成模拟指标数据
function generateMockMetricsData() {
  const data = [];
  const metricTypes = ['cpu', 'memory', 'disk', 'network', 'api', 'app'];

  mockTargets.forEach(target => {
    metricTypes.forEach(metricType => {
      const baseValues = {
        cpu: { base: 50, variance: 30 },
        memory: { base: 60, variance: 20 },
        disk: { base: 45, variance: 15 },
        network: { base: 200, variance: 150 },
        api: { base: 100, variance: 80 },
        app: { base: 50, variance: 40 }
      };

      const config = baseValues[metricType];
      const dataPoints = [];

      for (let i = 0; i < 24; i++) {
        const value = config.base + (Math.random() - 0.5) * config.variance;
        dataPoints.push({
          timestamp: Date.now() - (24 - i) * 3600000,
          value: Math.max(0, parseFloat(value.toFixed(1)))
        });
      }

      data.push({
        targetId: target.id,
        targetName: target.name,
        metricType: metricType,
        dataPoints: dataPoints
      });
    });
  });

  return data;
}

// ========== 工具函数 ==========

function simulateNetworkDelay(min = 200, max = 800) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ========== 认证 API ==========

export async function login(identifier, password) {
  await simulateNetworkDelay();

  // 固定账户验证
  if (identifier === 'admin' && password === 'admin123') {
    return {
      user: mockUser,
      accessToken: 'mock-jwt-access-' + Date.now(),
      refreshToken: 'mock-jwt-refresh-' + Date.now()
    };
  }

  throw new Error('用户名或密码错误');
}

export async function register(userData) {
  await simulateNetworkDelay();
  return {
    user: { ...mockUser, ...userData, id: generateId(), role: 'user' },
    accessToken: 'mock-jwt-access-' + Date.now(),
    refreshToken: 'mock-jwt-refresh-' + Date.now()
  };
}

export async function logout() {
  await simulateNetworkDelay();
  return { success: true };
}

export async function refreshToken(refreshToken) {
  await simulateNetworkDelay();
  return {
    accessToken: 'mock-jwt-access-new-' + Date.now(),
    refreshToken: 'mock-jwt-refresh-new-' + Date.now()
  };
}

export async function getCurrentUser() {
  await simulateNetworkDelay();
  return { user: mockUser };
}

// ========== 监控目标 API ==========

export async function getTargets() {
  await simulateNetworkDelay();
  return { targets: mockTargets };
}

export async function getTarget(id) {
  await simulateNetworkDelay();
  const target = mockTargets.find(t => t.id === id);
  if (!target) throw new Error('目标不存在');
  return { target };
}

export async function createTarget(targetData) {
  await simulateNetworkDelay();
  const newTarget = {
    ...targetData,
    id: generateId(),
    enabled: true,
    status: 'offline'
  };
  mockTargets.push(newTarget);
  return { target: newTarget };
}

export async function updateTarget(id, targetData) {
  await simulateNetworkDelay();
  const index = mockTargets.findIndex(t => t.id === id);
  if (index === -1) throw new Error('目标不存在');
  mockTargets[index] = { ...mockTargets[index], ...targetData };
  return { target: mockTargets[index] };
}

export async function deleteTarget(id) {
  await simulateNetworkDelay();
  const index = mockTargets.findIndex(t => t.id === id);
  if (index === -1) throw new Error('目标不存在');
  mockTargets.splice(index, 1);
  return { success: true };
}

export async function toggleTarget(id, enabled) {
  await simulateNetworkDelay();
  const target = mockTargets.find(t => t.id === id);
  if (!target) throw new Error('目标不存在');
  target.enabled = enabled;
  return { target };
}

// ========== 告警规则 API ==========

export async function getAlerts() {
  await simulateNetworkDelay();
  return { alerts: mockAlerts };
}

export async function getAlert(id) {
  await simulateNetworkDelay();
  const alert = mockAlerts.find(a => a.id === id);
  if (!alert) throw new Error('告警规则不存在');
  return { alert };
}

export async function createAlert(alertData) {
  await simulateNetworkDelay();
  const newAlert = {
    ...alertData,
    id: generateId(),
    enabled: true,
    triggerCount: 0,
    lastTriggered: null
  };
  mockAlerts.push(newAlert);
  return { alert: newAlert };
}

export async function updateAlert(id, alertData) {
  await simulateNetworkDelay();
  const index = mockAlerts.findIndex(a => a.id === id);
  if (index === -1) throw new Error('告警规则不存在');
  mockAlerts[index] = { ...mockAlerts[index], ...alertData };
  return { alert: mockAlerts[index] };
}

export async function deleteAlert(id) {
  await simulateNetworkDelay();
  const index = mockAlerts.findIndex(a => a.id === id);
  if (index === -1) throw new Error('告警规则不存在');
  mockAlerts.splice(index, 1);
  return { success: true };
}

export async function toggleAlert(id, enabled) {
  await simulateNetworkDelay();
  const alert = mockAlerts.find(a => a.id === id);
  if (!alert) throw new Error('告警规则不存在');
  alert.enabled = enabled;
  return { alert };
}

// ========== 监控指标 API ==========

export async function getMetrics(params = {}) {
  await simulateNetworkDelay();
  let data = generateMockMetricsData();

  if (params.targetId) {
    data = data.filter(m => m.targetId === params.targetId);
  }
  if (params.metricType) {
    data = data.filter(m => m.metricType === params.metricType);
  }

  return { metrics: data };
}

export async function getRealtimeMetrics(targetId = null) {
  await simulateNetworkDelay(100, 300);

  const metrics = mockTargets.map(target => {
    if (targetId && target.id !== targetId) return null;

    return {
      targetId: target.id,
      targetName: target.name,
      timestamp: Date.now(),
      metrics: {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        network: Math.random() * 1000
      }
    };
  }).filter(Boolean);

  return { metrics };
}

export async function getAggregatedMetrics(params = {}) {
  await simulateNetworkDelay();
  return {
    avg: { cpu: 45.2, memory: 62.8, disk: 55.3, network: 320.5 },
    max: { cpu: 89.1, memory: 85.2, disk: 78.9, network: 890.2 },
    min: { cpu: 12.3, memory: 35.6, disk: 28.4, network: 45.2 }
  };
}

// ========== 告警历史 API ==========

export async function getAlertHistory(params = {}) {
  await simulateNetworkDelay();
  return {
    history: [
      { id: '1', alertName: 'CPU使用率告警-Web服务器', severity: 'critical', status: 'resolved', createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: '2', alertName: '内存使用率告警-API网关', severity: 'warning', status: 'active', createdAt: new Date(Date.now() - 1800000).toISOString() }
    ]
  };
}

export async function acknowledgeAlert(id) {
  await simulateNetworkDelay();
  return { success: true };
}

// ========== 统计数据 API ==========

export async function getStats() {
  await simulateNetworkDelay();
  return {
    totalTargets: mockTargets.length,
    onlineTargets: mockTargets.filter(t => t.status === 'online').length,
    offlineTargets: mockTargets.filter(t => t.status === 'offline').length,
    totalAlerts: mockAlerts.length,
    activeAlerts: mockAlerts.filter(a => a.enabled).length
  };
}

export async function getOverview() {
  await simulateNetworkDelay();
  return {
    totalTargets: 10,
    onlineTargets: 7,
    offlineTargets: 3,
    totalAlerts: 8,
    criticalAlerts: 3,
    warningAlerts: 4,
    infoAlerts: 1
  };
}

// 导出所有 API
const mockApi = {
  // 认证
  login,
  register,
  logout,
  refreshToken,
  getCurrentUser,

  // 监控目标
  getTargets,
  getTarget,
  createTarget,
  updateTarget,
  deleteTarget,
  toggleTarget,

  // 告警规则
  getAlerts,
  getAlert,
  createAlert,
  updateAlert,
  deleteAlert,
  toggleAlert,

  // 监控指标
  getMetrics,
  getRealtimeMetrics,
  getAggregatedMetrics,

  // 告警历史
  getAlertHistory,
  acknowledgeAlert,

  // 统计
  getStats,
  getOverview
};

export default mockApi;
