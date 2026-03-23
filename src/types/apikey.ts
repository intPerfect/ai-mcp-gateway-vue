/**
 * API Key 相关类型定义
 */

export interface ApiKeyInfo {
  key_id: string
  key_name: string
  api_key: string
  secret_key: string
  status: number
  create_time: string
  expire_time?: string
}

export interface GatewayKeyInfo {
  gateway_id: string
  gateway_name: string
  gateway_key: string
  status: number
  create_time: string
  tool_count: number
}

export interface CreateApiKeyParams {
  key_name: string
  expire_days: number
}
