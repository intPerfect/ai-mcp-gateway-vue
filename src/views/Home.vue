<template>
  <div class="home">
    <!-- Hero 欢迎区域 -->
    <div class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
          <h1>AI MCP Gateway</h1>
          <p class="hero-subtitle">基于 Model Context Protocol 的智能网关管理系统</p>
          <p class="hero-description">统一管理 AI 工具接口，提供安全可靠的工具调用能力</p>
        </div>
        <a-button type="primary" size="large" class="hero-button" @click="$router.push('/chat')">
          <template #icon><icon-message /></template>
          开始对话
        </a-button>
      </div>
      <div class="hero-decoration">
        <div class="decoration-circle circle-1"></div>
        <div class="decoration-circle circle-2"></div>
        <div class="decoration-circle circle-3"></div>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-section">
      <div class="stat-item">
        <div
          class="stat-icon-wrapper"
          style="background: linear-gradient(135deg, #165dff, #4080ff)"
        >
          <icon-apps class="stat-icon" />
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.tools }}</span>
          <span class="stat-label">注册工具</span>
        </div>
      </div>
      <div class="stat-item">
        <div
          class="stat-icon-wrapper"
          style="background: linear-gradient(135deg, #00b42a, #00d68b)"
        >
          <icon-message class="stat-icon" />
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.sessions }}</span>
          <span class="stat-label">活跃会话</span>
        </div>
      </div>
      <div class="stat-item">
        <div
          class="stat-icon-wrapper"
          style="background: linear-gradient(135deg, #722ed1, #9a4dff)"
        >
          <icon-safe class="stat-icon" />
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.apikeys }}</span>
          <span class="stat-label">API Key</span>
        </div>
      </div>
      <div class="stat-item">
        <div
          class="stat-icon-wrapper"
          style="background: linear-gradient(135deg, #ff7d00, #ffaa00)"
        >
          <icon-branch class="stat-icon" />
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.requests }}</span>
          <span class="stat-label">请求次数</span>
        </div>
      </div>
    </div>

    <!-- 功能入口卡片 -->
    <div class="features-section">
      <h2 class="section-title">功能导航</h2>
      <div class="features-grid">
        <div class="feature-card" @click="$router.push('/tools')">
          <div class="feature-header">
            <div class="feature-icon" style="background: linear-gradient(135deg, #165dff, #722ed1)">
              <icon-apps />
            </div>
            <icon-right class="feature-arrow" />
          </div>
          <h3>工具管理</h3>
          <p>管理 MCP 工具，健康检查，OpenAPI 导入</p>
          <div class="feature-tags">
            <span class="tag">健康检查</span>
            <span class="tag">OpenAPI</span>
          </div>
        </div>

        <div class="feature-card" @click="$router.push('/apikey')">
          <div class="feature-header">
            <div class="feature-icon" style="background: linear-gradient(135deg, #00b42a, #00d068)">
              <icon-safe />
            </div>
            <icon-right class="feature-arrow" />
          </div>
          <h3>API Key 管理</h3>
          <p>管理用户和网关 API Key，控制访问权限</p>
          <div class="feature-tags">
            <span class="tag">权限控制</span>
            <span class="tag">安全认证</span>
          </div>
        </div>

        <div class="feature-card" @click="$router.push('/chat')">
          <div class="feature-header">
            <div class="feature-icon" style="background: linear-gradient(135deg, #ff7d00, #ffc547)">
              <icon-message />
            </div>
            <icon-right class="feature-arrow" />
          </div>
          <h3>对话测试</h3>
          <p>WebSocket 实时对话，工具调用测试</p>
          <div class="feature-tags">
            <span class="tag">实时对话</span>
            <span class="tag">工具调用</span>
          </div>
        </div>

        <div class="feature-card" @click="$router.push('/microservice')">
          <div class="feature-header">
            <div class="feature-icon" style="background: linear-gradient(135deg, #f5319d, #ff7a45)">
              <icon-storage />
            </div>
            <icon-right class="feature-arrow" />
          </div>
          <h3>微服务管理</h3>
          <p>管理微服务配置，监控服务状态</p>
          <div class="feature-tags">
            <span class="tag">服务配置</span>
            <span class="tag">状态监控</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速指南 -->
    <div class="guide-section">
      <h2 class="section-title">快速开始</h2>
      <div class="guide-steps">
        <div class="guide-step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>配置 API Key</h4>
            <p>创建用户 API Key 用于身份认证</p>
          </div>
        </div>
        <div class="step-connector"></div>
        <div class="guide-step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>导入工具</h4>
            <p>通过 OpenAPI 导入微服务工具</p>
          </div>
        </div>
        <div class="step-connector"></div>
        <div class="guide-step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>开始对话</h4>
            <p>与 AI 进行对话，自动调用工具</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  IconApps,
  IconMessage,
  IconSafe,
  IconBranch,
  IconRight,
  IconStorage
} from '@arco-design/web-vue/es/icon'

const stats = ref({
  tools: 0,
  sessions: 3,
  apikeys: 2,
  requests: 128
})

const loadData = async () => {
  try {
    const response = await fetch('/api/tools')
    const result = await response.json()
    if (result.code === '0000') {
      stats.value.tools = result.data.total || 0
    }
  } catch (error) {
    console.error('Failed to load data:', error)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.home {
  padding: 0;
  min-height: 100%;
}

/* Hero Section */
.hero-section {
  position: relative;
  background: linear-gradient(135deg, #165dff 0%, #722ed1 50%, #9a4dff 100%);
  padding: 48px 32px;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 24px;
}

.hero-content {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hero-text h1 {
  color: #fff;
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.hero-subtitle {
  color: rgba(255, 255, 255, 0.95);
  font-size: 18px;
  margin: 0 0 8px 0;
}

.hero-description {
  color: rgba(255, 255, 255, 0.75);
  font-size: 14px;
  margin: 0;
}

.hero-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(4px);
  font-size: 16px;
  height: 48px;
  padding: 0 32px;
}

.hero-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.hero-decoration {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 50%;
  pointer-events: none;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.circle-1 {
  width: 200px;
  height: 200px;
  top: -50px;
  right: -50px;
}

.circle-2 {
  width: 150px;
  height: 150px;
  bottom: -30px;
  right: 100px;
}

.circle-3 {
  width: 80px;
  height: 80px;
  top: 50%;
  right: 50px;
  transform: translateY(-50%);
}

/* Stats Section */
.stats-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

@media (max-width: 768px) {
  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-item {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.stat-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon {
  font-size: 24px;
  color: #fff;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1d2129;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #86909c;
  margin-top: 4px;
}

/* Features Section */
.features-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 16px 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1200px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
}

.feature-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.feature-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
}

.feature-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.feature-arrow {
  color: #c9cdd4;
  font-size: 16px;
  transition: all 0.2s ease;
}

.feature-card:hover .feature-arrow {
  color: #165dff;
  transform: translateX(4px);
}

.feature-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 8px 0;
}

.feature-card p {
  font-size: 13px;
  color: #86909c;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.feature-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  font-size: 12px;
  color: #165dff;
  background: #e8f3ff;
  padding: 4px 10px;
  border-radius: 4px;
}

/* Guide Section */
.guide-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.guide-steps {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

@media (max-width: 768px) {
  .guide-steps {
    flex-direction: column;
    gap: 16px;
  }

  .step-connector {
    display: none;
  }
}

.guide-step {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
}

.step-number {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #165dff, #722ed1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 4px 0;
}

.step-content p {
  font-size: 13px;
  color: #86909c;
  margin: 0;
}

.step-connector {
  flex: 0 0 60px;
  height: 2px;
  background: linear-gradient(90deg, #165dff, #722ed1);
  margin-top: 17px;
  opacity: 0.3;
}
</style>
