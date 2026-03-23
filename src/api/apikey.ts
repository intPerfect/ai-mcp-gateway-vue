/**
 * API Key 管理 API
 */
import { get, post, del } from './request'
import type { ApiKeyInfo, GatewayKeyInfo, CreateApiKeyParams } from '@/types'

/**
 * 获取用户 API Keys
 */
export function getUserApiKeys(): Promise<ApiKeyInfo[]> {
  return get<ApiKeyInfo[]>('/apikeys').then((data: unknown) => {
    const result = data as { user_keys?: ApiKeyInfo[] }
    return result.user_keys || []
  })
}

/**
 * 获取网关 API Keys
 */
export function getGatewayApiKeys(): Promise<GatewayKeyInfo[]> {
  return get<GatewayKeyInfo[]>('/apikeys').then((data: unknown) => {
    const result = data as { gateway_keys?: GatewayKeyInfo[] }
    return result.gateway_keys || []
  })
}

/**
 * 创建用户 API Key
 */
export function createUserApiKey(params: CreateApiKeyParams): Promise<ApiKeyInfo> {
  return post<ApiKeyInfo>('/apikeys', params)
}

/**
 * 删除 API Key
 */
export function deleteApiKey(keyId: string): Promise<void> {
  return del<void>(`/apikeys/${keyId}`)
}
