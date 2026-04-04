/**
 * 用户状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, logout as logoutApi, getUserInfo, checkAuth } from '@/api/auth'
import type { UserInfo, LoginRequest } from '@/types/user'
import { getStorage, setStorage, removeStorage, clearStorage } from '@/utils'

const TOKEN_KEY = 'token'
const USER_KEY = 'user_info'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string | null>(getStorage<string>(TOKEN_KEY) || null)
  const userInfo = ref<UserInfo | null>(getStorage<UserInfo>(USER_KEY) || null)
  const loading = ref(false)

  // 计算属性
  const isLoggedIn = computed(() => !!token.value && !!userInfo.value)
  const username = computed(() => userInfo.value?.username || '')
  const realName = computed(() => userInfo.value?.real_name || userInfo.value?.username || '')
  const roles = computed(() => userInfo.value?.roles || [])
  const permissions = computed(() => userInfo.value?.permissions || [])

  // 是否是超级管理员
  const isSuperAdmin = computed(() => roles.value.includes('SUPER_ADMIN'))

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
      // 登录前清除所有旧缓存，避免残留脏数据
      clearStorage()
      token.value = null
      userInfo.value = null

      console.log('[UserStore] Calling login API...')
      const response = await loginApi(credentials)
      console.log('[UserStore] Login API response:', response)

      token.value = response.token
      userInfo.value = response.user_info

      // 持久化
      setStorage(TOKEN_KEY, response.token)
      setStorage(USER_KEY, response.user_info)

      console.log('[UserStore] Token saved:', response.token?.substring(0, 20) + '...')
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
      removeStorage(USER_KEY)
    }
  }

  /**
   * 刷新用户信息
   */
  async function refreshUserInfo(): Promise<void> {
    if (!token.value) return

    try {
      const info = await getUserInfo()
      userInfo.value = info
      setStorage(USER_KEY, info)
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
        // 如果本地没有用户信息，从服务器获取
        if (!userInfo.value) {
          await refreshUserInfo()
        }
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
