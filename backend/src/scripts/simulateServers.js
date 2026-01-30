import { Target, Alert, Metric, AlertHistory, User } from '../models/index.js';

// Generate proper UUIDs
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Utility functions
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// 10台服务器配置
const SERVERS = [
  { name: 'Web-Server-01', host: '192.168.1.101', type: 'host', role: 'frontend' },
  { name: 'Web-Server-02', host: '192.168.1.102', type: 'host', role: 'frontend' },
  { name: 'Web-Server-03', host: '192.168.1.103', type: 'host', role: 'frontend' },
  { name: 'API-Gateway-01', host: '192.168.1.201', type: 'application', role: 'api' },
  { name: 'API-Gateway-02', host: '192.168.1.202', type: 'application', role: 'api' },
  { name: 'DB-Primary', host: '192.168.1.151', type: 'host', role: 'database' },
  { name: 'DB-Replica', host: '192.168.1.152', type: 'host', role: 'database' },
  { name: 'Cache-Redis', host: '192.168.1.161', type: 'application', role: 'cache' },
  { name: 'Worker-Queue-01', host: '192.168.1.171', type: 'host', role: 'worker' },
  { name: 'Storage-NFS', host: '192.168.1.181', type: 'host', role: 'storage' }
];

// 为每台服务器生成真实的监控数据
function generateServerMetrics(server, timestamp) {
  const metrics = [];

  // CPU指标
  const cpuUsage = server.role === 'database' ? randomFloat(30, 85) :
                   server.role === 'worker' ? randomFloat(50, 95) :
                   randomFloat(10, 70);
  metrics.push({
    metricType: 'cpu',
    data: {
      usage: cpuUsage,
      cores: randomInt(4, 16),
      load1min: parseFloat((cpuUsage / 20).toFixed(2)),
      load5min: parseFloat((cpuUsage / 25).toFixed(2)),
      load15min: parseFloat((cpuUsage / 30).toFixed(2)),
      user: parseFloat((cpuUsage * 0.7).toFixed(2)),
      system: parseFloat((cpuUsage * 0.3).toFixed(2))
    },
    timestamp
  });

  // Memory指标
  const memUsage = server.role === 'database' ? randomFloat(60, 92) :
                   server.role === 'cache' ? randomFloat(70, 95) :
                   randomFloat(30, 75);
  const totalMem = server.role === 'database' ? 32768 :
                   server.role === 'cache' ? 16384 :
                   8192;
  metrics.push({
    metricType: 'memory',
    data: {
      usage: memUsage,
      total: totalMem,
      used: Math.floor(totalMem * memUsage / 100),
      free: Math.floor(totalMem * (100 - memUsage) / 100),
      cached: randomInt(500, 3000),
      buffers: randomInt(100, 500)
    },
    timestamp
  });

  // Disk指标
  const diskUsage = server.role === 'storage' ? randomFloat(40, 75) :
                    server.role === 'database' ? randomFloat(50, 80) :
                    randomFloat(20, 60);
  metrics.push({
    metricType: 'disk',
    data: {
      usage: diskUsage,
      total: 500000000000,
      used: Math.floor(500000000000 * diskUsage / 100),
      free: Math.floor(500000000000 * (100 - diskUsage) / 100),
      iops: randomInt(100, server.role === 'database' ? 2000 : 800),
      readBytes: randomInt(1000000, 50000000),
      writeBytes: randomInt(500000, 30000000)
    },
    timestamp
  });

  // Network指标
  metrics.push({
    metricType: 'network',
    data: {
      rx: randomInt(1000000, server.role === 'frontend' ? 500000000 : 100000000),
      tx: randomInt(500000, server.role === 'frontend' ? 300000000 : 80000000),
      rxBps: randomInt(100000, server.role === 'frontend' ? 10000000 : 5000000),
      txBps: randomInt(50000, server.role === 'frontend' ? 8000000 : 3000000),
      connections: randomInt(
        server.role === 'frontend' ? 200 : 50,
        server.role === 'frontend' ? 1000 : 300
      ),
      packetsIn: randomInt(1000, 50000),
      packetsOut: randomInt(800, 40000)
    },
    timestamp
  });

  // API指标 (仅API服务器)
  if (server.role === 'api') {
    metrics.push({
      metricType: 'api',
      data: {
        latency: randomInt(20, 500),
        requestCount: randomInt(500, 5000),
        successRate: randomFloat(95, 100, 2),
        errorCount: randomInt(0, 50),
        p50: randomInt(30, 100),
        p95: randomInt(100, 400),
        p99: randomInt(200, 800)
      },
      timestamp
    });
  }

  // App指标
  metrics.push({
    metricType: 'app',
    data: {
      responseTime: randomInt(50, server.role === 'worker' ? 5000 : 500),
      throughput: randomInt(100, server.role === 'frontend' ? 5000 : 1000),
      errorRate: randomFloat(0, 5, 2),
      activeConnections: randomInt(
        server.role === 'frontend' ? 100 : 20,
        server.role === 'frontend' ? 800 : 200
      ),
      queueDepth: randomInt(0, server.role === 'worker' ? 100 : 20)
    },
    timestamp
  });

  return metrics;
}

// 生成告警
const ALERT_TEMPLATES = [
  { name: 'High CPU Usage', metricType: 'cpu', condition: 'greater_than', threshold: 80, severity: 'warning' },
  { name: 'Critical CPU Usage', metricType: 'cpu', condition: 'greater_than', threshold: 90, severity: 'critical' },
  { name: 'High Memory Usage', metricType: 'memory', condition: 'greater_than', threshold: 85, severity: 'warning' },
  { name: 'Critical Memory Usage', metricType: 'memory', condition: 'greater_than', threshold: 95, severity: 'critical' },
  { name: 'Disk Space Low', metricType: 'disk', condition: 'greater_than', threshold: 80, severity: 'warning' },
  { name: 'High API Latency', metricType: 'api', condition: 'greater_than', threshold: 500, severity: 'warning' },
  { name: 'High Error Rate', metricType: 'app', condition: 'greater_than', threshold: 3, severity: 'warning' },
  { name: 'Connection Count High', metricType: 'network', condition: 'greater_than', threshold: 800, severity: 'info' }
];

async function simulateServers() {
  try {
    console.log('开始模拟10台服务器监控数据...\n');

    // 获取管理员用户
    const adminUser = await User.findOne({
      where: { role: 'admin' }
    });

    if (!adminUser) {
      console.error('未找到管理员用户，请先创建管理员账户');
      return;
    }

    const userId = adminUser.id;
    console.log(`使用用户: ${adminUser.username}\n`);

    // 清除现有测试数据
    console.log('清除现有测试数据...');
    await AlertHistory.destroy({ where: { userId } });
    await Metric.destroy({ where: { userId } });
    await Alert.destroy({ where: { userId } });
    await Target.destroy({ where: { userId } });

    // 创建10台服务器目标
    console.log('\n创建10台监控目标:');
    const targets = [];
    for (const server of SERVERS) {
      const target = await Target.create({
        userId,
        name: server.name,
        type: server.type,
        host: server.host,
        port: randomInt(3000, 9000),
        description: `${server.role.toUpperCase()} server for production`,
        tags: [server.role, 'production'],
        agentId: generateUUID(),
        status: randomInt(0, 10) > 1 ? 'online' : 'offline',
        enabled: true,
        metadata: {
          role: server.role,
          environment: 'production',
          region: 'cn-north-1',
          version: '1.0.' + randomInt(0, 10)
        }
      });
      targets.push(target);
      console.log(`  ✓ ${server.name} (${server.host}) - ${server.role}`);
    }

    // 为每台服务器创建告警规则
    console.log('\n创建告警规则:');
    const alerts = [];
    let alertCount = 0;

    for (const target of targets) {
      // 根据服务器角色选择相关告警
      let relevantAlerts = ALERT_TEMPLATES.filter(a => {
        if (target.metadata.role === 'api' && a.metricType === 'api') return true;
        if (target.metadata.role === 'database' && ['cpu', 'memory', 'disk'].includes(a.metricType)) return true;
        if (target.metadata.role === 'frontend' && ['cpu', 'memory', 'network', 'app'].includes(a.metricType)) return true;
        if (a.metricType === 'cpu' || a.metricType === 'memory') return true;
        return false;
      });

      // 每台服务器3-5个告警
      const numAlerts = randomInt(3, 5);
      for (let i = 0; i < numAlerts && i < relevantAlerts.length; i++) {
        const template = relevantAlerts[i];
        const state = Math.random() > 0.7 ? 'firing' : 'ok';

        const alert = await Alert.create({
          userId,
          name: `${template.name} - ${target.name}`,
          targetId: target.id,
          metricType: template.metricType,
          condition: template.condition,
          threshold: template.threshold,
          duration: randomInt(30, 300),
          severity: template.severity,
          enabled: Math.random() > 0.1,
          cooldown: randomInt(60, 600),
          state,
          triggerCount: state === 'firing' ? randomInt(1, 20) : 0,
          lastTriggered: state === 'firing' ? new Date(Date.now() - randomInt(0, 3600000)) : null,
          lastResolved: state === 'ok' ? new Date(Date.now() - randomInt(0, 86400000)) : null,
          message: `Triggered when ${template.metricType} ${template.condition} ${template.threshold}`,
          notificationChannels: {
            inApp: true,
            email: Math.random() > 0.5,
            webhook: null
          }
        });
        alerts.push(alert);
        alertCount++;
        console.log(`  ✓ ${alert.name} (${state}, ${template.severity})`);
      }
    }

    // 生成历史告警记录
    console.log('\n生成告警历史记录:');
    const historyCount = 60;
    for (let i = 0; i < historyCount; i++) {
      const alert = alerts[randomInt(0, alerts.length - 1)];
      const target = targets.find(t => t.id === alert.targetId) || targets[0];
      const status = Math.random() > 0.3 ? 'resolved' : (Math.random() > 0.5 ? 'triggered' : 'acknowledged');

      await AlertHistory.create({
        userId,
        alertId: alert.id,
        targetId: target.id,
        targetName: target.name,
        alertName: alert.name,
        severity: alert.severity,
        metricType: alert.metricType,
        condition: alert.condition,
        threshold: alert.threshold,
        actualValue: randomFloat(alert.threshold - 20, alert.threshold + 30),
        message: alert.message,
        status,
        createdAt: new Date(Date.now() - randomInt(0, 7 * 24 * 3600000)), // 过去7天
        resolvedAt: status === 'resolved' ? new Date(Date.now() - randomInt(0, 6 * 24 * 3600000)) : null,
        acknowledgedAt: status === 'acknowledged' ? new Date(Date.now() - randomInt(0, 6 * 24 * 3600000)) : null
      });
    }
    console.log(`  ✓ 生成了 ${historyCount} 条告警历史记录`);

    // 为每台服务器生成时间序列监控数据
    console.log('\n生成监控指标数据 (最近1小时, 每5分钟一条):');
    const now = Date.now();
    const interval = 5 * 60 * 1000; // 5分钟
    const pointsPerServer = 12; // 每台服务器12个数据点 (1小时)
    let totalMetrics = 0;

    for (const target of targets) {
      const server = SERVERS.find(s => s.name === target.name) || SERVERS[0];

      for (let i = 0; i < pointsPerServer; i++) {
        const timestamp = new Date(now - (pointsPerServer - i) * interval);
        const metrics = generateServerMetrics(server, timestamp);

        for (const metric of metrics) {
          await Metric.create({
            userId,
            targetId: target.id,
            metricType: metric.metricType,
            data: metric.data,
            timestamp: metric.timestamp
          });
          totalMetrics++;
        }
      }

      // 显示每台服务器的最新数据
      const latestMetrics = generateServerMetrics(server, new Date());
      console.log(`\n  📊 ${target.name}:`);
      for (const metric of latestMetrics) {
        const valueKey = metric.metricType === 'cpu' || metric.metricType === 'memory' || metric.metricType === 'disk'
          ? 'usage' : (metric.metricType === 'network' ? 'connections' : 'responseTime');
        const value = metric.data[valueKey];
        const unit = metric.metricType === 'cpu' || metric.metricType === 'memory' || metric.metricType === 'disk'
          ? '%' : (metric.metricType === 'network' ? ' conns' : 'ms');
        console.log(`     ${metric.metricType.padEnd(10)}: ${value}${unit}`);
      }
    }

    // 统计摘要
    console.log('\n' + '='.repeat(60));
    console.log('📈 数据模拟完成！');
    console.log('='.repeat(60));
    console.log(`🖥️  监控服务器数量: ${targets.length} 台`);
    console.log(`⚠️  告警规则数量: ${alertCount} 条`);
    console.log(`📋 告警历史记录: ${historyCount} 条`);
    console.log(`📊 监控指标数据: ${totalMetrics} 条`);
    console.log(`📁 总计数据量: ${targets.length + alertCount + historyCount + totalMetrics} 条`);
    console.log('='.repeat(60));
    console.log('\n💡 访问 Dashboard 查看数据:');
    console.log('   http://localhost:5173');
    console.log('   http://localhost:5174');
    console.log('\n🔑 登录凭据:');
    console.log('   管理员: admin / admin123');
    console.log('   普通用户: testuser / password123\n');

    process.exit(0);
  } catch (error) {
    console.error('数据模拟失败:', error);
    process.exit(1);
  }
}

// 运行模拟
simulateServers();
