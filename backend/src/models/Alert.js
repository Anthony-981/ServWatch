import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Alert = sequelize.define('Alert', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Owner of this alert'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  targetId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  metricType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  condition: {
    type: DataTypes.ENUM('greater_than', 'less_than', 'equals', 'not_equals'),
    allowNull: false
  },
  threshold: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Duration in seconds threshold must be exceeded'
  },
  severity: {
    type: DataTypes.ENUM('info', 'warning', 'critical'),
    defaultValue: 'warning'
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notificationChannels: {
    type: DataTypes.JSONB,
    defaultValue: {
      inApp: true,
      email: false,
      webhook: null
    }
  },
  cooldown: {
    type: DataTypes.INTEGER,
    defaultValue: 300,
    comment: 'Minimum seconds between alerts'
  },
  state: {
    type: DataTypes.ENUM('ok', 'firing', 'resolved'),
    defaultValue: 'ok'
  },
  lastTriggered: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastResolved: {
    type: DataTypes.DATE,
    allowNull: true
  },
  triggerCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'alerts',
  timestamps: true,
  indexes: [
    { fields: ['targetId'] },
    { fields: ['enabled'] },
    { fields: ['state'] },
    { fields: ['severity'] },
    { fields: ['userId'] },
    { fields: ['userId', 'enabled'] },
    { fields: ['userId', 'state'] }
  ]
});

export default Alert;
