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
        v-model:open-keys="openKeys"
        theme="light"
        mode="vertical"
        @menu-item-click="
          (key: string) => {
            console.log('[Menu] clicked:', key)
            router.push('/' + key)
          }
        "
      >
        <a-menu-item key="home">
          <template #icon><icon-home /></template>
          <span>首页</span>
        </a-menu-item>
        <a-menu-item key="gateway">
          <template #icon><icon-safe /></template>
          <span>网关管理</span>
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
        <a-sub-menu v-if="showSystemMenu" key="system" :popup="false">
          <template #icon><icon-settings /></template>
          <template #title>系统管理</template>
          <a-menu-item key="system/user">
            <template #icon><icon-user /></template>
            <span>用户管理</span>
          </a-menu-item>
          <a-menu-item key="system/role">
            <template #icon><icon-user-group /></template>
            <span>角色管理</span>
          </a-menu-item>
          <a-menu-item v-if="userStore.isSuperAdmin" key="system/business-line">
            <template #icon><icon-branch /></template>
            <span>业务线管理</span>
          </a-menu-item>
        </a-sub-menu>
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
          <a-dropdown trigger="hover" :popup-max-height="400">
            <div class="user-dropdown">
              <a-avatar class="avatar">
                <icon-user />
              </a-avatar>
              <span class="user-name">{{ currentUserName }}</span>
              <icon-down class="dropdown-arrow" />
            </div>
            <template #content>
              <a-dgroup title="当前用户信息">
                <div style="padding: 8px 12px; font-size: 12px; color: var(--color-text-2)">
                  <div>用户名: {{ userStore.username }}</div>
                  <div>角色: {{ currentUserRoles }}</div>
                </div>
              </a-dgroup>
              <a-divider style="margin: 4px 0" />
              <a-dgroup v-if="testUsers.length" title="快速切换用户">
                <a-doption v-for="user in testUsers" :key="user.username" @click="switchUser(user)">
                  <template #icon><icon-user /></template>
                  <span>{{ user.label }}</span>
                  <a-tag v-if="userStore.username === user.username" size="small" color="arcoblue">
                    当前
                  </a-tag>
                </a-doption>
              </a-dgroup>
              <a-divider style="margin: 4px 0" />
              <a-doption>
                <template #icon><icon-settings /></template>
                个人设置
              </a-doption>
              <a-doption>
                <template #icon><icon-question-circle /></template>
                帮助文档
              </a-doption>
              <a-divider style="margin: 4px 0" />
              <a-doption @click="handleLogout">
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
import { Message } from '@arco-design/web-vue'
import { useUserStore } from '@/stores/user'
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
  IconRobot,
  IconUserGroup,
  IconBranch
} from '@arco-design/web-vue/es/icon'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 快速切换用户的测试账号列表 — 从 .env 读取，仅开发环境可用
const testUsers = (() => {
  const raw = import.meta.env.VITE_TEST_ACCOUNTS as string | undefined
  if (!raw) return []
  return raw.split(';').map(item => {
    const [username, password, label, rolesStr] = item.split(':')
    return { username, password, label, roles: rolesStr?.split(',') || [] }
  })
})()

const collapsed = ref(false)
const selectedKeys = ref(['home'])
const openKeys = ref(['system']) // 展开的子菜单

// 当前用户显示名称
const currentUserName = computed(() => userStore.realName || userStore.username || '未登录')
const currentUserRoles = computed(() => userStore.roles.join(', ') || '无角色')

// 是否显示系统管理菜单（超管或有系统管理相关权限的用户）
const showSystemMenu = computed(
  () => userStore.isSuperAdmin || userStore.canManageUsers
)

// 切换用户
async function switchUser(user: (typeof testUsers)[0]) {
  try {
    Message.loading({ content: `正在切换到 ${user.label}...`, id: 'switch-user' })
    await userStore.logout()
    await userStore.login({ username: user.username, password: user.password })
    Message.success({ content: `已切换到 ${user.label}`, id: 'switch-user' })
    router.replace('/')
  } catch (e: any) {
    Message.error({ content: `切换失败: ${e.message}`, id: 'switch-user' })
  }
}

// 退出登录
async function handleLogout() {
  try {
    await userStore.logout()
    router.replace('/login')
  } catch {
    router.replace('/login')
  }
}

const pageTitleMap: Record<string, string> = {
  home: '首页',
  gateway: '网关管理',
  microservice: '微服务管理',
  tools: '工具管理',
  chat: '对话测试',
  'system/user': '用户管理',
  'system/role': '角色管理',
  'system/business-line': '业务线管理'
}

const currentPageTitle = computed(() => {
  const key = route.path.replace('/', '')
  return pageTitleMap[key] || 'AI MCP Gateway'
})

const routeKeyMap: Record<string, string> = {
  home: 'home',
  gateway: 'gateway',
  microservice: 'microservice',
  tools: 'tools',
  chat: 'chat',
  'system/user': 'system/user',
  'system/role': 'system/role',
  'system/business-line': 'system/business-line'
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
      // 如果是系统管理下的页面，自动展开子菜单
      if (key.startsWith('system/')) {
        if (!openKeys.value.includes('system')) {
          openKeys.value = ['system']
        }
      }
    }
  },
  { immediate: true }
)
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
