/**
 * 认证相关 API
 */
import { post, get, resetRedirectFlag } from './request'
import type { LoginRequest, LoginResponse, UserInfo } from '@/types/user'

/**
 * 用户登录
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  // 重置跳转标志，确保登录请求可以正常进行
  resetRedirectFlag()
  return post<LoginResponse>('/auth/login', data)
}

/**
 * 用户登出
 */
export const logout = async (): Promise<void> => {
  await post<void>('/auth/logout')
}

/**
 * 获取当前用户信息
 */
export const getUserInfo = async (): Promise<UserInfo> => {
  return get<UserInfo>('/auth/userinfo')
}

/**
 * 检查登录状态
 */
export const checkAuth = async (): Promise<{ logged_in: boolean; username?: string }> => {
  try {
    const result = await get<{ logged_in: boolean; username?: string }>('/auth/check')
    return result || { logged_in: false }
  } catch {
    return { logged_in: false }
  }
}

/**
 * 获取当前用户菜单
 */
export const getMyMenus = async () => {
  return get<any>('/permissions/my/menus')
}

/**
 * 获取当前用户权限
 */
export const getMyPermissions = async (): Promise<string[]> => {
  return get<string[]>('/permissions/my')
}
