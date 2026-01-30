import api from '../utils/axios.js';

/**
 * Auth API Service
 */
export const authApi = {
  /**
   * Register a new user
   */
  async register(data) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  /**
   * Login user
   */
  async login(identifier, password) {
    const response = await api.post('/auth/login', { identifier, password });
    return response.data;
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Update user profile
   */
  async updateProfile(data) {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  /**
   * Change password
   */
  async changePassword(currentPassword, newPassword) {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  /**
   * Logout
   */
  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Admin methods

  /**
   * Get all users (admin only)
   */
  async getUsers(params) {
    const response = await api.get('/auth/users', { params });
    return response.data;
  },

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId, role) {
    const response = await api.put(`/auth/users/${userId}/role`, { role });
    return response.data;
  },

  /**
   * Toggle user status (admin only)
   */
  async toggleUserStatus(userId) {
    const response = await api.put(`/auth/users/${userId}/toggle-status`);
    return response.data;
  },

  /**
   * Delete user (admin only)
   */
  async deleteUser(userId) {
    const response = await api.delete(`/auth/users/${userId}`);
    return response.data;
  }
};

export default api;
