import { defineStore } from 'pinia';
import { ref } from 'vue';
import { targetService } from '../services/targetService.js';

export const useTargetStore = defineStore('targets', () => {
  // State
  const targets = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Actions
  async function fetchTargets() {
    loading.value = true;
    error.value = null;
    try {
      const result = await targetService.getAll();
      targets.value = result.data || [];
    } catch (err) {
      error.value = err.message;
      console.error('Failed to fetch targets:', err);
    } finally {
      loading.value = false;
    }
  }

  async function createTarget(data) {
    loading.value = true;
    error.value = null;
    try {
      const result = await targetService.create(data);
      targets.value.push(result.data);
      return result.data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateTarget(id, data) {
    loading.value = true;
    error.value = null;
    try {
      const result = await targetService.update(id, data);
      const index = targets.value.findIndex(t => t.id === id);
      if (index !== -1) {
        targets.value[index] = result.data;
      }
      return result.data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteTarget(id) {
    loading.value = true;
    error.value = null;
    try {
      await targetService.delete(id);
      targets.value = targets.value.filter(t => t.id !== id);
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateTargetStatus(id, status, agentId) {
    try {
      const result = await targetService.updateStatus(id, status, agentId);
      const index = targets.value.findIndex(t => t.id === id);
      if (index !== -1) {
        targets.value[index] = result.data;
      }
    } catch (err) {
      console.error('Failed to update target status:', err);
    }
  }

  // Getters
  const onlineTargets = ref(() => targets.value.filter(t => t.status === 'online'));
  const offlineTargets = ref(() => targets.value.filter(t => t.status === 'offline'));
  const hostTargets = ref(() => targets.value.filter(t => t.type === 'host'));
  const appTargets = ref(() => targets.value.filter(t => t.type === 'application'));

  return {
    // State
    targets,
    loading,
    error,
    // Actions
    fetchTargets,
    createTarget,
    updateTarget,
    deleteTarget,
    updateTargetStatus,
    // Getters
    onlineTargets,
    offlineTargets,
    hostTargets,
    appTargets
  };
});
