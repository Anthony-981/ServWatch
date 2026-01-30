import api from '../utils/axios.js';

export const targetService = {
  // Get all targets
  async getAll() {
    const response = await api.get('/targets');
    return response.data;
  },

  // Get single target
  async getById(id) {
    const response = await api.get(`/targets/${id}`);
    return response.data;
  },

  // Create new target
  async create(data) {
    const response = await api.post('/targets', data);
    return response.data;
  },

  // Update target
  async update(id, data) {
    const response = await api.put(`/targets/${id}`, data);
    return response.data;
  },

  // Delete target
  async delete(id) {
    const response = await api.delete(`/targets/${id}`);
    return response.data;
  },

  // Update target status
  async updateStatus(id, status, agentId) {
    const response = await api.post(`/targets/${id}/status`, {
      status,
      agentId
    });
    return response.data;
  }
};
