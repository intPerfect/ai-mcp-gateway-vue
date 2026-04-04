import { get, post } from './request'

export interface UsageStats {
  total_keys: number
  total_calls: number
  active_keys: number
  top_usage: Array<{
    gateway_id: string
    key_id: string
    count: number
    ttl: number
  }>
}

export interface KeyUsage {
  gateway_id: string
  key_id: string
  key_preview: string
  rate_limit: number
  current_count: number
  remaining: number
  ttl_seconds: number
  window_hours: number
}

export interface UsageLog {
  id: number
  gateway_id: string
  key_id: string
  session_id: string | null
  call_type: string
  call_detail: string | null
  call_time: string
  success: number
}

export interface UsageLogsResponse {
  total: number
  page: number
  page_size: number
  items: UsageLog[]
}

export const getUsageStats = async (): Promise<UsageStats> => {
  const result = await get<UsageStats>('/admin/usage/stats')
  return (
    result || {
      total_keys: 0,
      total_calls: 0,
      active_keys: 0,
      top_usage: []
    }
  )
}

export const getKeyUsageList = async (gatewayId?: string): Promise<KeyUsage[]> => {
  const params = gatewayId ? `?gateway_id=${gatewayId}` : ''
  const result = await get<KeyUsage[]>(`/admin/usage/keys${params}`)
  return result || []
}

export const getUsageLogs = async (params: {
  gateway_id?: string
  key_id?: string
  call_type?: string
  page?: number
  page_size?: number
}): Promise<UsageLogsResponse> => {
  const query = new URLSearchParams()
  if (params.gateway_id) query.append('gateway_id', params.gateway_id)
  if (params.key_id) query.append('key_id', params.key_id)
  if (params.call_type) query.append('call_type', params.call_type)
  if (params.page) query.append('page', String(params.page))
  if (params.page_size) query.append('page_size', String(params.page_size))

  const result = await get<UsageLogsResponse>(`/admin/usage/logs?${query.toString()}`)
  return result || { total: 0, page: 1, page_size: 20, items: [] }
}

export const resetUsageCount = async (gatewayId: string, keyId: string): Promise<void> => {
  await post(`/admin/usage/reset?gateway_id=${gatewayId}&key_id=${keyId}`, {})
}
