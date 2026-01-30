# ServWatch 部署指南

## Docker 部署（推荐）

### 前置要求

- Docker 20.10+
- Docker Compose 2.0+

### 快速启动

```bash
# 克隆项目
git clone https://github.com/your-org/servwatch.git
cd servwatch

# 启动所有服务
docker-compose -f docker/docker-compose.yml up -d

# 查看日志
docker-compose -f docker/docker-compose.yml logs -f

# 停止服务
docker-compose -f docker/docker-compose.yml down
```

### 服务端口

| 服务 | 内部端口 | 外部端口 |
|------|----------|----------|
| Frontend | 80 | 80 |
| Backend | 3001 | 3001 |
| PostgreSQL | 5432 | 5432 |
| Redis | 6379 | 6379 |

## 手动部署

### 后端部署

#### 1. 安装依赖

```bash
cd backend
npm install --production
```

#### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件设置生产环境配置
```

#### 3. 使用 PM2 运行

```bash
npm install -g pm2
pm2 start npm --name "servwatch-backend" -- start
pm2 save
pm2 startup
```

### 前端部署

#### 1. 构建前端

```bash
cd frontend
npm install
npm run build
```

#### 2. 使用 Nginx 托管

```nginx
server {
    listen 80;
    server_name monitor.example.com;

    root /path/to/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### Agent 部署

在需要监控的服务器上：

```bash
# 复制 Agent 到目标服务器
scp -r agent/ user@target-server:/opt/servwatch-agent

# SSH 到目标服务器
ssh user@target-server

# 启动 Agent
cd /opt/servwatch-agent
npm install
npm start

# 或使用 PM2
pm2 start npm --name "servwatch-agent" -- start
pm2 save
```

## 生产环境配置

### 数据库优化

```sql
-- 创建索引
CREATE INDEX idx_metrics_timestamp ON metrics(timestamp DESC);
CREATE INDEX idx_metrics_target_type ON metrics(targetId, metricType);
CREATE INDEX idx_alerts_enabled ON alerts(enabled) WHERE enabled = true;

-- 配置保留策略
SELECT add_retention_policy('metrics', '7 days');
```

### 反向代理配置

#### Nginx

```nginx
upstream servwatch_backend {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002 backup;
}

server {
    listen 443 ssl http2;
    server_name monitor.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    location / {
        proxy_pass http://servwatch_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 安全建议

1. **启用 HTTPS**
   ```bash
   certbot --nginx -d monitor.example.com
   ```

2. **配置防火墙**
   ```bash
   ufw allow 22/tcp    # SSH
   ufw allow 80/tcp    # HTTP
   ufw allow 443/tcp   # HTTPS
   ufw enable
   ```

3. **定期备份数据库**
   ```bash
   # 每日备份
   0 2 * * * pg_dump -U postgres servwatch > /backup/servwatch_$(date +\%Y\%m\%d).sql
   ```

4. **监控服务状态**
   ```bash
   # PM2 监控
   pm2 monit

   # 系统资源监控
   htop
   ```

## 常见问题

### 端口冲突

```bash
# 查看端口占用
netstat -tulpn | grep :3001

# 修改后端端口
# 编辑 backend/.env
PORT=3002
```

### 数据库连接失败

```bash
# 检查 PostgreSQL 状态
systemctl status postgresql

# 检查连接
psql -U postgres -h localhost -c "SELECT version();"
```

### WebSocket 连接失败

1. 检查 Nginx 配置是否包含 WebSocket 升级头
2. 确认防火墙允许 WebSocket 连接
3. 验证后端 CORS 配置
