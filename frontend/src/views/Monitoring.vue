<template>
  <div class="monitoring-page">
    <header class="page-header">
      <div>
        <h1>监控数据中心</h1>
        <p>查看和分析所有服务器的历史监控数据</p>
      </div>
      <div class="header-controls">
        <el-select v-model="selectedTargetId" placeholder="选择服务器" clearable style="width: 200px" @change="filterData">
          <el-option
            v-for="target in mockTargets"
            :key="target.id"
            :label="target.name"
            :value="target.id"
          >
            <span>{{ target.name }}</span>
            <el-tag :type="getStatusType(target.status)" size="small">{{ getStatusText(target.status) }}</el-tag>
          </el-option>
        </el-select>
        <el-select v-model="selectedMetricType" placeholder="选择指标" clearable style="width: 150px" @change="filterData">
          <el-option label="CPU" value="cpu" />
          <el-option label="内存" value="memory" />
          <el-option label="磁盘" value="disk" />
          <el-option label="网络" value="network" />
          <el-option label="API" value="api" />
          <el-option label="应用" value="app" />
        </el-select>
        <el-button type="primary" @click="refreshData">刷新</el-button>
      </div>
    </header>

    <!-- Stats Overview -->
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-label">服务器总数</div>
        <div class="stat-value">{{ mockTargets.length }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">在线</div>
        <div class="stat-value online">{{ onlineCount }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">离线</div>
        <div class="stat-value offline">{{ offlineCount }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">告警规则</div>
        <div class="stat-value">{{ mockAlerts.length }}</div>
      </div>
    </div>

    <!-- Metrics Charts -->
    <div class="charts-container" v-if="filteredMetricsData.length > 0">
      <div v-for="metric in filteredMetricsData" :key="`${metric.targetId}-${metric.metricType}`" class="chart-card">
        <div class="chart-header">
          <h3>{{ metric.targetName }} - {{ getMetricLabel(metric.metricType) }}</h3>
          <el-tag :type="getMetricColor(metric.metricType)" size="small">{{ metric.metricType }}</el-tag>
        </div>
        <div class="chart-wrapper" :id="`chart-${metric.targetId}-${metric.metricType}`"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <el-empty description="暂无监控数据，请选择服务器和指标类型">
        <el-button type="primary" @click="selectedMetricType = 'cpu'; filterData()">
          显示所有CPU数据
        </el-button>
      </el-empty>
    </div>

    <!-- Targets Grid -->
    <div class="targets-section">
      <h2>服务器列表</h2>
      <div class="targets-grid">
        <div v-for="target in mockTargets" :key="target.id" class="target-summary-card"
             :class="{ offline: target.status === 'offline' }" @click="selectTarget(target.id)">
          <div class="target-header">
            <h4>{{ target.name }}</h4>
            <el-tag :type="getStatusType(target.status)" size="small">{{ getStatusText(target.status) }}</el-tag>
          </div>
          <div class="target-info">
            <span>{{ target.host }}</span>
            <span>{{ getTypeText(target.type) }}</span>
          </div>
          <div class="target-metrics">
            <span class="metric">CPU: {{ getTargetMetric(target.id, 'cpu') }}%</span>
            <span class="metric">内存: {{ getTargetMetric(target.id, 'memory') }}%</span>
            <span class="metric">磁盘: {{ getTargetMetric(target.id, 'disk') }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import * as echarts from 'echarts';

// Mock targets
const mockTargets = ref([
  { id: '1', name: 'Web-Server-01', host: '192.168.1.101', type: 'host', status: 'offline' },
  { id: '2', name: 'Web-Server-02', host: '192.168.1.102', type: 'host', status: 'online' },
  { id: '3', name: 'Web-Server-03', host: '192.168.1.103', type: 'host', status: 'online' },
  { id: '4', name: 'API-Gateway-01', host: '192.168.1.201', type: 'application', status: 'online' },
  { id: '5', name: 'API-Gateway-02', host: '192.168.1.202', type: 'application', status: 'online' },
  { id: '6', name: 'DB-Primary', host: '192.168.1.151', type: 'host', status: 'online' },
  { id: '7', name: 'DB-Replica', host: '192.168.1.152', type: 'host', status: 'online' },
  { id: '8', name: 'Cache-Redis', host: '192.168.1.161', type: 'application', status: 'offline' },
  { id: '9', name: 'Worker-Queue-01', host: '192.168.1.171', type: 'host', status: 'online' },
  { id: '10', name: 'Storage-NFS', host: '192.168.1.181', type: 'host', status: 'online' }
]);

// Mock alerts
const mockAlerts = ref([
  { id: '1', name: 'CPU告警', severity: 'critical' },
  { id: '2', name: '内存告警', severity: 'warning' },
  { id: '3', name: '磁盘告警', severity: 'critical' },
  { id: '4', name: 'API告警', severity: 'warning' },
  { id: '5', name: '网络告警', severity: 'info' },
  { id: '6', name: 'Redis告警', severity: 'warning' },
  { id: '7', name: '数据库告警', severity: 'critical' },
  { id: '8', name: 'Worker告警', severity: 'warning' }
]);

// Target metrics for display
const targetMetrics = ref({
  '1': { cpu: 64.2, memory: 72.8, disk: 45.3 },
  '2': { cpu: 30.3, memory: 65.2, disk: 52.1 },
  '3': { cpu: 47.5, memory: 58.9, disk: 41.7 },
  '4': { cpu: 34.9, memory: 48.2, disk: 35.6 },
  '5': { cpu: 57.4, memory: 62.1, disk: 38.9 },
  '6': { cpu: 43.5, memory: 78.3, disk: 68.2 },
  '7': { cpu: 63.4, memory: 71.5, disk: 65.8 },
  '8': { cpu: 49.6, memory: 45.2, disk: 28.4 },
  '9': { cpu: 69.8, memory: 55.7, disk: 42.3 },
  '10': { cpu: 12.2, memory: 35.4, disk: 75.6 }
});

// Generate mock metrics data
function generateMockMetricsData() {
  const data = [];
  const metricTypes = ['cpu', 'memory', 'disk', 'network', 'api', 'app'];

  mockTargets.value.forEach(target => {
    metricTypes.forEach(metricType => {
      const baseValues = {
        cpu: { base: 50, variance: 30 },
        memory: { base: 60, variance: 20 },
        disk: { base: 45, variance: 30 },
        network: { base: 50, variance: 40 },
        api: { base: 200, variance: 150 },
        app: { base: 100, variance: 80 }
      };

      const config = baseValues[metricType] || baseValues.cpu;
      const dataPoints = [];
      let value = config.base;

      for (let i = 0; i < 24; i++) {
        value = value + (Math.random() - 0.5) * config.variance;
        value = Math.max(0, Math.min(metricType === 'api' || metricType === 'app' ? 500 : 100, value));
        dataPoints.push({
          timestamp: Date.now() - (24 - i) * 3600000,
          value: parseFloat(value.toFixed(1))
        });
      }

      data.push({
        targetId: target.id,
        targetName: target.name,
        metricType: metricType,
        dataPoints
      });
    });
  });

  return data;
}

const selectedTargetId = ref(null);
const selectedMetricType = ref('cpu');
const metricsData = ref(generateMockMetricsData());

// Charts storage
let charts = {};

// Computed
const onlineCount = computed(() => mockTargets.value.filter(t => t.status === 'online').length);
const offlineCount = computed(() => mockTargets.value.filter(t => t.status === 'offline').length);

const filteredMetricsData = computed(() => {
  let data = metricsData.value;

  if (selectedTargetId.value) {
    data = data.filter(m => m.targetId === selectedTargetId.value);
  }

  if (selectedMetricType.value) {
    data = data.filter(m => m.metricType === selectedMetricType.value);
  }

  return data;
});

function getTargetMetric(targetId, metricType) {
  return targetMetrics.value[targetId]?.[metricType]?.toFixed(1) || '-';
}

function getTypeText(type) {
  const types = { host: '主机', application: '应用' };
  return types[type] || type;
}

function getStatusType(status) {
  return status === 'online' ? 'success' : 'danger';
}

function getStatusText(status) {
  return status === 'online' ? '在线' : '离线';
}

function getMetricLabel(type) {
  const labels = {
    cpu: 'CPU使用率',
    memory: '内存使用率',
    disk: '磁盘使用率',
    network: '网络流量',
    api: 'API响应时间',
    app: '应用性能'
  };
  return labels[type] || type;
}

function getMetricColor(type) {
  const colors = {
    cpu: 'primary',
    memory: 'success',
    disk: 'warning',
    network: 'info',
    api: 'danger',
    app: 'warning'
  };
  return colors[type] || '';
}

function getMetricColorCode(type) {
  const colors = {
    cpu: '#3b82f6',
    memory: '#10b981',
    disk: '#f59e0b',
    network: '#8b5cf6',
    api: '#ef4444',
    app: '#06b6d4'
  };
  return colors[type] || '#3b82f6';
}

function selectTarget(targetId) {
  selectedTargetId.value = targetId;
  filterData();
}

function filterData() {
  nextTick(() => {
    renderCharts();
  });
}

function refreshData() {
  metricsData.value = generateMockMetricsData();
  nextTick(() => {
    renderCharts();
  });
}

function renderCharts() {
  // Dispose old charts
  Object.values(charts).forEach(chart => chart?.dispose());
  charts = {};

  // Create new charts using DOM elements by ID
  filteredMetricsData.value.forEach(data => {
    const key = `${data.targetId}-${data.metricType}`;
    const el = document.getElementById(`chart-${key}`);
    if (!el) return;

    const chart = echarts.init(el);
    charts[key] = chart;

    const maxValue = data.metricType === 'api' || data.metricType === 'app' ? 500 : 100;

    const option = {
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
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const date = new Date(params[0].name);
          return `${date.toLocaleString()}<br/>${data.metricType}: ${params[0].value}`;
        }
      },
      xAxis: {
        type: 'category',
        data: data.dataPoints.map(d => {
          const date = new Date(d.timestamp);
          return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        }),
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { color: '#9ca3af', rotate: 45 }
      },
      yAxis: {
        type: 'value',
        max: maxValue,
        axisLine: { show: false },
        axisLabel: { color: '#9ca3af' },
        splitLine: { lineStyle: { color: '#374151', type: 'dashed' } }
      },
      series: [{
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: getMetricColorCode(data.metricType), width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: getMetricColorCode(data.metricType) + '40' },
              { offset: 1, color: getMetricColorCode(data.metricType) + '05' }
            ]
          }
        },
        data: data.dataPoints.map(d => d.value)
      }]
    };

    chart.setOption(option);
  });
}

onMounted(() => {
  // Wait for DOM to be ready before rendering charts
  nextTick(() => {
    renderCharts();
  });

  // Handle window resize
  const resizeHandler = () => {
    Object.values(charts).forEach(chart => chart?.resize());
  };
  window.addEventListener('resize', resizeHandler);

  onUnmounted(() => {
    window.removeEventListener('resize', resizeHandler);
  });
});

onUnmounted(() => {
  Object.values(charts).forEach(chart => chart?.dispose());
});
</script>

<style scoped>
.monitoring-page {
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #f1f5f9, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-header p {
  font-size: 14px;
  color: #64748b;
  margin: 4px 0 0 0;
}

.header-controls {
  display: flex;
  gap: 12px;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #f1f5f9;
}

.stat-value.online { color: #10b981; }
.stat-value.offline { color: #ef4444; }

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.chart-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.chart-header h3 {
  font-size: 15px;
  font-weight: 500;
  color: #f1f5f9;
  margin: 0;
}

.chart-wrapper {
  height: 280px;
  padding: 10px 20px 20px;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
}

.targets-section {
  margin-top: 32px;
}

.targets-section h2 {
  font-size: 20px;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 16px;
}

.targets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.target-summary-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.target-summary-card:hover {
  transform: translateY(-2px);
  border-color: rgba(59, 130, 246, 0.3);
}

.target-summary-card.offline {
  opacity: 0.6;
}

.target-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.target-header h4 {
  font-size: 15px;
  font-weight: 500;
  color: #f1f5f9;
  margin: 0;
}

.target-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 12px;
}

.target-metrics {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
}

.target-metrics .metric {
  padding: 4px 8px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 4px;
}

/* Element Plus overrides */
:deep(.el-button--primary) {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  border: none;
}
</style>
