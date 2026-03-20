// 管理后台 API 调用

const API_BASE = '/api'

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

export const getUserApiKeys = async (): Promise<ApiKeyInfo[]> => {
  const response = await fetch(`${API_BASE}/apikeys`)
  const result = await response.json()
  if (result.code === '0000') {
    return result.data?.user_keys || []
  }
  throw new Error(result.info || '获取用户API Key失败')
}

export const getGatewayApiKeys = async (): Promise<GatewayKeyInfo[]> => {
  const response = await fetch(`${API_BASE}/apikeys`)
  const result = await response.json()
  if (result.code === '0000') {
    return result.data?.gateway_keys || []
  }
  throw new Error(result.info || '获取网关API Key失败')
}

export const createUserApiKey = async (data: {
  key_name: string
  expire_days: number
}): Promise<ApiKeyInfo> => {
  const response = await fetch(`${API_BASE}/apikeys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  const result = await response.json()
  if (result.code === '0000') {
    return result.data
  }
  throw new Error(result.info || '创建API Key失败')
}

export const deleteApiKey = async (keyId: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/apikeys/${keyId}`, {
    method: 'DELETE'
  })
  const result = await response.json()
  if (result.code !== '0000') {
    throw new Error(result.info || '删除API Key失败')
  }
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

export const getTools = async (): Promise<{ total: number; tools: ToolInfo[] }> => {
  const response = await fetch(`${API_BASE}/tools`)
  const result = await response.json()
  if (result.code === '0000') {
    return result.data || { total: 0, tools: [] }
  }
  throw new Error(result.info || '获取工具列表失败')
}

export const reloadTools = async (): Promise<{ loaded: number; failed: number }> => {
  const response = await fetch(`${API_BASE}/tools/reload`, {
    method: 'POST'
  })
  const result = await response.json()
  if (result.code === '0000') {
    return result.data || { loaded: 0, failed: 0 }
  }
  throw new Error(result.info || '刷新工具失败')
}

export const checkToolHealth = async (
  toolName: string
): Promise<{ healthy: boolean; message: string }> => {
  const response = await fetch(`${API_BASE}/tools/${toolName}/check`, {
    method: 'POST'
  })
  const result = await response.json()
  if (result.code === '0000') {
    return result.data || { healthy: false, message: '检查失败' }
  }
  throw new Error(result.info || '健康检查失败')
}

export const importOpenAPI = async (data: {
  service_name: string
  service_url: string
  openapi_url?: string
}): Promise<{ imported: number }> => {
  const response = await fetch(`${API_BASE}/openapi/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  const result = await response.json()
  if (result.code === '0000') {
    return result.data || { imported: 0 }
  }
  throw new Error(result.info || '导入OpenAPI失败')
}

export const previewOpenAPI = async (
  openapiUrl: string,
  serviceUrl: string
): Promise<{ tools: Array<{ name: string; method: string; path: string }> }> => {
  const response = await fetch(
    `${API_BASE}/openapi/preview?openapi_url=${encodeURIComponent(openapiUrl)}&service_url=${encodeURIComponent(serviceUrl)}`
  )
  const result = await response.json()
  if (result.code === '0000') {
    return result.data || { tools: [] }
  }
  throw new Error(result.info || '预览OpenAPI失败')
}

// ============ 统计信息 ============

export interface StatsInfo {
  total_tools: number
  healthy_tools: number
  total_sessions: number
  total_messages: number
}

export const getStats = async (): Promise<StatsInfo> => {
  const response = await fetch(`${API_BASE}/stats`)
  const result = await response.json()
  if (result.code === '0000') {
    return result.data || {
      total_tools: 0,
      healthy_tools: 0,
      total_sessions: 0,
      total_messages: 0
    }
  }
  throw new Error(result.info || '获取统计信息失败')
}
