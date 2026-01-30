<template>
  <div class="targets-page">
    <header class="page-header">
      <div>
        <h1>监控目标管理</h1>
        <p>添加和管理被监控的主机和服务</p>
      </div>
      <el-button type="primary" @click="showAddDialog = true">
        + 添加目标
      </el-button>
    </header>

    <!-- Stats Cards -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon online">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ onlineCount }}</div>
          <div class="stat-label">在线</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon offline">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ offlineCount }}</div>
          <div class="stat-label">离线</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon host">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <path d="M8 21h8m-4-4v4"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ hostCount }}</div>
          <div class="stat-label">主机</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon app">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ appCount }}</div>
          <div class="stat-label">应用</div>
        </div>
      </div>
    </div>

    <!-- Target List -->
    <div class="targets-list">
      <el-card v-for="target in mockTargets" :key="target.id" class="target-card" :class="{ offline: target.status === 'offline' }">
        <template #header>
          <div class="card-header">
            <div class="target-info">
              <h3>{{ target.name }}</h3>
              <el-tag :type="target.type === 'host' ? 'primary' : 'success'" size="small">
                {{ getTypeText(target.type) }}
              </el-tag>
              <el-tag :type="getStatusType(target.status)" size="small">
                {{ getStatusText(target.status) }}
              </el-tag>
            </div>
            <div class="card-actions">
              <el-button size="small" @click="editTarget(target)">编辑</el-button>
              <el-button size="small" type="danger" @click="confirmDelete(target)">删除</el-button>
            </div>
          </div>
        </template>

        <div class="target-details">
          <div class="detail-item">
            <span class="label">主机:</span>
            <span>{{ target.host }}</span>
            <span v-if="target.port">:{{ target.port }}</span>
          </div>
          <div v-if="target.description" class="detail-item">
            <span class="label">描述:</span>
            <span>{{ target.description }}</span>
          </div>
          <div v-if="target.tags && target.tags.length" class="detail-item">
            <span class="label">标签:</span>
            <el-tag v-for="tag in target.tags" :key="tag" size="small" class="tag">
              {{ tag }}
            </el-tag>
          </div>
          <div class="detail-item">
            <span class="label">区域:</span>
            <span>{{ target.metadata?.region || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">版本:</span>
            <span>{{ target.metadata?.version || '-' }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingTarget ? '编辑目标' : '添加目标'"
      width="500px"
    >
      <el-form :model="formData" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="formData.name" placeholder="输入目标名称" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="formData.type" placeholder="选择类型">
            <el-option label="主机" value="host" />
            <el-option label="应用" value="application" />
            <el-option label="API" value="api" />
          </el-select>
        </el-form-item>
        <el-form-item label="主机地址">
          <el-input v-model="formData.host" placeholder="IP 或域名" />
        </el-form-item>
        <el-form-item label="端口">
          <el-input-number v-model="formData.port" :min="1" :max="65535" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" rows="2" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="tagsInput" placeholder="用逗号分隔" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTarget">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// Mock data
const mockTargets = ref([
  {
    id: '1',
    name: 'Web-Server-01',
    type: 'host',
    host: '192.168.1.101',
    port: 3093,
    description: 'FRONTEND server for production',
    tags: ['frontend', 'production'],
    status: 'offline',
    enabled: true,
    metadata: { role: 'frontend', region: 'cn-north-1', version: '1.0.10', environment: 'production' }
  },
  {
    id: '2',
    name: 'Web-Server-02',
    type: 'host',
    host: '192.168.1.102',
    port: 7435,
    description: 'FRONTEND server for production',
    tags: ['frontend', 'production'],
    status: 'online',
    enabled: true,
    metadata: { role: 'frontend', region: 'cn-north-1', version: '1.0.0', environment: 'production' }
  },
  {
    id: '3',
    name: 'Web-Server-03',
    type: 'host',
    host: '192.168.1.103',
    port: 7525,
    description: 'FRONTEND server for production',
    tags: ['frontend', 'production'],
    status: 'online',
    enabled: true,
    metadata: { role: 'frontend', region: 'cn-north-1', version: '1.0.0', environment: 'production' }
  },
  {
    id: '4',
    name: 'API-Gateway-01',
    type: 'application',
    host: '192.168.1.201',
    port: 7189,
    description: 'API server for production',
    tags: ['api', 'production'],
    status: 'online',
    enabled: true,
    metadata: { role: 'api', region: 'cn-north-1', version: '1.0.8', environment: 'production' }
  },
  {
    id: '5',
    name: 'API-Gateway-02',
    type: 'application',
    host: '192.168.1.202',
    port: 5297,
    description: 'API server for production',
    tags: ['api', 'production'],
    status: 'online',
    enabled: true,
    metadata: { role: 'api', region: 'cn-north-1', version: '1.0.5', environment: 'production' }
  },
  {
    id: '6',
    name: 'DB-Primary',
    type: 'host',
    host: '192.168.1.151',
    port: 6922,
    description: 'DATABASE server for production',
    tags: ['database', 'production'],
    status: 'online',
    enabled: true,
    metadata: { role: 'database', region: 'cn-north-1', version: '1.0.0', environment: 'production' }
  },
  {
    id: '7',
    name: 'DB-Replica',
    type: 'host',
    host: '192.168.1.152',
    port: 8806,
    description: 'DATABASE server for production',
    tags: ['database', 'production'],
    status: 'online',
    enabled: true,
    metadata: { role: 'database', region: 'cn-north-1', version: '1.0.4', environment: 'production' }
  },
  {
    id: '8',
    name: 'Cache-Redis',
    type: 'application',
    host: '192.168.1.161',
    port: 6697,
    description: 'CACHE server for production',
    tags: ['cache', 'production'],
    status: 'offline',
    enabled: true,
    metadata: { role: 'cache', region: 'cn-north-1', version: '1.0.9', environment: 'production' }
  },
  {
    id: '9',
    name: 'Worker-Queue-01',
    type: 'host',
    host: '192.168.1.171',
    port: 3225,
    description: 'WORKER server for production',
    tags: ['worker', 'production'],
    status: 'online',
    enabled: true,
    metadata: { role: 'worker', region: 'cn-north-1', version: '1.0.1', environment: 'production' }
  },
  {
    id: '10',
    name: 'Storage-NFS',
    type: 'host',
    host: '192.168.1.181',
    port: 6539,
    description: 'STORAGE server for production',
    tags: ['storage', 'production'],
    status: 'online',
    enabled: true,
    metadata: { role: 'storage', region: 'cn-north-1', version: '1.0.10', environment: 'production' }
  }
]);

const showAddDialog = ref(false);
const editingTarget = ref(null);
const formData = ref({
  name: '',
  type: 'host',
  host: '',
  port: null,
  description: '',
  tags: []
});
const tagsInput = ref('');

// Computed
const onlineCount = computed(() => mockTargets.value.filter(t => t.status === 'online').length);
const offlineCount = computed(() => mockTargets.value.filter(t => t.status === 'offline').length);
const hostCount = computed(() => mockTargets.value.filter(t => t.type === 'host').length);
const appCount = computed(() => mockTargets.value.filter(t => t.type === 'application').length);

function getTypeText(type) {
  const types = {
    host: '主机',
    application: '应用',
    api: 'API'
  };
  return types[type] || type;
}

function getStatusType(status) {
  switch (status) {
    case 'online': return 'success';
    case 'offline': return 'danger';
    default: return 'info';
  }
}

function getStatusText(status) {
  switch (status) {
    case 'online': return '在线';
    case 'offline': return '离线';
    default: return '未知';
  }
}

function editTarget(target) {
  editingTarget.value = target;
  formData.value = {
    name: target.name,
    type: target.type,
    host: target.host,
    port: target.port,
    description: target.description,
    tags: [...(target.tags || [])]
  };
  tagsInput.value = formData.value.tags.join(', ');
  showAddDialog.value = true;
}

function saveTarget() {
  if (editingTarget.value) {
    // Update existing
    const index = mockTargets.value.findIndex(t => t.id === editingTarget.value.id);
    if (index !== -1) {
      mockTargets.value[index] = {
        ...mockTargets.value[index],
        name: formData.value.name,
        type: formData.value.type,
        host: formData.value.host,
        port: formData.value.port,
        description: formData.value.description,
        tags: tagsInput.value ? tagsInput.value.split(',').map(t => t.trim()).filter(t => t) : []
      };
    }
    ElMessage.success('目标已更新');
  } else {
    // Add new
    mockTargets.value.push({
      id: Date.now().toString(),
      ...formData.value,
      tags: tagsInput.value ? tagsInput.value.split(',').map(t => t.trim()).filter(t => t) : [],
      status: 'offline',
      enabled: true,
      metadata: {}
    });
    ElMessage.success('目标已添加');
  }
  showAddDialog.value = false;
  resetForm();
}

function confirmDelete(target) {
  ElMessageBox.confirm(
    `确定要删除目标 "${target.name}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    mockTargets.value = mockTargets.value.filter(t => t.id !== target.id);
    ElMessage.success('目标已删除');
  });
}

function resetForm() {
  editingTarget.value = null;
  formData.value = {
    name: '',
    type: 'host',
    host: '',
    port: null,
    description: '',
    tags: []
  };
  tagsInput.value = '';
}
</script>

<style scoped>
.targets-page {
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

.stat-icon.online {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.stat-icon.offline {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.stat-icon.host {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.stat-icon.app {
  background: rgba(139, 92, 246, 0.15);
  color: #8b5cf6;
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

.targets-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.target-card {
  background: rgba(30, 41, 59, 0.6) !important;
  border: 1px solid rgba(148, 163, 184, 0.1) !important;
  border-radius: 12px !important;
  transition: all 0.3s;
}

.target-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.4);
  border-color: rgba(148, 163, 184, 0.2) !important;
}

.target-card.offline {
  opacity: 0.7;
}

.target-card :deep(.el-card__header) {
  background: transparent !important;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1) !important;
  padding: 16px 20px !important;
}

.target-card :deep(.el-card__body) {
  padding: 16px 20px !important;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.target-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.target-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.target-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.detail-item .label {
  color: #64748b;
  min-width: 60px;
}

.detail-item > span:not(.label) {
  color: #94a3b8;
}

.detail-item .tag {
  margin-right: 4px;
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
