# ServWatch - 实时可视化监控系统

一款现代化的实时监控系统，支持服务器系统指标和应用服务性能监控。

## 功能特性

- 🔄 **实时监控** - WebSocket 实时数据推送
- 📊 **可视化仪表板** - 基于 Apache ECharts 的交互式图表
- 🎯 **多目标监控** - 同时监控多台主机和应用
- 🚨 **智能告警** - 可配置的阈值告警规则
- 📈 **应用性能** - API 响应时间、事件循环延迟监控
- 🐳 **容器化部署** - Docker Compose 一键启动
- 🎛️ **模拟模式** - 无需后端即可预览前端界面

## 文档

| 文档 | 说明 |
|------|------|
| [快速参考](docs/QUICKSTART.md) | 模式切换、环境配置、常用命令 |
| [API 文档](API.md) | 完整的 REST API 和 WebSocket API 说明 |
| [开发指南](docs/DEVELOPMENT.md) | 开发环境搭建和代码规范 |
| [部署指南](docs/DEPLOYMENT.md) | 生产环境部署配置 |

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Pinia + ECharts + Element Plus |
| 后端 | Node.js + Express + Socket.IO |
| 数据库 | PostgreSQL + TimescaleDB |
| 缓存 | Redis |
| 采集 | Node.js Agent |

## 快速开始

### 使用 Docker Compose（推荐）

```bash
# 启动所有服务
docker-compose -f docker/docker-compose.yml up -d

# 访问仪表板
http://localhost:5173

# 查看日志
docker-compose -f docker/docker-compose.yml logs -f
```

### 本地开发

#### 模式选择

ServWatch 支持两种运行模式：

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| **模拟模式 (mock)** | 使用本地模拟数据，无需后端 | 前端开发、UI演示、功能预览 |
| **生产模式 (production)** | 连接真实后端 API | 完整功能测试、生产部署 |

#### 模拟模式（默认 - 无需后端）

```bash
cd frontend
npm install
npm run dev -- --port 5175

# 访问 http://localhost:5175
# 登录账户: admin / admin123
```

**特点：**
- 无需启动后端服务
- 无需配置数据库
- 固定登录账户: `admin` / `admin123`
- 所有数据为模拟生成

#### 生产模式（完整功能）

##### 1. 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd frontend
npm install

# Agent
cd agent
npm install
```

##### 2. 配置数据库

```bash
# 使用 Docker 启动 PostgreSQL + TimescaleDB
docker run -d \
  --name servwatch-postgres \
  -e POSTGRES_DB=servwatch \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  timescale/timescaledb:latest-pg16

# 创建数据库
psql -U postgres -h localhost -c "CREATE DATABASE servwatch;"
```

##### 3. 切换前端到生产模式

```bash
cd frontend

# 方式1: 复制环境配置文件
cp .env.production .env

# 方式2: 创建 .env 文件
echo "VITE_APP_MODE=production" > .env
echo "VITE_API_BASE_URL=http://localhost:3001/api" >> .env
echo "VITE_WS_URL=http://localhost:3001" >> .env
```

##### 4. 初始化数据库

```bash
cd backend

# 创建默认管理员用户
node src/migrations/seedUser.js

# 验证用户已创建
node src/scripts/checkData.js
```

##### 5. 启动服务

```bash
# 终端1: 后端 (端口 3001)
cd backend
npm run dev

# 终端2: 前端 (端口 5175)
cd frontend
npm run dev -- --port 5175

# 终端3: Agent (在需要监控的服务器上运行，可选)
cd agent
npm start
```

##### 6. 访问系统

```
前端地址: http://localhost:5175
默认账户: admin / admin123
后端地址: http://localhost:3001
```

#### 模式切换总结

```bash
# 切换到模拟模式
cd frontend
echo "VITE_APP_MODE=mock" > .env

# 切换到生产模式
cd frontend
echo "VITE_APP_MODE=production" > .env
echo "VITE_API_BASE_URL=http://localhost:3001/api" >> .env
echo "VITE_WS_URL=http://localhost:3001" >> .env

# 重启前端开发服务器
npm run dev -- --port 5175
```

## 项目结构

```
ServWatch/
├── backend/                    # Node.js 后端服务
│   ├── src/
│   │   ├── config/            # 配置管理
│   │   ├── controllers/       # 请求处理器
│   │   ├── services/          # 业务逻辑
│   │   │   ├── websocketService.js   # WebSocket连接管理
│   │   │   ├── alertService.js       # 告警评估通知
│   │   │   └── metricsService.js     # 指标聚合处理
│   │   ├── models/            # 数据模型 (Target, Metric, Alert)
│   │   ├── routes/            # API路由
│   │   ├── websocket/         # WebSocket处理器
│   │   └── app.js
│   ├── package.json
│   └── .env.example
│
├── agent/                      # 指标采集代理
│   ├── src/
│   │   ├── collectors/        # 采集器
│   │   │   ├── systemCollector.js   # 系统指标 (CPU/内存/磁盘/网络)
│   │   │   ├── appCollector.js      # 应用指标 (事件循环/堆内存)
│   │   │   └── apiCollector.js      # API性能 (响应时间/P95)
│   │   ├── transmitters/      # 数据传输
│   │   ├── config/            # Agent配置
│   │   └── agent.js
│   └── package.json
│
├── frontend/                   # Vue.js 前端
│   ├── src/
│   │   ├── components/        # Vue组件
│   │   ├── composables/       # 组合式函数
│   │   ├── stores/            # Pinia状态管理
│   │   ├── services/          # API服务
│   │   ├── views/             # 页面视图
│   │   └── main.js
│   └── package.json
│
└── docker/                     # Docker 配置
    ├── docker-compose.yml     # 多容器编排
    ├── Dockerfile.backend    # 后端镜像
    └── Dockerfile.frontend   # 前端镜像
```

## API 文档

详细的 API 文档请查看: [API.md](frontend/API.md)

### 快速参考

#### 基础信息

| 项目 | 值 |
|------|-----|
| 基础URL | `http://localhost:3001/api` |
| 认证方式 | JWT Bearer Token |
| 数据格式 | JSON |

#### 认证 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/auth/login` | POST | 用户登录 |
| `/auth/register` | POST | 用户注册 |
| `/auth/logout` | POST | 用户登出 |
| `/auth/refresh` | POST | 刷新Token |
| `/auth/me` | GET | 获取当前用户 |

#### 监控目标 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/targets` | GET | 获取所有目标 |
| `/targets` | POST | 创建新目标 |
| `/targets/:id` | GET | 获取目标详情 |
| `/targets/:id` | PUT | 更新目标 |
| `/targets/:id` | DELETE | 删除目标 |
| `/targets/:id/toggle` | PATCH | 启用/禁用目标 |

#### 告警规则 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/alerts` | GET | 获取所有告警规则 |
| `/alerts` | POST | 创建告警规则 |
| `/alerts/:id` | GET | 获取告警详情 |
| `/alerts/:id` | PUT | 更新告警规则 |
| `/alerts/:id` | DELETE | 删除告警规则 |
| `/alerts/:id/toggle` | PATCH | 启用/禁用告警 |
| `/alerts/history` | GET | 获取告警历史 |

#### 监控指标 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/metrics` | GET | 获取监控指标 |
| `/metrics/realtime` | GET | 获取实时指标 |
| `/metrics/aggregated` | GET | 获取聚合指标 |

#### 统计 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/stats` | GET | 获取统计数据 |
| `/stats/overview` | GET | 获取系统概览 |

#### WebSocket 事件

| 事件 | 方向 | 说明 |
|------|------|------|
| `dashboard:connect` | Client→Server | 仪表板连接 |
| `metrics:update` | Server→Client | 实时指标推送 |
| `alert:triggered` | Server→Client | 告警触发通知 |

#### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 配置说明

### 后端环境变量 (.env)

```env
# 服务器配置
PORT=3001
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=servwatch
DB_USER=postgres
DB_PASSWORD=postgres

# WebSocket配置
WS_CORS_ORIGIN=http://localhost:5173

# 指标配置
METRICS_RETENTION_DAYS=7
METRICS_AGGREGATION_INTERVAL=5000

# 告警配置
ALERT_EVALUATION_INTERVAL=5000
ALERT_COOLDOWN_DEFAULT=300
```

### Agent 配置

Agent 可以通过以下方式配置：

1. **环境变量**:
```bash
export SERVWATCH_SERVER=http://your-server:3001
export AGENT_NAME=my-server
export COLLECT_INTERVAL=1000
```

2. **配置文件** (`agent/agent.config.json`):
```json
{
  "server": {
    "url": "http://localhost:3001"
  },
  "agent": {
    "name": "production-server",
    "collectInterval": 1000
  },
  "metrics": {
    "cpu": true,
    "memory": true,
    "disk": true,
    "network": true
  }
}
```

## 监控指标说明

### 系统指标

| 指标 | 说明 | 单位 |
|------|------|------|
| CPU Usage | CPU 使用率 | % |
| Memory Usage | 内存使用率 | % |
| Disk Usage | 磁盘使用率 | % |
| Network Rx | 网络接收速率 | bytes/s |
| Network Tx | 网络发送速率 | bytes/s |

### 应用指标

| 指标 | 说明 | 单位 |
|------|------|------|
| Event Loop Delay | 事件循环延迟 | ms |
| Event Loop Utilization | 事件循环利用率 | % |
| Heap Used | 堆内存使用量 | bytes |
| Heap Percentage | 堆内存使用率 | % |
| Active Handles | 活跃句柄数 | count |

### API 指标

| 指标 | 说明 | 单位 |
|------|------|------|
| Avg Response Time | 平均响应时间 | ms |
| P95 | 95分位响应时间 | ms |
| P99 | 99分位响应时间 | ms |
| Error Rate | 错误率 | % |
| Request Rate | 请求速率 | req/s |

## 部署

### Docker 部署

```bash
# 构建并启动所有服务
docker-compose -f docker/docker-compose.yml up -d

# 查看服务状态
docker-compose -f docker/docker-compose.yml ps

# 查看日志
docker-compose -f docker/docker-compose.yml logs -f

# 停止并清理
docker-compose -f docker/docker-compose.yml down
```

### 生产环境建议

1. **使用进程管理器** (PM2) 运行后端和 Agent
2. **配置 Nginx** 作为反向代理
3. **启用 HTTPS** 使用 Let's Encrypt
4. **配置防火墙** 只开放必要端口
5. **定期备份** PostgreSQL 数据库

## 故障排除

### Agent 无法连接

```bash
# 检查服务器状态
curl http://backend-server:3001/health

# 检查 Agent 配置
cat agent/agent.config.json

# 查看日志
tail -f agent/output.log
```

### 数据库连接失败

```bash
# 检查 PostgreSQL 是否运行
docker ps | grep postgres

# 检查数据库是否存在
psql -U postgres -l | grep servwatch

# 检查连接
psql -U postgres -h localhost -d servwatch
```

### WebSocket 连接失败

1. 检查后端 CORS 配置
2. 确认防火墙允许 WebSocket 连接
3. 检查前端环境变量 `VITE_WS_URL`

## 开发路线图

- [x] 基础框架搭建
- [x] 系统指标采集
- [x] 应用性能监控
- [x] 告警系统
- [x] 目标管理
- [x] WebSocket 实时通信
- [x] Docker 容器化
- [ ] 邮件通知功能
- [ ] 用户认证系统
- [ ] 多租户支持
- [ ] 自定义仪表板
- [ ] 导出报表功能

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT

## 作者

ServWatch Team

---

**查看更新日志**: [CHANGELOG.md](CHANGELOG.md)
