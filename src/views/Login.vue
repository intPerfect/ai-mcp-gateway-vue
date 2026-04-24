<template>
  <div class="login-container">
    <!-- 左侧品牌区 -->
    <div class="login-brand">
      <div class="brand-content">
        <div class="brand-logo">MCP</div>
        <h1>AI MCP Gateway</h1>
        <p class="brand-subtitle">智能网关管理系统</p>
        <div class="brand-features">
          <div class="feature-item">
            <div class="feature-icon">
              <icon-swap />
            </div>
            <div>
              <div class="feature-title">多协议网关</div>
              <div class="feature-desc">统一管理 MCP 微服务接入</div>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <icon-safe />
            </div>
            <div>
              <div class="feature-title">精细权限管控</div>
              <div class="feature-desc">基于角色的网关级权限体系</div>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <icon-command />
            </div>
            <div>
              <div class="feature-title">AI 对话集成</div>
              <div class="feature-desc">多模型配置，智能工具调度</div>
            </div>
          </div>
        </div>
      </div>
      <!-- 装饰背景 -->
      <div class="brand-decor">
        <div class="decor-circle decor-circle-1"></div>
        <div class="decor-circle decor-circle-2"></div>
        <div class="decor-circle decor-circle-3"></div>
      </div>
    </div>

    <!-- 右侧登录区 -->
    <div class="login-right">
      <div class="login-card">
        <div class="login-header">
          <div class="login-logo-small">MCP</div>
          <h2>欢迎回来</h2>
          <p>登录 AI MCP Gateway 管理后台</p>
        </div>

        <a-form
          :model="form"
          layout="vertical"
          @submit-success="handleLogin"
        >
          <a-form-item
            field="username"
            :rules="[{ required: true, message: '请输入用户名' }]"
            hide-label
          >
            <a-input
              v-model="form.username"
              placeholder="用户名"
              size="large"
              :disabled="loading"
            >
              <template #prefix><icon-user /></template>
            </a-input>
          </a-form-item>

          <a-form-item
            field="password"
            :rules="[{ required: true, message: '请输入密码' }]"
            hide-label
          >
            <a-input-password
              v-model="form.password"
              placeholder="密码"
              size="large"
              :disabled="loading"
            >
              <template #prefix><icon-lock /></template>
            </a-input-password>
          </a-form-item>

          <a-alert v-if="errorMsg" type="error" :closable="false" style="margin-bottom: 16px">
            {{ errorMsg }}
          </a-alert>

          <a-button
            type="primary"
            html-type="submit"
            long
            size="large"
            :loading="loading"
          >
            登 录
          </a-button>
        </a-form>

        <div class="login-footer">
          <a-divider><span class="footer-hint">演示账号（点击填充）</span></a-divider>
          <a-space :size="10" wrap class="demo-accounts">
            <a-tag color="arcoblue" class="demo-tag" @click="fillAccount('admin', 'admin123')">admin / admin123</a-tag>
            <a-tag color="green" class="demo-tag" @click="fillAccount('oa_admin', '123456')">oa_admin / 123456</a-tag>
            <a-tag color="orangered" class="demo-tag" @click="fillAccount('product_admin', '123456')">product_admin / 123456</a-tag>
            <a-tag color="cyan" class="demo-tag" @click="fillAccount('oa_user', '123456')">oa_user / 123456</a-tag>
            <a-tag color="purple" class="demo-tag" @click="fillAccount('product_user', '123456')">product_user / 123456</a-tag>
          </a-space>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { IconUser, IconLock, IconSwap, IconSafe, IconCommand } from '@arco-design/web-vue/es/icon'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const errorMsg = ref('')

const form = reactive({
  username: '',
  password: ''
})

function fillAccount(username: string, password: string) {
  form.username = username
  form.password = password
  errorMsg.value = ''
}

async function handleLogin() {
  loading.value = true
  errorMsg.value = ''

  try {
    await userStore.login({
      username: form.username,
      password: form.password
    })
    const redirect = (route.query['redirect'] as string) || '/'
    await router.replace(redirect)
  } catch (e: any) {
    errorMsg.value = e.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
}

/* ====== 左侧品牌区 ====== */
.login-brand {
  flex: 1;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  min-height: 100vh;
}

.brand-content {
  position: relative;
  z-index: 1;
  padding: 48px;
  max-width: 480px;
}

.brand-logo {
  width: 64px;
  height: 64px;
  line-height: 64px;
  text-align: center;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 1px;
  margin-bottom: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.brand-content h1 {
  font-size: 36px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px;
}

.brand-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 48px;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  color: #fff;
}

.feature-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.85);
}

.feature-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 2px;
}

.feature-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

/* 装饰圆 */
.brand-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.decor-circle {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.decor-circle-1 {
  width: 600px;
  height: 600px;
  right: -200px;
  top: -100px;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.15), transparent 70%);
}

.decor-circle-2 {
  width: 400px;
  height: 400px;
  left: -100px;
  bottom: -80px;
  background: radial-gradient(circle, rgba(118, 75, 162, 0.12), transparent 70%);
}

.decor-circle-3 {
  width: 200px;
  height: 200px;
  right: 80px;
  bottom: 120px;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.1), transparent 70%);
}

/* ====== 右侧登录区 ====== */
.login-right {
  width: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-2);
  flex-shrink: 0;
}

.login-card {
  width: 100%;
  max-width: 420px;
  padding: 0 40px;
}

.login-logo-small {
  width: 48px;
  height: 48px;
  line-height: 48px;
  text-align: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
  margin-bottom: 24px;
}

.login-header {
  margin-bottom: 40px;
}

.login-header h2 {
  font-size: 28px;
  font-weight: 600;
  color: var(--color-text-1);
  margin: 0 0 8px;
}

.login-header p {
  font-size: 15px;
  color: var(--color-text-3);
  margin: 0;
}

.login-footer {
  margin-top: 40px;
  text-align: center;
}

.footer-hint {
  font-size: 12px;
  color: var(--color-text-4);
}

.demo-accounts {
  justify-content: center;
}

.demo-tag {
  cursor: pointer;
  transition: transform 0.15s;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
}

.demo-tag:hover {
  transform: scale(1.05);
}

.demo-tag:active {
  transform: scale(0.96);
}

/* ====== 响应式：小屏幕退回居中卡片 ====== */
@media (max-width: 900px) {
  .login-container {
    flex-direction: column;
  }

  .login-brand {
    display: none;
  }

  .login-right {
    width: 100%;
    min-height: 100vh;
  }
}
</style>
