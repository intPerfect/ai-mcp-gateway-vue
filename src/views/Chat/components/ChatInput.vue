<template>
  <div class="chat-input">
    <!-- Suggested questions: only when connected and no messages yet -->
    <div v-if="connected && !hasMessages && displayedQuestions.length" class="suggestions-block">
      <div class="suggestions-header">
        <span class="suggestions-title">猜你想问</span>
        <a-button type="text" size="small" class="refresh-btn" @click="handleRefresh">
          <icon-refresh :class="{ refreshing: isRefreshing }" />
          <span>换一换</span>
        </a-button>
      </div>
      <div class="suggestions-list">
        <div
          v-for="q in displayedQuestions"
          :key="q.text"
          class="suggestion-item"
          @click="handleSelect(q.text)"
        >
          <span class="suggestion-text">{{ q.text }}</span>
          <icon-right class="suggestion-arrow" />
        </div>
      </div>
    </div>

    <div class="input-row">
      <a-popconfirm content="确定要清空并新建对话吗？" @ok="emit('new-chat')">
        <a-button class="action-btn" :disabled="!connected">
          <template #icon><icon-plus /></template>
        </a-button>
      </a-popconfirm>

      <a-input
        v-model="inputMessage"
        placeholder="输入消息，按 Enter 发送..."
        :disabled="!connected || loading"
        allow-clear
        @press-enter="handleSend"
      />

      <!-- Stop button when generating, send button otherwise -->
      <button v-if="loading" class="stop-btn" title="停止生成" @click="emit('stop')">
        <span class="stop-icon"></span>
      </button>
      <a-button
        v-else
        type="primary"
        class="send-btn"
        :disabled="!connected || !inputMessage.trim()"
        :loading="sending"
        @click="handleSend"
      >
        <template #icon><icon-send /></template>
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { IconSend, IconRefresh, IconRight, IconPlus } from '@arco-design/web-vue/es/icon'
import { SUGGESTED_QUESTIONS } from '@/constants'
import { useUserStore } from '@/stores'

const props = defineProps<{
  connected: boolean
  loading: boolean
  sending: boolean
  hasMessages: boolean
}>()

const emit = defineEmits<{
  send: [message: string]
  stop: []
  'new-chat': []
}>()

const userStore = useUserStore()
const inputMessage = ref('')
const displayedQuestions = ref<{ text: string }[]>([])
const isRefreshing = ref(false)
const usedIndices = ref<Set<number>>(new Set())

// Filter suggested questions by user role
const getFilteredQuestions = () => {
  const roles = userStore.userInfo?.roles || []
  if (roles.includes('OA_ADMIN')) {
    return SUGGESTED_QUESTIONS.filter(q => q.businessLine === 'oa' || q.businessLine === 'common')
  }
  return SUGGESTED_QUESTIONS.filter(
    q => q.businessLine === 'product' || q.businessLine === 'common'
  )
}

const allQuestions = getFilteredQuestions()

const handleSend = () => {
  const message = inputMessage.value.trim()
  if (message && props.connected && !props.loading) {
    emit('send', message)
    inputMessage.value = ''
  }
}

const handleRefresh = () => {
  if (allQuestions.length === 0) {
    displayedQuestions.value = []
    return
  }
  isRefreshing.value = true
  setTimeout(() => {
    const availableIndices: number[] = []
    for (let i = 0; i < allQuestions.length; i++) {
      if (!usedIndices.value.has(i)) availableIndices.push(i)
    }
    if (availableIndices.length < 2) {
      usedIndices.value.clear()
      for (let i = 0; i < allQuestions.length; i++) availableIndices.push(i)
    }
    const shuffled = availableIndices.sort(() => Math.random() - 0.5)
    const selectedIndices = shuffled.slice(0, Math.min(2, shuffled.length))
    selectedIndices.forEach(i => usedIndices.value.add(i))
    displayedQuestions.value = selectedIndices.map(i => allQuestions[i])
    isRefreshing.value = false
  }, 300)
}

const handleSelect = (text: string) => {
  inputMessage.value = text
}

onMounted(() => {
  handleRefresh()
})
</script>

<style scoped>
.chat-input {
  padding: 4px 16px 12px;
  background: #fff;
}

.input-row {
  display: flex;
  gap: 8px;
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

.action-btn {
  flex-shrink: 0;
  height: 44px;
  width: 44px;
  border-radius: 22px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f2f3f5;
  border: none;
  color: #4e5969;
}

.action-btn:hover {
  background: #e5e6eb;
  color: #1d2129;
}

.action-btn :deep(.arco-icon) {
  font-size: 18px;
}

.send-btn {
  flex-shrink: 0;
  height: 44px;
  width: 44px;
  border-radius: 22px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn :deep(.arco-icon) {
  font-size: 18px;
}

.stop-btn {
  flex-shrink: 0;
  height: 44px;
  width: 44px;
  border-radius: 22px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8f3ff;
  border: none;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}

.stop-btn:hover {
  background: #d6e4ff;
  transform: scale(1.05);
}

.stop-btn:active {
  transform: scale(0.95);
}

.stop-icon {
  width: 14px;
  height: 14px;
  background: #165dff;
  border-radius: 2px;
  flex-shrink: 0;
}

/* ===== Suggested questions ===== */
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
</style>
