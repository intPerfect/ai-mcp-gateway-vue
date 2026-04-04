<template>
  <div class="tools-page">
    <div class="page-toolbar">
      <div class="toolbar-left">
        <a-select
          v-model="filterBusinessLine"
          placeholder="业务线"
          allow-clear
          style="width: 140px"
        >
          <a-option value="">全部业务线</a-option>
          <a-option v-for="bl in microserviceBusinessLines" :key="bl" :value="bl">
            {{ bl }}
          </a-option>
        </a-select>
        <a-input
          v-model="filterKeyword"
          placeholder="搜索微服务"
          allow-clear
          style="width: 180px"
        />
        <span class="tool-count">{{ filteredTools.length }} 个工具</span>
      </div>
      <div class="toolbar-right">
        <a-button @click="loadData">
          <template #icon><icon-refresh /></template>
          刷新
        </a-button>
        <a-button type="primary" @click="showImportModal = true">
          <template #icon><icon-plus /></template>
          导入工具
        </a-button>
      </div>
    </div>

    <div class="tool-list-container">
      <GroupedToolList
        :tools="filteredTools"
        :microservices="microserviceList"
        :loading="loading"
        @refresh="loadData"
      />
    </div>

    <a-modal
      v-model:visible="showImportModal"
      title="导入 OpenAPI 工具"
      :width="520"
      :ok-loading="importing"
      @ok="handleImport"
    >
      <a-form :model="importForm" layout="vertical">
        <a-form-item label="绑定微服务" required>
          <MicroserviceSelect
            v-model="importMicroserviceIds"
            :microservices="microserviceList"
            :multiple="false"
            placeholder="请选择微服务"
          />
        </a-form-item>
        <a-form-item label="服务 URL">
          <a-input-group :compact="true" style="display: flex; width: 100%">
            <a-input
              v-model="importForm.serviceUrl"
              placeholder="选定微服务后查看"
              disabled
              style="flex: 1"
            />
            <a-button @click="copyUrl">
              <template #icon><icon-copy /></template>
            </a-button>
          </a-input-group>
        </a-form-item>
        <a-form-item label="OpenAPI 地址" required>
          <a-input
            v-model="importForm.openapiUrl"
            placeholder="http://localhost:8778/openapi.json"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconRefresh, IconPlus, IconCopy } from '@arco-design/web-vue/es/icon'
import MicroserviceSelect from '@/components/MicroserviceSelect.vue'
import GroupedToolList from '@/components/GroupedToolList.vue'
import { getAllTools, getMicroservices } from '@/api/microservice'
import { importOpenAPI } from '@/api/openapi'
import type { MicroserviceTool, Microservice } from '@/types'

const loading = ref(false)
const toolsList = ref<MicroserviceTool[]>([])
const microserviceList = ref<Microservice[]>([])
const showImportModal = ref(false)
const importing = ref(false)
const importMicroserviceIds = ref<number[]>([])

const filterBusinessLine = ref<string>('')
const filterKeyword = ref<string>('')

watch(filterBusinessLine, () => {
  filterKeyword.value = ''
})

const microserviceBusinessLines = computed(() => {
  const bls = new Set(microserviceList.value.map(ms => ms.business_line).filter(Boolean))
  return Array.from(bls).sort()
})

const filteredTools = computed(() => {
  let result = toolsList.value

  if (filterBusinessLine.value) {
    result = result.filter(t => {
      const ms = microserviceList.value.find(m => m.id === t.microservice_id)
      return ms?.business_line === filterBusinessLine.value
    })
  }

  if (filterKeyword.value) {
    const keyword = filterKeyword.value.toLowerCase()
    result = result.filter(t => {
      const ms = microserviceList.value.find(m => m.id === t.microservice_id)
      return ms?.name?.toLowerCase().includes(keyword)
    })
  }

  return result
})

const importForm = reactive({
  serviceUrl: '',
  openapiUrl: ''
})

watch(
  () => importMicroserviceIds.value,
  newIds => {
    const newId = newIds.length > 0 ? newIds[0] : null
    if (newId) {
      const ms = microserviceList.value.find(m => m.id === newId)
      if (ms) {
        importForm.serviceUrl = ms.http_base_url
        importForm.openapiUrl = ms.http_base_url.replace(/\/$/, '') + '/openapi.json'
      }
    } else {
      importForm.serviceUrl = ''
      importForm.openapiUrl = ''
    }
  }
)

const loadData = async () => {
  loading.value = true
  try {
    const [tools, microservices] = await Promise.all([getAllTools(), getMicroservices()])
    toolsList.value = tools
    microserviceList.value = microservices
  } catch (error: any) {
    Message.error('加载数据失败：' + error.message)
  } finally {
    loading.value = false
  }
}

const handleImport = async () => {
  if (!importForm.openapiUrl) {
    Message.warning('请输入 OpenAPI 地址')
    return
  }

  const microserviceId =
    importMicroserviceIds.value.length > 0 ? importMicroserviceIds.value[0] : null
  if (!microserviceId) {
    Message.warning('请选择要绑定的微服务')
    return
  }

  const ms = microserviceList.value.find(m => m.id === microserviceId)
  const serviceName = ms?.name || ''

  importing.value = true
  try {
    const result = await importOpenAPI({
      service_name: serviceName,
      service_url: importForm.serviceUrl,
      openapi_url: importForm.openapiUrl,
      microservice_id: microserviceId
    })
    const importedCount = result.tools?.length || 0
    Message.success(`成功导入 ${importedCount} 个工具`)
    showImportModal.value = false
    importMicroserviceIds.value = []
    loadData()
  } catch (error: any) {
    Message.error('导入失败: ' + error.message)
  } finally {
    importing.value = false
  }
}

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(importForm.serviceUrl)
    Message.success('已复制')
  } catch {
    Message.error('复制失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.tools-page {
  height: calc(100vh - 88px);
  display: flex;
  flex-direction: column;
  background: #f2f3f5;
  padding: 16px;
  gap: 12px;
}

.page-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-count {
  font-size: 13px;
  color: #86909c;
  margin-left: 4px;
}

.tool-list-container {
  flex: 1;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}
</style>
