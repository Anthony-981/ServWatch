import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';
import appConfig from '../config/app.js';

export function useWebSocket() {
  const socket = ref(null);
  const connected = ref(false);
  const connectError = ref(null);

  // 事件处理器存储
  const eventHandlers = new Map();

  const connect = () => {
    if (appConfig.isMockMode) {
      // 模拟模式 - 直接设置为已连接
      connected.value = true;
      console.log('Mock mode: WebSocket connection simulated');
      return;
    }

    if (socket.value?.connected) return;

    socket.value = io(appConfig.wsURL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socket.value.on('connect', () => {
      connected.value = true;
      connectError.value = null;
      console.log('WebSocket connected:', socket.value.id);

      // 注册为仪表板客户端
      socket.value.emit('dashboard:connect');
    });

    socket.value.on('disconnect', () => {
      connected.value = false;
      console.log('WebSocket disconnected');
    });

    socket.value.on('connect_error', (err) => {
      connectError.value = err;
      console.error('WebSocket connection error:', err);
    });

    socket.value.on('dashboard:connected', (data) => {
      console.log('Dashboard registered:', data);
    });

    // 附加已存储的事件处理器
    eventHandlers.forEach((handler, event) => {
      socket.value.on(event, handler);
    });
  };

  const disconnect = () => {
    if (appConfig.isMockMode) {
      connected.value = false;
      return;
    }

    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
      connected.value = false;
    }
  };

  const on = (event, handler) => {
    eventHandlers.set(event, handler);
    if (socket.value && !appConfig.isMockMode) {
      socket.value.on(event, handler);
    }
  };

  const off = (event) => {
    eventHandlers.delete(event);
    if (socket.value && !appConfig.isMockMode) {
      socket.value.off(event);
    }
  };

  const emit = (event, data) => {
    if (appConfig.isMockMode) {
      console.log('Mock mode: WebSocket emit', event, data);
      return;
    }

    if (socket.value?.connected) {
      socket.value.emit(event, data);
    }
  };

  onMounted(() => {
    connect();
  });

  onUnmounted(() => {
    disconnect();
  });

  return {
    socket,
    connected,
    connectError,
    connect,
    disconnect,
    on,
    off,
    emit
  };
}
