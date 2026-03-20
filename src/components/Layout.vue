<template>
  <a-layout class="main-layout">
    <!-- 左侧导航 -->
    <a-layout-sider
      :collapsed="collapsed"
      :trigger="null"
      collapsible
      breakpoint="lg"
      :width="220"
      class="sider"
    >
      <div class="logo">
        <icon-apps class="logo-icon" />
        <span v-if="!collapsed" class="logo-text">AI MCP Gateway</span>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
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
          <a-button
            type="text"
            class="collapse-btn"
            @click="toggleCollapse"
          >
            <icon-menu v-if="collapsed" />
            <icon-menu-unfold v-else />
          </a-button>
          <span class="page-title">{{ pageTitle }}</span>
        </div>
        <div class="header-right">
          <a-dropdown>
            <a-avatar class="avatar">
              <icon-user />
            </a-avatar>
            <template #content>
              <a-doption>个人设置</a-doption>
              <a-doption>帮助文档</a-doption>
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
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  IconHome,
  IconApps,
  IconSafe,
  IconMessage,
  IconMenu,
  IconMenuUnfold,
  IconUser
} from '@arco-design/web-vue/es/icon'

const router = useRouter()
const route = useRoute()

const collapsed = ref(false)
const selectedKeys = ref(['home'])

const pageTitleMap: Record<string, string> = {
  home: '首页',
  apikey: 'API Key管理',
  tools: '工具管理',
  chat: '对话测试'
}

const pageTitle = computed(() => {
  return pageTitleMap[selectedKeys.value[0]] || 'AI MCP Gateway'
})

watch(
  () => route.path,
  (path) => {
    if (!path || typeof path !== 'string') {
      selectedKeys.value = ['home']
      return
    }
    const key = path.replace('/', '')
    if (key && pageTitleMap[key]) {
      selectedKeys.value = [key]
    }
  },
  { immediate: true }
)

const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

const handleMenuClick = (key: string) => {
  console.log('Menu clicked:', key)
  if (key && typeof key === 'string') {
    router.push('/' + key)
  }
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

.sider {
  background: var(--color-bg-container);
  border-right: 1px solid var(--color-border);
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--color-text-1);
  font-size: 16px;
  font-weight: 600;
  padding: 0 16px;
  border-bottom: 1px solid var(--color-border);
}

.logo-icon {
  font-size: 24px;
  color: rgb(var(--primary-6));
}

.content-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.header {
  background: var(--color-bg-container);
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  font-size: 18px;
}

.page-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-1);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  background: rgb(var(--primary-6));
  cursor: pointer;
}

.content {
  margin: 16px;
  padding: 0;
  min-height: calc(100vh - 64px - 32px);
  overflow: auto;
}
</style>
