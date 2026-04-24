/**
 * 应用配置常量
 */

// 应用名称
export const APP_NAME = 'AI MCP Gateway'

// 应用版本
export const APP_VERSION = '1.0.0'

// 默认后端地址
export const DEFAULT_API_BASE_URL = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:8998`

// 默认网关 Key (商品服务) — 从 .env 读取，生产环境不应包含
export const DEFAULT_GATEWAY_KEY = import.meta.env.VITE_DEFAULT_GATEWAY_KEY || ''

// OA 网关 Key — 从 .env 读取，生产环境不应包含
export const OA_GATEWAY_KEY = import.meta.env.VITE_OA_GATEWAY_KEY || ''

// 按角色映射的默认网关 Key（开发环境 mock 数据）
export const ROLE_GATEWAY_KEYS: Record<string, string> = {
  SUPER_ADMIN: import.meta.env.VITE_DEFAULT_GATEWAY_KEY || '',
  OA_ADMIN: import.meta.env.VITE_OA_ADMIN_KEY || import.meta.env.VITE_OA_GATEWAY_KEY || '',
  PRODUCT_ADMIN: import.meta.env.VITE_PRODUCT_ADMIN_KEY || import.meta.env.VITE_DEFAULT_GATEWAY_KEY || '',
  OA_USER: import.meta.env.VITE_OA_USER_KEY || import.meta.env.VITE_OA_GATEWAY_KEY || '',
  PRODUCT_USER: import.meta.env.VITE_PRODUCT_USER_KEY || import.meta.env.VITE_DEFAULT_GATEWAY_KEY || '',
}

// 注意: LLM配置现在从后端获取，不再使用硬编码的DEFAULT_LLM_KEY
// v10.0: LLM配置统一管理，通过网关-LLM绑定关系获取可用配置

// Storage Keys（仅保留实际使用的 key）
export const STORAGE_KEYS = {
  THEME: 'theme'
} as const

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
} as const
