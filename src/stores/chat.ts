/**
 * Chat Store - 对话状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 消息内容块类型
export interface ContentBlock {
  type: 'text' | 'thinking' | 'tool_use' | 'tool_result'
  text?: string
  thinking?: string
  id?: string
  name?: string
  input?: Record<string, unknown>
  tool_use_id?: string
  content?: string
  is_error?: boolean
}

// 消息类型
export interface Message {
  role: 'user' | 'assistant'
  content: string | ContentBlock[]
  time: string
  type?: 'tool_call' | 'text'
  tool_id?: string
  tool?: string
  arguments?: string
  result?: string
  status?: 'preparing' | 'executing' | 'completed'
  streaming?: boolean
  thinkingContent?: string
}

// 工具信息
export interface ToolInfo {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

export const useChatStore = defineStore('chat', () => {
  // 状态
  const messages = ref<Message[]>([])
  const tools = ref<ToolInfo[]>([])
  const connected = ref(false)
  const connecting = ref(false)
  const sending = ref(false)
  const loading = ref(false)
  const sessionId = ref('')
  const expandedThoughts = ref<Record<string, boolean>>({})
  const thinkingMsgIndex = ref(-1)
  const currentThinkingRound = ref(0)
  const currentToolCall = ref<{ name: string; id: string; arguments: string } | null>(null)

  // 计算属性
  const hasMessages = computed(() => messages.value.length > 0)
  const toolCount = computed(() => tools.value.length)

  // 方法
  function addMessage(message: Message) {
    messages.value.push(message)
  }

  function removeMessage(index: number) {
    messages.value.splice(index, 1)
  }

  function updateMessage(index: number, updates: Partial<Message>) {
    if (messages.value[index]) {
      Object.assign(messages.value[index], updates)
    }
  }

  function getLastMessage(): Message | undefined {
    return messages.value[messages.value.length - 1]
  }

  function clearMessages() {
    messages.value = []
    thinkingMsgIndex.value = -1
    currentThinkingRound.value = 0
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

  function toggleThought(key: string) {
    expandedThoughts.value[key] = !expandedThoughts.value[key]
  }

  function setThoughtExpanded(key: string, value: boolean) {
    expandedThoughts.value[key] = value
  }

  function resetThinkingState() {
    thinkingMsgIndex.value = -1
    currentThinkingRound.value = 0
  }

  function setCurrentToolCall(toolCall: { name: string; id: string; arguments: string } | null) {
    currentToolCall.value = toolCall
  }

  return {
    // 状态
    messages,
    tools,
    connected,
    connecting,
    sending,
    loading,
    sessionId,
    expandedThoughts,
    thinkingMsgIndex,
    currentThinkingRound,
    currentToolCall,
    // 计算属性
    hasMessages,
    toolCount,
    // 方法
    addMessage,
    removeMessage,
    updateMessage,
    getLastMessage,
    clearMessages,
    setTools,
    setConnected,
    setConnecting,
    setSending,
    setLoading,
    setSessionId,
    toggleThought,
    setThoughtExpanded,
    resetThinkingState,
    setCurrentToolCall
  }
})