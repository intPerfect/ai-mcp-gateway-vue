<template>
  <div class="chat-page">
    <!-- 左侧配置面板 - 固定 -->
    <div class="config-panel">
      <a-card class="config-card" :bordered="false">
        <template #title>
          <span class="card-title">配置</span>
        </template>
        <a-form :model="configForm" layout="vertical">
          <a-form-item label="后端地址">
            <a-input v-model="configForm.apiBaseUrl" placeholder="http://localhost:8777" />
          </a-form-item>
          <a-form-item label="网关API Key">
            <a-input-password v-model="configForm.gatewayKey" placeholder="输入网关API Key" />
          </a-form-item>
          <a-form-item label="LLM API Key">
            <a-input-password
              v-model="configForm.llmKey"
              placeholder="输入LLM API Key (MiniMax M2.7)"
            />
          </a-form-item>

          <!-- 微服务选择 -->
          <a-form-item label="选择微服务">
            <a-select
              v-model="configForm.selectedMicroservices"
              multiple
              placeholder="选择要连接的微服务"
              :disabled="connected"
              allow-clear
            >
              <a-option v-for="ms in microserviceList" :key="ms.id" :value="ms.id" :label="ms.name">
                <a-space>
                  <span>{{ ms.name }}</span>
                  <a-tag v-if="ms.health_status === 'healthy'" color="green" size="small">
                    健康
                  </a-tag>
                  <a-tag v-else-if="ms.health_status === 'unhealthy'" color="red" size="small">
                    异常
                  </a-tag>
                  <a-tag v-else color="gray" size="small">未知</a-tag>
                </a-space>
              </a-option>
            </a-select>
          </a-form-item>

          <a-form-item>
            <a-button
              v-if="!connected"
              type="primary"
              long
              :loading="connecting"
              :disabled="configForm.selectedMicroservices.length === 0"
              @click="connect"
            >
              <template #icon><icon-link /></template>
              连接
            </a-button>
            <a-button v-else type="outline" status="danger" long @click="disconnect">
              <template #icon><icon-close /></template>
              断开连接
            </a-button>
          </a-form-item>
        </a-form>

        <a-divider style="margin: 8px 0" />
        <div v-if="!connected" class="tool-tags">
          <a-tag>请先连接</a-tag>
        </div>
        <div v-else-if="tools.length === 0" class="tool-tags">
          <a-tag>暂无工具</a-tag>
        </div>
        <div v-else class="tools-grouped">
          <a-collapse :default-active-key="Object.keys(toolsByGroup)" expand-icon-position="right">
            <a-collapse-item
              v-for="(toolList, groupName) in toolsByGroup"
              :key="groupName"
              :header="`${groupName} (${toolList.length})`"
              :name="groupName"
            >
              <div class="tool-tags-group">
                <a-tag v-for="tool in toolList" :key="tool.name" color="arcoblue">
                  {{ tool.name }}
                </a-tag>
              </div>
            </a-collapse-item>
          </a-collapse>
        </div>
      </a-card>
    </div>

    <!-- 右侧对话区域 - 可滚动 -->
    <div class="chat-area">
      <a-card class="chat-card" :bordered="false">
        <template #extra>
          <a-button type="text" :disabled="messages.length === 0" @click="clearChat">
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
          <div v-for="(msg, index) in messages" :key="index" :class="['message-item', msg.role]">
            <div class="message-avatar">
              <icon-user v-if="msg.role === 'user'" />
              <icon-robot v-else />
            </div>
            <div class="message-content">
              <div class="message-header">
                <span class="message-role">{{ msg.role === 'user' ? '用户' : 'AI' }}</span>
                <span class="message-time">{{ msg.time }}</span>
                <!-- AI消息流式输出时显示加载状态 -->
                <a-spin v-if="msg.role === 'assistant' && msg.streaming" size="14" />
              </div>
              <div class="message-body">
                <template v-if="msg.type === 'tool_call'">
                  <div class="tool-call">
                    <div class="tool-call-header">
                      <a-tag color="orange" size="small">
                        <icon-tool size="14" />
                        工具调用
                      </a-tag>
                      <span class="tool-name">{{ msg.tool }}</span>
                      <a-tag
                        v-if="msg.status === 'preparing'"
                        color="gray"
                        size="small"
                        class="status-tag"
                      >
                        准备中
                      </a-tag>
                      <a-tag
                        v-else-if="msg.status === 'executing'"
                        color="arcoblue"
                        size="small"
                        class="status-tag"
                      >
                        执行中
                      </a-tag>
                      <a-tag
                        v-else-if="msg.status === 'completed'"
                        color="green"
                        size="small"
                        class="status-tag"
                      >
                        已完成
                      </a-tag>
                    </div>
                    <div class="tool-call-content">
                      <div class="tool-section">
                        <div class="section-label">参数:</div>
                        <pre class="tool-args">{{ msg.arguments || '无参数' }}</pre>
                      </div>
                      <div v-if="msg.result" class="tool-section">
                        <div class="section-label">结果:</div>
                        <pre class="tool-result">{{ msg.result }}</pre>
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <!-- 显示 thinking 过程 -->
                  <div v-if="msg.thinkingContent" class="thinking-block">
                    <div class="thinking-header">
                      <icon-mind-mapping size="14" />
                      <span>思考过程</span>
                      <a-button type="text" size="mini" @click="toggleThinking(index, 0)">
                        {{ expandedThoughts[`${index}-0`] ? '收起' : '展开' }}
                      </a-button>
                    </div>
                    <div v-if="expandedThoughts[`${index}-0`]" class="thinking-content">
                      {{ msg.thinkingContent }}
                    </div>
                  </div>
                  <!-- 只有当有内容时才显示 -->
                  <div
                    v-if="typeof msg.content === 'string' && msg.content.trim()"
                    class="text-content"
                  >
                    <MarkdownRender
                      :content="msg.content"
                      :streaming="msg.streaming"
                      class="markdown-stream"
                    />
                  </div>
                  <div v-else-if="typeof msg.content !== 'string'" class="blocks-content">
                    <div v-for="(block, bIndex) in msg.content" :key="bIndex" class="content-block">
                      <div v-if="block.type === 'thinking'" class="thinking-block">
                        <div class="thinking-header">
                          <icon-mind-mapping size="14" />
                          <span>思考过程</span>
                          <a-button type="text" size="mini" @click="toggleThinking(index, bIndex)">
                            {{ expandedThoughts[`${index}-${bIndex}`] ? '收起' : '展开' }}
                          </a-button>
                        </div>
                        <div v-if="expandedThoughts[`${index}-${bIndex}`]" class="thinking-content">
                          {{ block.thinking }}
                        </div>
                      </div>
                      <div v-else-if="block.type === 'text'" class="text-block">
                        <MarkdownRender :content="block.text" class="markdown-stream" />
                      </div>
                      <div v-else-if="block.type === 'tool_use'" class="tool-use-block">
                        <a-tag color="purple" size="small">
                          <icon-tool size="14" />
                          工具调用: {{ block.name }}
                        </a-tag>
                      </div>
                      <div v-else-if="block.type === 'tool_result'" class="tool-result-block">
                        <div class="result-header">
                          <icon-check-circle size="14" />
                          <span>工具结果</span>
                        </div>
                        <pre>{{ block.content }}</pre>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <!-- 推荐问题卡片 - 输入框上方 -->
          <div v-if="connected && showSuggestions" class="suggestions-block">
            <div class="suggestions-header">
              <span class="suggestions-title">猜你想问</span>
              <a-button type="text" size="small" class="refresh-btn" @click="refreshQuestions">
                <icon-refresh :class="{ refreshing: isRefreshing }" />
                <span>换一换</span>
              </a-button>
            </div>
            <div class="suggestions-list">
              <div
                v-for="q in displayedQuestions"
                :key="q.text"
                class="suggestion-item"
                @click="fillMessage(q.text)"
              >
                <span class="suggestion-text">{{ q.text }}</span>
                <icon-right class="suggestion-arrow" />
              </div>
            </div>
          </div>
          <!-- 单行输入框 + 发送按钮 -->
          <div class="input-row">
            <a-input
              v-model="inputMessage"
              placeholder="输入消息，按 Enter 发送..."
              :disabled="!connected"
              allow-clear
              @press-enter="handleSend"
            />
            <a-button
              type="primary"
              :disabled="!connected || !inputMessage.trim()"
              :loading="sending"
              @click="handleSend"
            >
              <template #icon><icon-send /></template>
            </a-button>
          </div>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, reactive, computed, nextTick, onUnmounted, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  IconLink,
  IconClose,
  IconMessage,
  IconDelete,
  IconUser,
  IconRobot,
  IconMindMapping,
  IconSend,
  IconTool,
  IconCheckCircle,
  IconRight,
  IconRefresh
} from '@arco-design/web-vue/es/icon'
import MarkdownRender from 'markstream-vue'
import 'markstream-vue/index.css'

interface ToolInfo {
  name: string
  description: string
  input_schema: Record<string, unknown>
  microservice_name?: string
}

interface Microservice {
  id: number
  name: string
  http_base_url: string
  description: string
  business_line: string
  health_status: 'healthy' | 'unhealthy' | 'unknown'
  tool_count?: number
}

interface ContentBlock {
  type: 'thinking' | 'text' | 'tool_use' | 'tool_result'
  thinking?: string
  text?: string
  name?: string
  content?: string
}

interface MessageItem {
  role: 'user' | 'assistant'
  content: string | ContentBlock[]
  time: string
  type?: string
  tool_id?: string
  tool?: string
  arguments?: string
  result?: string
  status?: string
  streaming?: boolean
  thinkingContent?: string
}

let websocket: WebSocket | null = null
const sessionId = ref('')

const configForm = reactive({
  apiBaseUrl: `http://${window.location.hostname}:8777`,
  gatewayKey: 'sk-defaultkey001:Xy7zA1b2C3d4E5f6G7h8I9j0KlMnOpQrStUvWxYz',
  llmKey:
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiLnmb7ono3kupHliJsiLCJVc2VyTmFtZSI6IueZvuiejeS6keWImyIsIkFjY291bnQiOiIiLCJTdWJqZWN0SUQiOiIxOTk4NjY2Nzg0MTg5NzE0Njk5IiwiUGhvbmUiOiIxOTUxMTk4MTY4OSIsIkdyb3VwSUQiOiIxOTk4NjY2Nzg0MTgxMzI2MDkxIiwiUGFnZU5hbWUiOiIiLCJNYWlsIjoiIiwiQ3JlYXRlVGltZSI6IjIwMjUtMTItMTAgMjE6MzI6MTYiLCJUb2tlblR5cGUiOjQsImlzcyI6Im1pbmltYXgifQ.u5vB41nODwjoj-a728IeKgtdnoL7AC0rJbw3Uv8iXA6CVqXQ3SY5RCTo87yAzAeva8prR4YcBQ-nIG5mtXYd_jemI-mjA909hYN3yvWsjuD4m_3U2SqoDY5E6vV6gyGPzQlnB0OkzOKJCwQbb6FUfcymWTSiAtw2k8DgfCeQLJLUMKmxOjHYOontut_gujCxY57wU-8h0p4PWkS74hLnritLO3oIBq6ZNmf1d3uC4pw-jVCflSlymm16luObc-DeohNc83fAOtMPSJ76mi_bdAcoIgCOyAP3VUan53QyLHwzcq-i8YI-TuxkAvH3slauNsHAfUWNhlqJouRXdFwsHg',
  selectedMicroservices: [] as number[] // 选中的微服务ID列表
})

const connected = ref(false)
const connecting = ref(false)
const loading = ref(false)
const sending = ref(false)
const showSuggestions = ref(true) // 是否显示推荐问题
const inputMessage = ref('')
const messages = ref<MessageItem[]>([])
const tools = ref<ToolInfo[]>([])
const microserviceList = ref<Microservice[]>([])

// 按 microservice_name 分组，过滤掉未绑定的
const toolsByGroup = computed(() => {
  const groups: Record<string, ToolInfo[]> = {}
  for (const tool of tools.value) {
    if (!tool.microservice_name) continue
    if (!groups[tool.microservice_name]) groups[tool.microservice_name] = []
    groups[tool.microservice_name].push(tool)
  }
  return groups
})
const messageListRef = ref<HTMLElement | null>(null)
const expandedThoughts = reactive<Record<string, boolean>>({})
// 追踪当前对话轮次的思考内容归宿消息索引（-1 表示尚未分配）
const thinkingMsgIndex = ref<number>(-1)
// 追踪当前 thinking 轮次，用于区分不同轮次的 thinking 块
const currentThinkingRound = ref<number>(0)

const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

// 加载网关Key（注意：API Key 使用 bcrypt 存储，无法获取明文，此处仅作备用逻辑）
const loadGatewayKey = async () => {
  try {
    const response = await fetch('/api/apikeys')
    const result = await response.json()
    if (result.code === '0000' && result.data?.gateway_keys?.length > 0) {
      // 数据库中存储的是 key_id，完整 API Key 需用户自行保存
      // 此处不覆盖默认值，仅记录日志
      console.log('已加载 gateway_keys:', result.data.gateway_keys)
    }
  } catch (error) {
    console.error('加载网关Key失败:', error)
  }
}

// 加载微服务列表
const loadMicroservices = async () => {
  try {
    const response = await fetch('/api/microservices')
    const result = await response.json()
    if (result.code === '0000') {
      microserviceList.value = result.data || []
    }
  } catch (error) {
    console.error('加载微服务列表失败:', error)
  }
}

// 页面加载时获取网关Key和微服务列表
onMounted(() => {
  loadGatewayKey()
  loadMicroservices()
})

const connect = async () => {
  if (connecting.value || connected.value) return

  connecting.value = true

  try {
    // 第一步：调用 HTTP 接口验证 Key 并获取 session
    const sessionResponse = await fetch(`${configForm.apiBaseUrl}/api/chat/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gateway_key: configForm.gatewayKey,
        llm_key: configForm.llmKey,
        microservice_ids:
          configForm.selectedMicroservices.length > 0 ? configForm.selectedMicroservices : null
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
    websocket = new WebSocket(wsUrl)

    websocket.onopen = () => {
      connected.value = true
      connecting.value = false
      Message.success('连接成功')
    }

    websocket.onmessage = event => {
      const data = JSON.parse(event.data)
      handleWsMessage(data)
    }

    websocket.onerror = error => {
      console.error('WebSocket 错误:', error)
      Message.error('连接失败')
      connecting.value = false
      connected.value = false
    }

    websocket.onclose = () => {
      connected.value = false
      connecting.value = false
      Message.warning('连接已断开')
    }
  } catch (error: any) {
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

// 跟踪当前工具调用状态
const currentToolCall = ref<{ name: string; id: string; arguments: string } | null>(null)

const handleWsMessage = (data: any) => {
  switch (data.type) {
    case 'welcome':
      console.log('收到 welcome 消息:', data)
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
      // 流式输出开始：如果已有空的loading气泡则复用，否则创建新气泡
      {
        const lastStreamMsg = messages.value[messages.value.length - 1]
        if (
          lastStreamMsg &&
          lastStreamMsg.role === 'assistant' &&
          lastStreamMsg.streaming &&
          lastStreamMsg.content === ''
        ) {
          // 复用已有的loading气泡（发送消息后预创建的）
        } else {
          messages.value.push({
            role: 'assistant',
            content: '',
            time: formatTime(new Date()),
            streaming: true
          })
        }
        scrollToBottom()
      }
      break

    case 'text_delta':
      // 流式文本增量 - 直接更新消息内容
      if (data.text) {
        const lastMsg = messages.value[messages.value.length - 1]
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.streaming) {
          lastMsg.content += data.text
        }
        scrollToBottom()
      }
      break

    case 'thinking_delta':
      // thinking 增量 - 根据后端传来的 round 字段区分不同轮次的 thinking
      if (data.accumulated || data.thinking) {
        // 使用后端传来的本轮累积内容
        const content = data.accumulated || data.thinking || ''
        const round = data.round || 1

        // 检查 round 是否变化，变化则需要创建新的 thinking 块
        if (round !== currentThinkingRound.value) {
          // 新轮次，重置 thinking 追踪
          currentThinkingRound.value = round
          thinkingMsgIndex.value = -1
        }

        if (thinkingMsgIndex.value === -1) {
          // 当前轮次首次收到 thinking_delta：绑定到最后一个 assistant 消息
          const lastMsg = messages.value[messages.value.length - 1]
          if (lastMsg && lastMsg.role === 'assistant') {
            const idx = messages.value.length - 1
            thinkingMsgIndex.value = idx
            // 默认展开（流式输出中自动展开）
            expandedThoughts[`${idx}-0`] = true
            // 设置本轮 thinking 内容
            lastMsg.thinkingContent = content
          }
        } else {
          // 同一轮次后续更新：直接使用后端传来的累积内容
          const thinkingMsg = messages.value[thinkingMsgIndex.value]
          if (thinkingMsg) {
            thinkingMsg.thinkingContent = content
          }
        }
      }
      break

    case 'text_stop':
      // 文本块结束
      break

    case 'tool_use_start':
      // 工具调用开始 - 先结束当前的流式消息，再显示工具调用
      {
        const lastStreamingMsg = messages.value[messages.value.length - 1]
        if (
          lastStreamingMsg &&
          lastStreamingMsg.role === 'assistant' &&
          lastStreamingMsg.streaming
        ) {
          if (lastStreamingMsg.content === '' && !lastStreamingMsg.thinkingContent) {
            // 气泡为空，直接移除避免残留
            messages.value.pop()
          } else {
            lastStreamingMsg.streaming = false
          }
        }
      }

      // 记录当前工具调用
      currentToolCall.value = {
        name: data.name,
        id: data.id,
        arguments: ''
      }

      // 添加工具调用消息
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

    case 'tool_call':
      // 更新工具调用消息（执行中状态）
      // 使用 tool_id 匹配，如果没有则使用 tool 名称
      {
        const toolId = data.tool_id || data.tool
        const existingToolMsg = messages.value.find(
          (m: MessageItem) =>
            m.type === 'tool_call' &&
            (m.tool_id === toolId || (m.tool === data.tool && m.status !== 'completed'))
        )
        if (existingToolMsg) {
          existingToolMsg.arguments = JSON.stringify(data.arguments, null, 2)
          existingToolMsg.status = data.status || 'executing'
        } else {
          messages.value.push({
            role: 'assistant',
            content: '',
            time: formatTime(new Date()),
            type: 'tool_call',
            tool_id: toolId,
            tool: data.tool,
            arguments: JSON.stringify(data.arguments, null, 2),
            status: data.status || 'executing'
          })
        }
        scrollToBottom()
      }
      break

    case 'tool_result':
      // 更新工具调用结果
      {
        const resultToolId = data.tool_id || data.tool
        const pendingToolMsg = [...messages.value]
          .reverse()
          .find(
            (m: MessageItem) =>
              m.type === 'tool_call' &&
              (m.tool_id === resultToolId || (m.tool === data.tool && m.status !== 'completed'))
          )
        if (pendingToolMsg) {
          pendingToolMsg.result =
            typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2)
          pendingToolMsg.status = 'completed'
        }
        scrollToBottom()
      }
      break

    case 'response':
      // 最终响应，标记流式输出结束
      // 找最后一个非 tool_call 的 assistant 消息气泡
      {
        let targetMsg = null
        for (let i = messages.value.length - 1; i >= 0; i--) {
          if (messages.value[i].role === 'assistant' && messages.value[i].type !== 'tool_call') {
            targetMsg = messages.value[i]
            break
          }
        }
        if (targetMsg) {
          targetMsg.streaming = false
          if (data.content && !targetMsg.content) {
            targetMsg.content = data.content
          }
        } else if (data.content) {
          // 如果没有找到合适的气泡，新建一个
          messages.value.push({
            role: 'assistant',
            content: data.content,
            time: formatTime(new Date()),
            streaming: false
          })
        }
      }
      loading.value = false
      sending.value = false
      showSuggestions.value = true // 消息结束后显示推荐问题
      scrollToBottom()
      break

    case 'status':
      // 状态消息 - 显示思考状态
      if (data.status === 'thinking') {
        // 思考状态
      } else if (data.status === 'cleared') {
        messages.value = []
      }
      break

    case 'error':
      Message.error('错误: ' + data.message)
      loading.value = false
      sending.value = false
      showSuggestions.value = true // 出错后显示推荐问题
      // 清除流式状态，移除空的loading气泡
      {
        const lastMsg = messages.value[messages.value.length - 1]
        if (lastMsg && lastMsg.role === 'assistant') {
          if (lastMsg.content === '' && lastMsg.streaming) {
            messages.value.pop() // 移除空的loading气泡
          } else {
            lastMsg.streaming = false
          }
        }
      }
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
  showSuggestions.value = false // 发送后隐藏推荐问题

  // 重置当前轮次的 thinking 归宿（新的对话轮次）
  thinkingMsgIndex.value = -1
  currentThinkingRound.value = 0

  // 立即显示用户消息气泡
  messages.value.push({
    role: 'user',
    content: message,
    time: formatTime(new Date())
  })

  // 立即显示AI loading气泡，避免白屏等待
  messages.value.push({
    role: 'assistant',
    content: '',
    time: formatTime(new Date()),
    streaming: true
  })
  scrollToBottom()

  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(
      JSON.stringify({
        type: 'chat',
        content: message
      })
    )
    sending.value = false
  } else {
    Message.error('连接已断开')
    messages.value.pop() // 移除loading气泡
    loading.value = false
    sending.value = false
  }
}

const clearChat = () => {
  messages.value = []
  thinkingMsgIndex.value = -1
  currentThinkingRound.value = 0
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

// 快捷测试问题 - 展示Agent多工具调用能力
const allQuestions = [
  { text: '统计各分类商品数量，找出商品最多的分类' },
  { text: '帮我下单iPhone 15 Pro：查库存、算价格、创建订单' },
  { text: '查找库存不足的商品，推荐价格相近的替代品' },
  { text: '查询价格在3000-5000元之间的商品有哪些' },
  { text: '帮我查看所有分类列表' },
  { text: '搜索名称包含"手机"的商品' },
  { text: '查询订单状态和详情' },
  { text: '推荐销量最高的商品' }
]

// 当前显示的问题
const displayedQuestions = ref<{ text: string }[]>([])
const usedIndices = ref<Set<number>>(new Set())
const isRefreshing = ref(false)

// 随机选取问题（不重复）
const refreshQuestions = () => {
  isRefreshing.value = true
  setTimeout(() => {
    // 获取未使用过的索引
    const availableIndices = []
    for (let i = 0; i < allQuestions.length; i++) {
      if (!usedIndices.value.has(i)) {
        availableIndices.push(i)
      }
    }

    // 如果可用问题不足，重置已使用记录
    if (availableIndices.length < 2) {
      usedIndices.value.clear()
      for (let i = 0; i < allQuestions.length; i++) {
        availableIndices.push(i)
      }
    }

    // 随机选取2个
    const shuffled = availableIndices.sort(() => Math.random() - 0.5)
    const selectedIndices = shuffled.slice(0, 2)

    // 记录已使用
    selectedIndices.forEach(i => usedIndices.value.add(i))

    // 设置显示的问题
    displayedQuestions.value = selectedIndices.map(i => allQuestions[i])
    isRefreshing.value = false
  }, 300)
}

// 初始化显示的问题
refreshQuestions()

// 将问题填入输入框
const fillMessage = (text: string) => {
  inputMessage.value = text
}

onUnmounted(() => {
  disconnect()
})
</script>

<style scoped>
.chat-page {
  display: flex;
  height: calc(100vh - 88px);
  gap: 16px;
  overflow: hidden; /* 防止页面滚动 */
}

/* 左侧配置面板 - 固定悬挂 */
.config-panel {
  width: 280px;
  flex-shrink: 0;
  height: 100%;
  overflow: hidden;
}

.config-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.config-card :deep(.arco-card-body) {
  flex: 1;
  overflow: hidden;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.config-card :deep(.arco-form) {
  flex-shrink: 0;
}

.config-card :deep(.arco-form-item) {
  margin-bottom: 10px;
}

.config-card :deep(.arco-form-item-label) {
  padding-bottom: 4px;
}

.config-card :deep(.arco-divider) {
  margin: 6px 0;
  flex-shrink: 0;
  border-color: #e5e6eb;
}

.tools-grouped {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  margin-top: 6px;
}

.tool-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tools-grouped :deep(.arco-collapse) {
  overflow-y: auto;
  max-height: 180px;
}

.tools-grouped :deep(.arco-collapse-item) {
  margin-bottom: 4px;
}

.tools-grouped :deep(.arco-collapse-item-header) {
  padding: 6px 10px;
  background: #f7f8fa;
  border-radius: 4px;
  font-size: 12px;
}

.tools-grouped :deep(.arco-collapse-item-content) {
  padding: 6px;
}

.tool-tags-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* 右侧对话区域 */
.chat-area {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chat-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.chat-card :deep(.arco-card-header) {
  display: none;
}

.chat-card :deep(.arco-card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.message-list {
  flex: 1;
  min-height: 0;
  padding: 16px;
  overflow-y: auto; /* 消息列表可滚动 */
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
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
  border-radius: 8px;
}

.tool-args {
  margin: 8px 0;
  padding: 10px 12px;
  background: #fffbf0;
  border-radius: 6px;
  font-size: 12px;
  overflow-x: auto;
}

.tool-result {
  margin-top: 8px;
}

.tool-result pre {
  margin-top: 4px;
  padding: 10px 12px;
  background: #f6ffed;
  border-radius: 6px;
  font-size: 12px;
  overflow-x: auto;
}

.thinking-block {
  padding: 8px;
  background: #f0f5ff;
  border-radius: 8px;
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
  padding: 10px 12px;
  background: #fff;
  border-radius: 6px;
  font-size: 13px;
  white-space: pre-wrap;
}

.blocks-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-area {
  padding: 16px;
  background: #fff;
  margin-top: 20px;
}

.input-row {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.input-row :deep(.arco-input-wrapper) {
  flex: 1;
  height: 44px;
  border-radius: 22px;
  padding: 0 16px;
  background: #f7f8fa;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.input-row :deep(.arco-input-wrapper:hover) {
  background: #fff;
  border-color: #e5e6eb;
}

.input-row :deep(.arco-input-wrapper:focus-within) {
  background: #fff;
  border-color: #165dff;
  box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.1);
}

.input-row :deep(.arco-input) {
  font-size: 14px;
}

.input-row :deep(.arco-btn-primary) {
  flex-shrink: 0;
  height: 44px;
  width: 44px;
  border-radius: 22px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.input-row :deep(.arco-btn-primary .arco-icon) {
  font-size: 18px;
}

pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

/* markstream-vue 样式优化 */
.markdown-stream {
  font-size: 14px;
  line-height: 1.6;
}

.markdown-stream :deep(h1),
.markdown-stream :deep(h2),
.markdown-stream :deep(h3),
.markdown-stream :deep(h4),
.markdown-stream :deep(h5),
.markdown-stream :deep(h6) {
  margin: 16px 0 8px;
  font-weight: 600;
}

.markdown-stream :deep(h1) {
  font-size: 1.5em;
}
.markdown-stream :deep(h2) {
  font-size: 1.3em;
}
.markdown-stream :deep(h3) {
  font-size: 1.1em;
}

.markdown-stream :deep(p) {
  margin: 8px 0;
}

.markdown-stream :deep(ul),
.markdown-stream :deep(ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.markdown-stream :deep(li) {
  margin: 4px 0;
}

.markdown-stream :deep(code) {
  background: #f2f3f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9em;
}

.markdown-stream :deep(pre code) {
  background: transparent;
  padding: 0;
}

.markdown-stream :deep(blockquote) {
  margin: 8px 0;
  padding: 8px 12px;
  border-left: 4px solid #165dff;
  background: #f7f8fa;
  color: #4e5969;
}

.markdown-stream :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0;
}

.markdown-stream :deep(th),
.markdown-stream :deep(td) {
  border: 1px solid #e5e6eb;
  padding: 8px 12px;
  text-align: left;
}

.markdown-stream :deep(th) {
  background: #f7f8fa;
  font-weight: 600;
}

/* 工具调用样式优化 */
.tool-call {
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 8px;
  overflow: visible;
  display: flex;
  flex-direction: column;
}

.tool-call-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #ffe7ba;
  border-bottom: 1px solid #ffd591;
  flex-shrink: 0;
}

.tool-name {
  font-weight: 600;
  color: #d46b08;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}

.status-tag {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
}

.tool-call-content {
  padding: 12px;
}

.tool-section {
  margin-bottom: 12px;
}

.tool-section:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 6px;
  font-weight: 500;
}

.tool-args,
.tool-result {
  margin: 0;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  font-size: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
}

.tool-result {
  background: #f6ffed;
  border-color: #b7eb8f;
}

/* 思考过程样式优化 */
.thinking-block {
  background: #f0f5ff;
  border: 1px solid #adc6ff;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.thinking-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #d6e4ff;
  color: #1d39c4;
  font-size: 13px;
  font-weight: 500;
}

.thinking-header button {
  margin-left: auto;
  color: #1d39c4;
}

.thinking-content {
  padding: 12px;
  background: #fff;
  font-size: 13px;
  line-height: 1.6;
  color: #434343;
  white-space: pre-wrap;
}

/* 工具使用和结果块样式 */
.tool-use-block {
  margin: 8px 0;
}

/* 豆包风格推荐问题 */
.suggestions-block {
  padding-bottom: 8px;
  margin-bottom: 8px;
}

.suggestions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.suggestions-title {
  font-size: 13px;
  color: #86909c;
  font-weight: 500;
}

.refresh-btn {
  color: #86909c;
  font-size: 12px;
  padding: 2px 6px;
}

.refresh-btn:hover {
  color: #165dff;
  background: #e8f3ff;
}

.refresh-btn .refreshing {
  animation: spin 0.5s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-item {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  width: auto;
  max-width: 100%;
}

.suggestion-item:hover {
  background: #e8f3ff;
  border-color: #91caff;
}

.suggestion-item:active {
  background: #d6e4ff;
}

.suggestion-text {
  font-size: 13px;
  color: #1d2129;
  line-height: 1.4;
  white-space: nowrap;
}

.suggestion-arrow {
  color: #86909c;
  font-size: 12px;
  margin-left: 6px;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.suggestion-item:hover .suggestion-arrow {
  transform: translateX(2px);
  color: #165dff;
}

.tool-result-block {
  margin: 8px 0;
  background: #f6ffed;
  border-radius: 8px;
  overflow: hidden;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #d9f7be;
  color: #389e0d;
  font-size: 12px;
  font-weight: 500;
}

.tool-result-block pre {
  padding: 10px 12px;
  margin: 0;
  font-size: 12px;
  background: #fff;
}
</style>
