/**
 * Gateway 管理 API
 */
import { get, post, put, del } from './request'
import type {
  Gateway,
  GatewayCreate,
  GatewayUpdate,
  GatewayKey,
  GatewayKeyCreate,
  GatewayKeyResult,
  LlmConfig,
  LlmConfigCreate,
  LlmConfigUpdate,
  Microservice
} from '@/types'

// ============================================
// 网关配置 API
// ============================================

/**
 * 获取网关列表
 */
export function getGateways(): Promise<Gateway[]> {
  return get<Gateway[]>('/gateways')
}

/**
 * 创建网关
 */
export function createGateway(data: GatewayCreate): Promise<Gateway> {
  return post<Gateway>('/gateways', data)
}

/**
 * 更新网关
 */
export function updateGateway(id: number, data: GatewayUpdate): Promise<Gateway> {
  return put<Gateway>(`/gateways/${id}`, data)
}

/**
 * 删除网关
 */
export function deleteGateway(id: number): Promise<void> {
  return del<void>(`/gateways/${id}`)
}

// ============================================
// 网关 Key API
// ============================================

/**
 * 获取网关Key列表
 */
export function getGatewayKeys(): Promise<GatewayKey[]> {
  return get<GatewayKey[]>('/gateway-keys')
}

/**
 * 创建网关Key（返回完整Key，仅此一次）
 */
export function createGatewayKey(data: GatewayKeyCreate): Promise<GatewayKeyResult> {
  return post<GatewayKeyResult>('/gateway-keys', data)
}

/**
 * 删除网关Key
 */
export function deleteGatewayKey(id: number): Promise<void> {
  return del<void>(`/gateway-keys/${id}`)
}

/**
 * 更新网关Key信息
 */
export function updateGatewayKey(id: number, data: Record<string, unknown>): Promise<void> {
  return put<void>(`/gateway-keys/${id}`, data)
}

// ============================================
// LLM 配置 API (v10.0)
// ============================================

/**
 * 获取LLM配置列表
 */
export function getLlmConfigs(): Promise<LlmConfig[]> {
  return get<LlmConfig[]>('/llm-configs')
}

/**
 * 创建LLM配置
 */
export function createLlmConfig(data: LlmConfigCreate): Promise<LlmConfig> {
  return post<LlmConfig>('/llm-configs', data)
}

/**
 * 更新LLM配置
 */
export function updateLlmConfig(id: number, data: LlmConfigUpdate): Promise<LlmConfig> {
  return put<LlmConfig>(`/llm-configs/${id}`, data)
}

/**
 * 删除LLM配置
 */
export function deleteLlmConfig(id: number): Promise<void> {
  return del<void>(`/llm-configs/${id}`)
}

// ============================================
// 网关-LLM绑定 API (v10.0)
// ============================================

/**
 * 获取网关绑定的LLM配置列表
 */
export function getGatewayLlms(gatewayId: string): Promise<LlmConfig[]> {
  return get<LlmConfig[]>(`/gateways/${gatewayId}/llms`)
}

/**
 * 绑定LLM配置到网关
 */
export function bindLlmToGateway(gatewayId: string, llmConfigId: string): Promise<void> {
  return post<void>(`/gateways/${gatewayId}/llms`, { llm_config_id: llmConfigId })
}

/**
 * 解绑LLM配置
 */
export function unbindLlmFromGateway(gatewayId: string, llmConfigId: string): Promise<void> {
  return del<void>(`/gateways/${gatewayId}/llms/${llmConfigId}`)
}

// ============================================
// 网关-微服务绑定 API
// ============================================

/**
 * 获取网关绑定的微服务列表
 */
export function getGatewayMicroservices(gatewayId: string): Promise<Microservice[]> {
  return get<Microservice[]>(`/gateways/${gatewayId}/microservices`)
}

/**
 * 设置网关绑定的微服务（覆盖）
 */
export function setGatewayMicroservices(
  gatewayId: string,
  microserviceIds: number[]
): Promise<void> {
  return put<void>(`/gateways/${gatewayId}/microservices`, { microservice_ids: microserviceIds })
}
