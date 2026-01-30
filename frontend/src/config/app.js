// 应用配置
export const appConfig = {
  // 模式: 'mock' | 'production'
  // mock: 使用模拟数据（无需后端）
  // production: 连接真实后端 API
  mode: import.meta.env.VITE_APP_MODE || 'mock',

  // API 基础地址
  apiBaseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',

  // WebSocket 地址
  wsURL: import.meta.env.VITE_WS_URL || 'http://localhost:3001',

  // 是否启用模拟模式
  get isMockMode() {
    return this.mode === 'mock';
  },

  // 是否启用生产模式
  get isProductionMode() {
    return this.mode === 'production';
  }
};

export default appConfig;
