import { createRouter, createWebHistory } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import Layout from '../components/Layout.vue'
import { useUserStore } from '@/stores/user'
import { getStorage } from '@/utils'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('../views/Home.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'gateway',
        name: 'Gateway',
        component: () => import('../views/Gateway.vue'),
        meta: { requiresAuth: true, permission: 'gateway:read' }
      },
      {
        path: 'microservice',
        name: 'Microservice',
        component: () => import('../views/Microservice.vue'),
        meta: { requiresAuth: true, permission: 'microservice:read' }
      },
      {
        path: 'tools',
        name: 'Tools',
        component: () => import('../views/Tools.vue'),
        meta: { requiresAuth: true, permission: 'tool:read' }
      },
      {
        path: 'chat',
        name: 'Chat',
        component: () => import('../views/Chat.vue'),
        meta: { requiresAuth: true }
      },
      // 系统管理
      {
        path: 'system/user',
        name: 'User',
        component: () => import('../views/system/User.vue'),
        meta: { requiresAuth: true, permission: 'user:read' }
      },
      {
        path: 'system/role',
        name: 'Role',
        component: () => import('../views/system/Role.vue'),
        meta: { requiresAuth: true, permission: 'role:read' }
      },
      {
        path: 'system/business-line',
        name: 'BusinessLine',
        component: () => import('../views/system/BusinessLine.vue'),
        meta: { requiresAuth: true, permission: 'business_line:manage' }
      },
      {
        path: 'system/usage',
        name: 'Usage',
        component: () => import('../views/system/Usage.vue'),
        meta: { requiresAuth: true, permission: 'admin:usage' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/home'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()

  // 检查 localStorage 中的 token（防止 axios 已清除但 Pinia 未同步）
  const localToken = getStorage<string>('token')

  console.log(
    '[Router] Navigation to:',
    to.path,
    'localToken:',
    !!localToken,
    'isLoggedIn:',
    userStore.isLoggedIn
  )

  // 不需要认证的页面
  if (to.meta['requiresAuth'] === false) {
    // 登录页：只有 localStorage 中有 token 时才检查是否已登录
    if (to.path === '/login' && localToken && userStore.isLoggedIn) {
      console.log('[Router] Already logged in, redirect to home')
      next('/')
      return
    }
    console.log('[Router] No auth required, proceed')
    next()
    return
  }

  // 需要认证的页面，但没有 token
  if (!localToken) {
    console.log('[Router] No token, redirect to login')
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  // 需要认证的页面，有 token 但 Pinia 状态未初始化
  if (!userStore.isLoggedIn) {
    console.log('[Router] Token exists but Pinia not initialized, calling init...')
    const initialized = await userStore.init()
    console.log('[Router] Init result:', initialized)
    if (!initialized) {
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }
  }

  // 检查权限
  const permission = to.meta['permission'] as string | undefined
  if (permission && !userStore.hasPermission(permission)) {
    console.log('[Router] No permission:', permission)
    Message.warning({
      content: `您没有访问该页面的权限 (${permission})`,
      duration: 3000
    })
    next('/')
    return
  }

  console.log('[Router] Auth check passed, proceed')
  next()
})

export default router
