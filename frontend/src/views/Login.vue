<template>
  <div class="auth-container">
    <div class="auth-card">
      <!-- Logo -->
      <div class="auth-logo">
        <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2"/>
          <path d="M16 8v8l6 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <circle cx="16" cy="16" r="3" fill="currentColor"/>
        </svg>
        <h1>ServWatch</h1>
      </div>

      <!-- Tab Switcher -->
      <div class="auth-tabs">
        <button
          class="tab-btn"
          :class="{ active: isLogin }"
          @click="isLogin = true"
        >
          登录
        </button>
        <button
          class="tab-btn"
          :class="{ active: !isLogin }"
          @click="isLogin = false"
        >
          注册
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4m0 4h.01"/>
        </svg>
        {{ error }}
      </div>

      <!-- Login Form -->
      <form v-if="isLogin" @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="login-identifier">用户名或邮箱</label>
          <input
            id="login-identifier"
            v-model="loginForm.identifier"
            type="text"
            placeholder="请输入用户名或邮箱"
            required
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label for="login-password">密码</label>
          <div class="password-input">
            <input
              id="login-password"
              v-model="loginForm.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码"
              required
              autocomplete="current-password"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
            >
              <svg v-if="showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <path d="M1 1l22 22"/>
              </svg>
            </button>
          </div>
        </div>

        <button type="submit" class="submit-btn" :disabled="isLoading">
          <span v-if="!isLoading">登录</span>
          <span v-else class="loading">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="32" stroke-linecap="round"/>
              <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
            </svg>
            登录中...
          </span>
        </button>
      </form>

      <!-- Register Form -->
      <form v-else @submit.prevent="handleRegister" class="auth-form">
        <div class="form-row">
          <div class="form-group">
            <label for="register-username">用户名</label>
            <input
              id="register-username"
              v-model="registerForm.username"
              type="text"
              placeholder="3-50个字符"
              pattern="[a-zA-Z0-9_]{3,50}"
              required
              autocomplete="username"
            />
          </div>

          <div class="form-group">
            <label for="register-email">邮箱</label>
            <input
              id="register-email"
              v-model="registerForm.email"
              type="email"
              placeholder="example@email.com"
              required
              autocomplete="email"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="register-firstName">名字</label>
            <input
              id="register-firstName"
              v-model="registerForm.firstName"
              type="text"
              placeholder="可选"
              autocomplete="given-name"
            />
          </div>

          <div class="form-group">
            <label for="register-lastName">姓氏</label>
            <input
              id="register-lastName"
              v-model="registerForm.lastName"
              type="text"
              placeholder="可选"
              autocomplete="family-name"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="register-password">密码</label>
          <div class="password-input">
            <input
              id="register-password"
              v-model="registerForm.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="至少6个字符"
              minlength="6"
              required
              autocomplete="new-password"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
            >
              <svg v-if="showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <path d="M1 1l22 22"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="register-confirmPassword">确认密码</label>
          <input
            id="register-confirmPassword"
            v-model="registerForm.confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            placeholder="再次输入密码"
            required
            autocomplete="new-password"
          />
        </div>

        <button type="submit" class="submit-btn" :disabled="isLoading">
          <span v-if="!isLoading">注册</span>
          <span v-else class="loading">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="32" stroke-linecap="round"/>
              <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
            </svg>
            注册中...
          </span>
        </button>
      </form>

      <!-- Demo Info -->
      <div class="demo-info">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4m0-4h.01"/>
        </svg>
        固定账户：用户名 <strong>admin</strong> / 密码 <strong>admin123</strong>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';
import api from '../services/api.js';

const router = useRouter();
const authStore = useAuthStore();

const isLogin = ref(true);
const showPassword = ref(false);
const isLoading = ref(false);
const error = ref(null);

const loginForm = ref({
  identifier: '',
  password: ''
});

const registerForm = ref({
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  confirmPassword: ''
});

async function handleLogin() {
  error.value = null;
  isLoading.value = true;

  try {
    const response = await api.login(loginForm.value.identifier, loginForm.value.password);
    authStore.setAuth(response);
    router.push('/');
  } catch (err) {
    error.value = err.message || '登录失败，请检查用户名和密码';
  } finally {
    isLoading.value = false;
  }
}

async function handleRegister() {
  error.value = null;

  // Validate passwords match
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    error.value = '两次输入的密码不一致';
    return;
  }

  isLoading.value = true;

  try {
    const { confirmPassword, ...registerData } = registerForm.value;
    const response = await api.register(registerData);
    authStore.setAuth(response);
    router.push('/');
  } catch (err) {
    error.value = err.message || '注册失败，请稍后重试';
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.auth-card {
  width: 100%;
  max-width: 420px;
  padding: 32px;
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.auth-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
  color: #3b82f6;
}

.auth-logo h1 {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.auth-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 10px;
  padding: 4px;
}

.tab-btn {
  flex: 1;
  padding: 10px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.tab-btn:hover:not(.active) {
  color: #94a3b8;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  margin-bottom: 20px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #ef4444;
  font-size: 14px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: #94a3b8;
}

.form-group input {
  padding: 12px 14px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 14px;
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input::placeholder {
  color: #64748b;
}

.password-input {
  position: relative;
}

.password-input input {
  padding-right: 44px;
}

.toggle-password {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  padding: 6px;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-password:hover {
  color: #94a3b8;
}

.submit-btn {
  margin-top: 8px;
  padding: 14px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 16px -4px rgba(59, 130, 246, 0.4);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.demo-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  padding: 12px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
  color: #64748b;
  font-size: 13px;
}

@media (max-width: 480px) {
  .auth-card {
    padding: 24px 20px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
