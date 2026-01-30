import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AlertHistory = sequelize.define('AlertHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Owner of this alert history record'
  },
  alertId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  targetId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  targetName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  alertName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  severity: {
    type: DataTypes.ENUM('info', 'warning', 'critical'),
    allowNull: false
  },
  metricType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  condition: {
    type: DataTypes.STRING,
    allowNull: false
  },
  threshold: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  actualValue: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('triggered', 'resolved', 'acknowledged'),
    defaultValue: 'triggered'
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  acknowledgedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'alert_history',
  timestamps: true,
  indexes: [
    { fields: ['alertId'] },
    { fields: ['targetId'] },
    { fields: ['severity'] },
    { fields: ['status'] },
    { fields: ['createdAt'] },
    { fields: ['userId'] },
    { fields: ['userId', 'createdAt'] }
  ]
});

export default AlertHistory;
