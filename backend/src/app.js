import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import config from './config/index.js';
import { createDatabaseIfNotExists, testConnection, initializeTimescaleDB } from './config/database.js';
import { initializeDatabase, Alert, AlertHistory } from './models/index.js';
import targetsRouter from './routes/targets.js';
import alertsRouter from './routes/alerts.js';
import authRouter from './routes/auth.js';
import metricsRouter from './routes/metrics.js';
import { authenticate } from './middleware/auth.js';
import { verifyAccessToken } from './services/authService.js';
import { Target } from './models/index.js';

const app = express();
const httpServer = createServer(app);

// In-memory metrics storage for alert evaluation (will be replaced with Redis in production)
const latestMetrics = new Map();
const alertStates = new Map(); // Track alert breach timestamps

// Store authenticated socket user data
const socketUsers = new Map();

// Socket.IO setup
const io = new Server(httpServer, {
  cors: config.websocket.cors
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
// Public auth routes
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/targets', authenticate, targetsRouter);
app.use('/api/alerts', authenticate, alertsRouter);
app.use('/api/metrics', authenticate, metricsRouter);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Socket authentication - client sends token after connection
  socket.on('authenticate', async (data) => {
    try {
      const { token } = data;
      if (!token) {
        socket.emit('auth:error', { success: false, error: 'No token provided' });
        return;
      }

      // Verify JWT token
      const payload = verifyAccessToken(token);
      if (!payload) {
        socket.emit('auth:error', { success: false, error: 'Invalid token' });
        return;
      }

      // Store user data on socket
      socket.data.userId = payload.id;
      socket.data.userRole = payload.role;
      socket.data.username = payload.username;

      // Add socket to user-specific room
      socket.join(`user:${payload.id}`);

      // Add admins to admin room
      if (payload.role === 'admin') {
        socket.join('admin');
      }

      // Store mapping
      socketUsers.set(socket.id, {
        userId: payload.id,
        role: payload.role,
        username: payload.username
      });

      console.log(`Socket authenticated: ${socket.id} -> user:${payload.id} (${payload.role})`);
      socket.emit('auth:success', {
        success: true,
        userId: payload.id,
        role: payload.role,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('auth:error', { success: false, error: 'Authentication failed' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    socketUsers.delete(socket.id);
  });

  // Agent registration
  socket.on('agent:register', (data) => {
    console.log('Agent registration:', data);
    socket.join(`agent:${data.agentId}`);
    socket.emit('agent:registered', {
      success: true,
      agentId: data.agentId,
      timestamp: new Date().toISOString()
    });
  });

  // Metrics received from agent
  socket.on('metrics:data', async (data) => {
    try {
      // Store latest metrics for alert evaluation
      if (data.agentId) {
        latestMetrics.set(data.agentId, data);
      }

      // Evaluate alerts against new metrics
      await evaluateAlerts(data);

      // Find the target associated with this agent
      const target = await Target.findOne({
        where: { agentId: data.agentId }
      });

      if (target) {
        // Send metrics only to the target owner
        io.to(`user:${target.userId}`).emit('metrics:update', data);

        // Also send to admins
        io.to('admin').emit('metrics:update', data);
      } else {
        // If no target found, broadcast to all authenticated users
        // (for system-level metrics or testing)
        io.emit('metrics:update', data);
      }
    } catch (error) {
      console.error('Error processing metrics:', error);
    }
  });

  // Dashboard connection (deprecated, use authenticate instead)
  socket.on('dashboard:connect', () => {
    socket.join('dashboard');
    console.log('Dashboard client connected (legacy)');
    socket.emit('dashboard:connected', {
      success: true,
      timestamp: new Date().toISOString()
    });
  });
});

// Broadcast metrics to specific user's room
export function broadcastMetrics(metrics, userId) {
  io.to(`user:${userId}`).emit('metrics:update', metrics);
  io.to('admin').emit('metrics:update', metrics);
}

// Broadcast alert to specific user's room
export function broadcastAlert(alert, userId) {
  io.to(`user:${userId}`).emit('alert:triggered', alert);
  io.to('admin').emit('alert:triggered', alert);
}

/**
 * Evaluate alert rules against metrics
 */
async function evaluateAlerts(metrics) {
  try {
    // Find the target associated with this agent
    const target = await Target.findOne({
      where: { agentId: metrics.agentId }
    });

    if (!target) {
      // No target found, skip alert evaluation
      return;
    }

    // Only evaluate alerts belonging to this target's owner
    const alerts = await Alert.findAll({
      where: {
        enabled: true,
        userId: target.userId
      }
    });

    for (const alert of alerts) {
      // Skip if target doesn't match
      if (alert.targetId && alert.targetId !== metrics.agentId) {
        continue;
      }

      // Extract metric value
      const metricValue = extractMetricValue(metrics, alert.metricType);
      if (metricValue === null || metricValue === undefined) continue;

      // Check if threshold is breached
      const isBreached = checkThreshold(metricValue, alert.condition, alert.threshold);

      const now = Date.now();
      const breachStartTime = alertStates.get(alert.id);

      if (isBreached) {
        if (!breachStartTime) {
          // First time breached, record timestamp
          alertStates.set(alert.id, now);
        } else if (now - breachStartTime >= alert.duration * 1000) {
          // Duration threshold exceeded, trigger alert
          await triggerAlert(alert, metricValue);
          alertStates.set(alert.id, now); // Reset for cooldown
        }
      } else {
        // Threshold not breached, clear state
        if (breachStartTime) {
          await resolveAlert(alert);
          alertStates.delete(alert.id);
        }
      }
    }
  } catch (error) {
    console.error('Error evaluating alerts:', error);
  }
}

/**
 * Extract metric value from metrics object
 */
function extractMetricValue(metrics, metricType) {
  const parts = metricType.split('.');
  let value = metrics;

  for (const part of parts) {
    if (value && typeof value === 'object') {
      value = value[part];
    } else {
      return null;
    }
  }

  return typeof value === 'number' ? value : null;
}

/**
 * Check if value meets condition threshold
 */
function checkThreshold(value, condition, threshold) {
  switch (condition) {
    case 'greater_than': return value > threshold;
    case 'less_than': return value < threshold;
    case 'equals': return value === threshold;
    case 'not_equals': return value !== threshold;
    default: return false;
  }
}

/**
 * Trigger an alert
 */
async function triggerAlert(alert, actualValue) {
  try {
    // Update alert state
    await alert.update({
      state: 'firing',
      lastTriggered: new Date(),
      triggerCount: alert.triggerCount + 1
    });

    // Create alert history record with userId
    await AlertHistory.create({
      alertId: alert.id,
      userId: alert.userId,  // Add userId for multi-tenant support
      targetId: alert.targetId || 'system',
      targetName: alert.targetId || 'System',
      alertName: alert.name,
      severity: alert.severity,
      metricType: alert.metricType,
      condition: alert.condition,
      threshold: alert.threshold,
      actualValue: actualValue,
      message: alert.message || `${alert.metricType} ${alert.condition} ${alert.threshold}`,
      status: 'triggered'
    });

    // Broadcast alert notification to the alert owner and admins
    broadcastAlert({
      alertId: alert.id,
      name: alert.name,
      severity: alert.severity,
      metricType: alert.metricType,
      threshold: alert.threshold,
      actualValue: actualValue,
      message: alert.message,
      timestamp: new Date().toISOString()
    }, alert.userId);

    console.log(`Alert triggered: ${alert.name} (${alert.metricType} = ${actualValue})`);
  } catch (error) {
    console.error('Error triggering alert:', error);
  }
}

/**
 * Resolve an alert
 */
async function resolveAlert(alert) {
  try {
    await alert.update({
      state: 'ok',
      lastResolved: new Date()
    });

    // Update alert history
    const latestHistory = await AlertHistory.findOne({
      where: { alertId: alert.id, status: 'triggered' },
      order: [['createdAt', 'DESC']]
    });

    if (latestHistory) {
      await latestHistory.update({
        status: 'resolved',
        resolvedAt: new Date()
      });
    }

    console.log(`Alert resolved: ${alert.name}`);
  } catch (error) {
    console.error('Error resolving alert:', error);
  }
}

// Start server
async function startServer() {
  try {
    // Create database if it doesn't exist
    console.log('Checking database...');
    await createDatabaseIfNotExists();

    // Test database connection
    const connected = await testConnection();
    if (connected) {
      await initializeTimescaleDB();
      await initializeDatabase();
    } else {
      console.warn('Starting without database connection. Some features may not work.');
    }

    httpServer.listen(config.server.port, () => {
      console.log(`ServWatch Backend Server running on port ${config.server.port}`);
      console.log(`Environment: ${config.server.env}`);
      console.log(`WebSocket CORS origin: ${config.server.corsOrigin}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app, io };
