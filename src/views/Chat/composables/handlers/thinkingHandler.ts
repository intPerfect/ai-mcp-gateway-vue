import { useChatStore, useChatStreamingStore } from '@/stores'
import { formatTime } from './streamHandler'
import type { WSEvent } from './streamHandler'

export function useThinkingHandler() {
  const chatStore = useChatStore()
  const streamingStore = useChatStreamingStore()

  const handleThinkingDelta = (data: WSEvent) => {
    if (!data['accumulated'] && !data['thinking']) return

    const content = (data['accumulated'] as string) || (data['thinking'] as string) || ''
    const round = (data['round'] as number) || 1

    if (round !== streamingStore.currentThinkingRound) {
      streamingStore.currentThinkingRound = round
      streamingStore.thinkingMsgIndex = -1
    }

    if (streamingStore.thinkingMsgIndex === -1) {
      const lastMsg = chatStore.getLastMessage()
      if (lastMsg && lastMsg.role === 'assistant') {
        const idx = chatStore.messages.length - 1
        streamingStore.thinkingMsgIndex = idx
        streamingStore.setThoughtExpanded(`${idx}-0`, true)
        lastMsg.thinkingContent = content
      }
    } else {
      const thinkingMsg = chatStore.messages[streamingStore.thinkingMsgIndex]
      if (thinkingMsg) {
        thinkingMsg.thinkingContent = content
      }
    }
  }

  const handleThinking = (thinking: string) => {
    if (thinking) {
      chatStore.addMessage({
        role: 'assistant',
        content: [{ type: 'thinking', thinking }],
        time: formatTime(new Date())
      })
    }
  }

  return { handleThinkingDelta, handleThinking }
}
