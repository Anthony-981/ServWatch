import { Target, Metric, Alert, AlertHistory, User } from '../models/index.js';

async function checkData() {
  try {
    console.log('=== 检查数据库中的模拟数据 ===\n');

    // 获取管理员用户
    const adminUser = await User.findOne({
      where: { role: 'admin' }
    });

    if (!adminUser) {
      console.log('❌ 未找到管理员用户');
      return;
    }
    console.log(`✅ 用户: ${adminUser.username} (${adminUser.id})\n`);

    const userId = adminUser.id;

    // 检查 Targets
    const targets = await Target.findAll({
      where: { userId },
      attributes: ['id', 'name', 'host', 'type', 'status', 'enabled']
    });

    console.log(`📡 监控目标 (${targets.length} 个):`);
    targets.forEach(t => {
      console.log(`  - ${t.name} (${t.host}) [${t.status}]`);
    });
    console.log('');

    // 检查 Alerts
    const alerts = await Alert.findAll({
      where: { userId },
      attributes: ['id', 'name', 'metricType', 'condition', 'threshold', 'severity', 'state', 'enabled']
    });

    console.log(`⚠️  告警规则 (${alerts.length} 条):`);
    alerts.forEach(a => {
      console.log(`  - ${a.name}: ${a.metricType} ${a.condition} ${a.threshold} [${a.state}]`);
    });
    console.log('');

    // 检查 Metrics (最新10条)
    const metrics = await Metric.findAll({
      where: { userId },
      attributes: ['id', 'metricType', 'timestamp'],
      order: [['timestamp', 'DESC']],
      limit: 10
    });

    console.log(`📊 监控指标 (最新 ${metrics.length} 条):`);
    metrics.forEach(m => {
      const dataPreview = JSON.stringify(m.data).substring(0, 50);
      console.log(`  - [${m.metricType}] ${m.timestamp} - ${dataPreview}...`);
    });
    console.log('');

    // 检查 Alert History (最新10条)
    const history = await AlertHistory.findAll({
      where: { userId },
      attributes: ['id', 'alertName', 'severity', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    console.log(`📋 告警历史 (最新 ${history.length} 条):`);
    history.forEach(h => {
      console.log(`  - ${h.alertName} [${h.severity}] - ${h.status} - ${h.createdAt}`);
    });
    console.log('');

    console.log('=== 数据检查完成 ===');
    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  }
}

checkData();
