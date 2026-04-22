<template>
  <div class="gateway-page">
    <a-tabs v-model:active-key="activeTab" class="main-tabs">
      <template #extra>
        <div class="tabs-extra">
          <a-input
            v-model="searchKeyword"
            placeholder="搜索网关/Key/模型..."
            allow-clear
            class="search-input"
          >
            <template #prefix><icon-search /></template>
          </a-input>
          <a-button @click="loadAll">
            <template #icon><icon-refresh /></template>
            刷新
          </a-button>
          <a-button v-if="activeTab === 'gateways'" type="primary" @click="gatewayPaneRef?.showCreateModal()">
            <template #icon><icon-plus /></template>
            新建网关
          </a-button>
          <a-button
            v-else-if="activeTab === 'gatewayKeys'"
            type="primary"
            @click="gatewayKeyPaneRef?.showCreateModal()"
          >
            <template #icon><icon-plus /></template>
            新建Key
          </a-button>
          <a-button
            v-else-if="activeTab === 'llmConfigs'"
            type="primary"
            @click="llmConfigPaneRef?.showCreateModal()"
          >
            <template #icon><icon-plus /></template>
            新建LLM配置
          </a-button>
        </div>
      </template>

      <a-tab-pane key="gateways">
        <template #title>
          <icon-desktop />
          网关配置
        </template>
        <GatewayPane
          ref="gatewayPaneRef"
          :gateways="filteredGateways"
          :microservices-map="gatewayMicroservicesMap"
          :all-microservices="allMicroservices"
          :loading="loading"
          :search-keyword="searchKeyword"
          @refresh="loadAll"
        />
      </a-tab-pane>

      <a-tab-pane key="gatewayKeys">
        <template #title>
          <icon-safe />
          网关Key
        </template>
        <GatewayKeyPane
          ref="gatewayKeyPaneRef"
          :gateway-keys="filteredGatewayKeys"
          :gateways="gateways"
          :loading="loading"
          :search-keyword="searchKeyword"
          @refresh="loadGatewayKeys"
        />
      </a-tab-pane>

      <a-tab-pane key="llmConfigs">
        <template #title>
          <icon-robot />
          LLM配置
        </template>
        <LlmConfigPane
          ref="llmConfigPaneRef"
          :llm-configs="filteredLlmConfigs"
          :loading="loading"
          :search-keyword="searchKeyword"
          @refresh="loadLlmConfigs"
        />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { IconDesktop, IconSafe, IconRobot, IconPlus, IconSearch, IconRefresh } from '@arco-design/web-vue/es/icon'
import { getGateways, getGatewayKeys, getLlmConfigs, getGatewayMicroservices } from '@/api/gateway'
import { getMicroservices } from '@/api/microservice'
import type { Gateway, GatewayKey, LlmConfig, Microservice } from '@/types'
import GatewayPane from './components/GatewayPane.vue'
import GatewayKeyPane from './components/GatewayKeyPane.vue'
import LlmConfigPane from './components/LlmConfigPane.vue'

const route = useRoute()

const activeTab = ref('gateways')
const loading = ref(false)
const searchKeyword = ref('')

const gateways = ref<Gateway[]>([])
const gatewayKeys = ref<GatewayKey[]>([])
const llmConfigs = ref<LlmConfig[]>([])
const allMicroservices = ref<Microservice[]>([])
const gatewayMicroservicesMap = ref<Record<string, Microservice[]>>({})

const kw = computed(() => searchKeyword.value.trim().toLowerCase())

const filteredGateways = computed(() => {
  if (!kw.value) return gateways.value
  return gateways.value.filter(g =>
    g.gateway_name.toLowerCase().includes(kw.value) ||
    g.gateway_id.toLowerCase().includes(kw.value)
  )
})

const filteredGatewayKeys = computed(() => {
  if (!kw.value) return gatewayKeys.value
  return gatewayKeys.value.filter(k =>
    k.gateway_id.toLowerCase().includes(kw.value) ||
    (k.gateway_name && k.gateway_name.toLowerCase().includes(kw.value)) ||
    (k.key_preview && k.key_preview.toLowerCase().includes(kw.value))
  )
})

const filteredLlmConfigs = computed(() => {
  if (!kw.value) return llmConfigs.value
  return llmConfigs.value.filter(c =>
    c.config_name.toLowerCase().includes(kw.value) ||
    c.model_name.toLowerCase().includes(kw.value) ||
    c.base_url.toLowerCase().includes(kw.value)
  )
})

const gatewayPaneRef = ref<InstanceType<typeof GatewayPane>>()
const gatewayKeyPaneRef = ref<InstanceType<typeof GatewayKeyPane>>()
const llmConfigPaneRef = ref<InstanceType<typeof LlmConfigPane>>()

const loadGateways = async () => {
  try {
    gateways.value = await getGateways()
    const msMap: Record<string, Microservice[]> = {}
    await Promise.all(
      gateways.value.map(async gw => {
        try {
          msMap[gw.gateway_id] = await getGatewayMicroservices(gw.gateway_id)
        } catch {
          msMap[gw.gateway_id] = []
        }
      })
    )
    gatewayMicroservicesMap.value = msMap
  } catch (e) {
    console.error('加载网关失败', e)
  }
}

const loadGatewayKeys = async () => {
  try {
    gatewayKeys.value = await getGatewayKeys()
  } catch (e) {
    console.error('加载网关Key失败', e)
  }
}

const loadLlmConfigs = async () => {
  try {
    llmConfigs.value = await getLlmConfigs()
  } catch (e) {
    console.error('加载LLM配置失败', e)
  }
}

const loadAll = async () => {
  loading.value = true
  await Promise.all([
    loadGateways(),
    loadGatewayKeys(),
    loadLlmConfigs(),
    (async () => {
      try {
        allMicroservices.value = await getMicroservices()
      } catch (e) {
        console.error('加载微服务列表失败', e)
      }
    })()
  ])
  loading.value = false
}

onMounted(async () => {
  await loadAll()
  const highlight = route.query['highlight'] as string
  if (highlight) {
    const gw = gateways.value.find(g => g.gateway_id === highlight)
    if (gw) {
      searchKeyword.value = gw.gateway_name
    }
  }
})
</script>

<style scoped>
.gateway-page {
  height: calc(100vh - 88px);
  overflow: hidden;
}

.main-tabs {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  height: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
}

.main-tabs :deep(.arco-tabs-content) {
  flex: 1;
  overflow: hidden;
}

.main-tabs :deep(.arco-tabs-pane) {
  height: 100%;
  overflow: hidden;
}

.main-tabs :deep(.arco-card) {
  border: none;
  height: 100%;
  overflow: hidden;
}

.main-tabs :deep(.arco-card-body) {
  height: 100%;
  overflow: auto;
}

.main-tabs :deep(.arco-card-header) {
  display: none;
}

.main-tabs :deep(.arco-table-td) {
  vertical-align: middle !important;
}

.main-tabs :deep(.arco-table-td .arco-space-item) {
  margin-bottom: 0 !important;
}

.tabs-extra {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  width: 220px;
}
</style>
