#!/bin/bash
# 多 Agent 模拟测试脚本

cd "$(dirname "$0")"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║    ServWatch 多 Agent 硬件模拟测试                      ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# 清理所有现有 agent
pkill -f "node src/agent.js" 2>/dev/null
sleep 1

# 配置不同的模拟环境
declare -A AGENT_CONFIGS
AGENT_CONFIGS[1]="Production-DB|Linux|64|256|2"
AGENT_CONFIGS[2]="Web-Server|Linux|16|64|1"
AGENT_CONFIGS[3]="Cache-Node|Windows|32|128|1"
AGENT_CONFIGS[4]="Worker-Node|Linux|128|512|4"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 启动 agents
echo -e "${CYAN}启动多个模拟 Agent...${NC}\n"

PIDS=()

for i in {1..4}; do
  IFS='|' read -r NAME PLATFORM CORES MEMORY GPUS <<< "${AGENT_CONFIGS[$i]}"

  case $i in
    1) COLOR=$RED ;;
    2) COLOR=$GREEN ;;
    3) COLOR=$YELLOW ;;
    4) COLOR=$PURPLE ;;
  esac

  echo -e "${COLOR}[Agent $i]${NC} $NAME - $PLATFORM ${CORES}核 ${MEMORY}GB ${GPUS}GPU"

  SIMULATION_MODE=true SIM_INDEX=$((i-1)) node src/agent.js > /tmp/agent${i}.log 2>&1 &
  PIDS+=($!)
done

echo ""
echo "══════════════════════════════════════════════════════════"
echo "实时指标监控 (按 Ctrl+C 停止):"
echo "══════════════════════════════════════════════════════════"
echo ""

# 监控输出
trap cleanup INT

cleanup() {
  echo ""
  echo "══════════════════════════════════════════════════════════"
  echo -e "${YELLOW}停止所有 Agent...${NC}"
  for pid in "${PIDS[@]}"; do
    kill $pid 2>/dev/null
  done
  echo -e "${GREEN}已清理所有进程${NC}"
  exit 0
}

# 持续显示日志
while true; do
  for i in {1..4}; do
    case $i in
      1) COLOR=$RED ;;
      2) COLOR=$GREEN ;;
      3) COLOR=$YELLOW ;;
      4) COLOR=$PURPLE ;;
    esac

    if [ -f "/tmp/agent${i}.log" ]; then
      LATEST=$(tail -1 /tmp/agent${i}.log 2>/dev/null)
      if [[ "$LATEST" == *"Metrics transmitted"* ]]; then
        echo -e "${COLOR}[Agent $i]${NC} $LATEST"
      fi
    fi
  done

  echo ""
  sleep 2
done
