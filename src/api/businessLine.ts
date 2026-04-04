// 业务线管理 API 调用
import { get, post, del } from './request'

export interface BusinessLine {
  id: number
  line_code: string
  line_name: string
  description: string | null
  status: number
  create_time: string
  update_time: string
}

export const getBusinessLines = async (): Promise<BusinessLine[]> => {
  const result = await get<BusinessLine[]>('/business-lines')
  return result || []
}

export const createBusinessLine = async (data: {
  line_code: string
  line_name: string
  description?: string
}): Promise<BusinessLine> => {
  return post<BusinessLine>('/business-lines', data)
}

export const updateBusinessLine = async (
  id: number,
  data: {
    line_name?: string
    description?: string
    status?: number
  }
): Promise<BusinessLine> => {
  return post<BusinessLine>(`/business-lines/${id}`, data)
}

export const deleteBusinessLine = async (id: number): Promise<void> => {
  await del<void>(`/business-lines/${id}`)
}
