import { Sequelize } from 'sequelize';
import config from './index.js';

const dbConfig = config.database;

// Create a Sequelize instance without database specified (for creating database)
const adminSequelize = new Sequelize('postgres', dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: false,
});

// Create database if it doesn't exist
export async function createDatabaseIfNotExists() {
  try {
    await adminSequelize.authenticate();
    const databases = await adminSequelize.query(
      "SELECT datname FROM pg_database WHERE datname = :dbname",
      { replacements: { dbname: dbConfig.database }, type: Sequelize.QueryTypes.SELECT }
    );
    if (databases.length === 0) {
      await adminSequelize.query(`CREATE DATABASE ${dbConfig.database};`);
      console.log(`Database "${dbConfig.database}" created successfully.`);
    } else {
      console.log(`Database "${dbConfig.database}" already exists.`);
    }
    await adminSequelize.close();
    return true;
  } catch (error) {
    console.error('Failed to create database:', error.message);
    await adminSequelize.close();
    return false;
  }
}

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: {
      max: 20,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test connection
export async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to database:', error);
    return false;
  }
}

// Initialize TimescaleDB extension
export async function initializeTimescaleDB() {
  try {
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS timescaledb;');
    console.log('TimescaleDB extension initialized.');
    return true;
  } catch (error) {
    console.error('Failed to initialize TimescaleDB:', error);
    return false;
  }
}

export default sequelize;
