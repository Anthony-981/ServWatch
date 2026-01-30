import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import { Metric, Target, AlertHistory } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * GET /api/metrics/history
 * Get historical metrics data for charts
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const { targetId, metricType, hours = 24, limit = 100 } = req.query;
    const userId = req.user.id;

    // Build where clause
    const where = { userId };
    if (targetId) where.targetId = targetId;
    if (metricType) where.metricType = metricType;

    // Calculate time range
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const metrics = await Metric.findAll({
      where: {
        ...where,
        timestamp: { [Op.gte]: startTime }
      },
      attributes: ['id', 'targetId', 'metricType', 'data', 'timestamp'],
      order: [['timestamp', 'ASC']],
      limit: parseInt(limit)
    });

    // Get targets for reference
    const targets = await Target.findAll({
      where: { userId },
      attributes: ['id', 'name', 'type', 'host']
    });

    // Group metrics by target and type
    const grouped = {};
    metrics.forEach(m => {
      const key = `${m.targetId}-${m.metricType}`;
      if (!grouped[key]) {
        const target = targets.find(t => t.id === m.targetId);
        grouped[key] = {
          targetId: m.targetId,
          targetName: target?.name || 'Unknown',
          metricType: m.metricType,
          dataPoints: []
        };
      }
      grouped[key].dataPoints.push({
        timestamp: m.timestamp,
        value: extractValue(m.data, m.metricType)
      });
    });

    res.json({
      success: true,
      data: Object.values(grouped)
    });
  } catch (error) {
    console.error('Error fetching metrics history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/metrics/summary
 * Get latest metrics summary for all targets
 */
router.get('/summary', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all targets
    const targets = await Target.findAll({
      where: { userId },
      attributes: ['id', 'name', 'type', 'host', 'status', 'enabled']
    });

    // Get latest metrics for each target
    const summary = await Promise.all(
      targets.map(async (target) => {
        const latestMetrics = await Metric.findAll({
          where: {
            userId,
            targetId: target.id
          },
          attributes: ['metricType', 'data', 'timestamp'],
          order: [['timestamp', 'DESC']],
          limit: 50
        });

        // Group by metric type
        const metricsByType = {};
        latestMetrics.forEach(m => {
          if (!metricsByType[m.metricType]) {
            metricsByType[m.metricType] = [];
          }
          metricsByType[m.metricType].push({
            timestamp: m.timestamp,
            value: extractValue(m.data, m.metricType),
            fullData: m.data
          });
        });

        return {
          id: target.id,
          name: target.name,
          type: target.type,
          host: target.host,
          status: target.status,
          enabled: target.enabled,
          metrics: metricsByType
        };
      })
    );

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching metrics summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/metrics/alert-history
 * Get alert history with filtering
 */
router.get('/alert-history', authenticate, async (req, res) => {
  try {
    const { limit = 50, offset = 0, severity, status } = req.query;
    const userId = req.user.id;

    const where = { userId };
    if (severity) where.severity = severity;
    if (status) where.status = status;

    const { count, rows } = await AlertHistory.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        total: count,
        items: rows
      }
    });
  } catch (error) {
    console.error('Error fetching alert history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Helper function to extract value from metric data
 */
function extractValue(data, metricType) {
  switch (metricType) {
    case 'cpu':
      return data?.usage ?? data?.cpu ?? 0;
    case 'memory':
      return data?.usage ?? data?.percentage ?? 0;
    case 'disk':
      return data?.usage ?? data?.percentage ?? 0;
    case 'network':
      return (data?.rx ?? 0) + (data?.tx ?? 0);
    case 'api':
      return data?.latency ?? 0;
    case 'app':
      return data?.responseTime ?? data?.eventLoopDelay ?? 0;
    default:
      return 0;
  }
}

export default router;
