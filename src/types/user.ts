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
  managed_business_lines: BusinessLineInfo[]
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
  is_admin: boolean
  create_time: string | null
}

// 权限信息
export interface PermissionInfo {
  id: number
  permission_code: string
  permission_name: string
  resource_id: number
  resource_name: string | null
  action: string
  description: string | null
  status: number
}

// 资源信息
export interface ResourceInfo {
  id: number
  resource_code: string
  resource_name: string
  resource_type: string
  parent_id: number
  api_path: string | null
  icon: string | null
  sort_order: number
  status: number
  children: ResourceInfo[]
}

// 权限树节点
export interface PermissionTreeNode {
  id: number
  code: string
  name: string
  resource_id: number
  resource_name: string
  action: string
  checked: boolean
}

// 资源权限分组
export interface ResourcePermissionGroup {
  resource_id: number
  resource_code: string
  resource_name: string
  permissions: PermissionTreeNode[]
}

// 数据权限树节点
export interface DataScopeTreeNode {
  id: string
  name: string
  type: 'business_line' | 'microservice' | 'gateway'
  parent_id: string | null
  children: DataScopeTreeNode[]
  checked: boolean
}

// 数据权限选项
export interface DataScopeOptions {
  business_lines: string[]
  gateways: Array<{ id: string; name: string }>
  microservices: Array<{ id: number; name: string; business_line: string | null }>
}

// 网关权限配置
export interface GatewayPermission {
  gateway_id: string
  gateway_name: string
  business_line_id?: number | null
  business_line_name?: string | null
  can_create: boolean
  can_read: boolean
  can_update: boolean
  can_delete: boolean
  can_chat: boolean
  // 以下字段用于表格显示，后端不返回
  key?: string
  name?: string
}

// 网关权限树节点（按业务线分组）
export interface GatewayPermissionTree {
  business_line_id: number
  business_line_name: string
  gateways: GatewayPermission[]
}

// 微服务权限配置
export interface MicroservicePermission {
  microservice_id: number
  microservice_name: string
  gateway_id: string
  gateway_name: string
  can_create: boolean
  can_read: boolean
  can_update: boolean
  can_delete: boolean
  can_chat: boolean
}
