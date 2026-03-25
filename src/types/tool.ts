/**
 * 工具相关类型定义
 */

export interface ToolInputSchema {
  type: string
  properties?: Record<string, unknown>
  required?: string[]
}

export interface ToolInfo {
  name: string
  description: string
  input_schema: ToolInputSchema
  status: string
  http_url?: string
  error?: string
  microservice_name?: string
}

export interface ToolListResponse {
  total: number
  tools: ToolInfo[]
}

export interface ToolHealthCheck {
  healthy: boolean
  message: string
}

export interface OpenAPIPreviewTool {
  name: string
  method: string
  path: string
}

export interface OpenAPIImportParams {
  service_name: string
  service_url: string
  openapi_url?: string
}
