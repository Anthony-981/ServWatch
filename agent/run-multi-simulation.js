import { spawn } from 'child_process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Agent 配置 - 模拟不同的硬件
const agents = [
  { name: 'Production-DB-01', desc: 'Production Database', simIndex: 0, color: '\x1b[31m' }, // Red
  { name: 'Web-Server-02', desc: 'Web Application', simIndex: 1, color: '\x1b[32m' },  // Green
  { name: 'Cache-Node-03', desc: 'Redis Cache', simIndex: 2, color: '\x1b[33m' },    // Yellow
  { name: 'Worker-Node-04', desc: 'Background Jobs', simIndex: 3, color: '\x1b[35m' }  // Purple
];

const RESET = '\x1b[0m';
const runningAgents = [];
let isRunning = true;

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║     ServWatch 多 Agent 硬件模拟测试                      ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// 启动每个 agent
agents.forEach((agent, index) => {
  const env = {
    ...process.env,
    SIMULATION_MODE: 'true',
    SIM_INDEX: agent.simIndex.toString()
  };

  console.log(`${agent.color}[${agent.name}]${RESET} ${agent.desc}`);

  const child = spawn('node', ['src/agent.js'], {
    cwd: __dirname,
    env: env,
    stdio: 'pipe',
    shell: true
  });

  // 收集输出
  let outputBuffer = '';

  child.stdout.on('data', (data) => {
    outputBuffer += data.toString();

    // 按行处理输出
    const lines = outputBuffer.split('\n');
    outputBuffer = lines.pop() || '';

    lines.forEach(line => {
      if (line.includes('Metrics transmitted')) {
        console.log(`${agent.color}[${agent.name.split('-')[0]}]${RESET} ${line}`);
      } else if (line.includes('Agent started')) {
        console.log(`${agent.color}[${agent.name.split('-')[0]}]${RESET} ✓ ${line}`);
      }
    });
  });

  child.stderr.on('data', (data) => {
    console.error(`${agent.color}[${agent.name} ERROR]${RESET} ${data.toString()}`);
  });

  child.on('close', (code) => {
    if (isRunning) {
      console.log(`${agent.color}[${agent.name}]${RESET} Agent exited (code: ${code})`);
    }
  });

  runningAgents.push(child);
});

console.log('\n═════════════════════════════════════════════════════════════');
console.log('实时指标监控中...');
console.log('═════════════════════════════════════════════════════════════\n');

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n\n═════════════════════════════════════════════════════════════');
  console.log('停止所有 Agent...');
  isRunning = false;

  runningAgents.forEach((agent, i) => {
    agent.kill();
  });

  setTimeout(() => {
    console.log('✓ 所有 Agent 已停止\n');
    process.exit(0);
  }, 1000);
});

// 保持运行
setTimeout(() => {
  console.log('\n按 Ctrl+C 停止所有 Agent\n');
}, 1000);
