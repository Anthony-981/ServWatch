/**
 * 正式版 API 服务
 * 连接真实的后端服务器
 */

import axios from 'axios';
import appConfig from '../config/app.js';

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: appConfig.apiBaseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加 JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 处理错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期，清除本地存储
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ========== 认证 API ==========

/**
 * 用户登录
 * @param {string} identifier - 用户名或邮箱
 * @param {string} password - 密码
 */
export async function login(identifier, password) {
  const response = await apiClient.post('/auth/login', { identifier, password });
  return response.data;
}

/**
 * 用户注册
 * @param {Object} userData - 用户数据
 */
export async function register(userData) {
  const response = await apiClient.post('/auth/register', userData);
  return response.data;
}

/**
 * 用户登出
 */
export async function logout() {
  const response = await apiClient.post('/auth/logout');
  return response.data;
}

/**
 * 刷新 token
 * @param {string} refreshToken - 刷新令牌
 */
export async function refreshToken(refreshToken) {
  const response = await apiClient.post('/auth/refresh', { refreshToken });
  return response.data;
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser() {
  const response = await apiClient.get('/auth/me');
  return response.data;
}

// ========== 监控目标 API ==========

/**
 * 获取所有监控目标
 */
export async function getTargets() {
  const response = await apiClient.get('/targets');
  return response.data;
}

/**
 * 获取单个监控目标
 * @param {string} id - 目标ID
 */
export async function getTarget(id) {
  const response = await apiClient.get(`/targets/${id}`);
  return response.data;
}

/**
 * 创建监控目标
 * @param {Object} targetData - 目标数据
 */
export async function createTarget(targetData) {
  const response = await apiClient.post('/targets', targetData);
  return response.data;
}

/**
 * 更新监控目标
 * @param {string} id - 目标ID
 * @param {Object} targetData - 更新数据
 */
export async function updateTarget(id, targetData) {
  const response = await apiClient.put(`/targets/${id}`, targetData);
  return response.data;
}

/**
 * 删除监控目标
 * @param {string} id - 目标ID
 */
export async function deleteTarget(id) {
  const response = await apiClient.delete(`/targets/${id}`);
  return response.data;
}

/**
 * 启用/禁用监控目标
 * @param {string} id - 目标ID
 * @param {boolean} enabled - 是否启用
 */
export async function toggleTarget(id, enabled) {
  const response = await apiClient.patch(`/targets/${id}/toggle`, { enabled });
  return response.data;
}

// ========== 告警规则 API ==========

/**
 * 获取所有告警规则
 */
export async function getAlerts() {
  const response = await apiClient.get('/alerts');
  return response.data;
}

/**
 * 获取单个告警规则
 * @param {string} id - 规则ID
 */
export async function getAlert(id) {
  const response = await apiClient.get(`/alerts/${id}`);
  return response.data;
}

/**
 * 创建告警规则
 * @param {Object} alertData - 告警数据
 */
export async function createAlert(alertData) {
  const response = await apiClient.post('/alerts', alertData);
  return response.data;
}

/**
 * 更新告警规则
 * @param {string} id - 规则ID
 * @param {Object} alertData - 更新数据
 */
export async function updateAlert(id, alertData) {
  const response = await apiClient.put(`/alerts/${id}`, alertData);
  return response.data;
}

/**
 * 删除告警规则
 * @param {string} id - 规则ID
 */
export async function deleteAlert(id) {
  const response = await apiClient.delete(`/alerts/${id}`);
  return response.data;
}

/**
 * 启用/禁用告警规则
 * @param {string} id - 规则ID
 * @param {boolean} enabled - 是否启用
 */
export async function toggleAlert(id, enabled) {
  const response = await apiClient.patch(`/alerts/${id}/toggle`, { enabled });
  return response.data;
}

// ========== 监控指标 API ==========

/**
 * 获取监控指标数据
 * @param {Object} params - 查询参数
 * @param {string} params.targetId - 目标ID（可选）
 * @param {string} params.metricType - 指标类型（可选）
 * @param {string} params.startTime - 开始时间（可选）
 * @param {string} params.endTime - 结束时间（可选）
 * @param {number} params.limit - 限制数量（可选）
 */
export async function getMetrics(params = {}) {
  const response = await apiClient.get('/metrics', { params });
  return response.data;
}

/**
 * 获取实时指标
 * @param {string} targetId - 目标ID（可选）
 */
export async function getRealtimeMetrics(targetId = null) {
  const params = targetId ? { targetId } : {};
  const response = await apiClient.get('/metrics/realtime', { params });
  return response.data;
}

/**
 * 获取指标聚合数据
 * @param {Object} params - 查询参数
 */
export async function getAggregatedMetrics(params = {}) {
  const response = await apiClient.get('/metrics/aggregated', { params });
  return response.data;
}

// ========== 告警历史 API ==========

/**
 * 获取告警历史
 * @param {Object} params - 查询参数
 */
export async function getAlertHistory(params = {}) {
  const response = await apiClient.get('/alerts/history', { params });
  return response.data;
}

/**
 * 确认告警
 * @param {string} id - 历史记录ID
 */
export async function acknowledgeAlert(id) {
  const response = await apiClient.post(`/alerts/history/${id}/acknowledge`);
  return response.data;
}

// ========== 统计数据 API ==========

/**
 * 获取统计数据
 */
export async function getStats() {
  const response = await apiClient.get('/stats');
  return response.data;
}

/**
 * 获取系统概览
 */
export async function getOverview() {
  const response = await apiClient.get('/stats/overview');
  return response.data;
}

// 导出所有 API
const productionApi = {
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

export default productionApi;
