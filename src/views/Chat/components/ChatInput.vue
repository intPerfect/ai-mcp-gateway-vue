<template>
  <div class="chat-input">
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

    <!-- 推荐问题 -->
    <div v-if="connected" class="suggestions-block">
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { IconSend, IconRefresh, IconRight } from '@arco-design/web-vue/es/icon'
import { SUGGESTED_QUESTIONS } from '@/constants'

defineProps<{
  connected: boolean
  sending: boolean
}>()

const emit = defineEmits<{
  send: [message: string]
}>()

const inputMessage = ref('')
const displayedQuestions = ref<{ text: string }[]>([])
const isRefreshing = ref(false)

const handleSend = () => {
  const message = inputMessage.value.trim()
  if (message) {
    emit('send', message)
    inputMessage.value = ''
  }
}

const handleRefresh = () => {
  isRefreshing.value = true
  setTimeout(() => {
    const shuffled = [...SUGGESTED_QUESTIONS].sort(() => Math.random() - 0.5)
    displayedQuestions.value = shuffled.slice(0, 2).map(item => ({ text: item.text }))
    isRefreshing.value = false
  }, 300)
}

const handleSelect = (text: string) => {
  inputMessage.value = text
}

onMounted(() => {
  handleRefresh()
})

defineExpose({
  focus: () => {
    // 可以添加输入框聚焦逻辑
  }
})
</script>

<style scoped>
.chat-input {
  border-top: 1px solid #e5e6eb;
  padding: 12px 16px;
  background: white;
}

.input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.input-row :deep(.arco-input-wrapper) {
  flex: 1;
}

.input-row :deep(.arco-btn-primary) {
  flex-shrink: 0;
}

/* 推荐问题样式 */
.suggestions-block {
  padding-top: 12px;
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
  flex-wrap: nowrap;
  gap: 8px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  flex: 1;
  min-width: 0;
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
  overflow: hidden;
  text-overflow: ellipsis;
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
