/**
 * 微服务管理 API
 */
import { get, post, put, del } from './request'
import type {
  Microservice,
  MicroserviceCreate,
  MicroserviceUpdate,
  MicroserviceTool,
  ToolEnabledRequest,
  ToolDetail,
  ToolUpdateRequest,
  HealthCheckResult
} from '@/types'

/**
 * 获取微服务列表
 */
export function getMicroservices(): Promise<Microservice[]> {
  return get<Microservice[]>('/microservices')
}

/**
 * 创建微服务
 */
export function createMicroservice(data: MicroserviceCreate): Promise<Microservice> {
  return post<Microservice>('/microservices', data)
}

/**
 * 更新微服务
 */
export function updateMicroservice(id: number, data: MicroserviceUpdate): Promise<Microservice> {
  return put<Microservice>(`/microservices/${id}`, data)
}

/**
 * 删除微服务
 */
export function deleteMicroservice(id: number): Promise<void> {
  return del<void>(`/microservices/${id}`)
}

/**
 * 微服务健康检查
 */
export function checkMicroserviceHealth(id: number): Promise<HealthCheckResult> {
  return post<HealthCheckResult>(`/microservices/${id}/check`)
}

/**
 * 获取微服务的工具列表
 */
export function getMicroserviceTools(id: number): Promise<MicroserviceTool[]> {
  return get<MicroserviceTool[]>(`/microservices/${id}/tools`)
}

/**
 * 获取所有工具列表
 */
export function getAllTools(): Promise<MicroserviceTool[]> {
  return get<MicroserviceTool[]>('/tools/all')
}

/**
 * 更新工具启用状态
 */
export function updateToolEnabled(toolId: number, data: ToolEnabledRequest): Promise<void> {
  return put<void>(`/tools/${toolId}/enabled`, data)
}

/**
 * 删除工具
 */
export function deleteTool(toolId: number): Promise<void> {
  return del<void>(`/tools/${toolId}`)
}

/**
 * 获取工具详情（含HTTP配置和参数映射）
 */
export function getToolDetail(toolId: number): Promise<ToolDetail> {
  return get<ToolDetail>(`/tools/${toolId}/detail`)
}

/**
 * 更新工具信息（含HTTP配置和参数映射）
 */
export function updateTool(toolId: number, data: ToolUpdateRequest): Promise<void> {
  return put<void>(`/tools/${toolId}`, data)
}
