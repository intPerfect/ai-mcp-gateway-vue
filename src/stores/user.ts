/**
 * 用户状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, logout as logoutApi, getUserInfo, checkAuth } from '@/api/auth'
import type { UserInfo, LoginRequest } from '@/types/user'
import { getStorage, setStorage, removeStorage } from '@/utils'

const TOKEN_KEY = 'token'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string | null>(getStorage<string>(TOKEN_KEY) || null)
  const userInfo = ref<UserInfo | null>(null)
  const loading = ref(false)

  // 计算属性
  const isLoggedIn = computed(() => !!token.value && !!userInfo.value)
  const username = computed(() => userInfo.value?.username || '')
  const realName = computed(() => userInfo.value?.real_name || userInfo.value?.username || '')
  const roles = computed(() => userInfo.value?.roles || [])
  const permissions = computed(() => userInfo.value?.permissions || [])

  // 是否是超级管理员
  const isSuperAdmin = computed(() => roles.value.includes('SUPER_ADMIN'))

  // 是否有业务线管理员权限（基于网关权限 can_manage_users）
  const canManageUsers = computed(() => userInfo.value?.can_manage_users || false)

  /**
   * 检查是否有指定权限
   */
  function hasPermission(permission: string): boolean {
    if (isSuperAdmin.value) return true
    return permissions.value.includes(permission)
  }

  /**
   * 检查是否有任一权限
   */
  function hasAnyPermission(perms: string[]): boolean {
    if (isSuperAdmin.value) return true
    return perms.some(p => permissions.value.includes(p))
  }

  /**
   * 检查是否有所有权限
   */
  function hasAllPermissions(perms: string[]): boolean {
    if (isSuperAdmin.value) return true
    return perms.every(p => permissions.value.includes(p))
  }

  /**
   * 登录
   */
  async function login(credentials: LoginRequest): Promise<void> {
    loading.value = true
    try {
      token.value = null
      userInfo.value = null

      const response = await loginApi(credentials)

      token.value = response.token
      userInfo.value = response.user_info

      // 只持久化 token，不缓存用户信息（每次从后端获取最新数据）
      setStorage(TOKEN_KEY, response.token)
    } finally {
      loading.value = false
    }
  }

  /**
   * 登出
   */
  async function logout(): Promise<void> {
    try {
      await logoutApi()
    } catch {
      // 忽略登出错误
    } finally {
      // 清除状态
      token.value = null
      userInfo.value = null
      removeStorage(TOKEN_KEY)
    }
  }

  /**
   * 刷新用户信息（从后端获取最新数据）
   */
  async function refreshUserInfo(): Promise<void> {
    if (!token.value) return

    try {
      const info = await getUserInfo()
      userInfo.value = info
    } catch {
      // Token过期，清除状态
      logout()
    }
  }

  /**
   * 初始化 - 检查登录状态
   */
  async function init(): Promise<boolean> {
    if (!token.value) {
      return false
    }

    try {
      const result = await checkAuth()
      if (result.logged_in) {
        // 每次都从后端获取最新用户信息（Redis 旁路缓存）
        await refreshUserInfo()
        return true
      } else {
        // Token无效，清除状态
        logout()
        return false
      }
    } catch {
      logout()
      return false
    }
  }

  return {
    // 状态
    token,
    userInfo,
    loading,

    // 计算属性
    isLoggedIn,
    username,
    realName,
    roles,
    permissions,
    isSuperAdmin,
    canManageUsers,

    // 方法
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    login,
    logout,
    refreshUserInfo,
    init
  }
})
