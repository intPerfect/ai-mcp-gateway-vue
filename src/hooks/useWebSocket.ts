/**
 * WebSocket 连接管理 Hook
 */
import { ref, onUnmounted } from 'vue'
import type { WsMessage, WsConnectionStatus, ChatConfigForm } from '@/types'

export function useWebSocket() {
  const ws = ref<WebSocket | null>(null)
  const status = ref<WsConnectionStatus>('disconnected')
  const sessionId = ref('')

  const connect = async (
    config: ChatConfigForm,
    onMessage: (data: WsMessage) => void,
    onTools?: (tools: unknown[]) => void
  ): Promise<boolean> => {
    if (status.value === 'connecting' || status.value === 'connected') {
      return false
    }

    status.value = 'connecting'

    try {
      const sessionResponse = await fetch(`${config.apiBaseUrl}/api/chat/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway_key: config.gatewayKey,
          llm_config_id: config.llmConfigId,
          microservice_ids: config.selectedMicroservices
        })
      })

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json()
        throw new Error(errorData.detail || '验证失败')
      }

      const sessionData = await sessionResponse.json()
      sessionId.value = sessionData.session_id
      const wsPath = sessionData.websocket_url

      // 连接 WebSocket
      const wsUrl = `ws://${window.location.hostname}:8777${wsPath}`
      ws.value = new WebSocket(wsUrl)

      return new Promise(resolve => {
        if (!ws.value) {
          status.value = 'disconnected'
          resolve(false)
          return
        }

        ws.value.onopen = () => {
          status.value = 'connected'
          resolve(true)
        }

        ws.value.onmessage = event => {
          const data = JSON.parse(event.data) as WsMessage
          if (data.type === 'welcome' && onTools) {
            onTools((data['tools'] || []) as unknown[])
          }
          onMessage(data)
        }

        ws.value.onerror = () => {
          status.value = 'error'
          resolve(false)
        }

        ws.value.onclose = () => {
          status.value = 'disconnected'
        }
      })
    } catch {
      status.value = 'error'
      return false
    }
  }

  const disconnect = () => {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
    status.value = 'disconnected'
    sessionId.value = ''
  }

  const send = (data: object): boolean => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(data))
      return true
    }
    return false
  }

  const isConnected = () => status.value === 'connected'

  onUnmounted(() => {
    disconnect()
  })

  return {
    ws,
    status,
    sessionId,
    connect,
    disconnect,
    send,
    isConnected
  }
}
