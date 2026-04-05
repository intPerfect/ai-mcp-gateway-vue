/**
 * 存储工具函数
 * 所有 key 自动添加 mcp_gateway_ 前缀，避免与其他应用冲突。
 * 仅用于登录信息（token / user_info）和主题偏好（theme）的持久化。
 */

const STORAGE_PREFIX = 'mcp_gateway_'

/**
 * 获取本地存储
 */
export function getStorage<T>(key: string, defaultValue?: T): T | null {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key)
    if (item === null) return defaultValue ?? null
    return JSON.parse(item) as T
  } catch {
    return defaultValue ?? null
  }
}

/**
 * 设置本地存储
 */
export function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch (e) {
    console.error('Storage set error:', e)
  }
}

/**
 * 移除本地存储
 */
export function removeStorage(key: string): void {
  localStorage.removeItem(STORAGE_PREFIX + key)
}
