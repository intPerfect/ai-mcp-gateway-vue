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
  Llm,
  LlmCreate,
  LlmUpdate,
  LlmKey,
  LlmKeyCreate,
  LlmKeyResult,
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

// ============================================
// LLM 配置 API
// ============================================

/**
 * 获取LLM列表
 */
export function getLlms(): Promise<Llm[]> {
  return get<Llm[]>('/llms')
}

/**
 * 创建LLM配置
 */
export function createLlm(data: LlmCreate): Promise<Llm> {
  return post<Llm>('/llms', data)
}

/**
 * 更新LLM配置
 */
export function updateLlm(id: number, data: LlmUpdate): Promise<Llm> {
  return put<Llm>(`/llms/${id}`, data)
}

/**
 * 删除LLM配置
 */
export function deleteLlm(id: number): Promise<void> {
  return del<void>(`/llms/${id}`)
}

// ============================================
// LLM Key API
// ============================================

/**
 * 获取LLM Key列表
 */
export function getLlmKeys(): Promise<LlmKey[]> {
  return get<LlmKey[]>('/llm-keys')
}

/**
 * 创建LLM Key（返回完整Key，仅此一次）
 */
export function createLlmKey(data: LlmKeyCreate): Promise<LlmKeyResult> {
  return post<LlmKeyResult>('/llm-keys', data)
}

/**
 * 删除LLM Key
 */
export function deleteLlmKey(id: number): Promise<void> {
  return del<void>(`/llm-keys/${id}`)
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
