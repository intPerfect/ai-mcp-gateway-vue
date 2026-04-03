// 管理后台 API 调用
import { get, post, del } from './request'

// ============ API Key 管理 ============

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

export interface ApiKeysResponse {
  user_keys: ApiKeyInfo[]
  gateway_keys: GatewayKeyInfo[]
}

export const getUserApiKeys = async (): Promise<ApiKeyInfo[]> => {
  const result = await get<ApiKeysResponse>('/apikeys')
  return result?.user_keys || []
}

export const getGatewayApiKeys = async (): Promise<GatewayKeyInfo[]> => {
  const result = await get<ApiKeysResponse>('/apikeys')
  return result?.gateway_keys || []
}

export const createUserApiKey = async (data: {
  key_name: string
  expire_days: number
}): Promise<ApiKeyInfo> => {
  return post<ApiKeyInfo>('/apikeys', data)
}

export const deleteApiKey = async (keyId: string): Promise<void> => {
  await del<void>(`/apikeys/${keyId}`)
}

// ============ 工具管理 ============

export interface ToolInfo {
  name: string
  description: string
  input_schema: any
  status: string
  http_url?: string
  error?: string
}

export interface ToolsResponse {
  total: number
  tools: ToolInfo[]
}

export const getTools = async (): Promise<{ total: number; tools: ToolInfo[] }> => {
  const result = await get<ToolsResponse>('/tools')
  return result || { total: 0, tools: [] }
}

export interface ReloadResult {
  loaded: number
  failed: number
}

export const reloadTools = async (): Promise<{ loaded: number; failed: number }> => {
  const result = await post<ReloadResult>('/tools/reload')
  return result || { loaded: 0, failed: 0 }
}

export interface HealthCheckResult {
  healthy: boolean
  message: string
}

export const checkToolHealth = async (
  toolName: string
): Promise<{ healthy: boolean; message: string }> => {
  const result = await post<HealthCheckResult>(`/tools/${toolName}/check`)
  return result || { healthy: false, message: '检查失败' }
}

export interface ImportResult {
  imported: number
}

export const importOpenAPI = async (data: {
  service_name: string
  service_url: string
  openapi_url?: string
}): Promise<{ imported: number }> => {
  const result = await post<ImportResult>('/openapi/import', data)
  return result || { imported: 0 }
}

export interface PreviewTool {
  name: string
  method: string
  path: string
}

export interface PreviewResult {
  tools: PreviewTool[]
}

export const previewOpenAPI = async (
  openapiUrl: string,
  serviceUrl: string
): Promise<{ tools: Array<{ name: string; method: string; path: string }> }> => {
  const result = await get<PreviewResult>(
    `/openapi/preview?openapi_url=${encodeURIComponent(openapiUrl)}&service_url=${encodeURIComponent(serviceUrl)}`
  )
  return result || { tools: [] }
}

// ============ 统计信息 ============

export interface StatsInfo {
  total_tools: number
  healthy_tools: number
  total_sessions: number
  total_messages: number
}

export const getStats = async (): Promise<StatsInfo> => {
  const result = await get<StatsInfo>('/stats')
  return (
    result || {
      total_tools: 0,
      healthy_tools: 0,
      total_sessions: 0,
      total_messages: 0
    }
  )
}
