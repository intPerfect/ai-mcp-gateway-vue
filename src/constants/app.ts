/**
 * 应用配置常量
 */

// 应用名称
export const APP_NAME = 'AI MCP Gateway'

// 应用版本
export const APP_VERSION = '1.0.0'

// 默认后端地址
export const DEFAULT_API_BASE_URL = `http://${window.location.hostname}:8777`

// 默认网关 Key (商品服务)
export const DEFAULT_GATEWAY_KEY = 'sk-defaultkey001:Xy7zA1b2C3d4E5f6G7h8I9j0KlMnOpQrStUvWxYz'

// OA 网关 Key
export const OA_GATEWAY_KEY = 'sk-oakey001:Xy7zA1b2C3d4E5f6G7h8I9j0KlMnOpQrStUvWxYz'

// 注意: LLM配置现在从后端获取，不再使用硬编码的DEFAULT_LLM_KEY
// v10.0: LLM配置统一管理，通过网关-LLM绑定关系获取可用配置

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
