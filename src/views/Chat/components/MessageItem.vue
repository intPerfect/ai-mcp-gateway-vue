<template>
  <div class="message-item" :class="message.role">
    <div class="message-avatar">
      <icon-user v-if="message.role === 'user'" />
      <icon-robot v-else />
    </div>
    <div class="message-content">
      <div class="message-header">
        <span class="message-role">{{ message.role === 'user' ? '用户' : 'AI' }}</span>
        <span class="message-time">{{ message.time }}</span>
        <a-spin v-if="message.role === 'assistant' && message.streaming" size="14" />
      </div>
      <div class="message-body">
        <!-- 工具调用消息 -->
        <template v-if="message.type === 'tool_call'">
          <ToolCallMessage :message="message" />
        </template>
        <!-- 普通消息 -->
        <template v-else>
          <!-- 思考过程 -->
          <ThinkingBlock
            v-if="message.thinkingContent"
            :content="message.thinkingContent"
            :expanded="expanded"
            @toggle="handleToggle"
          />
          <!-- 文本内容 -->
          <div
            v-if="typeof message.content === 'string' && message.content.trim()"
            class="text-content"
          >
            <MarkdownRender
              :content="message.content"
              :streaming="message.streaming"
              class="markdown-stream"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { IconUser, IconRobot } from '@arco-design/web-vue/es/icon'
import MarkdownRender from 'markstream-vue'
import 'markstream-vue/index.css'
import ToolCallMessage from './ToolCallMessage.vue'
import ThinkingBlock from './ThinkingBlock.vue'
import type { ChatMessage } from '@/types'

const props = defineProps<{
  message: ChatMessage
  defaultExpanded?: boolean
}>()

const expanded = ref(props.defaultExpanded ?? true)

watch(
  () => props.defaultExpanded,
  val => {
    expanded.value = val ?? true
  }
)

const handleToggle = () => {
  expanded.value = !expanded.value
}
</script>

<style scoped>
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

.text-content {
  font-size: 14px;
  line-height: 1.6;
}

/* Markdown 样式 */
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
</style>
