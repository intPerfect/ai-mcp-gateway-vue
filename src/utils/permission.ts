/**
 * 权限指令
 * 用法: v-permission="'user:create'" 或 v-permission="['user:create', 'user:update']"
 */
import type { Directive, DirectiveBinding } from 'vue'
import { useUserStore } from '@/stores/user'

/**
 * 检查权限辅助函数
 */
function checkPermission(el: HTMLElement, binding: DirectiveBinding) {
  const userStore = useUserStore()
  const { value } = binding

  if (!value) return

  let hasPerm = false

  if (typeof value === 'string') {
    hasPerm = userStore.hasPermission(value)
  } else if (Array.isArray(value)) {
    hasPerm = userStore.hasAnyPermission(value)
  }

  if (!hasPerm) {
    el.style.display = 'none'
  } else {
    el.style.display = ''
  }
}

/**
 * 单权限检查指令
 */
export const permission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    checkPermission(el, binding)
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    checkPermission(el, binding)
  }
}

/**
 * 检查角色辅助函数
 */
function checkRole(el: HTMLElement, binding: DirectiveBinding) {
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
    el.style.display = 'none'
  } else {
    el.style.display = ''
  }
}

/**
 * 角色检查指令
 * 用法: v-role="'SUPER_ADMIN'" 或 v-role="['SUPER_ADMIN', 'DEPT_ADMIN']"
 */
export const role: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    checkRole(el, binding)
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    checkRole(el, binding)
  }
}

// 注册全局指令
export function setupPermissionDirectives(app: any) {
  app.directive('permission', permission)
  app.directive('role', role)
}
