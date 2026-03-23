<template>
  <div ref="listRef" class="message-list">
    <div v-if="messages.length === 0" class="empty-chat">
      <icon-message size="48" />
      <p>开始对话吧</p>
    </div>
    <MessageItem
      v-for="(msg, index) in messages"
      :key="index"
      :message="msg"
      :default-expanded="expandedThoughts?.[index]"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { IconMessage } from '@arco-design/web-vue/es/icon'
import MessageItem from './MessageItem.vue'
import type { ChatMessage } from '@/types'

const props = defineProps<{
  messages: ChatMessage[]
  expandedThoughts?: Record<number, boolean>
}>()

const listRef = ref<any>(null)

// 自动滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (listRef.value) {
      listRef.value.scrollTop = listRef.value.scrollHeight
    }
  })
}

// 消息变化时自动滚动
watch(
  () => props.messages,
  () => {
    scrollToBottom()
  },
  { deep: true }
)

defineExpose({
  scrollToBottom
})
</script>

<style scoped>
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
</style>
