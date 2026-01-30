<template>
  <div id="app">
    <nav class="navbar" v-if="authStore.isAuthenticated">
      <div class="navbar-brand">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2" class="brand-circle"/>
          <path d="M16 8v8l6 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <circle cx="16" cy="16" r="3" fill="currentColor"/>
        </svg>
        <span class="brand-text">ServWatch</span>
      </div>
      <div class="navbar-links">
        <router-link to="/" class="nav-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          仪表板
        </router-link>
        <router-link to="/targets" class="nav-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>
          </svg>
          监控目标
        </router-link>
        <router-link to="/alerts" class="nav-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          告警规则
        </router-link>
        <router-link to="/monitoring" class="nav-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3v18h18"/>
            <path d="M9 3v18"/>
            <path d="M15 3v18"/>
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 7v5"/>
          </svg>
          监控数据
        </router-link>
      </div>
      <div class="navbar-right">
        <div class="connection-indicator" :class="{ connected: isConnected }">
          <span class="indicator-dot"></span>
          {{ isConnected ? '实时连接中' : '连接断开' }}
        </div>
        <div class="user-menu" ref="userMenuRef">
          <button class="user-button" @click="toggleUserMenu">
            <span class="user-avatar">{{ authStore.userInitials }}</span>
            <span class="user-name">{{ authStore.userDisplayName }}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          <div class="user-dropdown" v-show="showUserMenu">
            <div class="user-info">
              <div class="user-info-name">{{ authStore.userDisplayName }}</div>
              <div class="user-info-email">{{ authStore.user?.email }}</div>
              <div class="user-role-badge" :class="{ admin: authStore.isAdmin }">
                {{ authStore.isAdmin ? '管理员' : '用户' }}
              </div>
            </div>
            <div class="user-divider"></div>
            <button class="user-menu-item" @click="handleLogout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <path d="M16 17l5-5-5-5"/>
                <path d="M21 12H9"/>
              </svg>
              退出登录
            </button>
          </div>
        </div>
      </div>
    </nav>
    <router-view />
    <AlertNotification />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import AlertNotification from './components/alerts/AlertNotification.vue';
import { useAuthStore } from './stores/authStore.js';
import { authApi } from './services/authService.js';

const router = useRouter();
const authStore = useAuthStore();

// 使用模拟数据模式，不需要 WebSocket 连接
const isConnected = ref(true);

const showUserMenu = ref(false);
const userMenuRef = ref(null);

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value;
}

async function handleLogout() {
  try {
    await authApi.logout();
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    authStore.clearAuth();
    router.push('/login');
  }
}

// Close dropdown when clicking outside
function handleClickOutside(event) {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    showUserMenu.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

#app {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #e2e8f0;
}

/* Navigation Bar */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #e2e8f0;
  font-size: 18px;
  font-weight: 600;
}

.brand-circle {
  color: #3b82f6;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.brand-text {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.navbar-links {
  display: flex;
  gap: 4px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-link:hover {
  background: rgba(59, 130, 246, 0.1);
  color: #e2e8f0;
}

.nav-link.router-link-active {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.connection-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 20px;
  font-size: 12px;
  color: #ef4444;
  font-weight: 500;
}

.connection-indicator.connected {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: blink 1.5s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* User Menu */
.user-menu {
  position: relative;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px 6px 6px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.2s;
}

.user-button:hover {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(148, 163, 184, 0.2);
}

.user-avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  font-size: 13px;
  font-weight: 600;
  border-radius: 50%;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #e2e8f0;
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 240px;
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
}

.user-info {
  padding: 12px;
}

.user-info-name {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
}

.user-info-email {
  font-size: 13px;
  color: #64748b;
  margin-top: 2px;
}

.user-role-badge {
  display: inline-block;
  margin-top: 8px;
  padding: 4px 10px;
  background: rgba(59, 130, 246, 0.15);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: #3b82f6;
}

.user-role-badge.admin {
  background: rgba(139, 92, 246, 0.15);
  color: #8b5cf6;
}

.user-divider {
  height: 1px;
  background: rgba(148, 163, 184, 0.1);
  margin: 4px 0;
}

.user-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #ef4444;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.user-menu-item:hover {
  background: rgba(239, 68, 68, 0.1);
}
</style>
