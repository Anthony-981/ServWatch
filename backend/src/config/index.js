import dotenv from 'dotenv';
dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3001'),
    env: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.WS_CORS_ORIGIN || 'http://localhost:5173'
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'servwatch',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  },
  websocket: {
    cors: {
      origin: process.env.WS_CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:5174'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  },
  metrics: {
    retentionDays: parseInt(process.env.METRICS_RETENTION_DAYS || '7'),
    aggregationInterval: parseInt(process.env.METRICS_AGGREGATION_INTERVAL || '5000'),
    maxDataPoints: 60 // Keep last 60 data points in memory
  },
  alerts: {
    evaluationInterval: parseInt(process.env.ALERT_EVALUATION_INTERVAL || '5000'),
    defaultCooldown: parseInt(process.env.ALERT_COOLDOWN_DEFAULT || '300')
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'servwatch-jwt-secret-key-2024',
    expiresIn: '24h'
  }
};

export default config;
