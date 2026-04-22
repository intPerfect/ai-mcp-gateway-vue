/**
 * Chat Store - 对话状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ChatMessage, ToolInfo } from '@/types'

export const useChatStore = defineStore('chat', () => {
  // 状态
  const messages = ref<ChatMessage[]>([])
  const tools = ref<ToolInfo[]>([])
  const connected = ref(false)
  const connecting = ref(false)
  const sending = ref(false)
  const loading = ref(false)
  const sessionId = ref('')

  // 计算属性
  const hasMessages = computed(() => messages.value.length > 0)
  const toolCount = computed(() => tools.value.length)

  // 方法
  function addMessage(message: ChatMessage) {
    messages.value.push(message)
  }

  function clearMessages() {
    messages.value = []
  }

  function setTools(newTools: ToolInfo[]) {
    tools.value = newTools
  }

  function setConnected(value: boolean) {
    connected.value = value
  }

  function setConnecting(value: boolean) {
    connecting.value = value
  }

  function setSending(value: boolean) {
    sending.value = value
  }

  function setLoading(value: boolean) {
    loading.value = value
  }

  function setSessionId(id: string) {
    sessionId.value = id
  }

  function getLastMessage(): ChatMessage | null {
    return messages.value.length > 0 ? messages.value[messages.value.length - 1] : null
  }

  return {
    messages,
    tools,
    connected,
    connecting,
    sending,
    loading,
    sessionId,
    hasMessages,
    toolCount,
    addMessage,
    clearMessages,
    setTools,
    setConnected,
    setConnecting,
    setSending,
    setLoading,
    setSessionId,
    getLastMessage
  }
})
