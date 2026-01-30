"""
WebSocket Transmitter
Sends collected metrics to the backend server via WebSocket
"""

import socketio
import threading
import time
import queue
import logging
from typing import Optional, Dict, Any, Callable

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class WSTransmitter:
    """WebSocket transmitter for sending metrics to ServWatch backend"""

    def __init__(self, server_url: str, agent_id: str, options: Optional[Dict[str, Any]] = None):
        """
        Initialize the WebSocket transmitter.

        Args:
            server_url: Backend server URL (e.g., http://localhost:3001)
            agent_id: Unique identifier for this agent
            options: Optional configuration options
        """
        self.server_url = server_url
        self.agent_id = agent_id
        default_options = {
            'autoConnect': True,
            'reconnection': True,
            'reconnectionDelay': 1000,
            'reconnectionDelayMax': 5000,
            'reconnectionAttempts': 0  # Infinite
        }
        if options:
            default_options.update(options)
        self.options = default_options

        self.sio = None
        self.connected = False
        self.buffer = queue.Queue(maxsize=100)
        self.should_stop = False

        # Event handlers
        self.event_handlers: Dict[str, Callable] = {}

        # Background thread for handling messages
        self._thread = None

    def connect(self):
        """Connect to the backend server"""
        if self.connected:
            logger.info("Already connected")
            return

        # Create Socket.IO client
        self.sio = socketio.Client(
            reconnection=self.options['reconnection'],
            reconnection_delay=self.options['reconnectionDelay'],
            reconnection_delay_max=self.options['reconnectionDelayMax'],
            reconnection_attempts=self.options['reconnectionAttempts']
        )

        # Register event handlers
        self.sio.on('connect', self._on_connect)
        self.sio.on('disconnect', self._on_disconnect)
        self.sio.on('connect_error', self._on_connect_error)
        self.sio.on('agent:registered', self._on_registered)
        self.sio.on('reconnect', self._on_reconnect)

        # Connect to server
        try:
            self.sio.connect(self.server_url)
        except Exception as e:
            logger.error(f"Connection error: {e}")

    def _on_connect(self):
        """Handle connection event"""
        self.connected = True
        logger.info(f"Connected to server: {self.server_url}")

        # Register as agent
        self.sio.emit('agent:register', {
            'agentId': self.agent_id,
            'timestamp': int(time.time() * 1000)
        })

        # Start buffer flush thread
        self._start_flush_thread()

    def _on_disconnect(self):
        """Handle disconnect event"""
        self.connected = False
        logger.info("Disconnected from server")

    def _on_connect_error(self, error):
        """Handle connection error"""
        logger.error(f"Connection error: {error}")

    def _on_registered(self, data):
        """Handle agent registration confirmation"""
        logger.info(f"Agent registered: {data}")
        self._trigger('registered', data)

    def _on_reconnect(self):
        """Handle reconnection"""
        logger.info("Reconnected to server")
        self._trigger('reconnect', None)

    def _start_flush_thread(self):
        """Start background thread to flush buffered metrics"""
        if self._thread is None or not self._thread.is_alive():
            self.should_stop = False
            self._thread = threading.Thread(target=self._flush_loop, daemon=True)
            self._thread.start()

    def _flush_loop(self):
        """Background loop to flush buffered metrics"""
        while not self.should_stop:
            try:
                if self.connected and not self.buffer.empty():
                    data = self.buffer.get_nowait()
                    self.sio.emit('metrics:data', data)
                else:
                    time.sleep(0.1)
            except queue.Empty:
                time.sleep(0.1)
            except Exception as e:
                logger.error(f"Error flushing buffer: {e}")
                time.sleep(0.5)

    def disconnect(self):
        """Disconnect from the server"""
        self.should_stop = True
        if self.sio:
            self.sio.disconnect()
        self.connected = False
        logger.info("Disconnected from server")

    def transmit(self, metrics: Dict[str, Any]):
        """
        Transmit metrics to the server.

        Args:
            metrics: Dictionary containing metrics data
        """
        data = {
            'agentId': self.agent_id,
            **metrics
        }

        if self.connected:
            try:
                self.sio.emit('metrics:data', data)
            except Exception as e:
                logger.error(f"Error transmitting metrics: {e}")
                self._buffer_data(data)
        else:
            logger.warning("Not connected, buffering metrics")
            self._buffer_data(data)

    def _buffer_data(self, data: Dict[str, Any]):
        """Add data to buffer, removing oldest if full"""
        try:
            self.buffer.put_nowait(data)
        except queue.Full:
            try:
                self.buffer.get_nowait()  # Remove oldest
                self.buffer.put_nowait(data)
            except queue.Empty:
                pass

    def flush_buffer(self):
        """Flush all buffered metrics"""
        while not self.buffer.empty() and self.connected:
            try:
                data = self.buffer.get_nowait()
                self.sio.emit('metrics:data', data)
            except queue.Empty:
                break
            except Exception as e:
                logger.error(f"Error flushing buffer: {e}")
                break

    def on(self, event: str, handler: Callable):
        """Register an event handler"""
        self.event_handlers[event] = handler

    def _trigger(self, event: str, data: Any):
        """Trigger an event handler"""
        handler = self.event_handlers.get(event)
        if handler:
            handler(data)

    def is_connected(self) -> bool:
        """Check if connected to server"""
        return self.connected

    def get_buffer_size(self) -> int:
        """Get number of buffered metrics"""
        return self.buffer.qsize()
