"""
Configuration Management
Handles loading and validation of agent configuration
"""

import os
import json
import uuid
from pathlib import Path
from typing import Dict, Any, Optional


class Config:
    """Agent configuration manager"""

    DEFAULT_CONFIG = {
        'server': {
            'url': 'http://localhost:3001',
        },
        'agent': {
            'id': None,  # Will be auto-generated
            'name': None,
            'collectInterval': 1000,
            'transmitInterval': 1000,
            'enableGPU': True
        },
        'metrics': {
            'cpu': True,
            'memory': True,
            'disk': True,
            'network': True,
            'gpu': True,
            'temperatures': True,
            'processes': True
        },
        'logging': {
            'level': 'INFO',
            'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        }
    }

    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize configuration.

        Args:
            config_path: Optional path to configuration file
        """
        self.config_path = config_path or self._find_config_file()
        self.config = self._load_config()

    def _find_config_file(self) -> Optional[str]:
        """Find configuration file in standard locations"""
        possible_paths = [
            'agent.config.json',
            'config.json',
            os.path.expanduser('~/.servwatch/agent.config.json'),
            '/etc/servwatch/agent.config.json'
        ]

        for path in possible_paths:
            if os.path.exists(path):
                return path
        return None

    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from file and environment variables"""
        config = self.DEFAULT_CONFIG.copy()

        # Load from file
        if self.config_path:
            try:
                with open(self.config_path, 'r') as f:
                    file_config = json.load(f)
                    self._deep_merge(config, file_config)
                print(f"Loaded configuration from: {self.config_path}")
            except Exception as e:
                print(f"Warning: Failed to load config file: {e}")

        # Override with environment variables
        self._load_env_vars(config)

        # Generate agent ID if not set
        if not config['agent']['id']:
            config['agent']['id'] = f"agent-{uuid.uuid4()}"

        # Generate agent name if not set
        if not config['agent']['name']:
            import socket
            config['agent']['name'] = f"Agent-{socket.gethostname()}"

        return config

    def _load_env_vars(self, config: Dict[str, Any]):
        """Load configuration from environment variables"""
        # Server URL
        if os.getenv('SERVWATCH_SERVER'):
            config['server']['url'] = os.getenv('SERVWATCH_SERVER')

        # Agent ID
        if os.getenv('AGENT_ID'):
            config['agent']['id'] = os.getenv('AGENT_ID')

        # Agent name
        if os.getenv('AGENT_NAME'):
            config['agent']['name'] = os.getenv('AGENT_NAME')

        # Intervals
        if os.getenv('COLLECT_INTERVAL'):
            config['agent']['collectInterval'] = int(os.getenv('COLLECT_INTERVAL'))

        if os.getenv('TRANSMIT_INTERVAL'):
            config['agent']['transmitInterval'] = int(os.getenv('TRANSMIT_INTERVAL'))

        # GPU enablement
        if os.getenv('ENABLE_GPU'):
            config['agent']['enableGPU'] = os.getenv('ENABLE_GPU').lower() == 'true'

        # Metrics
        for metric in ['cpu', 'memory', 'disk', 'network', 'gpu', 'temperatures', 'processes']:
            env_var = f'METRIC_{metric.upper()}'
            if os.getenv(env_var):
                config['metrics'][metric] = os.getenv(env_var).lower() == 'true'

        # Logging
        if os.getenv('LOG_LEVEL'):
            config['logging']['level'] = os.getenv('LOG_LEVEL')

    def _deep_merge(self, base: Dict[str, Any], update: Dict[str, Any]):
        """Deep merge update dictionary into base"""
        for key, value in update.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                self._deep_merge(base[key], value)
            else:
                base[key] = value

    def get(self, *keys, default=None) -> Any:
        """
        Get configuration value by path.

        Args:
            *keys: Path to configuration value
            default: Default value if not found

        Returns:
            Configuration value or default
        """
        value = self.config
        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return default
        return value

    def save(self, path: Optional[str] = None):
        """
        Save current configuration to file.

        Args:
            path: Optional file path (defaults to original config path)
        """
        save_path = path or self.config_path or 'agent.config.json'

        # Create directory if needed
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)

        with open(save_path, 'w') as f:
            json.dump(self.config, f, indent=2)

        print(f"Configuration saved to: {save_path}")


# Global config instance
_config = None


def get_config(config_path: Optional[str] = None) -> Config:
    """Get global configuration instance"""
    global _config
    if _config is None:
        _config = Config(config_path)
    return _config
