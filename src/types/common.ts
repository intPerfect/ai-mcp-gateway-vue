/**
 * 通用类型定义
 */

// 通用 API 响应结构
export interface ApiResponse<T = unknown> {
  code: string
  info?: string
  data: T
}

// 分页参数
export interface PaginationParams {
  page: number
  pageSize: number
}

// 分页响应
export interface PaginationResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
