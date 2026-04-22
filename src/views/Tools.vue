<template>
  <div class="tools-page">
    <div class="page-toolbar">
      <div class="nav-path">
        <span class="nav-item" :class="{ active: !currentBL }" @click="navigateTo()">全部工具</span>
        <template v-if="currentBL">
          <icon-right class="nav-sep" />
          <span class="nav-item" :class="{ active: !currentMS }" @click="navigateToBL()">{{ currentBL }}</span>
        </template>
        <template v-if="currentMS">
          <icon-right class="nav-sep" />
          <span class="nav-item active">{{ currentMS.name }}</span>
        </template>
        <span class="tool-count">{{ displayTools.length }} 个工具</span>
      </div>
      <div class="toolbar-right">
        <a-button @click="loadData"><template #icon><icon-refresh /></template>刷新</a-button>
        <a-button type="primary" @click="openImportModal"><template #icon><icon-plus /></template>导入工具</a-button>
      </div>
    </div>

    <div class="tool-list-container">
      <a-spin :loading="loading" style="width: 100%; height: 100%">
        <!-- 全部工具: 折叠抽屉 -->
        <div v-if="!currentBL" class="drawer-list">
          <template v-for="bl in businessLines" :key="bl.name">
            <div class="drawer-bl" @click="toggleBL(bl.name)">
              <icon-down class="drawer-arrow" :class="{ collapsed: collapsedBLs.has(bl.name) }" />
              <span class="drawer-bl-name">{{ bl.name }}</span>
              <span class="drawer-bl-count">{{ bl.toolCount }}</span>
            </div>
            <div v-show="!collapsedBLs.has(bl.name)" class="drawer-ms-list">
              <div v-for="ms in bl.microservices" :key="ms.id" class="drawer-ms" @click="navigateToMS(ms)">
                <span class="drawer-ms-name">{{ ms.name }}</span>
                <span class="drawer-ms-count">{{ getToolCount(ms.id) }} 个工具</span>
                <icon-right class="drawer-ms-arrow" />
              </div>
              <div v-if="bl.microservices.length === 0" class="drawer-empty">暂无微服务</div>
            </div>
          </template>
          <div v-if="businessLines.length === 0" class="drawer-empty-page">
            <a-empty description="暂无工具数据" />
          </div>
        </div>

        <!-- 业务线/微服务: 工具列表 -->
        <div v-else class="tool-detail">
          <GroupedToolList
            :tools="displayTools"
            :microservices="microserviceList"
            :loading="false"
            :microservice-id="currentMS?.id"
            @refresh="loadData"
          />
        </div>
      </a-spin>
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
            <a-input v-model="importForm.serviceUrl" placeholder="选定微服务后查看" disabled style="flex: 1" />
            <a-button @click="copyUrl"><template #icon><icon-copy /></template></a-button>
          </a-input-group>
        </a-form-item>
        <a-form-item label="OpenAPI 地址" required>
          <a-input v-model="importForm.openapiUrl" placeholder="http://localhost:8778/openapi.json" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconRefresh, IconPlus, IconCopy, IconRight, IconDown } from '@arco-design/web-vue/es/icon'
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
const collapsedBLs = ref<Set<string>>(new Set())

const route = useRoute()
const currentBL = ref<string | null>(null)
const currentMS = ref<Microservice | null>(null)

interface BLGroup {
  name: string
  microservices: Microservice[]
  toolCount: number
}

const businessLines = computed<BLGroup[]>(() => {
  const map = new Map<string, Microservice[]>()
  microserviceList.value.forEach(ms => {
    const bl = ms.business_line || '未分类'
    if (!map.has(bl)) map.set(bl, [])
    map.get(bl)!.push(ms)
  })
  const result: BLGroup[] = []
  map.forEach((msList, name) => {
    let count = 0
    msList.forEach(ms => { count += toolsList.value.filter(t => t.microservice_id === ms.id).length })
    result.push({ name, microservices: msList, toolCount: count })
  })
  return result.sort((a, b) => a.name.localeCompare(b.name))
})

const displayTools = computed(() => {
  if (currentMS.value) return toolsList.value.filter(t => t.microservice_id === currentMS.value!.id)
  if (currentBL.value) {
    const bl = businessLines.value.find(b => b.name === currentBL.value)
    if (bl) {
      const msIds = new Set(bl.microservices.map(ms => ms.id))
      return toolsList.value.filter(t => msIds.has(t.microservice_id))
    }
  }
  return toolsList.value
})

const getToolCount = (msId: number) => toolsList.value.filter(t => t.microservice_id === msId).length

const toggleBL = (name: string) => {
  collapsedBLs.value.has(name) ? collapsedBLs.value.delete(name) : collapsedBLs.value.add(name)
}

const navigateTo = () => {
  currentBL.value = null
  currentMS.value = null
}

const navigateToBL = () => {
  currentMS.value = null
}

const navigateToMS = (ms: Microservice) => {
  currentBL.value = ms.business_line || '未分类'
  currentMS.value = ms
}

const openImportModal = () => {
  if (currentMS.value) {
    importMicroserviceIds.value = [currentMS.value.id]
  } else {
    importMicroserviceIds.value = []
  }
  showImportModal.value = true
}

const importForm = reactive({ serviceUrl: '', openapiUrl: '' })

watch(() => importMicroserviceIds.value, newIds => {
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
})

const loadData = async () => {
  loading.value = true
  try {
    const [tools, microservices] = await Promise.all([getAllTools(), getMicroservices()])
    toolsList.value = tools
    microserviceList.value = microservices

    if (route.query.microservice) {
      const msName = route.query.microservice as string
      const ms = microservices.find(m => m.name === msName)
      if (ms) {
        currentBL.value = ms.business_line || '未分类'
        currentMS.value = ms
      }
    } else if (route.query.businessLine) {
      currentBL.value = route.query.businessLine as string
    }
  } catch (error: any) {
    Message.error('加载数据失败：' + error.message)
  } finally {
    loading.value = false
  }
}

const handleImport = async () => {
  if (!importForm.openapiUrl) { Message.warning('请输入 OpenAPI 地址'); return }
  const microserviceId = importMicroserviceIds.value.length > 0 ? importMicroserviceIds.value[0] : null
  if (!microserviceId) { Message.warning('请选择要绑定的微服务'); return }
  const ms = microserviceList.value.find(m => m.id === microserviceId)

  importing.value = true
  try {
    const result = await importOpenAPI({
      service_name: ms?.name || '',
      service_url: importForm.serviceUrl,
      openapi_url: importForm.openapiUrl,
      microservice_id: microserviceId
    })
    Message.success(`成功导入 ${result.tools?.length || 0} 个工具`)
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
  try { await navigator.clipboard.writeText(importForm.serviceUrl); Message.success('已复制') }
  catch { Message.error('复制失败') }
}

onMounted(() => { loadData() })
</script>

<style scoped>
.tools-page {
  height: calc(100vh - 88px);
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 12px;
}

.page-toolbar {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.nav-path {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}
.nav-item {
  color: #86909c;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
  transition: all 0.15s;
}
.nav-item:hover { color: #165dff; background: #f2f3f5 }
.nav-item.active { color: #1d2129; font-weight: 500; cursor: default }
.nav-item.active:hover { background: transparent }
.nav-sep { font-size: 12px; color: #c9cdd4 }
.tool-count { margin-left: 12px; font-size: 12px; color: #c9cdd4 }

.toolbar-right { display: flex; align-items: center; gap: 8px }

.tool-list-container {
  flex: 1;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}
.tool-list-container :deep(.arco-spin) { height: 100% }

/* 抽屉列表 */
.drawer-list {
  height: 100%;
  overflow-y: auto;
}

.drawer-bl {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #1d2129;
  cursor: pointer;
  user-select: none;
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  border-bottom: 1px solid #f2f3f5;
}
.drawer-bl:hover { background: #fafbfc }

.drawer-arrow {
  font-size: 12px;
  color: #86909c;
  transition: transform 0.15s ease;
}
.drawer-arrow.collapsed { transform: rotate(-90deg) }
.drawer-bl-name { flex: 1 }
.drawer-bl-count {
  font-size: 11px;
  color: #fff;
  font-weight: 500;
  min-width: 20px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  background: #165dff;
  border-radius: 9px;
  padding: 0 6px;
}

.drawer-ms-list { padding: 4px 0 4px 16px }

.drawer-ms {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px 10px 16px;
  margin: 0 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
}
.drawer-ms:hover { background: #f2f3f5 }
.drawer-ms-name { flex: 1; font-size: 13px; color: #4e5969; font-weight: 500 }
.drawer-ms-count {
  font-size: 11px;
  color: #fff;
  font-weight: 500;
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  background: #165dff;
  border-radius: 9px;
  padding: 0 5px;
}
.drawer-ms-arrow { font-size: 12px; color: #c9cdd4 }

.drawer-empty { padding: 12px 24px; font-size: 12px; color: #c9cdd4 }
.drawer-empty-page { padding: 80px 0; text-align: center }

.tool-detail { height: 100% }
</style>
