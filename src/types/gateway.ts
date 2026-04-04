/**
 * Gateway 相关类型定义
 */

// 网关配置
export interface Gateway {
  id: number
  gateway_id: string
  gateway_name: string
  gateway_desc: string | null
  version: string
  auth: number
  status: number
  create_time: string | null
}

export interface GatewayCreate {
  gateway_id: string
  gateway_name: string
  gateway_desc?: string
  version?: string
  auth?: number
}

export interface GatewayUpdate {
  gateway_name?: string
  gateway_desc?: string
  version?: string
  auth?: number
  status?: number
}

// 网关 Key
export interface GatewayKey {
  id: number
  gateway_id: string
  key_id: string
  key_preview: string
  rate_limit: number
  expire_time: string | null
  remark: string | null
  status: number
  create_time: string | null
}

export interface GatewayKeyCreate {
  gateway_id: string
  rate_limit?: number
  expire_days?: number
  remark?: string
}

export interface GatewayKeyResult {
  id: number
  gateway_id: string
  api_key: string
  key_preview: string
  expire_time: string
  message: string
}

// LLM 配置 (v10.0 统一)
export interface LlmConfig {
  id: number
  config_id: string
  config_name: string
  api_type: string // openai/anthropic
  base_url: string
  model_name: string
  description: string | null
  status: number
  create_time: string | null
}

export interface LlmConfigCreate {
  config_name: string
  api_type: string
  base_url: string
  model_name: string
  api_key: string
  description?: string
}

export interface LlmConfigUpdate {
  config_name?: string
  api_type?: string
  base_url?: string
  model_name?: string
  api_key?: string
  description?: string
  status?: number
}

// 网关-LLM绑定
export interface GatewayLlmBind {
  gateway_id: string
  llm_config_ids: string[]
}

// 对话用 LLM 配置信息
export interface LlmConfigInfo {
  config_id: string
  config_name: string
  api_type: string
  model_name: string
  description: string | null
}
