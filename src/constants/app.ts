/**
 * 应用配置常量
 */

// 应用名称
export const APP_NAME = 'AI MCP Gateway'

// 应用版本
export const APP_VERSION = '1.0.0'

// 默认后端地址
export const DEFAULT_API_BASE_URL = `http://${window.location.hostname}:8777`

// 默认网关 Key
export const DEFAULT_GATEWAY_KEY = 'gw-test-api-key-001'

// Storage Keys
export const STORAGE_KEYS = {
  CONFIG: 'config',
  THEME: 'theme',
  LANGUAGE: 'language'
} as const

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
} as const
