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
  business_line_id?: number
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
  business_line_id?: number
}

export interface MicroserviceUpdate {
  name?: string
  http_base_url?: string
  description?: string
  business_line_id?: number
  status?: number
}

export interface MicroserviceTool {
  id: number
  tool_id: number
  tool_name: string
  tool_description: string
  microservice_id: number | null
  microservice_name: string | null
  business_line: string
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

export interface ToolHttpConfig {
  http_url: string
  http_method: string
  http_headers: string | null
  timeout: number
  retry_times: number
}

export interface ToolParameterMapping {
  id?: number
  param_location: string // path/query/body/form/header/file
  field_name: string
  field_type: string // string/integer/number/boolean/array/object
  field_desc: string
  is_required: number // 0/1
  default_value: string | null
  enum_values: string | null
  example_value: string | null
  sort_order: number
}

export interface ToolDetail {
  tool_id: number
  tool_name: string
  tool_description: string
  protocol_id: number
  http_config: ToolHttpConfig | null
  parameters: ToolParameterMapping[]
}

export interface ToolUpdateRequest {
  tool_name?: string
  tool_description?: string
  http_config?: Partial<ToolHttpConfig>
  parameters?: ToolParameterMapping[]
}

export interface HealthCheckResult {
  health_status: HealthStatus
  message: string
}
