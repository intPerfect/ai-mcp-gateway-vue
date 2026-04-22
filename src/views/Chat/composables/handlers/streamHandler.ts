import { useChatStore } from '@/stores'

export interface WSEvent {
  type: string
  [key: string]: unknown
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export function useStreamHandler() {
  const chatStore = useChatStore()

  const handleStreamStart = () => {
    const lastMsg = chatStore.getLastMessage()
    if (!lastMsg || lastMsg.role !== 'assistant' || !lastMsg.streaming || lastMsg.content !== '') {
      chatStore.addMessage({
        role: 'assistant',
        content: '',
        time: formatTime(new Date()),
        streaming: true
      })
    }
  }

  const handleTextDelta = (text: string) => {
    if (!text) return
    const lastMsg = chatStore.getLastMessage()
    if (lastMsg && lastMsg.role === 'assistant' && lastMsg.streaming) {
      if (typeof lastMsg.content === 'string') {
        lastMsg.content += text
      }
    }
  }

  const handleResponse = (data: WSEvent) => {
    let targetMsg = null
    for (let i = chatStore.messages.length - 1; i >= 0; i--) {
      if (chatStore.messages[i].role === 'assistant' && chatStore.messages[i].type !== 'tool_call') {
        targetMsg = chatStore.messages[i]
        break
      }
    }
    if (targetMsg) {
      targetMsg.streaming = false
      if (data['content'] && !targetMsg.content) {
        targetMsg.content = data['content'] as string
      }
    } else if (data['content']) {
      chatStore.addMessage({
        role: 'assistant',
        content: data['content'] as string,
        time: formatTime(new Date()),
        streaming: false
      })
    }
    chatStore.setLoading(false)
    chatStore.setSending(false)
  }

  return { handleStreamStart, handleTextDelta, handleResponse }
}
