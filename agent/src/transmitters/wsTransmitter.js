import { io } from 'socket.io-client';

/**
 * WebSocket Transmitter
 * Sends collected metrics to the backend server via WebSocket
 */
export class WSTransmitter {
  constructor(serverUrl, agentId, options = {}) {
    this.serverUrl = serverUrl;
    this.agentId = agentId;
    this.options = {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      ...options
    };

    this.socket = null;
    this.connected = false;
    this.buffer = [];
    this.maxBufferSize = 100;

    this.eventHandlers = new Map();
  }

  /**
   * Connect to the backend server
   */
  connect() {
    if (this.socket?.connected) return;

    this.socket = io(this.serverUrl, {
      autoConnect: this.options.autoConnect,
      reconnection: this.options.reconnection,
      reconnectionDelay: this.options.reconnectionDelay,
      reconnectionDelayMax: this.options.reconnectionDelayMax,
      reconnectionAttempts: this.options.reconnectionAttempts,
      query: { agentId: this.agentId }
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log(`Agent connected to server: ${this.serverUrl}`);

      // Register as agent
      this.socket.emit('agent:register', {
        agentId: this.agentId,
        timestamp: Date.now()
      });

      // Flush buffered metrics
      this.flushBuffer();
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('Agent disconnected from server');
    });

    this.socket.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
    });

    this.socket.on('agent:registered', (data) => {
      console.log('Agent registered:', data);
      this.trigger('registered', data);
    });

    this.socket.on('reconnect', () => {
      console.log('Agent reconnected to server');
      this.trigger('reconnect');
    });
  }

  /**
   * Disconnect from the server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
    }
  }

  /**
   * Transmit metrics to the server
   */
  transmit(metrics) {
    const data = {
      agentId: this.agentId,
      ...metrics
    };

    if (this.connected) {
      this.socket.emit('metrics:data', data);
    } else {
      // Buffer metrics when offline
      this.buffer.push(data);
      if (this.buffer.length > this.maxBufferSize) {
        this.buffer.shift(); // Remove oldest
      }
    }
  }

  /**
   * Flush buffered metrics
   */
  flushBuffer() {
    while (this.buffer.length > 0 && this.connected) {
      const data = this.buffer.shift();
      this.socket.emit('metrics:data', data);
    }
  }

  /**
   * Register event handler
   */
  on(event, handler) {
    this.eventHandlers.set(event, handler);
  }

  /**
   * Trigger event handler
   */
  trigger(event, data) {
    const handler = this.eventHandlers.get(event);
    if (handler) {
      handler(data);
    }
  }

  /**
   * Get connection status
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Get buffered metrics count
   */
  getBufferSize() {
    return this.buffer.length;
  }
}

export default WSTransmitter;
