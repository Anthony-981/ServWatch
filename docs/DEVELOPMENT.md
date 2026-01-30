# ServWatch 开发指南

## 前端开发

### 目录结构

```
frontend/
├── src/
│   ├── config/              # 配置文件
│   │   └── app.js          # 应用配置（模式切换）
│   ├── components/          # Vue组件
│   │   ├── alerts/         # 告警相关组件
│   │   └── ...
│   ├── composables/        # 组合式函数
│   │   └── useWebSocket.js
│   ├── services/           # API服务
│   │   ├── api.js         # 统一API入口
│   │   ├── mockApi.js     # 模拟API
│   │   └── productionApi.js # 正式API
│   ├── stores/             # Pinia状态管理
│   │   └── authStore.js   # 认证状态
│   ├── views/              # 页面视图
│   │   ├── Dashboard.vue  # 仪表板
│   │   ├── Targets.vue    # 监控目标
│   │   ├── Alerts.vue     # 告警规则
│   │   ├── Monitoring.vue # 监控数据
│   │   └── Login.vue      # 登录页面
│   └── main.js
├── public/
├── index.html
├── vite.config.js
└── package.json
```

### 环境配置

#### 模拟模式（默认）
```bash
# .env 或 .env.mock
VITE_APP_MODE=mock
VITE_API_BASE_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
```

#### 生产模式
```bash
# .env.production
VITE_APP_MODE=production
VITE_API_BASE_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
```

### 启动开发服务器

```bash
cd frontend
npm install
npm run dev -- --port 5175
```

### 模拟数据说明

模拟模式下：
- 固定登录账户: `admin` / `admin123`
- 无需启动后端服务
- 所有API请求返回本地模拟数据
- WebSocket模拟连接状态

## 后端开发

### 目录结构

```
backend/
├── src/
│   ├── config/              # 配置管理
│   │   ├── index.js        # 主配置文件
│   │   └── database.js     # 数据库配置
│   ├── controllers/        # 请求处理器
│   │   ├── authController.js
│   │   ├── targetController.js
│   │   ├── alertController.js
│   │   └── metricsController.js
│   ├── services/           # 业务逻辑
│   │   ├── alertService.js       # 告警评估
│   │   ├── metricsService.js     # 指标处理
│   │   └── websocketService.js  # WebSocket管理
│   ├── models/             # 数据模型
│   │   ├── User.js         # 用户模型
│   │   ├── Target.js       # 监控目标
│   │   ├── Metric.js       # 监控指标
│   │   ├── Alert.js        # 告警规则
│   │   └── AlertHistory.js # 告警历史
│   ├── routes/             # API路由
│   ├── websocket/          # WebSocket处理
│   ├── middleware/         # 中间件
│   ├── migrations/         # 数据库迁移
│   └── app.js              # 应用入口
├── package.json
└── .env.example
```

### 环境变量

```bash
# 服务器
PORT=3001
NODE_ENV=development

# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_NAME=servwatch
DB_USER=postgres
DB_PASSWORD=postgres

# CORS
WS_CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:5175

# JWT
JWT_SECRET=servwatch-jwt-secret-key-2024
```

### 启动开发服务器

```bash
cd backend
npm install
npm run dev
```

### 数据库迁移

```bash
# 创建默认管理员用户
node src/migrations/seedUser.js

# 添加userId字段
node src/migrations/addUserId.js
```

## 采集器开发

### 目录结构

```
agent/
├── src/
│   ├── collectors/         # 采集器
│   │   ├── systemCollector.js   # 系统指标
│   │   ├── appCollector.js      # 应用指标
│   │   └── apiCollector.js      # API性能
│   ├── transmitters/       # 数据传输
│   ├── config/             # 配置管理
│   └── agent.js           # Agent入口
├── package.json
└── agent.config.json
```

### 配置文件

```json
{
  "server": {
    "url": "http://localhost:3001",
    "reconnectInterval": 5000
  },
  "agent": {
    "name": "my-server",
    "collectInterval": 1000
  },
  "metrics": {
    "cpu": true,
    "memory": true,
    "disk": true,
    "network": true,
    "app": true,
    "api": true
  }
}
```

### 启动Agent

```bash
cd agent
npm install
npm start
```

## 代码规范

### 前端

- 使用 Vue 3 Composition API
- 使用 `<script setup>` 语法
- 组件命名: PascalCase (如 `Dashboard.vue`)
- 组合式函数命名: `use` 前缀 (如 `useWebSocket.js`)
- 状态管理使用 Pinia

### 后端

- 使用 ES6+ 语法
- 异步处理使用 `async/await`
- 错误处理使用 try-catch
- 路由命名: kebab-case (如 `/metrics/realtime`)

## 调试技巧

### 前端调试

1. **Vue DevTools**: 安装浏览器扩展
2. **Console**: 使用 `console.log` 调试
3. **Network**: 查看API请求
4. **Performance**: 分析性能瓶颈

### 后端调试

```bash
# 启用详细日志
NODE_ENV=development npm run dev

# 使用调试器
node inspect src/app.js
```

## 测试

### 前端测试

```bash
cd frontend
npm run test          # 运行单元测试
npm run test:e2e     # 运行E2E测试
npm run test:coverage # 生成覆盖率报告
```

### 后端测试

```bash
cd backend
npm run test          # 运行单元测试
npm run test:coverage # 生成覆盖率报告
```

## 发布部署

### 前端构建

```bash
cd frontend
npm run build        # 生产构建
npm run preview      # 预览构建结果
```

### Docker 构建

```bash
# 构建并启动所有服务
docker-compose -f docker/docker-compose.yml up -d --build
```
