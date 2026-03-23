/**
 * 统计信息 API
 */
import { get } from './request'

export interface StatsInfo {
  total_tools: number
  healthy_tools: number
  total_sessions: number
  total_messages: number
}

/**
 * 获取统计信息
 */
export function getStats(): Promise<StatsInfo> {
  return get<StatsInfo>('/stats')
}
