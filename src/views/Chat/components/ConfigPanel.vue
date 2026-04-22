<template>
  <div class="config-panel-wrapper">
    <a-card class="config-card" :bordered="false">
      <template #title>
        <span class="card-title">配置</span>
      </template>

      <a-form :model="config" layout="vertical">
        <a-form-item label="后端地址">
          <a-input v-model="config.apiBaseUrl" placeholder="http://localhost:8998" />
        </a-form-item>

        <a-form-item label="网关API Key">
          <a-input-password v-model="config.gatewayKey" placeholder="输入网关API Key">
            <template #append>
              <a-button :loading="verifying" @click="verifyGateway">验证</a-button>
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item v-if="verifiedGateway" label="已绑定网关">
          <a-tag color="arcoblue">
            {{ verifiedGateway.gateway_name }} ({{ verifiedGateway.gateway_id }})
          </a-tag>
        </a-form-item>

        <a-form-item label="微服务">
          <MicroserviceSelect
            v-model="config.selectedMicroservices"
            :microservices="microserviceList"
            :disabled="connected || !verifiedGateway"
            :show-health-status="true"
            placeholder="选择要连接的微服务"
          />
        </a-form-item>

        <a-form-item v-if="verifiedGateway" label="LLM模型">
          <a-select
            v-model="config.llmConfigId"
            placeholder="选择LLM模型"
            :disabled="connected"
            allow-clear
          >
            <template #label>
              <template v-if="selectedLlm">
                <span>{{ selectedLlm.config_name }}</span>
                <a-tag size="small" color="arcoblue">{{ selectedLlm.model_name }}</a-tag>
              </template>
            </template>
            <a-option v-for="llm in llmConfigList" :key="llm.config_id" :value="llm.config_id">
              <span>{{ llm.config_name }}</span>
              <a-tag size="small" color="arcoblue">{{ llm.model_name }}</a-tag>
            </a-option>
          </a-select>
        </a-form-item>

        <a-form-item>
          <a-button
            v-if="!connected"
            type="primary"
            long
            :loading="connecting"
            :disabled="!verifiedGateway || config.selectedMicroservices.length === 0 || !config.llmConfigId"
            @click="emit('connect')"
          >
            <template #icon><icon-link /></template>
            连接
          </a-button>
          <a-button v-else type="outline" status="danger" long @click="emit('disconnect')">
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
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconLink, IconClose } from '@arco-design/web-vue/es/icon'
import { storeToRefs } from 'pinia'
import MicroserviceSelect from '@/components/MicroserviceSelect.vue'
import { useConfigStore, useChatStore, useUserStore } from '@/stores'
import { OA_GATEWAY_KEY, DEFAULT_GATEWAY_KEY } from '@/constants'
import type { LlmConfigInfo, Microservice, ToolInfo } from '@/types'

const emit = defineEmits<{
  connect: []
  disconnect: []
}>()

const configStore = useConfigStore()
const chatStore = useChatStore()
const userStore = useUserStore()

const { config } = storeToRefs(configStore)
const connected = computed(() => chatStore.connected)
const connecting = computed(() => chatStore.connecting)
const tools = computed(() => chatStore.tools)

// 角色切换时自动更新 gatewayKey
watch(
  () => userStore.roles,
  () => {
    const roles = userStore.roles
    config.value.gatewayKey =
      roles.includes('OA_ADMIN') || roles.includes('OA_USER') ? OA_GATEWAY_KEY : DEFAULT_GATEWAY_KEY
    config.value.llmConfigId = ''
    config.value.selectedMicroservices = []
  }
)

// Local transient state – not persisted, valid for the current page session only
const verifying = ref(false)
const verifiedGateway = ref<{
  gateway_id: string
  gateway_name: string
  gateway_desc: string | null
  microservices: { id: number; name: string; health_status: string }[]
  llm_configs: LlmConfigInfo[]
} | null>(null)
const microserviceList = ref<Microservice[]>([])
const llmConfigList = ref<LlmConfigInfo[]>([])

const selectedLlm = computed(() =>
  llmConfigList.value.find(l => l.config_id === config.value.llmConfigId)
)

const toolsByGroup = computed(() => {
  const groups: Record<string, ToolInfo[]> = {}
  for (const tool of tools.value) {
    if (!tool.microservice_name) continue
    if (!groups[tool.microservice_name]) groups[tool.microservice_name] = []
    groups[tool.microservice_name].push(tool)
  }
  return groups
})

const verifyGateway = async () => {
  if (!config.value.gatewayKey.trim()) {
    verifiedGateway.value = null
    microserviceList.value = []
    llmConfigList.value = []
    config.value.selectedMicroservices = []
    config.value.llmConfigId = ''
    return
  }
  verifying.value = true
  try {
    const response = await fetch(`${config.value.apiBaseUrl}/api/chat/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: config.value.gatewayKey
    })
    if (response.ok) {
      const data = await response.json()
      verifiedGateway.value = data
      microserviceList.value = data.microservices.map(
        (ms: { id: number; name: string; business_line?: string; health_status: string }) => ({
          id: ms.id,
          name: ms.name,
          business_line: ms.business_line || '',
          health_status: ms.health_status
        })
      )
      config.value.selectedMicroservices = data.microservices.map(
        (ms: { id: number }) => ms.id
      )
      llmConfigList.value = data.llm_configs || []
      if (llmConfigList.value.length > 0 && !config.value.llmConfigId) {
        config.value.llmConfigId = llmConfigList.value[0].config_id
      }
      Message.success('网关验证成功')
    } else {
      verifiedGateway.value = null
      microserviceList.value = []
      llmConfigList.value = []
      config.value.selectedMicroservices = []
      config.value.llmConfigId = ''
      Message.error('网关 Key 无效')
    }
  } catch {
    verifiedGateway.value = null
    microserviceList.value = []
    llmConfigList.value = []
    config.value.selectedMicroservices = []
    config.value.llmConfigId = ''
    Message.error('网关验证失败，请检查后端地址')
  } finally {
    verifying.value = false
  }
}
</script>

<style scoped>
.config-panel-wrapper {
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

.tool-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tools-grouped {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  margin-top: 6px;
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
</style>
