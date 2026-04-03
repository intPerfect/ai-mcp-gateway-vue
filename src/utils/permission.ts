/**
 * 权限指令
 * 用法: v-permission="'user:create'" 或 v-permission="['user:create', 'user:update']"
 */
import type { Directive, DirectiveBinding } from 'vue'
import { useUserStore } from '@/stores/user'

/**
 * 单权限检查指令
 */
export const permission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const userStore = useUserStore()
    const { value } = binding

    if (!value) return

    let hasPermission = false

    if (typeof value === 'string') {
      hasPermission = userStore.hasPermission(value)
    } else if (Array.isArray(value)) {
      hasPermission = userStore.hasAnyPermission(value)
    }

    if (!hasPermission) {
      el.parentNode?.removeChild(el)
    }
  }
}

/**
 * 角色检查指令
 * 用法: v-role="'SUPER_ADMIN'" 或 v-role="['SUPER_ADMIN', 'DEPT_ADMIN']"
 */
export const role: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const userStore = useUserStore()
    const { value } = binding

    if (!value) return

    const roles = userStore.roles
    let hasRole = false

    if (typeof value === 'string') {
      hasRole = roles.includes(value)
    } else if (Array.isArray(value)) {
      hasRole = value.some(r => roles.includes(r))
    }

    if (!hasRole) {
      el.parentNode?.removeChild(el)
    }
  }
}

// 注册全局指令
export function setupPermissionDirectives(app: any) {
  app.directive('permission', permission)
  app.directive('role', role)
}
