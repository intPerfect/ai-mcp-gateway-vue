<template>
  <a-layout class="main-layout">
    <!-- 左侧导航 -->
    <a-layout-sider
      :collapsed="collapsed"
      :trigger="null"
      collapsible
      breakpoint="lg"
      :width="210"
      class="sider"
    >
      <div class="logo">
        <icon-robot class="logo-icon" />
        <span v-if="!collapsed" class="logo-text">AI MCP Gateway</span>
      </div>
      <a-menu
        v-model:selected-keys="selectedKeys"
        theme="light"
        mode="inline"
        @menu-item-click="handleMenuClick"
      >
        <a-menu-item key="home">
          <template #icon><icon-home /></template>
          <span>首页</span>
        </a-menu-item>
        <a-menu-item key="apikey">
          <template #icon><icon-safe /></template>
          <span>API Key管理</span>
        </a-menu-item>
        <a-menu-item key="microservice">
          <template #icon><icon-cloud /></template>
          <span>微服务管理</span>
        </a-menu-item>
        <a-menu-item key="tools">
          <template #icon><icon-apps /></template>
          <span>工具管理</span>
        </a-menu-item>
        <a-menu-item key="chat">
          <template #icon><icon-message /></template>
          <span>对话测试</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <!-- 右侧内容 -->
    <a-layout class="content-layout">
      <!-- 顶部栏 -->
      <a-layout-header class="header">
        <div class="header-left">
          <div class="header-logo">
            <span class="page-title">{{ currentPageTitle }}</span>
          </div>
        </div>
        <div class="header-right">
          <a-tooltip content="通知" position="bottom">
            <a-button type="text" class="header-icon-btn">
              <icon-notification />
            </a-button>
          </a-tooltip>
          <a-dropdown>
            <div class="user-dropdown">
              <a-avatar class="avatar">
                <icon-user />
              </a-avatar>
              <span class="user-name">管理员</span>
              <icon-down class="dropdown-arrow" />
            </div>
            <template #content>
              <a-doption>
                <template #icon><icon-settings /></template>
                个人设置
              </a-doption>
              <a-doption>
                <template #icon><icon-question-circle /></template>
                帮助文档
              </a-doption>
              <a-divider style="margin: 4px 0" />
              <a-doption>
                <template #icon><icon-export /></template>
                退出登录
              </a-doption>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <!-- 主内容 -->
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  IconHome,
  IconApps,
  IconSafe,
  IconMessage,
  IconUser,
  IconCloud,
  IconNotification,
  IconSettings,
  IconQuestionCircle,
  IconExport,
  IconDown,
  IconRobot
} from '@arco-design/web-vue/es/icon'

const router = useRouter()
const route = useRoute()

const collapsed = ref(false)
const selectedKeys = ref(['home'])

const pageTitleMap: Record<string, string> = {
  home: '首页',
  apikey: 'API Key管理',
  microservice: '微服务管理',
  tools: '工具管理',
  chat: '对话测试'
}

const currentPageTitle = computed(() => {
  const key = route.path.replace('/', '')
  return pageTitleMap[key] || 'AI MCP Gateway'
})

const routeKeyMap: Record<string, string> = {
  home: 'home',
  apikey: 'apikey',
  microservice: 'microservice',
  tools: 'tools',
  chat: 'chat'
}

watch(
  () => route.path,
  path => {
    if (!path || typeof path !== 'string') {
      selectedKeys.value = ['home']
      return
    }
    const key = path.replace('/', '')
    if (key && routeKeyMap[key]) {
      selectedKeys.value = [key]
    }
  },
  { immediate: true }
)

watch(
  () => route.path,
  path => {
    if (!path || typeof path !== 'string') {
      selectedKeys.value = ['home']
      return
    }
    const key = path.replace('/', '')
    if (key && routeKeyMap[key]) {
      selectedKeys.value = [key]
    }
  },
  { immediate: true }
)

const handleMenuClick = (key: string) => {
  if (key && typeof key === 'string') {
    router.push('/' + key)
  }
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
  background: #f5f7fa;
}

.sider {
  background: #fff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);
  z-index: 10;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  padding-left: 16px;
  gap: 10px;
  color: var(--color-text-1);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
}

.logo-icon {
  font-size: 22px;
  color: rgb(var(--primary-6));
}

.logo-text {
  background: linear-gradient(135deg, rgb(var(--primary-6)), #722ed1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #f5f7fa;
}

.header {
  background: #fff;
  padding: 0 20px 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  z-index: 9;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-logo {
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
  line-height: 1.2;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-icon-btn {
  font-size: 18px;
  color: var(--color-text-2);
  border-radius: 6px;
}

.header-icon-btn:hover {
  color: rgb(var(--primary-6));
  background: rgba(var(--primary-6), 0.08);
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-dropdown:hover {
  background: rgba(var(--primary-6), 0.06);
}

.avatar {
  background: linear-gradient(135deg, rgb(var(--primary-6)), #722ed1);
  color: #fff;
}

.user-name {
  font-size: 14px;
  color: var(--color-text-1);
  font-weight: 500;
}

.dropdown-arrow {
  font-size: 12px;
  color: var(--color-text-3);
}

.content {
  padding: 16px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
