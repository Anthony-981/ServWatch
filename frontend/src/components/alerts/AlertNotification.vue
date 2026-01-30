<template>
  <Teleport to="body">
    <div class="alert-container">
      <TransitionGroup name="alert">
        <div
          v-for="alert in alerts"
          :key="alert.id"
          :class="['alert-notification', `alert-${alert.severity}`]"
        >
          <div class="alert-content">
            <div class="alert-icon">
              <span v-if="alert.severity === 'critical'">⚠️</span>
              <span v-else-if="alert.severity === 'warning'">⚡</span>
              <span v-else>ℹ️</span>
            </div>
            <div class="alert-details">
              <div class="alert-title">{{ alert.name }}</div>
              <div class="alert-message">{{ alert.message }}</div>
              <div class="alert-meta">
                <span>{{ alert.metricType }}: {{ alert.actualValue }}</span>
                <span>{{ formatTime(alert.timestamp) }}</span>
              </div>
            </div>
            <button class="alert-close" @click="dismissAlert(alert.id)">✕</button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue';
import { useWebSocket } from '../../composables/useWebSocket.js';

const { on } = useWebSocket();
const alerts = ref([]);

// Listen for alerts
on('alert:triggered', (alert) => {
  alerts.value.unshift({
    ...alert,
    id: `${alert.alertId}-${Date.now()}`
  });

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    dismissAlert(alerts.value[0]?.id);
  }, 10000);
});

function dismissAlert(id) {
  const index = alerts.value.findIndex(a => a.id === id);
  if (index !== -1) {
    alerts.value.splice(index, 1);
  }
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString();
}
</script>

<style scoped>
.alert-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
}

.alert-notification {
  background: #1a1a2e;
  border-left: 4px solid;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.alert-critical {
  border-color: #f56c6c;
}

.alert-warning {
  border-color: #e6a23c;
}

.alert-info {
  border-color: #409eff;
}

.alert-content {
  display: flex;
  gap: 12px;
  padding: 16px;
  align-items: flex-start;
}

.alert-icon {
  font-size: 24px;
  line-height: 1;
}

.alert-details {
  flex: 1;
}

.alert-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.alert-message {
  font-size: 14px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.alert-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6b7280;
}

.alert-close {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  font-size: 18px;
  line-height: 1;
}

.alert-close:hover {
  color: #fff;
}

/* Transitions */
.alert-enter-active,
.alert-leave-active {
  transition: all 0.3s ease;
}

.alert-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.alert-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
