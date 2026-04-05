/**
 * useWebSocket - WebSocket 连接管理 composable
 */
import { onUnmounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useChatStore, useConfigStore } from '@/stores'
import type { ToolInfo } from '@/types'

export interface WSEvent {
  type: string
  [key: string]: unknown
}

export function useWebSocket() {
  const chatStore = useChatStore()
  const configStore = useConfigStore()

  let websocket: WebSocket | null = null

  const connect = async (): Promise<boolean> => {
    if (chatStore.connecting || chatStore.connected) return false

    chatStore.setConnecting(true)

    try {
      const sessionResponse = await fetch(`${configStore.config.apiBaseUrl}/api/chat/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gateway_key: configStore.config.gatewayKey,
          llm_config_id: configStore.config.llmConfigId,
          microservice_ids: configStore.config.selectedMicroservices
        })
      })

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json()
        throw new Error(errorData.detail || '验证失败')
      }

      const sessionData = await sessionResponse.json()
      chatStore.setSessionId(sessionData.session_id)
      const wsPath = sessionData.websocket_url

      // 第二步：连接 WebSocket
      const wsUrl = `ws://${window.location.hostname}:8998${wsPath}`
      websocket = new WebSocket(wsUrl)

      return new Promise(resolve => {
        websocket!.onopen = () => {
          chatStore.setConnected(true)
          chatStore.setConnecting(false)
          Message.success('连接成功')
          resolve(true)
        }

        websocket!.onmessage = event => {
          const data = JSON.parse(event.data)
          handleWsMessage(data)
        }

        websocket!.onerror = error => {
          console.error('WebSocket 错误:', error)
          Message.error('连接失败')
          chatStore.setConnecting(false)
          chatStore.setConnected(false)
          resolve(false)
        }

        websocket!.onclose = () => {
          chatStore.setConnected(false)
          chatStore.setConnecting(false)
          Message.warning('连接已断开')
        }
      })
    } catch (error: unknown) {
      console.error('连接失败:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      Message.error('连接失败：' + errorMessage)
      chatStore.setConnecting(false)
      return false
    }
  }

  const disconnect = () => {
    if (websocket) {
      websocket.close()
      websocket = null
    }
    chatStore.setConnected(false)
    chatStore.setTools([])
  }

  const send = (data: unknown): boolean => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify(data))
      return true
    }
    return false
  }

  const handleWsMessage = (data: WSEvent) => {
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
        // 工具调用声明结束
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
    if (text) {
      const lastMsg = chatStore.getLastMessage()
      if (lastMsg && lastMsg.role === 'assistant' && lastMsg.streaming) {
        if (typeof lastMsg.content === 'string') {
          lastMsg.content += text
        }
      }
    }
  }

  const handleThinkingDelta = (data: WSEvent) => {
    if (data['accumulated'] || data['thinking']) {
      const content = (data['accumulated'] as string) || (data['thinking'] as string) || ''
      const round = (data['round'] as number) || 1

      // 检查 round 是否变化
      if (round !== chatStore.currentThinkingRound) {
        chatStore.currentThinkingRound = round
        chatStore.thinkingMsgIndex = -1
      }

      if (chatStore.thinkingMsgIndex === -1) {
        const lastMsg = chatStore.getLastMessage()
        if (lastMsg && lastMsg.role === 'assistant') {
          const idx = chatStore.messages.length - 1
          chatStore.thinkingMsgIndex = idx
          chatStore.setThoughtExpanded(`${idx}-0`, true)
          lastMsg.thinkingContent = content
        }
      } else {
        const thinkingMsg = chatStore.messages[chatStore.thinkingMsgIndex]
        if (thinkingMsg) {
          thinkingMsg.thinkingContent = content
        }
      }
    }
  }

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
    console.log(`[WS] tool_use_start: id=${toolId}, name=${toolName}`)

    // 记录当前工具调用
    chatStore.setCurrentToolCall({
      name: toolName,
      id: toolId,
      arguments: ''
    })

    // 添加工具调用消息，设置 tool_id 以便后续匹配
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
    const hasArgs = data['arguments'] != null

    console.log(
      `[WS] tool_call: id=${toolId}, name=${toolName}, status=${data['status']}, hasArgs=${hasArgs}`
    )

    // 列出所有 tool_call 消息的 tool_id
    const allToolMsgs = chatStore.messages
      .filter(m => m.type === 'tool_call')
      .map(m => ({ tool_id: m.tool_id, tool: m.tool, status: m.status }))
    console.log(`[WS] current tool messages:`, JSON.stringify(allToolMsgs))

    // 优先使用 tool_id 精确匹配，避免同名工具调用串位
    let existingToolMsg = chatStore.messages.find(
      m => m.type === 'tool_call' && m.tool_id === toolId
    )

    // 如果没有找到，再尝试用 tool 名称匹配，但必须是 preparing 状态的消息
    if (!existingToolMsg) {
      existingToolMsg = chatStore.messages.find(
        m => m.type === 'tool_call' && m.tool === toolName && m.status === 'preparing'
      )
    }

    const statusVal = (data['status'] as 'preparing' | 'executing' | 'completed') || 'executing'
    if (existingToolMsg) {
      console.log(
        `[WS] tool_call MATCHED: tool_id=${existingToolMsg.tool_id}, updating args=${hasArgs}, status=${statusVal}`
      )
      // 只在有新参数时更新，避免覆盖已有参数
      if (data['arguments'] != null) {
        existingToolMsg.arguments = JSON.stringify(data['arguments'], null, 2)
      }
      existingToolMsg.status = statusVal
      // 始终同步 tool_id（fallback 匹配时后端 ID 可能与前端不同）
      existingToolMsg.tool_id = toolId
    } else {
      console.log(`[WS] tool_call NO MATCH, creating new message`)
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

    // 优先使用 tool_id 精确匹配
    let pendingToolMsg = [...chatStore.messages]
      .reverse()
      .find(m => m.type === 'tool_call' && m.tool_id === resultToolId)

    // 如果没有找到，再尝试用 tool 名称匹配（executing 或 preparing 状态）
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

  const handleResponse = (data: WSEvent) => {
    let targetMsg = null
    for (let i = chatStore.messages.length - 1; i >= 0; i--) {
      if (
        chatStore.messages[i].role === 'assistant' &&
        chatStore.messages[i].type !== 'tool_call'
      ) {
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

  const handleStatus = (data: WSEvent) => {
    if (data['status'] === 'cleared') {
      chatStore.clearMessages()
    }
  }

  const handleError = (message: string) => {
    Message.error('错误: ' + message)
    chatStore.setLoading(false)
    chatStore.setSending(false)
    // 清除流式状态
    const lastMsg = chatStore.getLastMessage()
    if (lastMsg && lastMsg.role === 'assistant') {
      if (lastMsg.content === '' && lastMsg.streaming) {
        chatStore.messages.pop()
      } else {
        lastMsg.streaming = false
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

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    websocket,
    connect,
    disconnect,
    send
  }
}
