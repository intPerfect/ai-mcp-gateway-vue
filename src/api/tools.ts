/**
 * 工具管理 API
 */
import { get, post } from './request'
import type {
  ToolListResponse,
  ToolHealthCheck,
  OpenAPIPreviewTool,
  OpenAPIImportParams
} from '@/types'

/**
 * 获取工具列表
 */
export function getTools(): Promise<ToolListResponse> {
  return get<ToolListResponse>('/tools')
}

/**
 * 刷新工具
 */
export function reloadTools(): Promise<{ loaded: number; failed: number }> {
  return post<{ loaded: number; failed: number }>('/tools/reload')
}

/**
 * 检查工具健康状态
 */
export function checkToolHealth(toolName: string): Promise<ToolHealthCheck> {
  return post<ToolHealthCheck>(`/tools/${toolName}/check`)
}

/**
 * 预览 OpenAPI
 */
export function previewOpenAPI(
  openapiUrl: string,
  serviceUrl: string
): Promise<{ tools: OpenAPIPreviewTool[] }> {
  return get<{ tools: OpenAPIPreviewTool[] }>(
    `/openapi/preview?openapi_url=${encodeURIComponent(openapiUrl)}&service_url=${encodeURIComponent(serviceUrl)}`
  )
}

/**
 * 导入 OpenAPI
 */
export function importOpenAPI(params: OpenAPIImportParams): Promise<{ imported: number }> {
  return post<{ imported: number }>('/openapi/import', params)
}
