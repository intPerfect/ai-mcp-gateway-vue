<template>
  <div class="tool-call">
    <div class="tool-call-header">
      <a-tag color="orange" size="small">
        <icon-tool size="14" />
        工具调用
      </a-tag>
      <span class="tool-name">{{ message.tool }}</span>
      <a-tag v-if="message.status === 'preparing'" color="gray" size="small" class="status-tag">
        准备中
      </a-tag>
      <a-tag
        v-else-if="message.status === 'executing'"
        color="arcoblue"
        size="small"
        class="status-tag"
      >
        执行中
      </a-tag>
      <a-tag
        v-else-if="message.status === 'completed'"
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
        <pre class="tool-args">{{ message.arguments || '无参数' }}</pre>
      </div>
      <div v-if="message.result" class="tool-section">
        <div class="section-label">结果:</div>
        <pre class="tool-result">{{ message.result }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconTool } from '@arco-design/web-vue/es/icon'
import type { ChatMessage } from '@/types'

defineProps<{
  message: ChatMessage
}>()
</script>

<style scoped>
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
</style>
