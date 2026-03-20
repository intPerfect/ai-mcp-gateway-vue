/* eslint-disable @typescript-eslint/no-explicit-any */
<template>
  <div class="tools-page">
    <a-card>
      <template #title>
        <a-space>
          <icon-apps />
          <span>工具管理</span>
        </a-space>
      </template>
      <template #extra>
        <a-space>
          <a-button type="primary" @click="loadTools">
            <template #icon><icon-refresh /></template>
            刷新
          </a-button>
          <a-button type="primary" status="success" @click="showImportModal = true">
            <template #icon><icon-upload /></template>
            导入OpenAPI
          </a-button>
        </a-space>
      </template>

      <a-table
        :columns="columns"
        :data="toolsList"
        :loading="loading"
        :pagination="false"
        row-key="name"
      >
        <template #name="{ record }">
          <a-tag color="arcoblue">{{ record.name }}</a-tag>
        </template>
        <template #description="{ record }">
          <span class="tool-description">{{ record.description || '暂无描述' }}</span>
        </template>
        <template #status="{ record }">
          <a-tag :color="getStatusColor(record.status)">
            {{ getStatusText(record.status) }}
          </a-tag>
        </template>
        <template #httpUrl="{ record }">
          <span class="http-url">{{ record.http_url || '-' }}</span>
        </template>
        <template #operations="{ record }">
          <a-space>
            <a-button type="text" size="small" @click="checkHealth(record)">
              <template #icon><icon-check-circle /></template>
              检查
            </a-button>
            <a-popconfirm
              content="确定要删除该工具吗？"
              @ok="deleteTool(record)"
            >
              <a-button type="text" status="danger" size="small">
                <template #icon><icon-delete /></template>
              </a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <!-- OpenAPI导入弹窗 -->
    <a-modal
      v-model:visible="showImportModal"
      title="导入OpenAPI工具"
      :width="600"
      @ok="handleImport"
      :ok-loading="importing"
    >
      <a-form :model="importForm" layout="vertical">
        <a-form-item label="服务名称" required>
          <a-input v-model="importForm.serviceName" placeholder="商品服务" />
        </a-form-item>
        <a-form-item label="服务URL" required>
          <a-input v-model="importForm.serviceUrl" placeholder="http://localhost:8778" />
        </a-form-item>
        <a-form-item label="OpenAPI地址">
          <a-input v-model="importForm.openapiUrl" placeholder="http://localhost:8778/openapi.json" />
        </a-form-item>
        <a-form-item>
          <a-divider>或者直接导入 Product Service 示例数据</a-divider>
          <a-button type="outline" @click="importProductService" :loading="importing">
            <template #icon><icon-apps /></template>
            导入 Product Service
          </a-button>
        </a-form-item>
      </a-form>

      <!-- 预览区域 -->
      <div v-if="importPreview.length > 0" class="import-preview">
        <div class="preview-title">将导入的工具预览：</div>
        <div v-for="tool in importPreview" :key="tool.name" class="preview-item">
          <a-tag size="small">{{ tool.method?.toUpperCase() || 'GET' }}</a-tag>
          <span>{{ tool.name }}</span>
          <span class="preview-path">{{ tool.path }}</span>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import type { TableColumn } from '@arco-design/web-vue'
import {
  IconApps,
  IconRefresh,
  IconUpload,
  IconCheckCircle,
  IconDelete
} from '@arco-design/web-vue/es/icon'

interface ToolInfo {
  name: string
  description: string
  input_schema: any
  status: string
  http_url?: string
  error?: string
}

const columns: TableColumn[] = [
  {
    title: '工具名称',
    dataIndex: 'name',
    slotName: 'name',
    width: 180
  },
  {
    title: '描述',
    dataIndex: 'description',
    slotName: 'description'
  },
  {
    title: '状态',
    dataIndex: 'status',
    slotName: 'status',
    width: 100
  },
  {
    title: 'HTTP地址',
    dataIndex: 'http_url',
    slotName: 'http_url',
    width: 200
  },
  {
    title: '操作',
    slotName: 'operations',
    width: 150
  }
]

const loading = ref(false)
const toolsList = ref<ToolInfo[]>([])
const showImportModal = ref(false)
const importing = ref(false)
const importPreview = ref<any[]>([])

const importForm = reactive({
  serviceName: 'Product Service',
  serviceUrl: 'http://localhost:8778',
  openapiUrl: ''
})

const loadTools = async () => {
  loading.value = true
  try {
    const response = await fetch('/api/tools')
    const result = await response.json()
    if (result.code === '0000') {
      toolsList.value = result.data?.tools || []
    }
  } catch (error: any) {
    Message.error('加载工具失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy': return 'green'
    case 'unhealthy': return 'red'
    default: return 'gray'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'healthy': return '健康'
    case 'unhealthy': return '异常'
    default: return '未知'
  }
}

const checkHealth = async (tool: ToolInfo) => {
  try {
    const response = await fetch(`/api/tools/${tool.name}/check`, {
      method: 'POST'
    })
    const result = await response.json()
    if (result.code === '0000') {
      if (result.data?.healthy) {
        Message.success(`${tool.name} 健康检查通过`)
      } else {
        Message.warning(`${tool.name} 健康检查失败: ${result.data?.message}`)
      }
      loadTools()
    }
  } catch (error: any) {
    Message.error('检查失败: ' + error.message)
  }
}

const deleteTool = async (tool: ToolInfo) => {
  Message.info('删除功能待实现')
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
      loadTools()
    } else {
      Message.error('导入失败: ' + result.info)
    }
  } catch (error: any) {
    Message.error('导入失败: ' + error.message)
  } finally {
    importing.value = false
  }
}

const importProductService = async () => {
  importing.value = true
  try {
    const response = await fetch('/api/openapi/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_name: 'Product Service',
        service_url: 'http://localhost:8778',
        openapi_url: ''
      })
    })
    const result = await response.json()
    if (result.code === '0000') {
      Message.success(`成功导入 ${result.data?.imported || 0} 个工具`)
      showImportModal.value = false
      loadTools()
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
  loadTools()
})
</script>

<style scoped>
.tools-page {
  padding: 16px;
}

.tool-description {
  color: #86909c;
  font-size: 13px;
}

.http-url {
  font-family: monospace;
  font-size: 12px;
  color: #4e61a9;
}

.import-preview {
  margin-top: 16px;
  padding: 12px;
  background: #f7f8fa;
  border-radius: 4px;
}

.preview-title {
  font-weight: 500;
  margin-bottom: 8px;
  color: #1d2129;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
}

.preview-path {
  color: #86909c;
  font-size: 11px;
  margin-left: auto;
}
</style>
