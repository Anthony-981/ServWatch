# ServWatch 快速参考指南

## 目录

1. [模式切换](#模式切换)
2. [环境变量配置](#环境变量配置)
3. [登录账户](#登录账户)
4. [端口说明](#端口说明)
5. [常用命令](#常用命令)
6. [故障排除](#故障排除)

---

## 模式切换

### 模拟模式 → 生产模式

```bash
# 1. 停止前端服务 (Ctrl+C)

# 2. 切换到生产模式
cd frontend
cp .env.production .env

# 3. 确保后端服务已启动
cd backend
npm run dev

# 4. 重启前端
npm run dev -- --port 5175
```

### 生产模式 → 模拟模式

```bash
# 1. 停止前端服务 (Ctrl+C)

# 2. 切换到模拟模式
cd frontend
cp .env.mock .env

# 3. 重启前端
npm run dev -- --port 5175
```

---

## 环境变量配置

### 前端环境变量 (.env)

```bash
# 模式选择 (必填)
VITE_APP_MODE=mock              # 模拟模式 或 production

# API 配置 (生产模式必填)
VITE_API_BASE_URL=http://localhost:3001/api

# WebSocket 配置 (生产模式必填)
VITE_WS_URL=http://localhost:3001
```

### 后端环境变量 (backend/.env)

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

# WebSocket CORS
WS_CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:5175

# JWT 密钥
JWT_SECRET=servwatch-jwt-secret-key-2024
```

---

## 登录账户

### 模拟模式

| 用户名 | 密码 | 权限 |
|--------|------|------|
| admin | admin123 | 管理员 |

### 生产模式

| 用户名 | 密码 | 权限 |
|--------|------|------|
| admin | admin123 | 管理员（默认） |
| 可注册新用户 | - | 普通用户 |

---

## 端口说明

| 服务 | 端口 | 说明 |
|------|------|------|
| Frontend | 5175 | Vue 前端开发服务器 |
| Backend | 3001 | Express 后端 API |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存（可选） |
| WebSocket | 3001 | Socket.IO 与后端共享端口 |

---

## 常用命令

### 前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev -- --port 5175

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 代码检查
npm run lint
```

### 后端

```bash
cd backend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 创建管理员用户
node src/migrations/seedUser.js

# 检查数据
node src/scripts/checkData.js

# 模拟数据生成
node src/scripts/simulateServers.js
```

### 数据库

```bash
# 启动 PostgreSQL Docker 容器
docker run -d \
  --name servwatch-postgres \
  -e POSTGRES_DB=servwatch \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  timescale/timescaledb:latest-pg16

# 连接数据库
psql -U postgres -h localhost -d servwatch

# 停止并删除容器
docker stop servwatch-postgres
docker rm servwatch-postgres
```

---

## 故障排除

### 前端无法启动

```bash
# 检查端口占用
netstat -ano | findstr :5175

# 更换端口
npm run dev -- --port 5176

# 清除缓存重新安装
rm -rf node_modules
rm package-lock.json
npm install
```

### 后端连接失败

```bash
# 检查后端是否运行
curl http://localhost:3001/health

# 检查数据库连接
psql -U postgres -h localhost -c "SELECT 1"

# 查看后端日志
cd backend
npm run dev
```

### 数据库初始化失败

```bash
# 1. 确认 PostgreSQL 正在运行
docker ps | grep postgres

# 2. 检查数据库是否存在
psql -U postgres -l | grep servwatch

# 3. 创建数据库
psql -U postgres -c "CREATE DATABASE servwatch;"

# 4. 运行迁移
cd backend
node src/migrations/seedUser.js
```

### WebSocket 连接错误

**模拟模式下：**
- WebSocket 错误是正常的，可以忽略
- 连接状态会显示为"实时连接中"

**生产模式下：**
```bash
# 1. 检查后端 CORS 配置
# backend/.env
WS_CORS_ORIGIN=http://localhost:5175

# 2. 检查防火墙
# Windows
netsh advfirewall firewall add rule name="Node.js" dir=in action=allow program=node

# 3. 重启后端服务
cd backend
npm run dev
```

### 图表不显示

```bash
# 1. 检查浏览器控制台错误
# 按 F12 打开开发者工具

# 2. 清除浏览器缓存
# Ctrl + Shift + Delete (Windows)
# Cmd + Shift + Delete (Mac)

# 3. 清除本地存储
# 在控制台执行
localStorage.clear()
location.reload()
```

---

## 开发技巧

### 快速重启

```bash
# 前端热重载 (HMR) 已启用
# 修改代码后自动刷新浏览器

# 后端需要手动重启
cd backend
npm run dev
```

### 查看日志

```bash
# 后端日志
cd backend
npm run dev

# 数据库日志
docker logs servwatch-postgres -f

# 前端构建日志
cd frontend
npm run build
```

### 调试工具

| 工具 | 用途 |
|------|------|
| Vue DevTools | Vue 组件调试 |
| Chrome DevTools | 网络请求、性能分析 |
| Postman | API 测试 |
| psql | 数据库查询 |

---

## 相关文档

- [完整 API 文档](API.md)
- [开发指南](docs/DEVELOPMENT.md)
- [部署指南](docs/DEPLOYMENT.md)
- [主 README](../README.md)
