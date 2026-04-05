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

// WebSocket 消息类型枚举（供后端类型对齐参考）
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
export interface ChatConfigForm {
  apiBaseUrl: string
  gatewayKey: string
  llmConfigId: string // 改为选择LLM配置ID
  selectedMicroservices: number[]
}
