import { Message } from '@arco-design/web-vue'
import { useChatStore } from '@/stores'
import type { ToolInfo } from '@/types'
import type { WSEvent } from './handlers/streamHandler'
import { useStreamHandler } from './handlers/streamHandler'
import { useThinkingHandler } from './handlers/thinkingHandler'
import { useToolCallHandler } from './handlers/toolCallHandler'
import { useStatusHandler } from './handlers/statusHandler'

export function useWsMessageHandler() {
  const chatStore = useChatStore()
  const { handleStreamStart, handleTextDelta, handleResponse } = useStreamHandler()
  const { handleThinkingDelta, handleThinking } = useThinkingHandler()
  const { handleToolUseStart, handleToolCall, handleToolResult } = useToolCallHandler()
  const { handleStatus, handleError } = useStatusHandler()

  const handleMessage = (data: WSEvent) => {
    switch (data.type) {
      case 'welcome':
        chatStore.setTools(data['tools'] as ToolInfo[])
        Message.success(`已连接，已加载 ${chatStore.toolCount} 个工具`)
        break
      case 'stream_start':
        handleStreamStart()
        break
      case 'text_delta':
        handleTextDelta(data['text'] as string)
        break
      case 'thinking_delta':
        handleThinkingDelta(data)
        break
      case 'tool_use_start':
        handleToolUseStart(data)
        break
      case 'tool_use_stop':
        break
      case 'tool_call':
        handleToolCall(data)
        break
      case 'tool_result':
        handleToolResult(data)
        break
      case 'response':
        handleResponse(data)
        break
      case 'status':
        handleStatus(data)
        break
      case 'error':
        handleError(data['message'] as string)
        break
      case 'thinking':
        handleThinking(data['thinking'] as string)
        break
    }
  }

  return { handleMessage }
}
