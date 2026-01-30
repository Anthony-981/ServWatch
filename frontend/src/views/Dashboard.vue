<template>
  <div class="dashboard">
    <main class="dashboard-main">
      <!-- Page Header -->
      <div class="page-header">
        <div class="page-title">
          <h1>实时监控仪表板</h1>
          <p class="page-subtitle">系统性能实时监控与分析</p>
        </div>
        <div class="system-info">
          <div class="info-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="M8 21h8m-4-4v4"/>
            </svg>
            <span>Web-Server-01</span>
          </div>
          <div class="info-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            <span>192.168.1.101</span>
          </div>
          <div class="info-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
            <span>{{ currentTime }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="quick-stats">
        <div class="stat-card cpu">
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
              <path d="M9 9h6v6H9z"/>
              <path d="M9 1v3m6-3v3M9 20v3m6-3v3M20 9h3m-3 6h3M1 9h3m-3 6h3"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">CPU 使用率</div>
            <div class="stat-value warning">64.2%</div>
            <div class="stat-trend">负载: 2.45 | 温度: 58°C</div>
          </div>
          <div class="stat-spark" ref="cpuSpark"></div>
        </div>

        <div class="stat-card memory">
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 12h20M2 12l5-5m-5 5l5 5"/>
              <path d="M22 12l-5-5m5 5l-5 5"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">内存使用</div>
            <div class="stat-value normal">72.8%</div>
            <div class="stat-trend">11.7 GB / 16.0 GB</div>
          </div>
          <div class="stat-spark" ref="memorySpark"></div>
        </div>

        <div class="stat-card disk">
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v4m0 12v4"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">磁盘使用率</div>
            <div class="stat-value normal">45.3%</div>
            <div class="stat-trend">I/O: 125.6 MB/s</div>
          </div>
        </div>

        <div class="stat-card network">
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a10 10 0 1 0 10 10"/>
              <path d="M12 12 2.1 12"/>
              <path d="M12 12l5.9 5.9"/>
              <path d="M12 12V2.1"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">网络流量</div>
            <div class="stat-value-small">
              <span class="rx">↓ 45.2 MB/s</span>
              <span class="tx">↑ 23.8 MB/s</span>
            </div>
          </div>
          <div class="stat-spark" ref="networkSpark"></div>
        </div>

        <!-- GPU Card -->
        <div class="stat-card gpu">
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
              <path d="M9 9h6M9 12h6M9 15h4"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">GPU 使用率</div>
            <div class="stat-value normal">34.6%</div>
            <div class="stat-trend">显存: 4.2 GB / 12.0 GB</div>
          </div>
          <div class="stat-spark" ref="gpuSpark"></div>
        </div>

        <!-- Processes Card -->
        <div class="stat-card processes">
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">进程数</div>
            <div class="stat-value">284</div>
            <div class="stat-trend">运行中: 284</div>
          </div>
        </div>

        <!-- Uptime Card -->
        <div class="stat-card swap">
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 12h16M4 12l4-4m12 4l4-4"/>
              <path d="M4 12l4 4m12-4l4 4"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">运行时间</div>
            <div class="stat-value">45天</div>
            <div class="stat-trend">12小时 30分钟</div>
          </div>
        </div>
      </div>

      <!-- Server Overview -->
      <div class="metrics-section">
        <div class="section-header">
          <h2>服务器概览</h2>
        </div>
        <div class="server-grid">
          <div v-for="server in mockServers" :key="server.id" class="server-card" :class="{ offline: server.status === 'offline' }">
            <div class="server-header">
              <div class="server-name">{{ server.name }}</div>
              <div class="server-status" :class="server.status">{{ getStatusText(server.status) }}</div>
            </div>
            <div class="server-info">{{ server.host }}</div>
            <div class="server-type">{{ server.type }}</div>
            <div class="server-metrics">
              <div class="metric-item">
                <span class="metric-label">CPU</span>
                <span class="metric-value" :class="getSeverityClass(server.cpu)">{{ server.cpu }}%</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">内存</span>
                <span class="metric-value" :class="getSeverityClass(server.memory)">{{ server.memory }}%</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">磁盘</span>
                <span class="metric-value" :class="getSeverityClass(server.disk)">{{ server.disk }}%</span>
              </div>
              <div class="metric-item" v-if="server.gpu > 0">
                <span class="metric-label">GPU</span>
                <span class="metric-value" :class="getSeverityClass(server.gpu)">{{ server.gpu }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Metrics -->
      <div class="metrics-section">
        <div class="section-header">
          <h2>详细指标</h2>
        </div>
        <div class="metrics-grid">
          <!-- CPU Details -->
          <div class="detail-card">
            <div class="detail-header">
              <h3>CPU 使用率趋势</h3>
              <span class="detail-badge warning">64.2%</span>
            </div>
            <div class="detail-chart" ref="cpuChart"></div>
            <div class="detail-stats">
              <div class="detail-stat">
                <span class="label">核心数</span>
                <span class="value">8</span>
              </div>
              <div class="detail-stat">
                <span class="label">1分钟负载</span>
                <span class="value">2.45</span>
              </div>
              <div class="detail-stat">
                <span class="label">5分钟负载</span>
                <span class="value">2.12</span>
              </div>
            </div>
          </div>

          <!-- Memory Details -->
          <div class="detail-card">
            <div class="detail-header">
              <h3>内存使用趋势</h3>
              <span class="detail-badge normal">72.8%</span>
            </div>
            <div class="detail-chart" ref="memoryChart"></div>
            <div class="detail-stats">
              <div class="detail-stat">
                <span class="label">已使用</span>
                <span class="value">11.7 GB</span>
              </div>
              <div class="detail-stat">
                <span class="label">总内存</span>
                <span class="value">16.0 GB</span>
              </div>
              <div class="detail-stat">
                <span class="label">可用</span>
                <span class="value">4.3 GB</span>
              </div>
            </div>
          </div>

          <!-- Network Details -->
          <div class="detail-card">
            <div class="detail-header">
              <h3>网络流量趋势</h3>
              <span class="detail-badge normal">69.0 MB/s</span>
            </div>
            <div class="detail-chart" ref="networkChart"></div>
            <div class="detail-stats">
              <div class="detail-stat">
                <span class="label">下载</span>
                <span class="value">45.2 MB/s</span>
              </div>
              <div class="detail-stat">
                <span class="label">上传</span>
                <span class="value">23.8 MB/s</span>
              </div>
              <div class="detail-stat">
                <span class="label">连接数</span>
                <span class="value">1,245</span>
              </div>
            </div>
          </div>

          <!-- GPU Details -->
          <div class="detail-card gpu-detail-card">
            <div class="detail-header">
              <h3>GPU 监控</h3>
              <span class="detail-badge">{{ mockGPUs.length }} 张显卡</span>
            </div>
            <div class="gpu-cards-grid">
              <div v-for="gpu in mockGPUs" :key="gpu.id" class="gpu-card" :class="{ critical: gpu.temperature > 70 }">
                <div class="gpu-card-header">
                  <div class="gpu-name">{{ gpu.name }}</div>
                  <div class="gpu-id">GPU {{ gpu.id }}</div>
                </div>
                <div class="gpu-metrics">
                  <div class="gpu-metric-row">
                    <span class="metric-label">使用率</span>
                    <span class="metric-value" :class="getSeverityClass(gpu.usage)">{{ gpu.usage }}%</span>
                  </div>
                  <div class="gpu-metric-row">
                    <span class="metric-label">显存</span>
                    <span class="metric-value">{{ gpu.memoryUsed }} / {{ gpu.memoryTotal }} GB</span>
                  </div>
                  <div class="gpu-metric-row">
                    <span class="metric-label">温度</span>
                    <span class="metric-value" :class="{ critical: gpu.temperature > 70, warning: gpu.temperature > 60 }">{{ gpu.temperature }}°C</span>
                  </div>
                  <div class="gpu-metric-row">
                    <span class="metric-label">功耗</span>
                    <span class="metric-value">{{ gpu.power }} / {{ gpu.powerLimit }}W</span>
                  </div>
                  <div class="gpu-metric-row">
                    <span class="metric-label">风扇</span>
                    <span class="metric-value">{{ gpu.fanSpeed }}%</span>
                  </div>
                </div>
                <div class="gpu-progress-bar">
                  <div class="gpu-progress-fill" :style="{ width: gpu.usage + '%', background: getSeverityColor(gpu.usage) }"></div>
                </div>
              </div>
            </div>
            <div class="detail-chart" ref="gpuChart" style="margin-top: 16px;"></div>
          </div>

          <!-- Top Processes -->
          <div class="detail-card">
            <div class="detail-header">
              <h3>Top 进程 (CPU)</h3>
              <span class="detail-badge">284 个进程</span>
            </div>
            <div class="processes-list">
              <div class="process-item" v-for="(proc, index) in mockProcesses" :key="index">
                <span class="process-rank">{{ index + 1 }}</span>
                <span class="process-name">{{ proc.name }}</span>
                <span class="process-cpu">{{ proc.cpu }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, onBeforeUnmount, nextTick } from 'vue';
import * as echarts from 'echarts';

// Mock data
const mockServers = ref([
  { id: '1', name: 'Web-Server-01', host: '192.168.1.101', type: 'frontend', status: 'offline', cpu: 64.2, memory: 72.8, disk: 45.3, gpu: 0 },
  { id: '2', name: 'Web-Server-02', host: '192.168.1.102', type: 'frontend', status: 'online', cpu: 30.3, memory: 65.2, disk: 52.1, gpu: 0 },
  { id: '3', name: 'Web-Server-03', host: '192.168.1.103', type: 'frontend', status: 'online', cpu: 47.5, memory: 58.9, disk: 41.7, gpu: 0 },
  { id: '4', name: 'API-Gateway-01', host: '192.168.1.201', type: 'api', status: 'online', cpu: 34.9, memory: 48.2, disk: 35.6, gpu: 12.5 },
  { id: '5', name: 'API-Gateway-02', host: '192.168.1.202', type: 'api', status: 'online', cpu: 57.4, memory: 62.1, disk: 38.9, gpu: 0 },
  { id: '6', name: 'DB-Primary', host: '192.168.1.151', type: 'database', status: 'online', cpu: 43.5, memory: 78.3, disk: 68.2, gpu: 23.8 },
  { id: '7', name: 'DB-Replica', host: '192.168.1.152', type: 'database', status: 'online', cpu: 63.4, memory: 71.5, disk: 65.8, gpu: 0 },
  { id: '8', name: 'Cache-Redis', host: '192.168.1.161', type: 'cache', status: 'offline', cpu: 49.6, memory: 45.2, disk: 28.4, gpu: 0 },
  { id: '9', name: 'Worker-Queue-01', host: '192.168.1.171', type: 'worker', status: 'online', cpu: 69.8, memory: 55.7, disk: 42.3, gpu: 67.2 },
  { id: '10', name: 'Storage-NFS', host: '192.168.1.181', type: 'storage', status: 'online', cpu: 12.2, memory: 35.4, disk: 75.6, gpu: 0 }
]);

const mockProcesses = ref([
  { name: 'node', cpu: 12.5 },
  { name: 'nginx', cpu: 8.3 },
  { name: 'postgres', cpu: 6.7 },
  { name: 'redis-server', cpu: 4.2 },
  { name: 'dockerd', cpu: 3.8 }
]);

// Mock GPU cards data
const mockGPUs = ref([
  { id: 0, name: 'NVIDIA RTX 4090', usage: 34.6, memoryUsed: 4.2, memoryTotal: 24.0, temperature: 62, power: 285, powerLimit: 450, fanSpeed: 45 },
  { id: 1, name: 'NVIDIA RTX 4090', usage: 28.3, memoryUsed: 3.8, memoryTotal: 24.0, temperature: 58, power: 245, powerLimit: 450, fanSpeed: 40 },
  { id: 2, name: 'NVIDIA A100', usage: 67.2, memoryUsed: 32.5, memoryTotal: 80.0, temperature: 74, power: 320, powerLimit: 400, fanSpeed: 65 }
]);

// Chart refs
const cpuChart = ref(null);
const memoryChart = ref(null);
const networkChart = ref(null);
const gpuChart = ref(null);
const cpuSpark = ref(null);
const memorySpark = ref(null);
const networkSpark = ref(null);
const gpuSpark = ref(null);

let charts = {};
let timeInterval = null;
let chartInterval = null;
const currentTime = ref(new Date().toLocaleTimeString());

// Generate mock history data
function generateMockData(baseValue, variance, count) {
  const data = [];
  let value = baseValue;
  for (let i = 0; i < count; i++) {
    value = value + (Math.random() - 0.5) * variance;
    value = Math.max(0, Math.min(100, value));
    data.push({
      timestamp: Date.now() - (count - i) * 5000,
      value: parseFloat(value.toFixed(1))
    });
  }
  return data;
}

const cpuHistory = ref(generateMockData(64, 20, 50));
const memoryHistory = ref(generateMockData(73, 10, 50));
const networkHistory = ref(generateMockData(69, 30, 50));
const gpuHistory = ref(generateMockData(35, 40, 50));

function getSeverityClass(value, critical = 80, warning = 60) {
  if (value >= critical) return 'critical';
  if (value >= warning) return 'warning';
  return 'normal';
}

function getSeverityColor(value, critical = 80, warning = 60) {
  if (value >= critical) return '#ef4444';
  if (value >= warning) return '#f59e0b';
  return '#10b981';
}

function getStatusText(status) {
  return status === 'online' ? '在线' : '离线';
}

function initSparkline(refName, color, data) {
  nextTick(() => {
    const el = refName.value;
    if (!el) return;
    const chart = echarts.init(el);
    charts[refName.value] = chart;
    chart.setOption({
      grid: { top: 0, right: 0, bottom: 0, left: 0 },
      xAxis: { show: false },
      yAxis: { show: false },
      series: [{
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color, width: 1.5 },
        areaStyle: { color, opacity: 0.3 },
        data: data.slice(-20).map(d => d.value)
      }]
    });
  });
}

function initChart(refName, color, data, max = 100) {
  nextTick(() => {
    const el = refName.value;
    if (!el) return;

    const chart = echarts.init(el);
    charts[refName.value] = chart;

    chart.setOption({
      grid: { top: 15, right: 15, bottom: 60, left: 50 },
      dataZoom: [
        {
          type: 'slider',
          show: true,
          xAxisIndex: [0],
          start: 0,
          end: 100,
          height: 20,
          bottom: 10,
          borderColor: 'transparent',
          backgroundColor: 'rgba(55, 65, 81, 0.5)',
          fillerColor: 'rgba(59, 130, 246, 0.3)',
          handleStyle: {
            color: '#3b82f6'
          },
          textStyle: {
            color: '#9ca3af'
          },
          brushSelect: false
        },
        {
          type: 'inside',
          xAxisIndex: [0],
          start: 0,
          end: 100,
          zoomOnMouseWheel: true,
          moveOnMouseMove: true
        }
      ],
      xAxis: {
        type: 'category',
        show: true,
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { color: '#9ca3af', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        show: true,
        max: max,
        axisLine: { show: false },
        axisLabel: { color: '#9ca3af', fontSize: 11 },
        splitLine: { lineStyle: { color: '#374151', type: 'dashed' } }
      },
      series: [{
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color, width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: color + '40' },
              { offset: 1, color: color + '05' }
            ]
          }
        },
        data: data.map(d => d.value)
      }]
    });
  });
}

function updateCharts() {
  // Update data
  cpuHistory.value = generateMockData(64, 20, 50);
  memoryHistory.value = generateMockData(73, 10, 50);
  networkHistory.value = generateMockData(69, 30, 50);
  gpuHistory.value = generateMockData(35, 40, 50);

  // Update sparklines
  if (charts[cpuSpark.value]) {
    charts[cpuSpark.value].setOption({
      series: [{ data: cpuHistory.value.slice(-20).map(d => d.value) }]
    });
  }
  if (charts[memorySpark.value]) {
    charts[memorySpark.value].setOption({
      series: [{ data: memoryHistory.value.slice(-20).map(d => d.value) }]
    });
  }
  if (charts[networkSpark.value]) {
    charts[networkSpark.value].setOption({
      series: [{ data: networkHistory.value.slice(-20).map(d => d.value) }]
    });
  }
  if (charts[gpuSpark.value]) {
    charts[gpuSpark.value].setOption({
      series: [{ data: gpuHistory.value.slice(-20).map(d => d.value) }]
    });
  }

  // Update main charts
  if (charts[cpuChart.value]) {
    charts[cpuChart.value].setOption({
      series: [{ data: cpuHistory.value.map(d => d.value) }]
    });
  }
  if (charts[memoryChart.value]) {
    charts[memoryChart.value].setOption({
      series: [{ data: memoryHistory.value.map(d => d.value) }]
    });
  }
  if (charts[networkChart.value]) {
    charts[networkChart.value].setOption({
      series: [{ data: networkHistory.value.map(d => d.value) }]
    });
  }
  if (charts[gpuChart.value]) {
    charts[gpuChart.value].setOption({
      series: [{ data: gpuHistory.value.map(d => d.value) }]
    });
  }
}

onMounted(() => {
  // Initialize sparklines
  initSparkline(cpuSpark, '#3b82f6', cpuHistory.value);
  initSparkline(memorySpark, '#10b981', memoryHistory.value);
  initSparkline(networkSpark, '#8b5cf6', networkHistory.value);
  initSparkline(gpuSpark, '#f97316', gpuHistory.value);

  // Initialize main charts
  initChart(cpuChart, '#3b82f6', cpuHistory.value);
  initChart(memoryChart, '#10b981', memoryHistory.value);
  initChart(networkChart, '#8b5cf6', networkHistory.value);
  initChart(gpuChart, '#f97316', gpuHistory.value);

  // Update time
  timeInterval = setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString();
  }, 1000);

  // Update charts every 3 seconds
  chartInterval = setInterval(updateCharts, 3000);
});

onBeforeUnmount(() => {
  if (chartInterval) clearInterval(chartInterval);
});

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval);
  Object.values(charts).forEach(chart => chart?.dispose());
});
</script>

<style scoped>
.dashboard {
  min-height: calc(100vh - 60px);
}

.dashboard-main {
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}

.page-title h1 {
  font-size: 32px;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 4px;
  background: linear-gradient(135deg, #f1f5f9, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 14px;
  color: #64748b;
}

.system-info {
  display: flex;
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 8px;
  font-size: 13px;
  color: #94a3b8;
}

.info-item svg {
  color: #64748b;
}

/* Quick Stats */
.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
}

.stat-card.cpu::before { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
.stat-card.memory::before { background: linear-gradient(90deg, #10b981, #34d399); }
.stat-card.disk::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.stat-card.network::before { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
.stat-card.gpu::before { background: linear-gradient(90deg, #f97316, #fb923c); }
.stat-card.processes::before { background: linear-gradient(90deg, #06b6d4, #22d3ee); }
.stat-card.swap::before { background: linear-gradient(90deg, #6366f1, #818cf8); }

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.4);
  border-color: rgba(148, 163, 184, 0.2);
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 12px;
  color: #3b82f6;
}

.stat-card.memory .stat-icon { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.stat-card.disk .stat-icon { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.stat-card.network .stat-icon { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
.stat-card.gpu .stat-icon { background: rgba(249, 115, 22, 0.1); color: #f97316; }
.stat-card.processes .stat-icon { background: rgba(6, 182, 212, 0.1); color: #06b6d4; }
.stat-card.swap .stat-icon { background: rgba(99, 102, 241, 0.1); color: #6366f1; }

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1;
}

.stat-value.normal { color: #10b981; }
.stat-value.warning { color: #f59e0b; }
.stat-value.critical { color: #ef4444; }

.stat-value-small {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 18px;
  font-weight: 600;
  color: #f1f5f9;
}

.stat-value-small .rx { color: #10b981; }
.stat-value-small .tx { color: #8b5cf6; }

.stat-trend {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.stat-spark {
  width: 80px;
  height: 36px;
}

/* Server Grid */
.server-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.server-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s;
}

.server-card:hover {
  transform: translateY(-2px);
  border-color: rgba(59, 130, 246, 0.3);
}

.server-card.offline {
  opacity: 0.6;
}

.server-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.server-name {
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
}

.server-status {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.server-status.online {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.server-status.offline {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.server-info {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 4px;
}

.server-type {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 12px;
}

.server-metrics {
  display: flex;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 11px;
  color: #64748b;
}

.metric-value {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
}

.metric-value.normal { color: #10b981; }
.metric-value.warning { color: #f59e0b; }
.metric-value.critical { color: #ef4444; }

/* Metrics Section */
.metrics-section {
  margin-top: 32px;
}

.section-header {
  margin-bottom: 16px;
}

.section-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #f1f5f9;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 16px;
}

/* Detail Cards */
.detail-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.detail-header h3 {
  font-size: 14px;
  font-weight: 500;
  color: #94a3b8;
}

.detail-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.detail-badge.normal { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.detail-badge.warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.detail-badge.critical { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

.detail-chart {
  height: 180px;
  padding: 16px 20px;
}

.detail-stats {
  display: flex;
  justify-content: space-around;
  padding: 12px 20px;
  background: rgba(15, 23, 42, 0.5);
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.detail-stat {
  text-align: center;
}

.detail-stat .label {
  display: block;
  font-size: 11px;
  color: #64748b;
  margin-bottom: 4px;
}

.detail-stat .value {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
}

/* Process List */
.processes-list {
  padding: 0;
}

.process-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  transition: background 0.2s;
}

.process-item:last-child {
  border-bottom: none;
}

.process-item:hover {
  background: rgba(15, 23, 42, 0.5);
}

.process-rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.process-item:nth-child(2) .process-rank {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.process-item:nth-child(3) .process-rank {
  background: rgba(6, 182, 212, 0.2);
  color: #06b6d4;
}

.process-name {
  flex: 1;
  font-size: 13px;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.process-cpu {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
  min-width: 50px;
  text-align: right;
}

/* GPU Cards Grid */
.gpu-detail-card {
  grid-column: span 2;
}

.gpu-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.gpu-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.gpu-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #f97316, #fb923c);
}

.gpu-card.critical::before {
  background: linear-gradient(90deg, #ef4444, #f87171);
}

.gpu-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px -8px rgba(249, 115, 22, 0.3);
  border-color: rgba(249, 115, 22, 0.3);
}

.gpu-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.gpu-name {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
}

.gpu-id {
  font-size: 11px;
  color: #64748b;
  padding: 2px 8px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 4px;
}

.gpu-metrics {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.gpu-metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.gpu-metric-row .metric-label {
  color: #64748b;
}

.gpu-metric-row .metric-value {
  color: #94a3b8;
  font-weight: 500;
}

.gpu-metric-row .metric-value.critical {
  color: #ef4444;
}

.gpu-metric-row .metric-value.warning {
  color: #f59e0b;
}

.gpu-progress-bar {
  height: 4px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 2px;
  overflow: hidden;
}

.gpu-progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}
</style>
