/**
 * 用户相关类型定义
 */

// 用户信息
export interface UserInfo {
  id: number
  username: string
  real_name: string | null
  email: string | null
  phone: string | null
  avatar: string | null
  status: number
  roles: string[]
  role_ids: number[] // 用户角色ID列表
  permissions: string[]
  business_lines: BusinessLineInfo[]
  can_manage_users: boolean  // 是否有业务线管理员权限（基于网关权限）
  create_time: string | null
}

// 登录请求
export interface LoginRequest {
  username: string
  password: string
}

// 登录响应
export interface LoginResponse {
  token: string
  token_type: string
  expires_in: number
  user_info: UserInfo
}

// 数据权限配置
export interface DataPermissionSet {
  business_lines: string[]
  gateway_ids: string[]
  microservice_ids: number[]
  chat_access: boolean
}

// 角色信息
export interface RoleInfo {
  id: number
  role_code: string
  role_name: string
  description: string | null
  business_line_id: number | null // 所属业务线ID，NULL表示全局角色
  business_line_name: string | null // 业务线名称（前端展示用）
  is_system: number
  status: number
  permissions: string[]
  permission_ids: number[]
  data_permissions: DataPermissionSet | null
  create_time: string | null
}

// 业务线信息
export interface BusinessLineInfo {
  id: number
  line_code: string
  line_name: string
  description: string | null
  status: number
  create_time: string | null
}

// 网关权限配置
export interface GatewayPermission {
  gateway_id: string
  gateway_name: string
  business_line_names: string[]
  can_view: boolean
  can_manage_gateway: boolean
  can_delete_gateway: boolean
  can_manage_keys: boolean
  can_manage_microservices: boolean
  can_manage_tools: boolean
  can_manage_users: boolean
  can_chat: boolean
  key?: string
  name?: string
}
