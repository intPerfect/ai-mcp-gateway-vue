<template>
  <div class="microservice-page">
    <div class="page-header">
      <span class="page-title">微服务管理</span>
      <a-button type="primary" @click="showCreateModal">
        <template #icon><icon-plus /></template>
        新增微服务
      </a-button>
    </div>
    <a-card :bordered="false">
      <a-table
        :columns="columns"
        :data="microserviceList"
        :loading="loading"
        :pagination="false"
        row-key="id"
      >
        <template #name="{ record }">
          <a-link @click="showToolsModal(record)">{{ record.name }}</a-link>
        </template>
        <template #healthStatus="{ record }">
          <a-tag :color="getHealthColor(record.health_status)">
            {{ getHealthText(record.health_status) }}
          </a-tag>
        </template>
        <template #businessLine="{ record }">
          <span>{{ record.business_line || '-' }}</span>
        </template>
        <template #toolCount="{ record }">
          <a-badge
            :count="record.tool_count || 0"
            :dot-style="{ background: 'rgb(var(--primary-6))' }"
          />
        </template>
        <template #status="{ record }">
          <a-tag :color="record.status === 1 ? 'green' : 'red'">
            {{ record.status === 1 ? '启用' : '禁用' }}
          </a-tag>
        </template>
        <template #operations="{ record }">
          <a-space>
            <a-button type="text" size="small" @click="handleHealthCheck(record)">
              <template #icon><icon-check-circle /></template>
              检查
            </a-button>
            <a-tooltip content="编辑">
              <a-button type="text" size="small" @click="showEditModal(record)">
                <template #icon><icon-edit /></template>
              </a-button>
            </a-tooltip>
            <a-popconfirm content="确定要删除该微服务吗？" @ok="handleDelete(record.id)">
              <a-button type="text" status="danger" size="small">
                <template #icon><icon-delete /></template>
              </a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <!-- 新增/编辑微服务弹窗 -->
    <a-modal
      v-model:visible="formModalVisible"
      :title="isEdit ? '编辑微服务' : '新增微服务'"
      :width="500"
      :ok-loading="submitting"
      @ok="handleSubmit"
    >
      <a-form :model="formData" layout="vertical">
        <a-form-item label="服务名称" required>
          <a-input v-model="formData.name" placeholder="请输入服务名称" />
        </a-form-item>
        <a-form-item label="HTTP基础URL" required>
          <a-input v-model="formData.http_base_url" placeholder="http://localhost:8080" />
        </a-form-item>
        <a-form-item label="服务描述">
          <a-textarea
            v-model="formData.description"
            placeholder="请输入服务描述"
            :auto-size="{ minRows: 2, maxRows: 4 }"
          />
        </a-form-item>
        <a-form-item label="业务线">
          <a-input v-model="formData.business_line" placeholder="请输入业务线" />
        </a-form-item>
        <a-form-item v-if="isEdit" label="状态">
          <a-switch v-model="formData.status" :checked-value="1" :unchecked-value="0" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 工具绑定管理弹窗 -->
    <a-modal
      v-model:visible="toolsModalVisible"
      :title="`${currentMicroservice?.name || ''} - 工具管理`"
      :width="900"
      :footer="false"
      class="tools-modal"
    >
      <a-tabs default-active-key="binded">
        <a-tab-pane key="binded" title="已绑定工具">
          <a-table
            :columns="toolColumns"
            :data="bindedTools"
            :loading="toolsLoading"
            :pagination="false"
            row-key="tool_id"
            size="small"
          >
            <template #callStatus="{ record }">
              <a-tooltip :content="getCallStatusTooltip(record)">
                <span class="call-status">{{ getCallStatusIcon(record.call_status) }}</span>
              </a-tooltip>
            </template>
            <template #enabled="{ record }">
              <a-switch
                v-model="record.enabled"
                :checked-value="1"
                :unchecked-value="0"
                size="small"
                @change="handleToolEnabledChange(record)"
              />
            </template>
            <template #operations="{ record }">
              <a-button type="text" size="small" @click="handleUnbindTool(record.tool_id)">
                解绑
              </a-button>
            </template>
          </a-table>
        </a-tab-pane>
        <a-tab-pane key="unbind" title="未绑定工具">
          <a-table
            :columns="unbindToolColumns"
            :data="unbindTools"
            :loading="toolsLoading"
            :pagination="false"
            row-key="tool_id"
            size="small"
          >
            <template #operations="{ record }">
              <a-button type="primary" size="small" @click="handleBindTool(record.tool_id)">
                绑定
              </a-button>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, reactive, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import type { TableColumn } from '@arco-design/web-vue'
import { IconPlus, IconCheckCircle, IconEdit, IconDelete } from '@arco-design/web-vue/es/icon'
import {
  getMicroservices,
  createMicroservice,
  updateMicroservice,
  deleteMicroservice,
  checkMicroserviceHealth,
  getMicroserviceTools,
  getUnbindTools,
  bindTool,
  unbindTool,
  updateToolEnabled
} from '@/api/microservice'
import type {
  Microservice,
  MicroserviceTool,
  MicroserviceCreate,
  MicroserviceUpdate
} from '@/types'

const columns: TableColumn[] = [
  {
    title: '服务名称',
    dataIndex: 'name',
    slotName: 'name',
    width: 150,
    ellipsis: true,
    tooltip: true
  },
  { title: 'HTTP地址', dataIndex: 'http_base_url', ellipsis: true, tooltip: true },
  { title: '描述', dataIndex: 'description', ellipsis: true, tooltip: true },
  { title: '业务线', dataIndex: 'business_line', slotName: 'businessLine', width: 100 },
  { title: '健康状态', dataIndex: 'health_status', slotName: 'healthStatus', width: 80 },
  { title: '工具数', dataIndex: 'tool_count', slotName: 'toolCount', width: 70 },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 70 },
  { title: '操作', slotName: 'operations', width: 140 }
]

const toolColumns: TableColumn[] = [
  { title: '工具名称', dataIndex: 'tool_name', width: 180 },
  { title: '描述', dataIndex: 'tool_description', ellipsis: true },
  { title: '调用状态', slotName: 'callStatus', width: 100 },
  { title: '调用次数', dataIndex: 'call_count', width: 80 },
  { title: '错误次数', dataIndex: 'error_count', width: 80 },
  { title: '启用', slotName: 'enabled', width: 80 },
  { title: '操作', slotName: 'operations', width: 80 }
]

const unbindToolColumns: TableColumn[] = [
  { title: '工具名称', dataIndex: 'tool_name', width: 180 },
  { title: '描述', dataIndex: 'tool_description', ellipsis: true },
  { title: '操作', slotName: 'operations', width: 100 }
]

const loading = ref(false)
const submitting = ref(false)
const toolsLoading = ref(false)
const microserviceList = ref<Microservice[]>([])
const formModalVisible = ref(false)
const toolsModalVisible = ref(false)
const isEdit = ref(false)
const currentMicroservice = ref<Microservice | null>(null)
const bindedTools = ref<MicroserviceTool[]>([])
const unbindTools = ref<MicroserviceTool[]>([])

const formData = reactive<MicroserviceCreate & { id?: number; status?: number }>({
  name: '',
  http_base_url: '',
  description: '',
  business_line: '',
  status: 1
})

const loadMicroservices = async () => {
  loading.value = true
  try {
    microserviceList.value = await getMicroservices()
  } catch (error: any) {
    Message.error('加载微服务列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const getHealthColor = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'green'
    case 'unhealthy':
      return 'red'
    default:
      return 'gray'
  }
}

const getHealthText = (status: string) => {
  switch (status) {
    case 'healthy':
      return '健康'
    case 'unhealthy':
      return '异常'
    default:
      return '未知'
  }
}

const getCallStatusIcon = (status: string) => {
  switch (status) {
    case 'sunny':
      return '☀️ 晴朗'
    case 'cloudy':
      return '☁️ 阴云'
    case 'rainy':
      return '🌧️ 下雨'
    default:
      return '❓ 未知'
  }
}

const getCallStatusTooltip = (record: MicroserviceTool) => {
  const parts = [`状态: ${getCallStatusIcon(record.call_status)}`]
  if (record.last_call_code) {
    parts.push(`返回码: ${record.last_call_code}`)
  }
  if (record.last_call_time) {
    parts.push(`最后调用: ${record.last_call_time}`)
  }
  parts.push(`调用次数: ${record.call_count}`)
  parts.push(`错误次数: ${record.error_count}`)
  return parts.join('\n')
}

const showCreateModal = () => {
  isEdit.value = false
  Object.assign(formData, {
    name: '',
    http_base_url: '',
    description: '',
    business_line: '',
    status: 1
  })
  formModalVisible.value = true
}

const showEditModal = (record: Microservice) => {
  isEdit.value = true
  Object.assign(formData, {
    id: record.id,
    name: record.name,
    http_base_url: record.http_base_url,
    description: record.description,
    business_line: record.business_line,
    status: record.status
  })
  formModalVisible.value = true
}

const handleSubmit = async () => {
  if (!formData.name || !formData.http_base_url) {
    Message.warning('请填写必填项')
    return
  }

  submitting.value = true
  try {
    if (isEdit.value && formData.id) {
      const updateData: MicroserviceUpdate = {
        name: formData.name,
        http_base_url: formData.http_base_url,
        description: formData.description,
        business_line: formData.business_line,
        status: formData.status
      }
      await updateMicroservice(formData.id, updateData)
      Message.success('更新成功')
    } else {
      const createData: MicroserviceCreate = {
        name: formData.name,
        http_base_url: formData.http_base_url,
        description: formData.description,
        business_line: formData.business_line
      }
      await createMicroservice(createData)
      Message.success('创建成功')
    }
    formModalVisible.value = false
    loadMicroservices()
  } catch (error: any) {
    Message.error(error.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id: number) => {
  try {
    await deleteMicroservice(id)
    Message.success('删除成功')
    loadMicroservices()
  } catch (error: any) {
    Message.error(error.message || '删除失败')
  }
}

const handleHealthCheck = async (record: Microservice) => {
  try {
    const result = await checkMicroserviceHealth(record.id)
    if (result.health_status === 'healthy') {
      Message.success(`${record.name} 健康检查通过`)
    } else {
      Message.warning(`${record.name} 健康检查失败: ${result.message}`)
    }
    loadMicroservices()
  } catch (error: any) {
    Message.error(error.message || '健康检查失败')
  }
}

const showToolsModal = async (record: Microservice) => {
  currentMicroservice.value = record
  toolsModalVisible.value = true
  await loadTools()
}

const loadTools = async () => {
  if (!currentMicroservice.value) return

  toolsLoading.value = true
  try {
    const [binded, unbind] = await Promise.all([
      getMicroserviceTools(currentMicroservice.value.id),
      getUnbindTools()
    ])
    bindedTools.value = binded
    unbindTools.value = unbind
  } catch (error: any) {
    Message.error('加载工具列表失败: ' + error.message)
  } finally {
    toolsLoading.value = false
  }
}

const handleBindTool = async (toolId: number) => {
  if (!currentMicroservice.value) return

  try {
    await bindTool(toolId, { microservice_id: currentMicroservice.value.id })
    Message.success('绑定成功')
    loadTools()
    loadMicroservices()
  } catch (error: any) {
    Message.error(error.message || '绑定失败')
  }
}

const handleUnbindTool = async (toolId: number) => {
  try {
    await unbindTool(toolId)
    Message.success('解绑成功')
    loadTools()
    loadMicroservices()
  } catch (error: any) {
    Message.error(error.message || '解绑失败')
  }
}

const handleToolEnabledChange = async (record: MicroserviceTool) => {
  try {
    await updateToolEnabled(record.tool_id, { enabled: record.enabled })
    Message.success(record.enabled === 1 ? '已启用' : '已禁用')
  } catch (error: any) {
    Message.error(error.message || '操作失败')
    // 恢复原状态
    record.enabled = record.enabled === 1 ? 0 : 1
  }
}

onMounted(() => {
  loadMicroservices()
})
</script>

<style scoped>
.microservice-page {
  height: calc(100vh - 88px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.microservice-page :deep(.arco-card) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.microservice-page :deep(.arco-card-body) {
  flex: 1;
  overflow: hidden;
  min-width: 0;
}

.microservice-page :deep(.arco-card-header) {
  display: none;
}

.microservice-page :deep(.arco-table-container) {
  overflow-x: auto;
}

.call-status {
  font-size: 16px;
  cursor: pointer;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.page-title {
  font-size: 16px;
  font-weight: 500;
  color: #1d2129;
}

.tools-modal :deep(.arco-modal-body) {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.tools-modal :deep(.arco-tabs-content) {
  max-height: calc(100vh - 280px);
  overflow-y: auto;
}

.tools-modal :deep(.arco-table-body) {
  max-height: 350px !important;
  overflow-y: auto !important;
}
</style>
