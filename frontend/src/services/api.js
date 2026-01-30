/**
 * 统一 API 服务
 * 根据配置自动选择模拟 API 或正式 API
 */

import appConfig from '../config/app.js';
import mockApi from './mockApi.js';
import productionApi from './productionApi.js';

// 根据模式选择 API
const api = appConfig.isMockMode ? mockApi : productionApi;

// 导出所有 API 方法
export const {
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
} = api;

export default api;
