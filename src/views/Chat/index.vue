<template>
  <div class="chat-page">
    <!-- Left config panel (fixed width) -->
    <div class="config-panel">
      <ConfigPanel @connect="handleConnect" @disconnect="handleDisconnect" />
    </div>

    <!-- Right chat area (flexible) -->
    <div class="chat-area">
      <a-card class="chat-card" :bordered="false">
        <template #extra>
          <a-button
            type="text"
            :disabled="!chatStore.hasMessages"
            @click="handleClearChat"
          >
            <template #icon><icon-delete /></template>
            清空
          </a-button>
        </template>

        <!-- Message list + scroll-to-bottom button -->
        <div class="message-area-wrapper">
          <div ref="messageListRef" class="message-list">
            <div v-if="!chatStore.hasMessages" class="empty-chat">
              <icon-message size="48" />
              <p>开始对话吧</p>
            </div>
            <MessageItem
              v-for="(msg, index) in chatStore.messages"
              :key="index"
              :message="msg"
              :default-expanded="chatStore.expandedThoughts[`${index}-0`]"
            />
          </div>

          <transition name="fade">
            <button
              v-if="userScrolled"
              class="scroll-to-bottom-btn"
              @click="scrollToBottomForce()"
            >
              <icon-arrow-down />
            </button>
          </transition>
        </div>

        <!-- Input area -->
        <ChatInput
          :connected="chatStore.connected"
          :loading="chatStore.loading"
          :sending="chatStore.sending"
          :has-messages="chatStore.hasMessages"
          @send="handleSend"
          @stop="handleStop"
          @new-chat="handleNewChat"
        />
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconDelete, IconMessage, IconArrowDown } from '@arco-design/web-vue/es/icon'
import ConfigPanel from './components/ConfigPanel.vue'
import MessageItem from './components/MessageItem.vue'
import ChatInput from './components/ChatInput.vue'
import { useWebSocket } from './composables/useWebSocket'
import { useChatStore } from '@/stores'
import { useScrollToBottom } from '@/hooks'

const chatStore = useChatStore()
const { connect, disconnect, send } = useWebSocket()
const {
  containerRef: messageListRef,
  scrollToBottom,
  scrollToBottomForce,
  userScrolled,
  initScroll,
  cleanupScroll
} = useScrollToBottom()

const formatTime = (date: Date): string =>
  date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

// Auto scroll on new messages (only when user hasn't scrolled up)
watch(
  () => chatStore.messages,
  () => {
    scrollToBottom()
  },
  { deep: true }
)

const handleConnect = async () => {
  await connect()
}

const handleDisconnect = () => {
  disconnect()
}

const handleSend = (message: string) => {
  if (!chatStore.connected || chatStore.loading) return

  chatStore.setSending(true)
  chatStore.setLoading(true)
  chatStore.resetThinkingState()

  // Immediately show user message bubble
  chatStore.addMessage({
    role: 'user',
    content: message,
    time: formatTime(new Date())
  })

  // Immediately show AI loading bubble to avoid blank wait
  chatStore.addMessage({
    role: 'assistant',
    content: '',
    time: formatTime(new Date()),
    streaming: true
  })

  scrollToBottomForce()

  const sent = send({ type: 'chat', content: message })
  if (!sent) {
    Message.error('连接已断开')
    chatStore.messages.pop() // remove loading bubble
    chatStore.setLoading(false)
    chatStore.setSending(false)
  } else {
    // WS send is synchronous; sending state clears immediately
    chatStore.setSending(false)
  }
}

const handleStop = () => {
  send({ type: 'cancel' })
  chatStore.setLoading(false)
  chatStore.setSending(false)
  // Mark the last streaming message as done
  for (let i = chatStore.messages.length - 1; i >= 0; i--) {
    if (chatStore.messages[i].role === 'assistant' && chatStore.messages[i].streaming) {
      chatStore.messages[i].streaming = false
      break
    }
  }
}

const handleClearChat = () => {
  chatStore.clearMessages()
  send({ type: 'clear' })
}

const handleNewChat = () => {
  handleClearChat()
}

onMounted(() => {
  initScroll()
})

onUnmounted(() => {
  cleanupScroll()
})
</script>

<style scoped>
.chat-page {
  display: flex;
  height: calc(100vh - 88px);
  gap: 16px;
  overflow: hidden;
}

/* Left config panel – fixed width */
.config-panel {
  width: 280px;
  flex-shrink: 0;
  height: 100%;
  overflow: hidden;
}

/* Right chat area – fills remaining space */
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
  flex-shrink: 0;
}

.chat-card :deep(.arco-card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding: 0;
}

/* Message area wrapper – relative for scroll button positioning */
.message-area-wrapper {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* Scrollable message list */
.message-list {
  flex: 1;
  min-height: 0;
  padding: 16px;
  overflow-y: auto;
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

pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

/* ===== Scroll-to-bottom button ===== */
.scroll-to-bottom-btn {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #e5e6eb;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: box-shadow 0.2s, background 0.2s;
  color: #4e5969;
  padding: 0;
}

.scroll-to-bottom-btn:hover {
  background: #f2f3f5;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
  color: #165dff;
}

.scroll-to-bottom-btn :deep(.arco-icon) {
  font-size: 16px;
}

/* ===== Fade transition for scroll button ===== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(6px);
}
</style>
