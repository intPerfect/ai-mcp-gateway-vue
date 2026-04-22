/**
 * OpenAPI 相关类型定义
 */

// OpenAPI 导入请求
export interface OpenAPIImportRequest {
  service_name: string
  service_url: string
  openapi_url?: string
  openapi_spec?: Record<string, unknown>
  microservice_id: number
}

// 导入的工具信息
export interface ImportedTool {
  name: string
  description: string
  method: string
  path: string
  param_count: number
}

// OpenAPI 导入结果
export interface OpenAPIImportResult {
  message: string
  tools: ImportedTool[]
  imported?: number
}

// OpenAPI 预览结果
export interface OpenAPIPreviewResult {
  total: number
  tools: ImportedTool[]
}
