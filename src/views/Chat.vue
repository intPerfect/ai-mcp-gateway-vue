/* eslint-disable @typescript-eslint/no-explicit-any */
<template>
  <div class="chat-page">
    <a-row :gutter="16">
      <!-- 配置面板 -->
      <a-col :span="6">
        <a-card class="config-card">
          <template #title>
            <a-space>
              <icon-settings />
              <span>配置</span>
            </a-space>
          </template>

          <a-form :model="configForm" layout="vertical">
            <a-form-item label="后端地址">
              <a-input v-model="configForm.apiBaseUrl" placeholder="http://localhost:8777" />
            </a-form-item>
            <a-form-item label="网关API Key">
              <a-input-password v-model="configForm.gatewayKey" placeholder="输入网关API Key" />
            </a-form-item>
            <a-form-item label="LLM API Key">
              <a-input-password v-model="configForm.llmKey" placeholder="输入LLM API Key (MiniMax)" />
            </a-form-item>
            <a-form-item>
              <a-button
                v-if="!connected"
                type="primary"
                long
                @click="connect"
                :loading="connecting"
              >
                <template #icon><icon-link /></template>
                连接
              </a-button>
              <a-button v-else type="outline" status="danger" long @click="disconnect">
                <template #icon><icon-close /></template>
                断开
              </a-button>
            </a-form-item>
          </a-form>

          <a-divider>可用工具</a-divider>
          <div class="tool-tags">
            <a-tag v-if="!connected">请先连接</a-tag>
            <a-tag v-else-if="tools.length === 0">暂无工具</a-tag>
            <a-tag v-for="tool in tools" :key="tool.name" color="arcoblue">
              {{ tool.name }}
            </a-tag>
          </div>
        </a-card>
      </a-col>

      <!-- 对话区域 -->
      <a-col :span="18">
        <a-card class="chat-card">
          <template #title>
            <a-space>
              <icon-message />
              <span>对话测试</span>
              <a-tag v-if="connected" color="green" size="small">已连接</a-tag>
              <a-tag v-else color="red" size="small">未连接</a-tag>
            </a-space>
          </template>
          <template #extra>
            <a-button type="text" @click="clearChat" :disabled="messages.length === 0">
              <template #icon><icon-delete /></template>
              清空
            </a-button>
          </template>

          <!-- 消息列表 -->
          <div ref="messageListRef" class="message-list">
            <div v-if="messages.length === 0" class="empty-chat">
              <icon-message size="48" />
              <p>开始对话吧</p>
            </div>
            <div
              v-for="(msg, index) in messages"
              :key="index"
              :class="['message-item', msg.role]"
            >
              <div class="message-avatar">
                <icon-user v-if="msg.role === 'user'" />
                <icon-robot v-else />
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="message-role">{{ msg.role === 'user' ? '用户' : 'AI' }}</span>
                  <span class="message-time">{{ msg.time }}</span>
                </div>
                <div class="message-body">
                  <template v-if="msg.type === 'tool_call'">
                    <div class="tool-call">
                      <a-tag color="orange" size="small">
                        <icon-tool size="16" />
                        工具调用: {{ msg.tool }}
                      </a-tag>
                      <pre class="tool-args">{{ msg.arguments }}</pre>
                      <a-tag v-if="msg.status === 'executing'" color="arcoblue" size="small">
                        执行中...
                      </a-tag>
                      <template v-else>
                        <div class="tool-result">
                          <span class="result-label">结果:</span>
                          <pre>{{ msg.result }}</pre>
                        </div>
                      </template>
                    </div>
                  </template>
                  <template v-else>
                    <div v-if="typeof msg.content === 'string'" class="text-content">
                      {{ msg.content }}
                    </div>
                    <div v-else class="blocks-content">
                      <div
                        v-for="(block, bIndex) in msg.content"
                        :key="bIndex"
                        class="content-block"
                      >
                        <div v-if="block.type === 'thinking'" class="thinking-block">
                          <div class="thinking-header">
                            <icon-mind-mapping size="14" />
                            <span>思考中...</span>
                            <a-button
                              type="text"
                              size="mini"
                              @click="toggleThinking(index, bIndex)"
                            >
                              {{ expandedThoughts[`${index}-${bIndex}`] ? '收起' : '展开' }}
                            </a-button>
                          </div>
                          <div
                            v-if="expandedThoughts[`${index}-${bIndex}`]"
                            class="thinking-content"
                          >
                            {{ block.thinking }}
                          </div>
                        </div>
                        <div v-else-if="block.type === 'text'" class="text-block">
                          {{ block.text }}
                        </div>
                        <div v-else-if="block.type === 'tool_use'" class="tool-use-block">
                          <a-tag color="purple" size="small">
                            工具调用: {{ block.name }}
                          </a-tag>
                        </div>
                        <div v-else-if="block.type === 'tool_result'" class="tool-result-block">
                          <span class="result-label">工具结果:</span>
                          <pre>{{ block.content }}</pre>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>

            <!-- 加载指示器 -->
            <div v-if="loading" class="message-item assistant">
              <div class="message-avatar">
                <icon-robot />
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="message-role">AI</span>
                </div>
                <div class="message-body">
                  <a-spin size="16" />
                  <span style="margin-left: 8px; color: #86909c;">思考中...</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 输入区域 -->
          <div class="input-area">
            <a-textarea
              v-model="inputMessage"
              placeholder="输入消息..."
              :disabled="!connected"
              :auto-size="{ minRows: 2, maxRows: 4 }"
              @press-enter="handleSend"
            />
            <div class="input-actions">
              <a-space>
                <span class="char-count">{{ inputMessage.length }} 字符</span>
              </a-space>
              <a-button
                type="primary"
                @click="handleSend"
                :disabled="!connected || !inputMessage.trim()"
                :loading="sending"
              >
                <template #icon><icon-send /></template>
                发送
              </a-button>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onUnmounted, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  IconSettings,
  IconLink,
  IconClose,
  IconMessage,
  IconDelete,
  IconUser,
  IconRobot,
  IconMindMapping,
  IconSend,
  IconTool
} from '@arco-design/web-vue/es/icon'

interface ToolInfo {
  name: string
  description: string
  input_schema: any
}

interface MessageItem {
  role: 'user' | 'assistant'
  content: string | any[]
  time: string
  type?: string
  tool?: string
  arguments?: string
  result?: string
  status?: string
  streaming?: boolean
}

let websocket: WebSocket | null = null
const sessionId = ref('')

const configForm = reactive({
  apiBaseUrl: `http://${window.location.hostname}:8777`,
  gatewayKey: 'gw-test-api-key-001',
  llmKey: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiLnmb7ono3kupHliJsiLCJVc2VyTmFtZSI6IueZvuiejeS6keWImyIsIkFjY291bnQiOiIiLCJTdWJqZWN0SUQiOiIxOTk4NjY2Nzg0MTg5NzE0Njk5IiwiUGhvbmUiOiIxOTUxMTk4MTY4OSIsIkdyb3VwSUQiOiIxOTk4NjY2Nzg0MTgxMzI2MDkxIiwiUGFnZU5hbWUiOiIiLCJNYWlsIjoiIiwiQ3JlYXRlVGltZSI6IjIwMjUtMTItMTAgMjE6MzI6MTYiLCJUb2tlblR5cGUiOjQsImlzcyI6Im1pbmltYXgifQ.u5vB41nODwjoj-a728IeKgtdnoL7AC0rJbw3Uv8iXA6CVqXQ3SY5RCTo87yAzAeva8prR4YcBQ-nIG5mtXYd_jemI-mjA909hYN3yvWsjuD4m_3U2SqoDY5E6vV6gyGPzQlnB0OkzOKJCwQbb6FUfcymWTSiAtw2k8DgfCeQLJLUMKmxOjHYOontut_gujCxY57wU-8h0p4PWkS74hLnritLO3oIBq6ZNmf1d3uC4pw-jVCflSlymm16luObc-DeohNc83fAOtMPSJ76mi_bdAcoIgCOyAP3VUan53QyLHwzcq-i8YI-TuxkAvH3slauNsHAfUWNhlqJouRXdFwsHg'
})

const connected = ref(false)
const connecting = ref(false)
const loading = ref(false)
const sending = ref(false)
const inputMessage = ref('')
const messages = ref<MessageItem[]>([])
const tools = ref<ToolInfo[]>([])
const messageListRef = ref<HTMLElement | null>(null)
const expandedThoughts = reactive<Record<string, boolean>>({})
const streamingContent = ref('')  // 流式输出缓存

const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

// 加载网关Key
const loadGatewayKey = async () => {
  try {
    const response = await fetch('/api/apikeys')
    const result = await response.json()
    if (result.code === '0000' && result.data?.gateway_keys?.length > 0) {
      configForm.gatewayKey = result.data.gateway_keys[0].api_key
    }
  } catch (error) {
    console.error('加载网关Key失败:', error)
  }
}

// 页面加载时获取网关Key
onMounted(() => {
  loadGatewayKey()
})

const connect = async () => {
  if (connecting.value || connected.value) return

  connecting.value = true

  try {
    // 第一步：调用 HTTP 接口验证 Key 并获取 session
    console.log('正在验证 Key...')
    const sessionResponse = await fetch(`${configForm.apiBaseUrl}/api/chat/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gateway_key: configForm.gatewayKey,
        llm_key: configForm.llmKey
      })
    })

    if (!sessionResponse.ok) {
      const errorData = await sessionResponse.json()
      throw new Error(errorData.detail || '验证失败')
    }

    const sessionData = await sessionResponse.json()
    sessionId.value = sessionData.session_id
    const wsPath = sessionData.websocket_url

    // 第二步：连接 WebSocket
    const wsUrl = `ws://${window.location.hostname}:8777${wsPath}`
    console.log('正在连接 WebSocket:', wsUrl)
    websocket = new WebSocket(wsUrl)

    websocket.onopen = () => {
      console.log('WebSocket 连接成功')
      connected.value = true
      connecting.value = false
      Message.success('连接成功')
    }

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleWsMessage(data)
    }

    websocket.onerror = (error) => {
      console.error('WebSocket 错误:', error)
      Message.error('连接失败')
      connecting.value = false
      connected.value = false
    }

    websocket.onclose = () => {
      console.log('WebSocket 连接已断开')
      connected.value = false
      connecting.value = false
      Message.warning('连接已断开')
    }
  } catch (error: any) {
    console.error('连接失败:', error)
    Message.error('连接失败：' + error.message)
    connecting.value = false
  }
}

const disconnect = () => {
  if (websocket) {
    websocket.close()
    websocket = null
  }
  connected.value = false
  tools.value = []
}

const handleWsMessage = (data: any) => {
  switch (data.type) {
    case 'welcome':
      tools.value = data.tools || []
      Message.success(`已连接，已加载 ${tools.value.length} 个工具`)
      break

    case 'user':
      messages.value.push({
        role: 'user',
        content: data.content,
        time: formatTime(new Date())
      })
      scrollToBottom()
      break

    case 'stream_start':
      // 流式输出开始，只有在没有正在streaming的消息时才创建新气泡
      streamingContent.value = ''
      if (messages.value.length === 0 || messages.value[messages.value.length - 1].streaming !== true) {
        messages.value.push({
          role: 'assistant',
          content: '',
          time: formatTime(new Date()),
          streaming: true
        })
        scrollToBottom()
      }
      break

    case 'text_delta':
      // 流式文本增量
      if (data.text) {
        streamingContent.value += data.text
        if (messages.value.length > 0) {
          const lastMsg = messages.value[messages.value.length - 1]
          if (lastMsg.role === 'assistant' && lastMsg.streaming) {
            lastMsg.content = streamingContent.value
          }
        }
        scrollToBottom()
      }
      break

    case 'text_stop':
      // 文本块结束 — 如果流式消息内容为空，移除空气泡
      if (messages.value.length > 0) {
        const lastMsg = messages.value[messages.value.length - 1]
        if (lastMsg.role === 'assistant' && lastMsg.streaming && !lastMsg.content) {
          messages.value.pop()
        }
      }
      break

    case 'tool_use_start':
      // 工具调用开始
      messages.value.push({
        role: 'assistant',
        content: '',
        time: formatTime(new Date()),
        type: 'tool_call',
        tool: data.name,
        arguments: '',
        status: 'preparing'
      })
      scrollToBottom()
      break

    case 'tool_use_stop':
      // 工具调用定义结束
      break

    case 'assistant':
      messages.value.push({
        role: 'assistant',
        content: data.content || data.text,
        time: formatTime(new Date())
      })
      loading.value = false
      scrollToBottom()
      break

    case 'tool_call':
      // 更新或创建工具调用消息
      const existingToolMsg = messages.value.find(
        (m: MessageItem) => m.type === 'tool_call' && m.tool === data.tool && m.status === 'preparing'
      )
      if (existingToolMsg) {
        existingToolMsg.arguments = JSON.stringify(data.arguments, null, 2)
        existingToolMsg.status = data.status
      } else {
        messages.value.push({
          role: 'assistant',
          content: '',
          time: formatTime(new Date()),
          type: 'tool_call',
          tool: data.tool,
          arguments: JSON.stringify(data.arguments, null, 2),
          status: data.status
        })
      }
      scrollToBottom()
      break

    case 'tool_result':
      const lastToolMsg = [...messages.value].reverse().find((m: MessageItem) => m.type === 'tool_call' && m.tool === data.tool)
      if (lastToolMsg) {
        lastToolMsg.result = typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2)
        lastToolMsg.status = 'completed'
      }
      scrollToBottom()
      break

    case 'response':
      // 最终响应，标记流式输出结束
      if (messages.value.length > 0) {
        const lastMsg = messages.value[messages.value.length - 1]
        if (lastMsg.role === 'assistant' && lastMsg.streaming) {
          lastMsg.streaming = false
          lastMsg.content = data.content || streamingContent.value
        }
      }
      streamingContent.value = ''
      loading.value = false
      sending.value = false
      scrollToBottom()
      break

    case 'status':
      // 状态消息
      if (data.status === 'cleared') {
        messages.value = []
      }
      break

    case 'error':
      Message.error('错误: ' + data.message)
      loading.value = false
      sending.value = false
      // 清除流式状态
      if (messages.value.length > 0) {
        const lastMsg = messages.value[messages.value.length - 1]
        if (lastMsg.streaming) {
          lastMsg.streaming = false
        }
      }
      streamingContent.value = ''
      break

    case 'thinking':
      // 显示思考过程
      if (data.thinking) {
        messages.value.push({
          role: 'assistant',
          content: [{ type: 'thinking', thinking: data.thinking }],
          time: formatTime(new Date())
        })
        scrollToBottom()
      }
      break
  }
}

const handleSend = () => {
  if (!inputMessage.value.trim() || !connected.value || sending.value) return

  const message = inputMessage.value.trim()
  inputMessage.value = ''
  sending.value = true
  loading.value = true

  // 立即显示用户消息气泡
  messages.value.push({
    role: 'user',
    content: message,
    time: formatTime(new Date())
  })
  scrollToBottom()

  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify({
      type: 'chat',
      content: message
    }))
    sending.value = false
  } else {
    Message.error('连接已断开')
    loading.value = false
    sending.value = false
  }
}

const clearChat = () => {
  messages.value = []
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify({ type: 'clear' }))
  }
}

const toggleThinking = (msgIndex: number, blockIndex: number) => {
  const key = `${msgIndex}-${blockIndex}`
  expandedThoughts[key] = !expandedThoughts[key]
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

onUnmounted(() => {
  disconnect()
})
</script>

<style scoped>
.chat-page {
  padding: 16px;
  height: calc(100vh - 100px);
}

.config-card {
  height: 100%;
}

.tool-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chat-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  min-height: 400px;
  max-height: calc(100vh - 300px);
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #86909c;
}

.empty-chat p {
  margin-top: 16px;
}

.message-item {
  display: flex;
  margin-bottom: 16px;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-item.user .message-avatar {
  background: #165dff;
  color: white;
  margin-left: 12px;
}

.message-item.assistant .message-avatar {
  background: #722ed1;
  color: white;
  margin-right: 12px;
}

.message-content {
  max-width: 80%;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.message-role {
  font-weight: 500;
  font-size: 13px;
}

.message-time {
  font-size: 11px;
  color: #86909c;
}

.message-body {
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
}

.message-item.user .message-body {
  background: #165dff;
  color: white;
}

.message-item.assistant .message-body {
  background: #f2f3f5;
  color: #1d2129;
}

.tool-call {
  padding: 8px;
  background: #fff7e6;
  border-radius: 4px;
}

.tool-args {
  margin: 8px 0;
  padding: 8px;
  background: #ffe7d6;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
}

.tool-result {
  margin-top: 8px;
}

.tool-result pre {
  margin-top: 4px;
  padding: 8px;
  background: #d9f7be;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
}

.thinking-block {
  padding: 8px;
  background: #f0f5ff;
  border-radius: 4px;
  margin-bottom: 8px;
}

.thinking-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #165dff;
  font-size: 13px;
}

.thinking-content {
  margin-top: 8px;
  padding: 8px;
  background: #e6f4ff;
  border-radius: 4px;
  font-size: 13px;
  white-space: pre-wrap;
}

.blocks-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-area {
  border-top: 1px solid #e5e6eb;
  padding: 16px;
  background: white;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.char-count {
  font-size: 12px;
  color: #86909c;
}

pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
