/**
 * OpenAPI 导入 API
 */
import { get, post } from './request'
import type { OpenAPIImportRequest, OpenAPIImportResult, OpenAPIPreviewResult } from '@/types'

/**
 * 导入OpenAPI工具
 */
export function importOpenAPI(data: OpenAPIImportRequest): Promise<OpenAPIImportResult> {
  return post<OpenAPIImportResult>('/openapi/import', data)
}

/**
 * 预览OpenAPI解析结果
 */
export function previewOpenAPI(
  openapiUrl: string,
  serviceUrl: string
): Promise<OpenAPIPreviewResult> {
  return get<OpenAPIPreviewResult>('/openapi/preview', {
    openapi_url: openapiUrl,
    service_url: serviceUrl
  })
}
