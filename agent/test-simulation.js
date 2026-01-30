import { spawn } from 'child_process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║     ServWatch 硬件模拟测试 - 实时数据显示                     ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

const agents = [
  { name: 'Production-DB', index: 0, desc: '64核 / 256GB / RTX 4090 x2' },
  { name: 'Web-Server', index: 1, desc: '16核 / 64GB / Tesla A100' },
  { name: 'Cache-Node', index: 2, desc: '8核 / 128GB / Intel Iris' },
  { name: 'Worker-Node', index: 3, desc: '32核 / 512GB / AMD RX 7900' }
];

const colors = ['\x1b[31m', '\x1b[32m', '\x1b[33m', '\x1b[35m'];
const RESET = '\x1b[0m';

const runningAgents = [];
let iteration = 0;

// 启动每个 agent
agents.forEach((agent, i) => {
  const env = {
    ...process.env,
    SIMULATION_MODE: 'true',
    SIM_INDEX: agent.index.toString(),
    FORCE_COLOR: '1'
  };

  console.log(`${colors[i]}[${agent.name}]${RESET} ${agent.desc}`);

  const child = spawn('node', ['src/agent.js'], {
    cwd: __dirname,
    env: env,
    stdio: 'pipe',
    shell: true,
    detached: false
  });

  let buffer = '';

  child.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    lines.forEach(line => {
      if (line.includes('Metrics transmitted')) {
        // 提取关键指标
        const cpu = line.match(/CPU ([\d.]+)%/)?.[1] || '0';
        const mem = line.match(/Memory ([\d.]+)%/)?.[1] || '0';
        const gpu = line.match(/GPU ([\dx\s\d.]+)%/)?.[1] || 'N/A';
        const procs = line.match(/Procs (\d+)/)?.[1] || '0';

        process.stdout.write(
          `\r${colors[i]}[${agent.name}]${RESET} `.padEnd(20) +
          `CPU: ${cpu.padStart(5)}%  ` +
          `MEM: ${mem.padStart(5)}%  ` +
          `GPU: ${gpu.padStart(10)}  ` +
          `Procs: ${procs.padStart(4)}    \n`
        );
      }
    });
  });

  child.stderr.on('data', (data) => {
    // 忽略 stderr
  });

  child.on('close', (code) => {
    // Ignore
  });

  runningAgents.push(child);
});

console.log('\n等待指标传输...\n');

// 运行一段时间后停止
setTimeout(() => {
  console.log('\n\n停止所有 Agent...\n');
  runningAgents.forEach(agent => agent.kill());
  process.exit(0);
}, 20000);
