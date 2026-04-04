/**
 * 配置 Store - 应用配置状态管理
 */
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { getStorage, setStorage } from '@/utils'
import { DEFAULT_API_BASE_URL, DEFAULT_GATEWAY_KEY, STORAGE_KEYS } from '@/constants'
import type { ChatConfigForm } from '@/types'

export const useConfigStore = defineStore('config', () => {
  const savedConfig = getStorage<ChatConfigForm>(STORAGE_KEYS.CONFIG)

  const config = ref<ChatConfigForm>(
    savedConfig || {
      apiBaseUrl: DEFAULT_API_BASE_URL,
      gatewayKey: DEFAULT_GATEWAY_KEY,
      llmConfigId: '',
      selectedMicroservices: []
    }
  )

  // 主题
  const theme = ref<'light' | 'dark'>(getStorage<'light' | 'dark'>(STORAGE_KEYS.THEME) || 'light')

  // 监听配置变化，自动保存
  watch(
    config,
    newVal => {
      setStorage(STORAGE_KEYS.CONFIG, newVal)
    },
    { deep: true }
  )

  watch(theme, newVal => {
    setStorage(STORAGE_KEYS.THEME, newVal)
    // 应用主题
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
