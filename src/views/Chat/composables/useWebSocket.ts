/**
 * useWebSocket - WebSocket 连接生命周期管理
 */
import { onUnmounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useChatStore, useChatStreamingStore, useConfigStore } from '@/stores'
import { useWsMessageHandler } from './useWsMessageHandler'
import { useWsReconnect } from './useWsReconnect'

export function useWebSocket() {
  const chatStore = useChatStore()
  const streamingStore = useChatStreamingStore()
  const configStore = useConfigStore()
  const { handleMessage } = useWsMessageHandler()

  let websocket: WebSocket | null = null

  const { reconnecting, scheduleReconnect, markIntentional, getIntentionalDisconnect, reset: resetReconnect } = useWsReconnect({
    onReconnect: () => connect()
  })

  const getWsBaseUrl = () => {
    const envWsUrl = import.meta.env.VITE_WS_URL
    if (envWsUrl) return envWsUrl
    const apiBase = configStore.config.apiBaseUrl
    return apiBase.replace(/^http/, 'ws')
  }

  const connect = async (): Promise<boolean> => {
    if (chatStore.connecting || chatStore.connected) return false

    chatStore.setConnecting(true)

    try {
      const sessionResponse = await fetch(`${configStore.config.apiBaseUrl}/api/chat/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway_key: configStore.config.gatewayKey,
          llm_config_id: configStore.config.llmConfigId,
          microservice_ids: configStore.config.selectedMicroservices
        })
      })

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json()
        throw new Error(errorData.detail || '验证失败')
      }

      const sessionData = await sessionResponse.json()
      chatStore.setSessionId(sessionData.session_id)
      const wsPath = sessionData.websocket_url

      const wsBaseUrl = getWsBaseUrl()
      const wsUrl = `${wsBaseUrl}${wsPath}`
      websocket = new WebSocket(wsUrl)

      return new Promise(resolve => {
        websocket!.onopen = () => {
          chatStore.setConnected(true)
          chatStore.setConnecting(false)
          resetReconnect()
          Message.success('连接成功')
          resolve(true)
        }

        websocket!.onmessage = event => {
          handleMessage(JSON.parse(event.data))
        }

        websocket!.onerror = () => {
          Message.error('连接失败')
          chatStore.setConnecting(false)
          chatStore.setConnected(false)
          resolve(false)
        }

        websocket!.onclose = () => {
          chatStore.setConnected(false)
          chatStore.setConnecting(false)
          if (!getIntentionalDisconnect()) {
            scheduleReconnect()
          }
        }
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      Message.error('连接失败：' + errorMessage)
      chatStore.setConnecting(false)
      return false
    }
  }

  const disconnect = () => {
    markIntentional()
    if (websocket) {
      websocket.close()
      websocket = null
    }
    chatStore.setConnected(false)
    chatStore.setTools([])
    streamingStore.resetAll()
  }

  const send = (data: unknown): boolean => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify(data))
      return true
    }
    return false
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    websocket,
    reconnecting,
    connect,
    disconnect,
    send
  }
}
