/**
 * 微服务相关类型定义
 */

export type HealthStatus = 'healthy' | 'unhealthy' | 'unknown'
export type CallStatus = 'sunny' | 'cloudy' | 'rainy'

export interface Microservice {
  id: number
  name: string
  http_base_url: string
  description: string
  business_line: string
  health_status: HealthStatus
  last_check_time: string | null
  status: number
  tool_count?: number
  create_time: string
  update_time: string
}

export interface MicroserviceCreate {
  name: string
  http_base_url: string
  description?: string
  business_line?: string
}

export interface MicroserviceUpdate {
  name?: string
  http_base_url?: string
  description?: string
  business_line?: string
  status?: number
}

export interface MicroserviceTool {
  id: number
  tool_id: number
  tool_name: string
  tool_description: string
  microservice_id: number | null
  microservice_name: string | null
  enabled: number
  call_status: CallStatus
  last_call_time: string | null
  last_call_code: string | null
  call_count: number
  error_count: number
}

export interface ToolBindRequest {
  microservice_id: number
}

export interface ToolEnabledRequest {
  enabled: number
}

export interface HealthCheckResult {
  health_status: HealthStatus
  message: string
}
