# ServWatch API 文档

## 基本信息

- **基础URL**: `http://localhost:3001/api`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_APP_MODE` | 运行模式: `mock` 或 `production` | `mock` |
| `VITE_API_BASE_URL` | API 基础地址 | `http://localhost:3001/api` |
| `VITE_WS_URL` | WebSocket 地址 | `http://localhost:3001` |

---

## 认证 API

### 用户登录

**请求**
```
POST /auth/login
Content-Type: application/json

{
  "identifier": "admin",
  "password": "admin123"
}
```

**参数说明**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| identifier | string | 是 | 用户名或邮箱 |
| password | string | 是 | 密码 |

**响应**
```json
{
  "user": {
    "id": "1",
    "username": "admin",
    "email": "admin@servwatch.local",
    "firstName": "System",
    "lastName": "Administrator",
    "role": "admin",
    "avatar": null,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 用户注册

**请求**
```
POST /auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**参数说明**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 (3-50字符, 字母数字) |
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码 (最少6字符) |
| firstName | string | 否 | 名字 |
| lastName | string | 否 | 姓氏 |

**响应**
```json
{
  "user": {
    "id": "2",
    "username": "newuser",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 用户登出

**请求**
```
POST /auth/logout
Authorization: Bearer {accessToken}
```

**响应**
```json
{
  "success": true
}
```

### 刷新Token

**请求**
```
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 获取当前用户

**请求**
```
GET /auth/me
Authorization: Bearer {accessToken}
```

**响应**
```json
{
  "user": {
    "id": "1",
    "username": "admin",
    "email": "admin@servwatch.local",
    "firstName": "System",
    "lastName": "Administrator",
    "role": "admin",
    "avatar": null,
    "isActive": true
  }
}
```

---

## 监控目标 API

### 获取所有监控目标

**请求**
```
GET /targets
Authorization: Bearer {accessToken}
```

**响应**
```json
{
  "targets": [
    {
      "id": "1",
      "name": "Web-Server-01",
      "type": "host",
      "host": "192.168.1.101",
      "port": 3093,
      "status": "online",
      "description": "Frontend server",
      "tags": ["frontend", "production"],
      "metadata": {
        "role": "frontend",
        "region": "cn-north-1",
        "version": "1.0.10"
      },
      "enabled": true,
      "userId": "1",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 获取单个监控目标

**请求**
```
GET /targets/{id}
Authorization: Bearer {accessToken}
```

**响应**
```json
{
  "target": {
    "id": "1",
    "name": "Web-Server-01",
    "type": "host",
    "host": "192.168.1.101",
    "port": 3093,
    "status": "online",
    "description": "Frontend server",
    "tags": ["frontend", "production"],
    "metadata": {
      "role": "frontend",
      "region": "cn-north-1",
      "version": "1.0.10"
    },
    "enabled": true
  }
}
```

### 创建监控目标

**请求**
```
POST /targets
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "New-Server",
  "type": "host",
  "host": "192.168.1.200",
  "port": 3093,
  "description": "New server",
  "tags": ["web", "backend"],
  "metadata": {
    "role": "backend",
    "region": "cn-north-1"
  }
}
```

**参数说明**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 目标名称 |
| type | string | 是 | 类型: `host` 或 `application` |
| host | string | 是 | 主机地址 |
| port | number | 是 | 端口号 |
| description | string | 否 | 描述 |
| tags | array | 否 | 标签数组 |
| metadata | object | 否 | 元数据 |

**响应**
```json
{
  "target": {
    "id": "11",
    "name": "New-Server",
    "type": "host",
    "host": "192.168.1.200",
    "port": 3093,
    "status": "offline",
    "enabled": true,
    ...
  }
}
```

### 更新监控目标

**请求**
```
PUT /targets/{id}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Updated-Name",
  "description": "Updated description"
}
```

**响应**
```json
{
  "target": {
    "id": "1",
    "name": "Updated-Name",
    ...
  }
}
```

### 删除监控目标

**请求**
```
DELETE /targets/{id}
Authorization: Bearer {accessToken}
```

**响应**
```json
{
  "success": true
}
```

### 启用/禁用监控目标

**请求**
```
PATCH /targets/{id}/toggle
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "enabled": true
}
```

**响应**
```json
{
  "target": {
    "id": "1",
    "enabled": true,
    ...
  }
}
```

---

## 告警规则 API

### 获取所有告警规则

**请求**
```
GET /alerts
Authorization: Bearer {accessToken}
```

**响应**
```json
{
  "alerts": [
    {
      "id": "1",
      "name": "CPU使用率告警",
      "targetId": "1",
      "metricType": "cpu",
      "condition": "greater_than",
      "threshold": 80,
      "severity": "critical",
      "enabled": true,
      "triggerCount": 15,
      "lastTriggered": "2024-01-01T12:00:00.000Z",
      "userId": "1",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**字段说明**

| 字段 | 说明 | 可选值 |
|------|------|--------|
| metricType | 指标类型 | `cpu`, `memory`, `disk`, `network`, `api`, `app` |
| condition | 条件 | `greater_than`, `less_than`, `equals` |
| severity | 严重程度 | `critical`, `warning`, `info` |

### 创建告警规则

**请求**
```
POST /alerts
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "内存告警",
  "targetId": "1",
  "metricType": "memory",
  "condition": "greater_than",
  "threshold": 85,
  "severity": "warning"
}
```

**响应**
```json
{
  "alert": {
    "id": "9",
    "name": "内存告警",
    ...
  }
}
```

### 更新告警规则

**请求**
```
PUT /alerts/{id}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "threshold": 90,
  "enabled": false
}
```

### 删除告警规则

**请求**
```
DELETE /alerts/{id}
Authorization: Bearer {accessToken}
```

### 启用/禁用告警规则

**请求**
```
PATCH /alerts/{id}/toggle
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "enabled": false
}
```

---

## 监控指标 API

### 获取监控指标数据

**请求**
```
GET /metrics?targetId={targetId}&metricType={metricType}&startTime={startTime}&endTime={endTime}&limit={limit}
Authorization: Bearer {accessToken}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| targetId | string | 否 | 目标ID |
| metricType | string | 否 | 指标类型 |
| startTime | string | 否 | 开始时间 (ISO 8601) |
| endTime | string | 否 | 结束时间 (ISO 8601) |
| limit | number | 否 | 限制数量 (默认: 100) |

**响应**
```json
{
  "metrics": [
    {
      "id": "1",
      "targetId": "1",
      "metricType": "cpu",
      "data": {
        "value": 45.2,
        "cores": [30.5, 45.2, 60.1, 35.8]
      },
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

### 获取实时指标

**请求**
```
GET /metrics/realtime?targetId={targetId}
Authorization: Bearer {accessToken}
```

**响应**
```json
{
  "metrics": [
    {
      "targetId": "1",
      "targetName": "Web-Server-01",
      "timestamp": "2024-01-01T12:00:00.000Z",
      "metrics": {
        "cpu": 45.2,
        "memory": 62.8,
        "disk": 55.3,
        "network": {
          "rx": 125.6,
          "tx": 45.2
        }
      }
    }
  ]
}
```

### 获取聚合指标

**请求**
```
GET /metrics/aggregated?targetId={targetId}&metricType={metricType}&period={period}
Authorization: Bearer {accessToken}
```

**查询参数**

| 参数 | 说明 | 可选值 |
|------|------|--------|
| period | 聚合周期 | `1h`, `6h`, `24h`, `7d` |

**响应**
```json
{
  "avg": { "cpu": 45.2, "memory": 62.8 },
  "max": { "cpu": 89.1, "memory": 85.2 },
  "min": { "cpu": 12.3, "memory": 35.6 },
  "count": 1000
}
```

---

## 告警历史 API

### 获取告警历史

**请求**
```
GET /alerts/history?status={status}&severity={severity}&limit={limit}
Authorization: Bearer {accessToken}
```

**查询参数**

| 参数 | 说明 | 可选值 |
|------|------|--------|
| status | 状态 | `active`, `resolved`, `acknowledged` |
| severity | 严重程度 | `critical`, `warning`, `info` |
| limit | 限制数量 | 默认: 50 |

**响应**
```json
{
  "history": [
    {
      "id": "1",
      "alertId": "1",
      "alertName": "CPU使用率告警",
      "severity": "critical",
      "status": "active",
      "message": "CPU使用率达到 85%",
      "value": 85,
      "threshold": 80,
      "acknowledgedAt": null,
      "resolvedAt": null,
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

### 确认告警

**请求**
```
POST /alerts/history/{id}/acknowledge
Authorization: Bearer {accessToken}
```

**响应**
```json
{
  "success": true
}
```

---

## 统计数据 API

### 获取统计数据

**请求**
```
GET /stats
Authorization: Bearer {accessToken}
```

**响应**
```json
{
  "totalTargets": 10,
  "onlineTargets": 7,
  "offlineTargets": 3,
  "totalAlerts": 8,
  "activeAlerts": 6,
  "resolvedToday": 12
}
```

### 获取系统概览

**请求**
```
GET /stats/overview
Authorization: Bearer {accessToken}
```

**响应**
```json
{
  "totalTargets": 10,
  "onlineTargets": 7,
  "offlineTargets": 3,
  "totalAlerts": 8,
  "criticalAlerts": 3,
  "warningAlerts": 4,
  "infoAlerts": 1
}
```

---

## 错误响应

所有错误响应遵循以下格式：

```json
{
  "error": "错误描述信息"
}
```

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 (Token 无效或过期) |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## WebSocket API

### 连接

**URL**: `ws://localhost:3001/socket.io/`

### 事件

#### 客户端 → 服务器

| 事件 | 数据 | 说明 |
|------|------|------|
| `dashboard:connect` | - | 注册为仪表板客户端 |
| `metrics:subscribe` | `{ targetIds: [] }` | 订阅指标推送 |

#### 服务器 → 客户端

| 事件 | 数据 | 说明 |
|------|------|------|
| `dashboard:connected` | `{ clientId: "..." }` | 连接成功 |
| `metrics:update` | `{ targetId, metrics, timestamp }` | 实时指标更新 |
| `alert:triggered` | `{ alert, value, timestamp }` | 告警触发 |

---

## 模拟模式说明

设置 `VITE_APP_MODE=mock` 可启用模拟模式：

- 所有 API 请求返回本地模拟数据
- 无需启动后端服务器
- 固定登录账户: `admin` / `admin123`
- 适用于开发和演示
