import { Target, Alert, Metric, AlertHistory, User } from '../models/index.js';

// Mock data generators
// Generate proper UUIDs for agents
function generateAgentUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const AGENT_IDS = [
  generateAgentUUID(),
  generateAgentUUID(),
  generateAgentUUID(),
  generateAgentUUID()
];

const HOST_NAMES = [
  'web-server-01',
  'web-server-02',
  'db-server-primary',
  'db-server-replica',
  'cache-server-01',
  'api-gateway-01',
  'worker-node-01',
  'worker-node-02'
];

const TARGET_NAMES = [
  'Production Web Server',
  'Database Primary',
  'Redis Cache',
  'API Gateway',
  'Background Worker',
  'Load Balancer',
  'File Storage',
  'Monitoring Service'
];

const ALERT_NAMES = [
  'High CPU Usage',
  'High Memory Usage',
  'Disk Space Low',
  'API Response Time',
  'Connection Pool Exhausted',
  'Queue Backlog',
  'Error Rate High',
  'Network Latency'
];

const METRIC_TYPES = ['cpu', 'memory', 'disk', 'network', 'app', 'api'];

const CONDITIONS = ['greater_than', 'less_than', 'equals', 'not_equals'];
const SEVERITIES = ['info', 'warning', 'critical'];
const STATES = ['ok', 'firing', 'resolved'];
const ALERT_STATUSES = ['triggered', 'resolved', 'acknowledged'];

// Utility functions
function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate realistic metric values
function generateMetricData(metricType) {
  const baseCpu = randomInt(5, 95);
  const baseMemory = randomInt(40, 98);
  const baseDisk = randomInt(20, 95);

  switch (metricType) {
    case 'cpu':
      return {
        usage: baseCpu,
        cores: randomInt(2, 16),
        load1min: (baseCpu / 20).toFixed(2),
        load5min: (baseCpu / 25).toFixed(2),
        load15min: (baseCpu / 30).toFixed(2)
      };
    case 'memory':
      return {
        usage: baseMemory,
        total: 16384,
        used: Math.floor(16384 * baseMemory / 100),
        free: Math.floor(16384 * (100 - baseMemory) / 100),
        cached: randomInt(500, 2000)
      };
    case 'disk':
      return {
        usage: baseDisk,
        total: 500000000000,
        used: Math.floor(500000000000 * baseDisk / 100),
        free: Math.floor(500000000000 * (100 - baseDisk) / 100),
        iops: randomInt(50, 500)
      };
    case 'network':
      return {
        rx: randomInt(1000000, 1000000000),
        tx: randomInt(1000000, 1000000000),
        rxBps: randomInt(100000, 10000000),
        txBps: randomInt(100000, 10000000),
        connections: randomInt(50, 500)
      };
    case 'app':
      return {
        responseTime: randomInt(10, 5000),
        throughput: randomInt(100, 10000),
        errorRate: (Math.random() * 5).toFixed(2),
        activeConnections: randomInt(10, 1000)
      };
    case 'api':
      return {
        latency: randomInt(5, 1000),
        requestCount: randomInt(100, 5000),
        successRate: (95 + Math.random() * 5).toFixed(2),
        p95: randomInt(50, 2000),
        p99: randomInt(100, 5000)
      };
    default:
      return { value: randomInt(0, 100) };
  }
}

// Generate timestamp within last 24 hours
function generateTimestamp(offsetMinutes = 0) {
  const now = new Date();
  now.setMinutes(now.getMinutes() - offsetMinutes);
  return now;
}

async function simulateData() {
  try {
    console.log('Starting data simulation...');

    // Get first admin user
    const adminUser = await User.findOne({
      where: { role: 'admin' }
    });

    if (!adminUser) {
      console.error('No admin user found. Please create an admin user first.');
      return;
    }

    const userId = adminUser.id;
    console.log(`Using user: ${adminUser.username} (${userId})`);

    // Clear existing test data for this user
    console.log('Clearing existing test data...');
    await AlertHistory.destroy({ where: { userId } });
    await Metric.destroy({ where: { userId } });
    await Alert.destroy({ where: { userId } });
    await Target.destroy({ where: { userId } });

    console.log('Generating Targets (8 records)...');
    const targets = [];
    for (let i = 0; i < 8; i++) {
      const target = await Target.create({
        userId,
        name: TARGET_NAMES[i] || `Target ${i + 1}`,
        type: random(['host', 'application', 'api']),
        host: HOST_NAMES[i] || `host-${i + 1}`,
        port: randomInt(3000, 9000),
        description: `Simulated target for testing monitoring system`,
        tags: ['production', 'simulated'],
        agentId: random(AGENT_IDS),
        status: random(['online', 'offline', 'unknown']),
        enabled: Math.random() > 0.1,
        metadata: {
          version: '1.0.' + randomInt(0, 10),
          region: random(['us-east', 'us-west', 'eu-west', 'ap-south']),
          environment: 'production'
        }
      });
      targets.push(target);
      console.log(`  Created target: ${target.name}`);
    }

    console.log('Generating Alerts (20 records)...');
    const alerts = [];
    for (let i = 0; i < 20; i++) {
      const target = random(targets);
      const metricType = random(METRIC_TYPES);
      const condition = random(CONDITIONS);
      const threshold = randomInt(50, 95);
      const severity = random(SEVERITIES);
      const state = random(STATES);

      const alert = await Alert.create({
        userId,
        name: `${ALERT_NAMES[i % ALERT_NAMES.length]} - ${target.name}`,
        targetId: target.id,
        metricType,
        condition,
        threshold,
        duration: randomInt(0, 300),
        severity,
        enabled: Math.random() > 0.2,
        cooldown: randomInt(60, 600),
        state,
        triggerCount: state === 'firing' ? randomInt(1, 50) : 0,
        lastTriggered: state === 'firing' ? generateTimestamp(randomInt(0, 60)) : null,
        lastResolved: state === 'ok' ? generateTimestamp(randomInt(0, 1440)) : null,
        message: `Alert when ${metricType} ${condition} ${threshold}`,
        notificationChannels: {
          inApp: true,
          email: Math.random() > 0.5,
          webhook: null
        }
      });
      alerts.push(alert);
      console.log(`  Created alert: ${alert.name} (${state}, ${severity})`);
    }

    console.log('Generating Alert History (40 records)...');
    for (let i = 0; i < 40; i++) {
      const alert = random(alerts);
      const target = targets.find(t => t.id === alert.targetId) || random(targets);
      const status = random(ALERT_STATUSES);

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
        actualValue: parseFloat((Math.random() * 100).toFixed(2)),
        message: alert.message,
        status,
        createdAt: generateTimestamp(randomInt(0, 10080)), // Last 7 days
        resolvedAt: status === 'resolved' ? generateTimestamp(randomInt(0, 1440)) : null,
        acknowledgedAt: status === 'acknowledged' ? generateTimestamp(randomInt(0, 1440)) : null
      });
    }
    console.log(`  Created 40 alert history records`);

    console.log('Generating Metrics (132 records - distributed across types)...');
    const metricsPerType = Math.floor(132 / METRIC_TYPES.length);
    let metricCount = 0;

    for (const metricType of METRIC_TYPES) {
      for (let i = 0; i < metricsPerType; i++) {
        const target = random(targets);
        const minutesOffset = randomInt(0, 1440); // Last 24 hours

        const metric = await Metric.create({
          userId,
          targetId: target.id,
          metricType,
          data: generateMetricData(metricType),
          timestamp: generateTimestamp(minutesOffset)
        });
        metricCount++;

        if (metricCount % 20 === 0) {
          console.log(`  Generated ${metricCount} metrics...`);
        }
      }
    }
    console.log(`  Total metrics created: ${metricCount}`);

    console.log('\n=== Data Simulation Summary ===');
    console.log(`Targets: ${targets.length}`);
    console.log(`Alerts: ${alerts.length}`);
    console.log(`Alert History: 40`);
    console.log(`Metrics: ${metricCount}`);
    console.log(`Total Records: ${targets.length + alerts.length + 40 + metricCount}`);
    console.log('\nData simulation completed successfully!');
    console.log('\nYou can now view the data in the dashboard at:');
    console.log('  http://localhost:5173 or http://localhost:5174');

    process.exit(0);
  } catch (error) {
    console.error('Error simulating data:', error);
    process.exit(1);
  }
}

// Run simulation
simulateData();
