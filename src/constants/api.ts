/**
 * API 相关常量
 */

// API 响应码
export const API_CODE = {
  SUCCESS: '0000',
  ERROR: '9999',
  UNAUTHORIZED: '1001',
  FORBIDDEN: '1003',
  NOT_FOUND: '1004'
} as const

// HTTP 状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500
} as const

// 请求超时时间（毫秒）
export const REQUEST_TIMEOUT = 30000

// API 基础路径
export const API_BASE_URL = '/api'
