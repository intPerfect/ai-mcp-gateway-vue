/**
 * ChatStreaming Store - 流式对话中的思考追踪和工具调用追踪状态
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useChatStreamingStore = defineStore('chatStreaming', () => {
  const expandedThoughts = ref<Record<string, boolean>>({})
  const thinkingMsgIndex = ref(-1)
  const currentThinkingRound = ref(0)
  const currentToolCall = ref<{ name: string; id: string; arguments: string } | null>(null)

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

  function resetAll() {
    thinkingMsgIndex.value = -1
    currentThinkingRound.value = 0
    currentToolCall.value = null
    expandedThoughts.value = {}
  }

  return {
    expandedThoughts,
    thinkingMsgIndex,
    currentThinkingRound,
    currentToolCall,
    toggleThought,
    setThoughtExpanded,
    resetThinkingState,
    setCurrentToolCall,
    resetAll
  }
})
