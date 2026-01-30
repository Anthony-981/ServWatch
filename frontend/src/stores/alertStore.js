import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../utils/axios.js';

export const useAlertStore = defineStore('alerts', () => {
  // State
  const alerts = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Actions
  async function fetchAlerts() {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/alerts');
      alerts.value = response.data.data || [];
    } catch (err) {
      error.value = err.message;
      console.error('Failed to fetch alerts:', err);
    } finally {
      loading.value = false;
    }
  }

  async function createAlert(data) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post('/alerts', data);
      alerts.value.push(response.data.data);
      return response.data.data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateAlert(id, data) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.put(`/alerts/${id}`, data);
      const index = alerts.value.findIndex(a => a.id === id);
      if (index !== -1) {
        alerts.value[index] = response.data.data;
      }
      return response.data.data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteAlert(id) {
    loading.value = true;
    error.value = null;
    try {
      await api.delete(`/alerts/${id}`);
      alerts.value = alerts.value.filter(a => a.id !== id);
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function toggleAlert(alert) {
    try {
      await updateAlert(alert.id, { enabled: alert.enabled });
    } catch (err) {
      console.error('Failed to toggle alert:', err);
      // Revert the change
      alert.enabled = !alert.enabled;
    }
  }

  return {
    // State
    alerts,
    loading,
    error,
    // Actions
    fetchAlerts,
    createAlert,
    updateAlert,
    deleteAlert,
    toggleAlert
  };
});
