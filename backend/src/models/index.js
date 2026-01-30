import sequelize from '../config/database.js';
import User from './User.js';
import Target from './Target.js';
import Metric from './Metric.js';
import Alert from './Alert.js';
import AlertHistory from './AlertHistory.js';
import { createMetricsHypertable } from './Metric.js';

// Define associations
Target.hasMany(Metric, {
  foreignKey: 'targetId',
  as: 'metrics'
});

Metric.belongsTo(Target, {
  foreignKey: 'targetId',
  as: 'target'
});

Target.hasMany(Alert, {
  foreignKey: 'targetId',
  as: 'alerts'
});

Alert.belongsTo(Target, {
  foreignKey: 'targetId',
  as: 'target'
});

Alert.hasMany(AlertHistory, {
  foreignKey: 'alertId',
  as: 'history'
});

AlertHistory.belongsTo(Alert, {
  foreignKey: 'alertId',
  as: 'alert'
});

// User associations - User owns Targets, Alerts, AlertHistory, and Metrics
User.hasMany(Target, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
  as: 'targets'
});

Target.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(Alert, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
  as: 'alerts'
});

Alert.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(AlertHistory, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
  as: 'alertHistories'
});

AlertHistory.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(Metric, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
  as: 'metrics'
});

Metric.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Initialize database
export async function initializeDatabase() {
  try {
    // Sync all models without alter - safer approach
    // Only create missing tables/columns, don't modify existing ones
    await sequelize.sync();
    console.log('Database models synced.');

    // Create TimescaleDB hypertable
    await createMetricsHypertable();

    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
}

export {
  sequelize,
  User,
  Target,
  Metric,
  Alert,
  AlertHistory
};
