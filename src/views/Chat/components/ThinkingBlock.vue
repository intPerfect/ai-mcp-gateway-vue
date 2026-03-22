/* eslint-disable @typescript-eslint/no-explicit-any */
<template>
  <div class="thinking-block">
    <div class="thinking-header">
      <icon-mind-mapping size="14" />
      <span>思考过程</span>
      <a-button
        type="text"
        size="mini"
        @click="toggleExpand"
      >
        {{ expanded ? '收起' : '展开' }}
      </a-button>
    </div>
    <div v-if="expanded" class="thinking-content">
      {{ content }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { IconMindMapping } from '@arco-design/web-vue/es/icon'

const props = defineProps<{
  content: string
  defaultExpanded?: boolean
}>()

const expanded = ref(props.defaultExpanded ?? false)

const toggleExpand = () => {
  expanded.value = !expanded.value
}
</script>

<style scoped>
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
</style>