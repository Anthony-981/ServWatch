import express from 'express';
const router = express.Router();
import { Alert, AlertHistory } from '../models/index.js';
import sequelize from 'sequelize';
import { requireOwnership, addUserFilter, validateTargetOwnership, ensureUniqueAlertName } from '../middleware/ownership.js';

// Apply user filter to all routes
router.use(addUserFilter);

// Get alert statistics (must come before /:id route)
router.get('/stats', async (req, res) => {
  try {
    const total = await Alert.count({ where: req.userFilter });
    const enabled = await Alert.count({ where: { ...req.userFilter, enabled: true } });
    const firing = await Alert.count({ where: { ...req.userFilter, state: 'firing' } });

    // Get severity counts
    const severityCounts = await Alert.findAll({
      where: req.userFilter,
      attributes: [
        'severity',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['severity'],
      raw: true
    });

    const recentHistory = await AlertHistory.findAll({
      where: req.userFilter,
      limit: 10,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        total,
        enabled,
        firing,
        severityCounts: severityCounts.map(s => ({
          severity: s.severity,
          count: parseInt(s.count)
        })),
        recentTriggers: recentHistory.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get alert history (must come before /:id route)
router.get('/history/list', async (req, res) => {
  try {
    const { limit = 100, severity, targetId } = req.query;

    const where = { ...req.userFilter };
    if (severity) where.severity = severity;
    if (targetId) where.targetId = targetId;

    const history = await AlertHistory.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({ success: true, data: history.rows, total: history.count });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all alert rules (filtered by user)
router.get('/', async (req, res) => {
  try {
    const alerts = await Alert.findAll({
      where: req.userFilter,
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single alert rule (with ownership check)
router.get('/:id', requireOwnership(Alert), async (req, res) => {
  try {
    res.json({ success: true, data: req.resource });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new alert rule (with user ownership and target validation)
router.post('/', ensureUniqueAlertName, validateTargetOwnership, async (req, res) => {
  try {
    const {
      name,
      targetId,
      metricType,
      condition,
      threshold,
      duration = 0,
      severity = 'warning',
      cooldown = 300,
      notificationChannels = { inApp: true, email: false },
      message
    } = req.body;

    if (!name || !metricType || !condition || threshold === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, metricType, condition, threshold'
      });
    }

    const alert = await Alert.create({
      name,
      targetId,
      metricType,
      condition,
      threshold,
      duration,
      severity,
      cooldown,
      notificationChannels,
      message,
      state: 'ok',
      enabled: true,
      triggerCount: 0,
      userId: req.user.id  // Set ownership to current user
    });

    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update alert rule (with ownership check)
router.put('/:id', requireOwnership(Alert), validateTargetOwnership, async (req, res) => {
  try {
    const {
      name,
      targetId,
      metricType,
      condition,
      threshold,
      duration,
      severity,
      cooldown,
      notificationChannels,
      message,
      enabled
    } = req.body;

    await req.resource.update({
      ...(name !== undefined && { name }),
      ...(targetId !== undefined && { targetId }),
      ...(metricType !== undefined && { metricType }),
      ...(condition !== undefined && { condition }),
      ...(threshold !== undefined && { threshold }),
      ...(duration !== undefined && { duration }),
      ...(severity !== undefined && { severity }),
      ...(cooldown !== undefined && { cooldown }),
      ...(notificationChannels !== undefined && { notificationChannels }),
      ...(message !== undefined && { message }),
      ...(enabled !== undefined && { enabled })
    });

    res.json({ success: true, data: req.resource });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete alert rule (with ownership check)
router.delete('/:id', requireOwnership(Alert), async (req, res) => {
  try {
    await req.resource.destroy();
    res.json({ success: true, message: 'Alert deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Toggle alert enabled state (with ownership check)
router.patch('/:id/toggle', requireOwnership(Alert), async (req, res) => {
  try {
    await req.resource.update({ enabled: !req.resource.enabled });
    res.json({ success: true, data: req.resource });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
