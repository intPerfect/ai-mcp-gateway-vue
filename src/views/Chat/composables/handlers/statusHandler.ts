import { Message } from '@arco-design/web-vue'
import { useChatStore } from '@/stores'

export function useStatusHandler() {
  const chatStore = useChatStore()

  const handleStatus = (data: Record<string, unknown>) => {
    if (data['status'] === 'cleared') {
      chatStore.clearMessages()
    }
  }

  const handleError = (message: string) => {
    Message.error('错误: ' + message)
    chatStore.setLoading(false)
    chatStore.setSending(false)
    const lastMsg = chatStore.getLastMessage()
    if (lastMsg && lastMsg.role === 'assistant') {
      if (lastMsg.content === '' && lastMsg.streaming) {
        chatStore.messages.pop()
      } else {
        lastMsg.streaming = false
      }
    }
  }

  return { handleStatus, handleError }
}
