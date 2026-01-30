import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load configuration from environment or config file
function loadConfig() {
  // Default configuration
  const config = {
    server: {
      url: process.env.SERVWATCH_SERVER || 'http://localhost:3001',
    },
    agent: {
      id: process.env.AGENT_ID || null,
      name: process.env.AGENT_NAME || null,
      collectInterval: parseInt(process.env.COLLECT_INTERVAL || '1000'),
      transmitInterval: parseInt(process.env.TRANSMIT_INTERVAL || '1000')
    },
    metrics: {
      cpu: true,
      memory: true,
      disk: true,
      network: true
    }
  };

  // Try to load from config file
  const configPath = join(__dirname, '../../agent.config.json');
  if (existsSync(configPath)) {
    try {
      const fileConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
      Object.assign(config, fileConfig);
    } catch (error) {
      console.warn('Failed to load config file:', error.message);
    }
  }

  // Generate agent ID if not set
  if (!config.agent.id) {
    config.agent.id = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  return config;
}

export default loadConfig();
