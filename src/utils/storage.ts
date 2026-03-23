/**
 * 存储工具函数
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

/**
 * 清空本地存储（仅清除带前缀的）
 */
export function clearStorage(): void {
  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    if (key.startsWith(STORAGE_PREFIX)) {
      localStorage.removeItem(key)
    }
  })
}
