import { io } from 'socket.io-client';

/**
 * Alert Service
 * Evaluates metrics against alert rules and triggers notifications
 */
export class AlertService {
  constructor(models, wsServer) {
    this.Alert = models.Alert;
    this.AlertHistory = models.AlertHistory;
    this.wsServer = wsServer;

    this.breachedTimestamps = new Map();
    this.lastAlertTimes = new Map();
    this.evaluationTimer = null;
  }

  /**
   * Start alert evaluation
   */
  start(intervalMs = 5000) {
    if (this.evaluationTimer) return;

    this.evaluationTimer = setInterval(async () => {
      await this.evaluateAllRules();
    }, intervalMs);

    console.log('Alert service started');
  }

  /**
   * Stop alert evaluation
   */
  stop() {
    if (this.evaluationTimer) {
      clearInterval(this.evaluationTimer);
      this.evaluationTimer = null;
    }
  }

  /**
   * Evaluate all enabled alert rules
   */
  async evaluateAllRules() {
    try {
      const alerts = await this.Alert.findAll({
        where: { enabled: true }
      });

      for (const alert of alerts) {
        await this.evaluateAlert(alert);
      }
    } catch (error) {
      console.error('Error evaluating alerts:', error);
    }
  }

  /**
   * Evaluate a single alert rule
   */
  async evaluateAlert(alert) {
    // This would integrate with metrics service to get current values
    // For now, it's a placeholder for the evaluation logic
  }

  /**
   * Check if threshold is breached
   */
  checkThreshold(actualValue, condition, threshold) {
    switch (condition) {
      case 'greater_than':
        return actualValue > threshold;
      case 'less_than':
        return actualValue < threshold;
      case 'equals':
        return actualValue === threshold;
      case 'not_equals':
        return actualValue !== threshold;
      default:
        return false;
    }
  }

  /**
   * Trigger an alert
   */
  async triggerAlert(alert, actualValue) {
    const now = Date.now();
    const lastAlertTime = this.lastAlertTimes.get(alert.id);

    // Check cooldown
    if (lastAlertTime && (now - lastAlertTime) < alert.cooldown * 1000) {
      return; // Still in cooldown
    }

    // Update alert state
    await alert.update({
      state: 'firing',
      lastTriggered: new Date(),
      triggerCount: alert.triggerCount + 1
    });

    // Create alert history record
    await this.AlertHistory.create({
      alertId: alert.id,
      targetId: alert.targetId,
      targetName: `Target ${alert.targetId}`,
      alertName: alert.name,
      severity: alert.severity,
      metricType: alert.metricType,
      condition: alert.condition,
      threshold: alert.threshold,
      actualValue: actualValue,
      message: alert.message || `${alert.metricType} ${alert.condition} ${alert.threshold}`,
      status: 'triggered'
    });

    // Send notifications
    await this.sendNotifications(alert, actualValue);

    // Update last alert time
    this.lastAlertTimes.set(alert.id, now);

    console.log(`Alert triggered: ${alert.name} (value: ${actualValue})`);
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alert) {
    await alert.update({
      state: 'ok',
      lastResolved: new Date()
    });

    this.breachedTimestamps.delete(alert.id);

    console.log(`Alert resolved: ${alert.name}`);
  }

  /**
   * Send notifications for an alert
   */
  async sendNotifications(alert, actualValue) {
    const notification = {
      alertId: alert.id,
      name: alert.name,
      severity: alert.severity,
      metricType: alert.metricType,
      threshold: alert.threshold,
      actualValue: actualValue,
      message: alert.message,
      timestamp: new Date().toISOString()
    };

    // In-app notification (via WebSocket)
    if (alert.notificationChannels?.inApp) {
      this.wsServer?.emit('alert:triggered', notification);
    }

    // Email notification (placeholder)
    if (alert.notificationChannels?.email) {
      // TODO: Implement email sending
      console.log('Email notification would be sent here');
    }

    // Webhook notification (placeholder)
    if (alert.notificationChannels?.webhook) {
      // TODO: Implement webhook call
      console.log('Webhook notification would be sent to:', alert.notificationChannels.webhook);
    }
  }

  /**
   * Create a new alert rule
   */
  async createAlert(data) {
    return await this.Alert.create(data);
  }

  /**
   * Update an alert rule
   */
  async updateAlert(id, data) {
    const alert = await this.Alert.findByPk(id);
    if (!alert) throw new Error('Alert not found');
    return await alert.update(data);
  }

  /**
   * Delete an alert rule
   */
  async deleteAlert(id) {
    const alert = await this.Alert.findByPk(id);
    if (!alert) throw new Error('Alert not found');
    await alert.destroy();
  }

  /**
   * Get alert history
   */
  async getAlertHistory(options = {}) {
    const { limit = 100, offset = 0, severity, targetId } = options;

    const where = {};
    if (severity) where.severity = severity;
    if (targetId) where.targetId = targetId;

    return await this.AlertHistory.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
  }
}

export default AlertService;
