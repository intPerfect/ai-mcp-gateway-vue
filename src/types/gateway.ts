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

// LLM 配置
export interface Llm {
  id: number
  llm_id: string
  llm_name: string
  llm_type: string
  base_url: string
  default_model: string | null
  description: string | null
  status: number
  create_time: string | null
}

export interface LlmCreate {
  llm_id: string
  llm_name: string
  llm_type: string
  base_url: string
  default_model?: string
  description?: string
}

export interface LlmUpdate {
  llm_name?: string
  llm_type?: string
  base_url?: string
  default_model?: string
  description?: string
  status?: number
}

// LLM Key
export interface LlmKey {
  id: number
  llm_id: string
  key_id: string
  key_preview: string
  rate_limit: number
  expire_time: string | null
  remark: string | null
  status: number
  create_time: string | null
}

export interface LlmKeyCreate {
  llm_id: string
  rate_limit?: number
  expire_days?: number
  remark?: string
}

export interface LlmKeyResult {
  id: number
  llm_id: string
  llm_key: string
  key_preview: string
  expire_time: string
  message: string
}
