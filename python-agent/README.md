# ServWatch Python Agent

A Python agent for monitoring system metrics and sending them to ServWatch backend.

## Features

- **CPU Monitoring** - Usage, load averages, frequency, temperature
- **Memory Monitoring** - RAM and swap usage
- **Disk Monitoring** - Drive usage and I/O rates
- **Network Monitoring** - Interface stats and traffic rates
- **GPU Monitoring** - NVIDIA GPU utilization, VRAM, temperature, power (via NVML)
- **Temperature Sensors** - CPU and system temperatures
- **Process Monitoring** - Top processes by CPU and memory
- **WebSocket Communication** - Real-time metrics transmission

## Requirements

- Python 3.8+
- Linux/Windows/macOS
- NVIDIA GPU (optional, for GPU monitoring)

## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/servwatch.git
cd servwatch/python-agent

# Install dependencies
pip install -r requirements.txt

# Or install in development mode
pip install -e .
```

## Configuration

Create a configuration file `agent.config.json`:

```json
{
  "server": {
    "url": "http://localhost:3001"
  },
  "agent": {
    "id": "agent-server-001",
    "name": "Production Server Agent",
    "collectInterval": 1000,
    "transmitInterval": 1000,
    "enableGPU": true
  },
  "metrics": {
    "cpu": true,
    "memory": true,
    "disk": true,
    "network": true,
    "gpu": true,
    "temperatures": true,
    "processes": true
  }
}
```

### Environment Variables

You can also configure using environment variables:

| Variable | Description |
|----------|-------------|
| `SERVWATCH_SERVER` | Backend server URL |
| `AGENT_ID` | Unique agent identifier |
| `AGENT_NAME` | Agent display name |
| `COLLECT_INTERVAL` | Metrics collection interval (ms) |
| `TRANSMIT_INTERVAL` | Metrics transmission interval (ms) |
| `ENABLE_GPU` | Enable GPU monitoring (true/false) |
| `METRIC_CPU` | Enable CPU monitoring |
| `METRIC_MEMORY` | Enable memory monitoring |
| `LOG_LEVEL` | Logging level (DEBUG/INFO/WARNING/ERROR) |

## Usage

### Command Line

```bash
# Using config file
python -m servwatch_agent.agent --config agent.config.json

# Override server URL
python -m servwatch_agent.agent --server http://192.168.1.100:3001

# Set custom agent ID
python -m servwatch_agent.agent --agent-id my-server-agent

# Disable GPU monitoring
python -m servwatch_agent.agent --no-gpu
```

### As a Service (systemd)

Create `/etc/systemd/system/servwatch-agent.service`:

```ini
[Unit]
Description=ServWatch Agent
After=network.target

[Service]
Type=simple
User=servwatch
WorkingDirectory=/opt/servwatch-agent
ExecStart=/usr/bin/python -m servwatch_agent.agent --config /etc/servwatch/agent.config.json
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable servwatch-agent
sudo systemctl start servwatch-agent
sudo systemctl status servwatch-agent
```

### As a Service (Windows)

Create a Windows service using `nssm`:

```cmd
nssm install ServWatchAgent python "C:\servwatch-agent\run.py"
nssm set ServWatchAgent AppDirectory "C:\servwatch-agent"
nssm set ServWatchAgent AppParameters "-m servwatch_agent.agent --config C:\servwatch-agent\agent.config.json"
nssm start ServWatchAgent
```

## Metrics Format

The agent sends the following metrics format:

```json
{
  "timestamp": 1704067200000,
  "agentId": "agent-server-001",
  "cpu": {
    "usage": 45.2,
    "loadAverage": [1.2, 1.5, 1.8],
    "cores": 8,
    "physicalCores": 4,
    "temperature": 55
  },
  "memory": {
    "total": 17179869184,
    "used": 8589934592,
    "percentage": 50.0,
    "swapTotal": 4294967296,
    "swapUsed": 0
  },
  "disk": {
    "drives": [
      {
        "device": "/dev/sda1",
        "mountpoint": "/",
        "total": 500110859264,
        "used": 250055429632,
        "usePercent": 50
      }
    ],
    "io": {
      "readBytes_sec": 1048576,
      "writeBytes_sec": 524288
    }
  },
  "network": {
    "interfaces": [
      {
        "name": "eth0",
        "ip4": "192.168.1.100",
        "rx_sec": 1048576,
        "tx_sec": 524288
      }
    ],
    "totalRx": 1048576,
    "totalTx": 524288
  },
  "gpu": {
    "controllers": [
      {
        "vendor": "NVIDIA",
        "model": "GeForce RTX 3080",
        "usage": 75.0,
        "vram": 10737418240,
        "vramUsed": 5368709120,
        "temperature": 72,
        "powerUsage": 250.5
      }
    ],
    "count": 1,
    "avgUsage": 75.0
  },
  "temperatures": {
    "cpu": 55,
    "max": 72
  },
  "processes": {
    "total": 245,
    "running": 5,
    "topByCPU": [
      {
        "pid": 1234,
        "name": "python",
        "cpu": 15.2,
        "memory": 2.5
      }
    ]
  }
}
```

## GPU Monitoring

GPU monitoring requires NVIDIA drivers and the `nvidia-ml-py` package.

### Check GPU Availability

```bash
python -c "import pynvml; pynvml.nvmlInit(); print(pynvml.nvmlDeviceGetCount(), 'GPU(s) detected')"
```

### Supported GPU Metrics

- GPU utilization (%)
- VRAM usage
- Memory utilization (%)
- Temperature
- Power usage (W)
- Fan speed (%)
- Clock speeds (core/memory)

## Troubleshooting

### Import Error: No module named 'pynvml'

GPU monitoring is optional. The agent will work without it but skip GPU metrics.

```bash
# Install nvidia-ml-py
pip install nvidia-ml-py
```

### Connection Refused

Ensure the ServWatch backend is running and accessible:

```bash
# Test server connection
curl http://localhost:3001/health
```

### High CPU Usage

Adjust collection intervals in config:

```json
{
  "agent": {
    "collectInterval": 5000,
    "transmitInterval": 5000
  }
}
```

## Development

```bash
# Install in development mode
pip install -e .

# Run tests
pytest tests/

# Format code
black servwatch_agent/
```

## License

MIT License - see LICENSE file for details.
