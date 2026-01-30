import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 模拟不同的硬件配置
const simulatedAgents = [
  {
    name: 'Server-Production-01',
    hostname: 'prod-server-01',
    description: 'Production Database Server',
    platform: 'Linux',
    // 模拟更高的 CPU 使用率
    cpuMultiplier: 1.2,
    memoryMultiplier: 1.5
  },
  {
    name: 'Server-Web-02',
    hostname: 'web-server-02',
    description: 'Web Application Server',
    platform: 'Linux',
    // 模拟中等负载
    cpuMultiplier: 0.8,
    memoryMultiplier: 0.7
  },
  {
    name: 'Server-Cache-03',
    hostname: 'cache-server-03',
    description: 'Redis Cache Server',
    platform: 'Linux',
    // 模拟低负载
    cpuMultiplier: 0.3,
    memoryMultiplier: 0.4
  },
  {
    name: 'Worker-Machine-04',
    hostname: 'worker-04',
    description: 'Background Job Worker',
    platform: 'Windows',
    // 模拟间歇性高负载
    cpuMultiplier: 1.0,
    memoryMultiplier: 0.6
  }
];

console.log('🚀 Starting multiple ServWatch Agents for testing...\n');

const agents = [];

// 启动每个 agent
simulatedAgents.forEach((agentConfig, index) => {
  const env = {
    ...process.env,
    AGENT_ID: `test-agent-${index + 1}`,
    AGENT_NAME: agentConfig.name,
    SERWATCH_SERVER: 'http://localhost:3001'
  };

  console.log(`📡 Starting Agent ${index + 1}: ${agentConfig.name}`);
  console.log(`   Hostname: ${agentConfig.hostname}`);
  console.log(`   Platform: ${agentConfig.platform}\n`);

  const agent = spawn('node', ['src/agent.js'], {
    cwd: __dirname,
    env: env,
    stdio: 'pipe'
  });

  agent.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(l => l.trim());
    lines.forEach(line => {
      // 添加前缀以便区分不同的 agent
      if (line.includes('Metrics transmitted') || line.includes('Agent')) {
        console.log(`[Agent${index + 1}] ${line}`);
      }
    });
  });

  agent.stderr.on('data', (data) => {
    console.error(`[Agent${index + 1} ERROR] ${data.toString()}`);
  });

  agent.on('close', (code) => {
    console.log(`[Agent${index + 1}] Exited with code ${code}`);
  });

  agents.push(agent);
});

// 优雅关闭处理
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping all agents...');
  agents.forEach((agent, index) => {
    console.log(`  Stopping Agent ${index + 1}...`);
    agent.kill();
  });
  process.exit(0);
});

console.log('✅ All agents started. Press Ctrl+C to stop.\n');
console.log('💡 Tips:');
console.log('   - Open http://127.0.0.1:5175 to view the dashboard');
console.log('   - Each agent simulates different hardware and load patterns');
console.log('   - Agents will register with different IDs on the backend\n');
