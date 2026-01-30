import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Target = sequelize.define('Target', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Owner of this target'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
    // Note: unique constraint removed to allow same name for different users
  },
  type: {
    type: DataTypes.ENUM('host', 'application', 'api'),
    allowNull: false,
    defaultValue: 'host'
  },
  host: {
    type: DataTypes.STRING,
    allowNull: false
  },
  port: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  agentId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('online', 'offline', 'unknown'),
    defaultValue: 'unknown'
  },
  lastSeen: {
    type: DataTypes.DATE,
    allowNull: true
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'targets',
  timestamps: true,
  indexes: [
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['agentId'] },
    { fields: ['tags'] },
    { fields: ['userId'] },
    { fields: ['userId', 'enabled'] },
    { fields: ['userId', 'name'] }
  ]
});

export default Target;
