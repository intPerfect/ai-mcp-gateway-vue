import { ref } from 'vue'

interface ReconnectOptions {
  maxAttempts?: number
  baseDelay?: number
  maxDelay?: number
  onReconnect: () => Promise<boolean>
}

export function useWsReconnect(options: ReconnectOptions) {
  const { maxAttempts = 10, baseDelay = 1000, maxDelay = 30000, onReconnect } = options

  const reconnecting = ref(false)
  const reconnectAttempt = ref(0)
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let intentionalDisconnect = false

  const getIntentionalDisconnect = () => intentionalDisconnect

  const markIntentional = () => {
    intentionalDisconnect = true
    cancel()
  }

  const cancel = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    reconnecting.value = false
    reconnectAttempt.value = 0
  }

  const scheduleReconnect = () => {
    if (intentionalDisconnect) return
    if (reconnectAttempt.value >= maxAttempts) {
      cancel()
      return
    }

    reconnecting.value = true
    reconnectAttempt.value++

    const delay = Math.min(baseDelay * Math.pow(2, reconnectAttempt.value - 1), maxDelay)
    const jitter = delay * (0.5 + Math.random() * 0.5)

    reconnectTimer = setTimeout(async () => {
      const success = await onReconnect()
      if (success) {
        cancel()
      } else {
        scheduleReconnect()
      }
    }, jitter)
  }

  const reset = () => {
    intentionalDisconnect = false
    cancel()
  }

  return {
    reconnecting,
    reconnectAttempt,
    scheduleReconnect,
    markIntentional,
    getIntentionalDisconnect,
    cancel,
    reset
  }
}
