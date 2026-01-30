"""
ServWatch Python Agent
Main agent class for collecting and transmitting system metrics
"""

import asyncio
import logging
import signal
import sys
import time
from typing import Optional

from servwatch_agent.config import get_config
from servwatch_agent.collectors.system import SystemCollector
from servwatch_agent.transmitters.websocket import WSTransmitter

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class Agent:
    """Main agent class that orchestrates metric collection and transmission"""

    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the agent.

        Args:
            config_path: Optional path to configuration file
        """
        self.config = get_config(config_path)
        self.collector = None
        self.transmitter = None
        self.running = False
        self._system_info = None

        # Setup logging
        log_level = self.config.get('logging', 'level', default='INFO')
        logging.getLogger().setLevel(getattr(logging, log_level, logging.INFO))

    def start(self):
        """Start the agent"""
        logger.info("Starting ServWatch Python Agent")
        logger.info(f"Agent ID: {self.config.get('agent', 'id')}")
        logger.info(f"Server: {self.config.get('server', 'url')}")

        # Initialize collector
        enable_gpu = self.config.get('agent', 'enableGPU', default=True)
        self.collector = SystemCollector(enable_gpu=enable_gpu)

        # Get system info once
        self._system_info = self.collector.get_system_info()
        logger.info(f"Hostname: {self._system_info.get('hostname', 'Unknown')}")
        logger.info(f"Platform: {self._system_info.get('platform', 'Unknown')}")
        logger.info(f"CPU Cores: {self._system_info.get('cpu', {}).get('cores', 'Unknown')}")

        # Initialize transmitter
        server_url = self.config.get('server', 'url')
        agent_id = self.config.get('agent', 'id')
        self.transmitter = WSTransmitter(server_url, agent_id)

        # Connect to server
        self.transmitter.connect()

        # Register signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

        # Start collection loop
        self.running = True
        self._run()

    def _run(self):
        """Main collection loop"""
        collect_interval = self.config.get('agent', 'collectInterval', default=1000) / 1000
        transmit_interval = self.config.get('agent', 'transmitInterval', default=1000) / 1000

        last_transmit = time.time()
        last_metrics = None

        while self.running:
            try:
                # Collect metrics
                metrics = self.collector.collect_all()

                if metrics:
                    # Add system info to first transmission
                    if last_metrics is None and self._system_info:
                        metrics['systemInfo'] = self._system_info

                    last_metrics = metrics

                    # Transmit based on interval
                    now = time.time()
                    if now - last_transmit >= transmit_interval:
                        self.transmitter.transmit(metrics)
                        last_transmit = now

                        # Log summary
                        cpu = metrics.get('cpu', {}).get('usage', 0)
                        mem = metrics.get('memory', {}).get('percentage', 0)
                        gpu_count = metrics.get('gpu', {}).get('count', 0)
                        logger.debug(f"Metrics - CPU: {cpu:.1f}%, Memory: {mem:.1f}%, GPUs: {gpu_count}")

                # Sleep for collect interval
                time.sleep(collect_interval)

            except Exception as e:
                logger.error(f"Error in collection loop: {e}")
                time.sleep(collect_interval)

    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info("Received shutdown signal")
        self.stop()

    def stop(self):
        """Stop the agent"""
        if not self.running:
            return

        logger.info("Stopping ServWatch Python Agent")
        self.running = False

        if self.transmitter:
            self.transmitter.disconnect()

        logger.info("Agent stopped")
        sys.exit(0)


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='ServWatch Python Agent')
    parser.add_argument(
        '--config',
        '-c',
        help='Path to configuration file',
        default=None
    )
    parser.add_argument(
        '--server',
        '-s',
        help='Server URL (overrides config)',
        default=None
    )
    parser.add_argument(
        '--agent-id',
        '-i',
        help='Agent ID (overrides config)',
        default=None
    )
    parser.add_argument(
        '--no-gpu',
        action='store_true',
        help='Disable GPU monitoring'
    )

    args = parser.parse_args()

    # Create agent
    agent = Agent(config_path=args.config)

    # Override with command line args
    if args.server:
        agent.config.config['server']['url'] = args.server

    if args.agent_id:
        agent.config.config['agent']['id'] = args.agent_id

    if args.no_gpu:
        agent.config.config['agent']['enableGPU'] = False

    # Start agent
    try:
        agent.start()
    except KeyboardInterrupt:
        agent.stop()


if __name__ == '__main__':
    main()
