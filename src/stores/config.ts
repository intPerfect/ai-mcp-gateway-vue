/**
 * 配置 Store - 应用配置状态管理
 * 注意：配置项不持久化到 localStorage，每次从常量默认值初始化；
 *       仅 theme（界面偏好）持久化。
 */
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { getStorage, setStorage } from '@/utils'
import { DEFAULT_API_BASE_URL, DEFAULT_GATEWAY_KEY, OA_GATEWAY_KEY, STORAGE_KEYS } from '@/constants'
import { useUserStore } from '@/stores/user'
import type { ChatConfigForm } from '@/types'

export const useConfigStore = defineStore('config', () => {
  const userStore = useUserStore()

  // 根据用户角色决定默认网关 Key
  function getDefaultGatewayKey(): string {
    const roles = userStore.roles
    if (roles.includes('OA_ADMIN') || roles.includes('OA_USER')) {
      return OA_GATEWAY_KEY
    }
    return DEFAULT_GATEWAY_KEY
  }

  // 每次启动从常量初始化，不依赖 localStorage
  const config = ref<ChatConfigForm>({
    apiBaseUrl: DEFAULT_API_BASE_URL,
    gatewayKey: getDefaultGatewayKey(),
    llmConfigId: '',
    selectedMicroservices: []
  })

  // 监听用户角色变化，自动切换网关 Key（仅在用户未手动修改时生效）
  watch(
    () => userStore.roles,
    () => {
      config.value.gatewayKey = getDefaultGatewayKey()
      // 角色切换时同步清空 LLM 配置和微服务选择
      config.value.llmConfigId = ''
      config.value.selectedMicroservices = []
    }
  )

  // 主题是界面偏好，保留持久化
  const theme = ref<'light' | 'dark'>(getStorage<'light' | 'dark'>(STORAGE_KEYS.THEME) || 'light')

  watch(theme, newVal => {
    setStorage(STORAGE_KEYS.THEME, newVal)
    document.documentElement.setAttribute('data-theme', newVal)
  })

  // 方法
  function updateConfig(newConfig: Partial<ChatConfigForm>) {
    Object.assign(config.value, newConfig)
  }

  function setTheme(newTheme: 'light' | 'dark') {
    theme.value = newTheme
  }

  return {
    config,
    theme,
    updateConfig,
    setTheme
  }
})
