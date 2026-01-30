import express from 'express';
const router = express.Router();
import { Target } from '../models/index.js';
import { requireOwnership, addUserFilter, ensureUniqueTargetName } from '../middleware/ownership.js';

// Apply user filter to all routes
router.use(addUserFilter);

// Get all targets (filtered by user)
router.get('/', async (req, res) => {
  try {
    const targets = await Target.findAll({
      where: req.userFilter,
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: targets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single target (with ownership check)
router.get('/:id', requireOwnership(Target), async (req, res) => {
  try {
    res.json({ success: true, data: req.resource });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new target (with user ownership)
router.post('/', ensureUniqueTargetName, async (req, res) => {
  try {
    const { name, type, host, port, description, tags } = req.body;

    if (!name || !type || !host) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, type, host'
      });
    }

    const target = await Target.create({
      name,
      type,
      host,
      port,
      description,
      tags: tags || [],
      status: 'unknown',
      userId: req.user.id  // Set ownership to current user
    });

    res.status(201).json({ success: true, data: target });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update target (with ownership check)
router.put('/:id', requireOwnership(Target), ensureUniqueTargetName, async (req, res) => {
  try {
    const { name, type, host, port, description, tags, enabled } = req.body;

    await req.resource.update({
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(host !== undefined && { host }),
      ...(port !== undefined && { port }),
      ...(description !== undefined && { description }),
      ...(tags !== undefined && { tags }),
      ...(enabled !== undefined && { enabled })
    });

    res.json({ success: true, data: req.resource });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete target (with ownership check)
router.delete('/:id', requireOwnership(Target), async (req, res) => {
  try {
    await req.resource.destroy();
    res.json({ success: true, message: 'Target deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update target status (called by agent heartbeat)
// This endpoint allows authenticated agents to update their target's status
// It checks ownership through the agentId in the request body
router.post('/:id/status', async (req, res) => {
  try {
    const { status, agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({ success: false, error: 'agentId is required' });
    }

    // Find target by id and agentId (for security)
    const target = await Target.findOne({
      where: {
        id: req.params.id,
        agentId
      }
    });

    if (!target) {
      return res.status(404).json({ success: false, error: 'Target not found or agentId mismatch' });
    }

    await target.update({
      status,
      lastSeen: new Date()
    });

    res.json({ success: true, data: target });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
