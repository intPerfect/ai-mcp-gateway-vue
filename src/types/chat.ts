/**
 * 聊天相关类型定义
 */

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
export interface ChatMessage {
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

// WebSocket 消息类型
export type WsMessageType =
  | 'welcome'
  | 'user'
  | 'stream_start'
  | 'text_delta'
  | 'thinking_delta'
  | 'text_stop'
  | 'tool_use_start'
  | 'tool_use_stop'
  | 'tool_call'
  | 'tool_result'
  | 'response'
  | 'status'
  | 'error'
  | 'thinking'

export interface WsMessage {
  type: WsMessageType
  [key: string]: unknown
}

// WebSocket 连接状态
export type WsConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

// 配置表单
export interface ChatConfigForm {
  apiBaseUrl: string
  gatewayKey: string
  llmKey: string
}
