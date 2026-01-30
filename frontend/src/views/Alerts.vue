<template>
  <div class="alerts-page">
    <header class="page-header">
      <div>
        <h1>告警配置</h1>
        <p>配置和管理告警规则</p>
      </div>
      <el-button type="primary" @click="showAddDialog = true">
        + 添加告警规则
      </el-button>
    </header>

    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon total">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ mockAlerts.length }}</div>
          <div class="stat-label">总规则</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon enabled">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ enabledCount }}</div>
          <div class="stat-label">已启用</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon critical">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ criticalCount }}</div>
          <div class="stat-label">严重</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ warningCount }}</div>
          <div class="stat-label">警告</div>
        </div>
      </div>
    </div>

    <!-- Alert Rules List -->
    <div class="alerts-list">
      <el-card v-for="alert in mockAlerts" :key="alert.id" class="alert-card" :class="{ disabled: !alert.enabled }">
        <template #header>
          <div class="card-header">
            <div class="alert-info">
              <h3>{{ alert.name }}</h3>
              <el-tag :type="getSeverityType(alert.severity)" size="small">
                {{ getSeverityText(alert.severity) }}
              </el-tag>
              <el-switch
                v-model="alert.enabled"
                @change="toggleAlert(alert)"
                size="small"
              />
            </div>
            <div class="card-actions">
              <el-button size="small" @click="editAlert(alert)">编辑</el-button>
              <el-button size="small" type="danger" @click="confirmDelete(alert)">删除</el-button>
            </div>
          </div>
        </template>

        <div class="alert-details">
          <div class="detail-row">
            <span class="label">指标:</span>
            <el-tag size="small" type="info">{{ getMetricTypeText(alert.metricType) }}</el-tag>
          </div>
          <div class="detail-row">
            <span class="label">条件:</span>
            <span>{{ getConditionText(alert.condition) }} {{ alert.threshold }}{{ alert.unit }}</span>
          </div>
          <div v-if="alert.duration > 0" class="detail-row">
            <span class="label">持续时间:</span>
            <span>{{ alert.duration }} 秒</span>
          </div>
          <div class="detail-row">
            <span class="label">冷却时间:</span>
            <span>{{ alert.cooldown }} 秒</span>
          </div>
          <div v-if="alert.lastTriggered" class="detail-row">
            <span class="label">上次触发:</span>
            <span>{{ formatDate(alert.lastTriggered) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">触发次数:</span>
            <span>{{ alert.triggerCount || 0 }} 次</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingAlert ? '编辑告警规则' : '添加告警规则'"
      width="600px"
    >
      <el-form :model="formData" label-width="100px">
        <el-form-item label="规则名称" required>
          <el-input v-model="formData.name" placeholder="输入告警规则名称" />
        </el-form-item>
        <el-form-item label="监控目标">
          <el-select v-model="formData.targetId" placeholder="选择监控目标（可选）" clearable>
            <el-option
              v-for="target in mockTargets"
              :key="target.id"
              :label="target.name"
              :value="target.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="指标类型" required>
          <el-select v-model="formData.metricType" placeholder="选择指标">
            <el-option label="CPU 使用率" value="cpu" />
            <el-option label="内存使用率" value="memory" />
            <el-option label="磁盘使用率" value="disk" />
            <el-option label="网络接收速率" value="network.rx" />
            <el-option label="网络发送速率" value="network.tx" />
            <el-option label="API 响应时间" value="api.responseTime" />
          </el-select>
        </el-form-item>
        <el-form-item label="条件" required>
          <el-select v-model="formData.condition">
            <el-option label="大于" value="greater_than" />
            <el-option label="小于" value="less_than" />
            <el-option label="等于" value="equals" />
            <el-option label="不等于" value="not_equals" />
          </el-select>
        </el-form-item>
        <el-form-item label="阈值" required>
          <el-input-number v-model="formData.threshold" :min="0" :max="100" />
          <span class="unit-hint">根据指标类型确定单位</span>
        </el-form-item>
        <el-form-item label="持续时间">
          <el-input-number v-model="formData.duration" :min="0" :max="3600" />
          <span class="unit-hint">秒 - 阈值需持续多久才触发</span>
        </el-form-item>
        <el-form-item label="冷却时间">
          <el-input-number v-model="formData.cooldown" :min="10" :max="3600" />
          <span class="unit-hint">秒 - 同一告警的最小间隔</span>
        </el-form-item>
        <el-form-item label="严重级别" required>
          <el-radio-group v-model="formData.severity">
            <el-radio label="info">信息</el-radio>
            <el-radio label="warning">警告</el-radio>
            <el-radio label="critical">严重</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="通知方式">
          <el-checkbox v-model="formData.notificationChannels.inApp">应用内通知</el-checkbox>
          <el-checkbox v-model="formData.notificationChannels.email">邮件</el-checkbox>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.message" type="textarea" rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveAlert">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// Mock targets for dropdown
const mockTargets = ref([
  { id: '1', name: 'Web-Server-01' },
  { id: '2', name: 'Web-Server-02' },
  { id: '3', name: 'Web-Server-03' },
  { id: '4', name: 'API-Gateway-01' },
  { id: '5', name: 'API-Gateway-02' },
  { id: '6', name: 'DB-Primary' },
  { id: '7', name: 'DB-Replica' },
  { id: '8', name: 'Cache-Redis' },
  { id: '9', name: 'Worker-Queue-01' },
  { id: '10', name: 'Storage-NFS' }
]);

// Mock alert data
const mockAlerts = ref([
  {
    id: '1',
    name: 'CPU使用率告警-Web服务器',
    targetId: '1',
    metricType: 'cpu',
    condition: 'greater_than',
    threshold: 80,
    unit: '%',
    duration: 300,
    cooldown: 600,
    severity: 'critical',
    enabled: true,
    notificationChannels: { inApp: true, email: true, webhook: null },
    message: 'Web服务器CPU使用率过高',
    triggerCount: 15,
    lastTriggered: new Date(Date.now() - 3600000).toISOString(),
    state: 'normal'
  },
  {
    id: '2',
    name: '内存使用率告警-API网关',
    targetId: '4',
    metricType: 'memory',
    condition: 'greater_than',
    threshold: 85,
    unit: '%',
    duration: 180,
    cooldown: 300,
    severity: 'warning',
    enabled: true,
    notificationChannels: { inApp: true, email: false, webhook: null },
    message: 'API网关内存使用率超过阈值',
    triggerCount: 8,
    lastTriggered: new Date(Date.now() - 7200000).toISOString(),
    state: 'normal'
  },
  {
    id: '3',
    name: '磁盘空间告警-数据库主库',
    targetId: '6',
    metricType: 'disk',
    condition: 'greater_than',
    threshold: 90,
    unit: '%',
    duration: 0,
    cooldown: 3600,
    severity: 'critical',
    enabled: true,
    notificationChannels: { inApp: true, email: true, webhook: null },
    message: '数据库主库磁盘空间不足',
    triggerCount: 3,
    lastTriggered: new Date(Date.now() - 86400000).toISOString(),
    state: 'normal'
  },
  {
    id: '4',
    name: 'API响应时间告警',
    targetId: null,
    metricType: 'api.responseTime',
    condition: 'greater_than',
    threshold: 1000,
    unit: 'ms',
    duration: 60,
    cooldown: 300,
    severity: 'warning',
    enabled: true,
    notificationChannels: { inApp: true, email: false, webhook: null },
    message: 'API响应时间过慢',
    triggerCount: 42,
    lastTriggered: new Date(Date.now() - 1800000).toISOString(),
    state: 'normal'
  },
  {
    id: '5',
    name: '网络流量异常告警',
    targetId: null,
    metricType: 'network.rx',
    condition: 'greater_than',
    threshold: 500,
    unit: 'MB/s',
    duration: 120,
    cooldown: 600,
    severity: 'info',
    enabled: false,
    notificationChannels: { inApp: true, email: false, webhook: null },
    message: '网络接收流量异常',
    triggerCount: 0,
    lastTriggered: null,
    state: 'normal'
  },
  {
    id: '6',
    name: 'Redis内存告警',
    targetId: '8',
    metricType: 'memory',
    condition: 'greater_than',
    threshold: 75,
    unit: '%',
    duration: 300,
    cooldown: 900,
    severity: 'warning',
    enabled: true,
    notificationChannels: { inApp: true, email: true, webhook: null },
    message: 'Redis缓存内存使用率过高',
    triggerCount: 5,
    lastTriggered: new Date(Date.now() - 10800000).toISOString(),
    state: 'normal'
  },
  {
    id: '7',
    name: '数据库连接数告警',
    targetId: '6',
    metricType: 'api.responseTime',
    condition: 'greater_than',
    threshold: 80,
    unit: '%',
    duration: 180,
    cooldown: 600,
    severity: 'critical',
    enabled: true,
    notificationChannels: { inApp: true, email: true, webhook: null },
    message: '数据库连接数接近上限',
    triggerCount: 12,
    lastTriggered: new Date(Date.now() - 14400000).toISOString(),
    state: 'normal'
  },
  {
    id: '8',
    name: 'Worker队列堆积告警',
    targetId: '9',
    metricType: 'api.responseTime',
    condition: 'greater_than',
    threshold: 1000,
    unit: 'ms',
    duration: 300,
    cooldown: 900,
    severity: 'warning',
    enabled: false,
    notificationChannels: { inApp: true, email: false, webhook: null },
    message: '后台任务队列处理延迟',
    triggerCount: 0,
    lastTriggered: null,
    state: 'normal'
  }
]);

const showAddDialog = ref(false);
const editingAlert = ref(null);
const formData = ref({
  name: '',
  targetId: null,
  metricType: 'cpu',
  condition: 'greater_than',
  threshold: 80,
  duration: 0,
  cooldown: 300,
  severity: 'warning',
  notificationChannels: {
    inApp: true,
    email: false,
    webhook: null
  },
  message: ''
});

// Computed
const enabledCount = computed(() => mockAlerts.value.filter(a => a.enabled).length);
const criticalCount = computed(() => mockAlerts.value.filter(a => a.severity === 'critical').length);
const warningCount = computed(() => mockAlerts.value.filter(a => a.severity === 'warning').length);

function getMetricTypeText(type) {
  const types = {
    cpu: 'CPU使用率',
    memory: '内存使用率',
    disk: '磁盘使用率',
    'network.rx': '网络接收速率',
    'network.tx': '网络发送速率',
    'api.responseTime': 'API响应时间'
  };
  return types[type] || type;
}

function getSeverityType(severity) {
  switch (severity) {
    case 'critical': return 'danger';
    case 'warning': return 'warning';
    default: return 'info';
  }
}

function getSeverityText(severity) {
  switch (severity) {
    case 'critical': return '严重';
    case 'warning': return '警告';
    default: return '信息';
  }
}

function getConditionText(condition) {
  switch (condition) {
    case 'greater_than': return '>';
    case 'less_than': return '<';
    case 'equals': return '=';
    case 'not_equals': return '!=';
    default: return condition;
  }
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('zh-CN');
}

function toggleAlert(alert) {
  ElMessage.success(alert.enabled ? '告警规则已启用' : '告警规则已禁用');
}

function editAlert(alert) {
  editingAlert.value = alert;
  formData.value = {
    name: alert.name,
    targetId: alert.targetId,
    metricType: alert.metricType,
    condition: alert.condition,
    threshold: alert.threshold,
    duration: alert.duration,
    cooldown: alert.cooldown,
    severity: alert.severity,
    notificationChannels: { ...alert.notificationChannels },
    message: alert.message || ''
  };
  showAddDialog.value = true;
}

function saveAlert() {
  if (editingAlert.value) {
    // Update existing
    const index = mockAlerts.value.findIndex(a => a.id === editingAlert.value.id);
    if (index !== -1) {
      mockAlerts.value[index] = {
        ...mockAlerts.value[index],
        name: formData.value.name,
        targetId: formData.value.targetId,
        metricType: formData.value.metricType,
        condition: formData.value.condition,
        threshold: formData.value.threshold,
        duration: formData.value.duration,
        cooldown: formData.value.cooldown,
        severity: formData.value.severity,
        notificationChannels: { ...formData.value.notificationChannels },
        message: formData.value.message
      };
    }
    ElMessage.success('告警规则已更新');
  } else {
    // Add new
    mockAlerts.value.push({
      id: Date.now().toString(),
      ...formData.value,
      unit: formData.value.metricType.includes('api') || formData.value.metricType.includes('network') ?
          (formData.value.metricType.includes('responseTime') ? 'ms' : 'MB/s') : '%',
      enabled: true,
      triggerCount: 0,
      lastTriggered: null,
      state: 'normal'
    });
    ElMessage.success('告警规则已添加');
  }
  showAddDialog.value = false;
  resetForm();
}

function confirmDelete(alert) {
  ElMessageBox.confirm(
    `确定要删除告警规则 "${alert.name}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    mockAlerts.value = mockAlerts.value.filter(a => a.id !== alert.id);
    ElMessage.success('告警规则已删除');
  });
}

function resetForm() {
  editingAlert.value = null;
  formData.value = {
    name: '',
    targetId: null,
    metricType: 'cpu',
    condition: 'greater_than',
    threshold: 80,
    duration: 0,
    cooldown: 300,
    severity: 'warning',
    notificationChannels: {
      inApp: true,
      email: false,
      webhook: null
    },
    message: ''
  };
}
</script>

<style scoped>
.alerts-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
  background: linear-gradient(135deg, #f1f5f9, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-header p {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.stat-icon.total {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.stat-icon.enabled {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.stat-icon.critical {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.stat-icon.warning {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
}

.alerts-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
}

.alert-card {
  background: rgba(30, 41, 59, 0.6) !important;
  border: 1px solid rgba(148, 163, 184, 0.1) !important;
  border-radius: 12px !important;
  transition: all 0.3s;
}

.alert-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.4);
  border-color: rgba(148, 163, 184, 0.2) !important;
}

.alert-card.disabled {
  opacity: 0.6;
}

.alert-card :deep(.el-card__header) {
  background: transparent !important;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1) !important;
  padding: 16px 20px !important;
}

.alert-card :deep(.el-card__body) {
  padding: 16px 20px !important;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.alert-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.alert-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.detail-row .label {
  color: #64748b;
  min-width: 80px;
}

.detail-row > span:not(.label) {
  color: #94a3b8;
}

.unit-hint {
  margin-left: 10px;
  color: #64748b;
  font-size: 12px;
}

/* Element Plus Overrides */
:deep(.el-button--primary) {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  border: none;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, #2563eb, #4f46e5);
}

:deep(.el-dialog) {
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.1);
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

:deep(.el-dialog__title) {
  color: #f1f5f9;
}

:deep(.el-form-item__label) {
  color: #94a3b8;
}

:deep(.el-input__wrapper) {
  background: rgba(15, 23, 42, 0.5);
  border-color: rgba(148, 163, 184, 0.2);
}

:deep(.el-input__inner) {
  color: #e2e8f0;
}

:deep(.el-textarea__inner) {
  background: rgba(15, 23, 42, 0.5);
  border-color: rgba(148, 163, 184, 0.2);
  color: #e2e8f0;
}
</style>
