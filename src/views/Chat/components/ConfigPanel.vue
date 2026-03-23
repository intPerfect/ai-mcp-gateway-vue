<template>
  <a-card class="config-card">
    <template #title>
      <a-space>
        <icon-settings />
        <span>配置</span>
      </a-space>
    </template>

    <a-form :model="localForm" layout="vertical">
      <a-form-item label="后端地址">
        <a-input v-model="localForm.apiBaseUrl" placeholder="http://localhost:8777" />
      </a-form-item>
      <a-form-item label="网关API Key">
        <a-input-password v-model="localForm.gatewayKey" placeholder="输入网关API Key" />
      </a-form-item>
      <a-form-item label="LLM API Key">
        <a-input-password v-model="localForm.llmKey" placeholder="输入LLM API Key (MiniMax)" />
      </a-form-item>
      <a-form-item>
        <a-button
          v-if="!connected"
          type="primary"
          long
          :loading="connecting"
          @click="handleConnect"
        >
          <template #icon><icon-link /></template>
          连接
        </a-button>
        <a-button v-else type="outline" status="danger" long @click="handleDisconnect">
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
</template>

<script setup lang="ts">
import { IconSettings, IconLink, IconClose } from '@arco-design/web-vue/es/icon'
import type { ChatConfigForm, ToolInfo } from '@/types'
import { computed } from 'vue'

const props = defineProps<{
  configForm: ChatConfigForm
  connected: boolean
  connecting: boolean
  tools: ToolInfo[]
}>()

const emit = defineEmits<{
  connect: []
  disconnect: []
  'update:configForm': [ChatConfigForm]
}>()

const localForm = computed({
  get: () => props.configForm,
  set: val => emit('update:configForm', val)
})

const handleConnect = () => emit('connect')
const handleDisconnect = () => emit('disconnect')
</script>

<style scoped>
.config-card {
  height: 100%;
}

.tool-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
