import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null);
  const accessToken = ref(null);
  const refreshToken = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  // Computed
  const isAuthenticated = computed(() => {
    return !!accessToken.value && !!user.value;
  });

  const isAdmin = computed(() => {
    return user.value?.role === 'admin';
  });

  const userInitials = computed(() => {
    if (!user.value) return '';
    const first = user.value.firstName || user.value.username || '';
    const last = user.value.lastName || '';
    return first.charAt(0).toUpperCase() + (last ? last.charAt(0).toUpperCase() : '');
  });

  const userDisplayName = computed(() => {
    if (!user.value) return '';
    if (user.value.firstName && user.value.lastName) {
      return `${user.value.firstName} ${user.value.lastName}`;
    }
    return user.value.username;
  });

  // Actions
  function setAuth(data) {
    user.value = data.user;
    accessToken.value = data.accessToken;
    refreshToken.value = data.refreshToken;

    // Persist to localStorage
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    localStorage.setItem('auth_accessToken', data.accessToken);
    localStorage.setItem('auth_refreshToken', data.refreshToken);
  }

  function clearAuth() {
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;

    // Clear from localStorage
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_accessToken');
    localStorage.removeItem('auth_refreshToken');
  }

  function restoreAuth() {
    try {
      const storedUser = localStorage.getItem('auth_user');
      const storedAccessToken = localStorage.getItem('auth_accessToken');
      const storedRefreshToken = localStorage.getItem('auth_refreshToken');

      if (storedUser && storedAccessToken && storedRefreshToken) {
        user.value = JSON.parse(storedUser);
        accessToken.value = storedAccessToken;
        refreshToken.value = storedRefreshToken;
        return true;
      }
    } catch (e) {
      console.error('Failed to restore auth:', e);
      // Clear corrupted data
      localStorage.clear();
    }
    return false;
  }

  function updateUser(data) {
    user.value = { ...user.value, ...data };
    localStorage.setItem('auth_user', JSON.stringify(user.value));
  }

  function setLoading(loading) {
    isLoading.value = loading;
  }

  function setError(err) {
    error.value = err;
  }

  function clearError() {
    error.value = null;
  }

  return {
    // State
    user,
    accessToken,
    refreshToken,
    isLoading,
    error,
    // Computed
    isAuthenticated,
    isAdmin,
    userInitials,
    userDisplayName,
    // Actions
    setAuth,
    clearAuth,
    restoreAuth,
    updateUser,
    setLoading,
    setError,
    clearError
  };
});
