import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Metric = sequelize.define('Metric', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  targetId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Owner of this metric'
  },
  metricType: {
    type: DataTypes.ENUM('cpu', 'memory', 'disk', 'network', 'app', 'api'),
    allowNull: false
  },
  // Raw metric data stored as JSONB
  data: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  // Timestamp for the metric (when it was collected)
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'metrics',
  timestamps: true,
  indexes: [
    { fields: ['targetId'] },
    { fields: ['metricType'] },
    { fields: ['timestamp'] },
    { fields: ['userId'] },
    { fields: ['userId', 'timestamp'] }
  ]
});

// Convert to hypertable for TimescaleDB
export async function createMetricsHypertable() {
  try {
    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM timescaledb_information.hypertables
          WHERE hypertable_name = 'metrics'
        ) THEN
          PERFORM create_hypertable('metrics', 'timestamp',
            chunk_time_interval => INTERVAL '1 day'
          );
        END IF;
      END $$;
    `);

    // Create retention policy (keep raw data for 7 days)
    await sequelize.query(`
      SELECT add_retention_policy('metrics', INTERVAL '7 days');
    `);

    // Create continuous aggregates for 5-minute averages
    await sequelize.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS metrics_5m
      WITH (timescaledb.continuous) AS
      SELECT
        target_id,
        metric_type,
        time_bucket('5 minutes', timestamp) AS bucket,
        AVG((data->>'usage')::float) AS avg_usage,
        MAX((data->>'usage')::float) AS max_usage,
        MIN((data->>'usage')::float) AS min_usage
      FROM metrics
      WHERE data ? 'usage'
      GROUP BY target_id, metric_type, bucket;
    `);

    console.log('Metrics hypertable and continuous aggregates created.');
  } catch (error) {
    console.error('Failed to create hypertable:', error.message);
  }
}

export default Metric;
