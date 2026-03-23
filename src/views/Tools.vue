/* eslint-disable @typescript-eslint/no-explicit-any */
<template>
  <div class="tools-page">
    <a-card :bordered="false">
      <template #extra>
        <a-space>
          <a-button type="primary" @click="loadData">
            <template #icon><icon-refresh /></template>
            刷新
          </a-button>
          <a-button type="primary" status="success" @click="showImportModal = true">
            <template #icon><icon-upload /></template>
            导入OpenAPI
          </a-button>
        </a-space>
      </template>

      <!-- 筛选区域 -->
      <div class="filter-section">
        <a-space wrap>
          <a-select
            v-model="filterMicroservice"
            placeholder="选择微服务"
            allow-clear
            style="width: 200px"
            @change="handleFilterChange"
          >
            <a-option value="">全部微服务</a-option>
            <a-option v-for="ms in microserviceList" :key="ms.id" :value="ms.id">
              {{ ms.name }}
            </a-option>
          </a-select>
          <a-select
            v-model="filterBusinessLine"
            placeholder="选择业务线"
            allow-clear
            style="width: 160px"
            @change="handleFilterChange"
          >
            <a-option value="">全部业务线</a-option>
            <a-option v-for="bl in businessLines" :key="bl" :value="bl">
              {{ bl }}
            </a-option>
          </a-select>
          <a-tag color="arcoblue">共 {{ filteredTools.length }} 个工具</a-tag>
        </a-space>
      </div>

      <a-table
        :columns="columns"
        :data="filteredTools"
        :loading="loading"
        :pagination="{ pageSize: 20 }"
        row-key="tool_id"
      >
        <template #toolName="{ record }">
          <a-space>
            <span class="call-status">{{ getCallStatusIcon(record.call_status) }}</span>
            <a-tag color="arcoblue">{{ record.tool_name }}</a-tag>
          </a-space>
        </template>
        <template #description="{ record }">
          <span class="tool-description">{{ record.tool_description || '暂无描述' }}</span>
        </template>
        <template #microservice="{ record }">
          <a-tag v-if="record.microservice_name" color="green">
            {{ record.microservice_name }}
          </a-tag>
          <span v-else class="unbound">未绑定</span>
        </template>
        <template #callStatus="{ record }">
          <a-tooltip :content="getCallStatusTooltip(record)">
            <span class="call-status-text" :class="record.call_status">
              {{ getCallStatusText(record.call_status) }}
            </span>
          </a-tooltip>
        </template>
        <template #enabled="{ record }">
          <a-switch
            v-model="record.enabled"
            :checked-value="1"
            :unchecked-value="0"
            size="small"
            @change="handleEnabledChange(record)"
          />
        </template>
        <template #callStats="{ record }">
          <span>{{ record.call_count || 0 }} / {{ record.error_count || 0 }}</span>
        </template>
        <template #operations="{ record }">
          <a-space>
            <a-button
              v-if="record.microservice_id"
              type="text"
              size="small"
              @click="handleUnbind(record)"
            >
              解绑
            </a-button>
            <a-button v-else type="text" size="small" @click="showBindModal(record)">绑定</a-button>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <!-- OpenAPI导入弹窗 -->
    <a-modal
      v-model:visible="showImportModal"
      title="导入OpenAPI工具"
      :width="600"
      :ok-loading="importing"
      @ok="handleImport"
    >
      <a-form :model="importForm" layout="vertical">
        <a-form-item label="服务名称" required>
          <a-input v-model="importForm.serviceName" placeholder="商品服务" />
        </a-form-item>
        <a-form-item label="服务URL" required>
          <a-input v-model="importForm.serviceUrl" placeholder="http://localhost:8778" />
        </a-form-item>
        <a-form-item label="OpenAPI地址">
          <a-input
            v-model="importForm.openapiUrl"
            placeholder="http://localhost:8778/openapi.json"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 绑定微服务弹窗 -->
    <a-modal
      v-model:visible="showBindModalVisible"
      title="绑定微服务"
      :ok-loading="binding"
      @ok="handleBind"
    >
      <a-form layout="vertical">
        <a-form-item label="选择微服务">
          <a-select v-model="bindMicroserviceId" placeholder="请选择微服务">
            <a-option v-for="ms in microserviceList" :key="ms.id" :value="ms.id">
              {{ ms.name }} ({{ ms.business_line || '无业务线' }})
            </a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import type { TableColumn } from '@arco-design/web-vue'
import { IconApps, IconRefresh, IconUpload } from '@arco-design/web-vue/es/icon'
import {
  getAllTools,
  getMicroservices,
  bindTool,
  unbindTool,
  updateToolEnabled
} from '@/api/microservice'
import type { MicroserviceTool, Microservice } from '@/types'

const columns: TableColumn[] = [
  {
    title: '工具名称',
    dataIndex: 'tool_name',
    slotName: 'toolName',
    width: 200
  },
  {
    title: '描述',
    dataIndex: 'tool_description',
    slotName: 'description'
  },
  {
    title: '所属微服务',
    dataIndex: 'microservice_name',
    slotName: 'microservice',
    width: 140
  },
  {
    title: '调用状态',
    dataIndex: 'call_status',
    slotName: 'callStatus',
    width: 100
  },
  {
    title: '启用',
    dataIndex: 'enabled',
    slotName: 'enabled',
    width: 80
  },
  {
    title: '调用/错误',
    dataIndex: 'call_count',
    slotName: 'callStats',
    width: 100
  },
  {
    title: '操作',
    slotName: 'operations',
    width: 100
  }
]

const loading = ref(false)
const toolsList = ref<MicroserviceTool[]>([])
const microserviceList = ref<Microservice[]>([])
const showImportModal = ref(false)
const importing = ref(false)
const showBindModalVisible = ref(false)
const binding = ref(false)
const bindToolId = ref<number | null>(null)
const bindMicroserviceId = ref<number | null>(null)

const filterMicroservice = ref<string | number>('')
const filterBusinessLine = ref<string>('')

const importForm = reactive({
  serviceName: 'Product Service',
  serviceUrl: 'http://localhost:8778',
  openapiUrl: ''
})

// 获取所有业务线
const businessLines = computed(() => {
  const lines = new Set<string>()
  microserviceList.value.forEach(ms => {
    if (ms.business_line) {
      lines.add(ms.business_line)
    }
  })
  return Array.from(lines)
})

// 筛选后的工具列表
const filteredTools = computed(() => {
  let result = toolsList.value

  if (filterMicroservice.value) {
    result = result.filter(t => t.microservice_id === filterMicroservice.value)
  }

  if (filterBusinessLine.value) {
    const msIds = microserviceList.value
      .filter(ms => ms.business_line === filterBusinessLine.value)
      .map(ms => ms.id)
    result = result.filter(t => t.microservice_id && msIds.includes(t.microservice_id))
  }

  return result
})

const loadData = async () => {
  loading.value = true
  try {
    const [tools, microservices] = await Promise.all([getAllTools(), getMicroservices()])
    toolsList.value = tools
    microserviceList.value = microservices
  } catch (error: any) {
    Message.error('加载数据失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  // 筛选已通过computed自动处理
}

const getCallStatusIcon = (status: string) => {
  switch (status) {
    case 'sunny':
      return '☀️'
    case 'cloudy':
      return '☁️'
    case 'rainy':
      return '🌧️'
    default:
      return '🌤️'
  }
}

const getCallStatusText = (status: string) => {
  switch (status) {
    case 'sunny':
      return '晴朗'
    case 'cloudy':
      return '阴云'
    case 'rainy':
      return '下雨'
    default:
      return '未知'
  }
}

const getCallStatusTooltip = (record: MicroserviceTool) => {
  const parts = [`状态: ${getCallStatusText(record.call_status)}`]
  if (record.last_call_code) {
    parts.push(`返回码: ${record.last_call_code}`)
  }
  if (record.last_call_time) {
    parts.push(`最后调用: ${record.last_call_time}`)
  }
  parts.push(`调用: ${record.call_count || 0}`)
  parts.push(`错误: ${record.error_count || 0}`)
  const errorRate = record.call_count
    ? (((record.error_count || 0) / record.call_count) * 100).toFixed(1)
    : '0'
  parts.push(`错误率: ${errorRate}%`)
  return parts.join('\n')
}

const handleEnabledChange = async (record: MicroserviceTool) => {
  try {
    await updateToolEnabled(record.tool_id, { enabled: record.enabled })
    Message.success(record.enabled === 1 ? '已启用' : '已禁用')
  } catch (error: any) {
    Message.error(error.message || '操作失败')
    record.enabled = record.enabled === 1 ? 0 : 1
  }
}

const showBindModal = (record: MicroserviceTool) => {
  bindToolId.value = record.tool_id
  bindMicroserviceId.value = null
  showBindModalVisible.value = true
}

const handleBind = async () => {
  if (!bindMicroserviceId.value) {
    Message.warning('请选择微服务')
    return
  }
  if (!bindToolId.value) return

  binding.value = true
  try {
    await bindTool(bindToolId.value, { microservice_id: bindMicroserviceId.value })
    Message.success('绑定成功')
    showBindModalVisible.value = false
    loadData()
  } catch (error: any) {
    Message.error(error.message || '绑定失败')
  } finally {
    binding.value = false
  }
}

const handleUnbind = async (record: MicroserviceTool) => {
  try {
    await unbindTool(record.tool_id)
    Message.success('解绑成功')
    loadData()
  } catch (error: any) {
    Message.error(error.message || '解绑失败')
  }
}

const handleImport = async () => {
  if (!importForm.openapiUrl) {
    Message.warning('请输入OpenAPI地址')
    return
  }

  importing.value = true
  try {
    const response = await fetch('/api/openapi/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_name: importForm.serviceName,
        service_url: importForm.serviceUrl,
        openapi_url: importForm.openapiUrl
      })
    })
    const result = await response.json()
    if (result.code === '0000') {
      Message.success(`成功导入 ${result.data?.imported || 0} 个工具`)
      showImportModal.value = false
      loadData()
    } else {
      Message.error('导入失败: ' + result.info)
    }
  } catch (error: any) {
    Message.error('导入失败: ' + error.message)
  } finally {
    importing.value = false
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
  overflow-x: hidden;
}

.tools-page :deep(.arco-card) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.tools-page :deep(.arco-card-header) {
  display: none;
}

.tools-page :deep(.arco-card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.tools-page :deep(.arco-table-wrapper) {
  overflow: hidden;
}

.filter-section {
  flex-shrink: 0;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f7f8fa;
  border-radius: 8px;
}

.tool-description {
  color: #86909c;
  font-size: 13px;
}

.unbound {
  color: #c9cdd4;
  font-size: 12px;
}

.call-status {
  font-size: 16px;
}

.call-status-text {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.call-status-text.sunny {
  background: #e8ffea;
  color: #00b42a;
}

.call-status-text.cloudy {
  background: #fff7e8;
  color: #ff7d00;
}

.call-status-text.rainy {
  background: #ffece8;
  color: #f53f3f;
}

.call-status-text.unknown {
  background: #f2f3f5;
  color: #86909c;
}
</style>
