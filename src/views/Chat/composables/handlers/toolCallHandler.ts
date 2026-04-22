import { useChatStore, useChatStreamingStore } from '@/stores'
import { formatTime } from './streamHandler'
import type { WSEvent } from './streamHandler'

export function useToolCallHandler() {
  const chatStore = useChatStore()
  const streamingStore = useChatStreamingStore()

  const handleToolUseStart = (data: WSEvent) => {
    // 结束当前的流式消息
    const lastStreamingMsg = chatStore.getLastMessage()
    if (lastStreamingMsg && lastStreamingMsg.role === 'assistant' && lastStreamingMsg.streaming) {
      if (lastStreamingMsg.content === '' && !lastStreamingMsg.thinkingContent) {
        chatStore.messages.pop()
      } else {
        lastStreamingMsg.streaming = false
      }
    }

    const toolId = (data['id'] as string) || (data['name'] as string)
    const toolName = data['name'] as string

    streamingStore.setCurrentToolCall({ name: toolName, id: toolId, arguments: '' })

    chatStore.addMessage({
      role: 'assistant',
      content: '',
      time: formatTime(new Date()),
      type: 'tool_call',
      tool_id: toolId,
      tool: toolName,
      arguments: '',
      status: 'preparing'
    })
  }

  const handleToolCall = (data: WSEvent) => {
    const toolId = (data['tool_id'] as string) || (data['tool'] as string)
    const toolName = data['tool'] as string

    // 优先使用 tool_id 精确匹配
    let existingToolMsg = chatStore.messages.find(
      m => m.type === 'tool_call' && m.tool_id === toolId
    )

    // fallback: 用 tool 名称 + preparing 状态匹配
    if (!existingToolMsg) {
      existingToolMsg = chatStore.messages.find(
        m => m.type === 'tool_call' && m.tool === toolName && m.status === 'preparing'
      )
    }

    const statusVal = (data['status'] as 'preparing' | 'executing' | 'completed') || 'executing'
    if (existingToolMsg) {
      if (data['arguments'] != null) {
        existingToolMsg.arguments = JSON.stringify(data['arguments'], null, 2)
      }
      existingToolMsg.status = statusVal
      existingToolMsg.tool_id = toolId
    } else {
      chatStore.addMessage({
        role: 'assistant',
        content: '',
        time: formatTime(new Date()),
        type: 'tool_call',
        tool_id: toolId,
        tool: toolName,
        arguments: data['arguments'] != null ? JSON.stringify(data['arguments'], null, 2) : '',
        status: statusVal
      })
    }
  }

  const handleToolResult = (data: WSEvent) => {
    const resultToolId = (data['tool_id'] as string) || (data['tool'] as string)
    const toolName = data['tool'] as string

    let pendingToolMsg = [...chatStore.messages]
      .reverse()
      .find(m => m.type === 'tool_call' && m.tool_id === resultToolId)

    if (!pendingToolMsg) {
      pendingToolMsg = [...chatStore.messages]
        .reverse()
        .find(
          m =>
            m.type === 'tool_call' &&
            m.tool === toolName &&
            (m.status === 'executing' || m.status === 'preparing')
        )
    }

    if (pendingToolMsg) {
      const result =
        typeof data['result'] === 'string'
          ? data['result']
          : JSON.stringify(data['result'], null, 2)
      pendingToolMsg.result = result
      pendingToolMsg.status = 'completed'
    }
  }

  return { handleToolUseStart, handleToolCall, handleToolResult }
}
