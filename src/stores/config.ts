/**
 * Config Store - 配置状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface ConfigForm {
  apiBaseUrl: string
  gatewayKey: string
  llmKey: string
}

export const useConfigStore = defineStore('config', () => {
  // 状态
  const apiBaseUrl = ref(`http://${window.location.hostname}:8777`)
  const gatewayKey = ref('gw-test-api-key-001')
  const llmKey = ref('')

  // 计算属性
  const isConfigured = computed(() => {
    return gatewayKey.value.length > 0
  })

  // 方法
  function setApiBaseUrl(url: string) {
    apiBaseUrl.value = url
  }

  function setGatewayKey(key: string) {
    gatewayKey.value = key
  }

  function setLlmKey(key: string) {
    llmKey.value = key
  }

  function updateConfig(config: Partial<ConfigForm>) {
    if (config.apiBaseUrl !== undefined) {
      apiBaseUrl.value = config.apiBaseUrl
    }
    if (config.gatewayKey !== undefined) {
      gatewayKey.value = config.gatewayKey
    }
    if (config.llmKey !== undefined) {
      llmKey.value = config.llmKey
    }
  }

  function getConfig(): ConfigForm {
    return {
      apiBaseUrl: apiBaseUrl.value,
      gatewayKey: gatewayKey.value,
      llmKey: llmKey.value
    }
  }

  return {
    // 状态
    apiBaseUrl,
    gatewayKey,
    llmKey,
    // 计算属性
    isConfigured,
    // 方法
    setApiBaseUrl,
    setGatewayKey,
    setLlmKey,
    updateConfig,
    getConfig
  }
})