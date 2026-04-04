<template>
  <div class="grouped-tool-list">
    <div v-if="loading" class="loading-state">
      <a-spin />
    </div>
    <div v-else-if="groupedTools.length === 0" class="empty-state">
      <a-empty description="暂无工具数据" />
    </div>
    <div v-else class="tool-groups">
      <div v-for="group in groupedTools" :key="group.businessLine" class="business-line-group">
        <div class="group-header" @click="toggleBusinessLine(group.businessLine)">
          <icon-down
            class="collapse-icon"
            :class="{ collapsed: collapsedBL.has(group.businessLine) }"
          />
          <span class="business-line-name">{{ group.businessLine || '未分类' }}</span>
          <a-badge :count="group.totalCount" :dot-style="{ background: 'rgb(var(--primary-6))' }" />
        </div>
        <div v-show="!collapsedBL.has(group.businessLine)" class="group-content">
          <div
            v-for="msGroup in group.microserviceGroups"
            :key="msGroup.microserviceId"
            class="microservice-group"
          >
            <div class="ms-header" @click="toggleMicroservice(msGroup.microserviceId)">
              <icon-down
                class="collapse-icon"
                :class="{ collapsed: collapsedMS.has(msGroup.microserviceId) }"
              />
              <span class="microservice-name">
                {{ msGroup.microserviceName || '未绑定微服务' }}
              </span>
              <a-badge
                :count="msGroup.tools.length"
                :dot-style="{ background: 'rgb(var(--primary-6))' }"
              />
            </div>
            <div v-show="!collapsedMS.has(msGroup.microserviceId)" class="tool-items">
              <div v-for="tool in msGroup.tools" :key="tool.tool_id" class="tool-item">
                <div class="tool-info">
                  <span class="tool-name">{{ tool.tool_name }}</span>
                  <span class="tool-desc">{{ tool.tool_description || '暂无描述' }}</span>
                </div>
                <div class="tool-stats">
                  <a-tooltip :content="getCallStatusTooltip(tool)">
                    <span class="call-status" :class="tool.call_status">
                      {{ getCallStatusIcon(tool.call_status) }}
                    </span>
                  </a-tooltip>
                  <span class="stats-num">
                    {{ tool.call_count || 0 }}/{{ tool.error_count || 0 }}
                  </span>
                </div>
                <div class="tool-actions">
                  <a-button type="text" size="mini" @click="openEditModal(tool)">
                    <template #icon><icon-edit /></template>
                  </a-button>
                  <a-switch
                    v-model="tool.enabled"
                    :checked-value="1"
                    :unchecked-value="0"
                    size="small"
                    @change="handleEnabledChange(tool)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <a-modal
      v-model:visible="editModalVisible"
      title="编辑工具"
      :width="720"
      :ok-loading="editLoading"
      @ok="handleEditSubmit"
      @cancel="closeEditModal"
    >
      <a-spin :loading="detailLoading" style="width: 100%">
        <a-form :model="editForm" layout="vertical">
          <!-- 基本信息 -->
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="工具名称" required>
                <a-input v-model="editForm.tool_name" placeholder="请输入工具名称" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="工具描述">
                <a-input v-model="editForm.tool_description" placeholder="请输入工具描述" />
              </a-form-item>
            </a-col>
          </a-row>

          <!-- HTTP 配置 -->
          <a-divider orientation="left" style="margin: 8px 0 12px">HTTP 配置</a-divider>
          <a-row :gutter="16">
            <a-col :span="4">
              <a-form-item label="方法">
                <a-select v-model="editForm.http_method">
                  <a-option value="GET">GET</a-option>
                  <a-option value="POST">POST</a-option>
                  <a-option value="PUT">PUT</a-option>
                  <a-option value="DELETE">DELETE</a-option>
                  <a-option value="PATCH">PATCH</a-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="20">
              <a-form-item label="请求 URL">
                <a-input v-model="editForm.http_url" placeholder="http://example.com/api/{param}" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="超时时间(ms)">
                <a-input-number
                  v-model="editForm.timeout"
                  :min="1000"
                  :max="300000"
                  :step="1000"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="重试次数">
                <a-input-number
                  v-model="editForm.retry_times"
                  :min="0"
                  :max="10"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item label="请求头 (JSON)">
            <a-textarea
              v-model="editForm.http_headers"
              placeholder='{"Content-Type": "application/json"}'
              :auto-size="{ minRows: 2, maxRows: 4 }"
            />
          </a-form-item>

          <!-- 参数映射 -->
          <a-divider orientation="left" style="margin: 8px 0 12px">
            参数映射
            <a-button type="text" size="mini" style="margin-left: 8px" @click="addParameter">
              <template #icon><icon-plus /></template>
              添加
            </a-button>
          </a-divider>
          <div v-if="editForm.parameters.length === 0" class="empty-params">
            <span style="color: #86909c; font-size: 13px">暂无参数，点击上方“添加”按钮新增</span>
          </div>
          <div v-for="(param, idx) in editForm.parameters" :key="idx" class="param-row">
            <a-row :gutter="8" align="start">
              <a-col :span="4">
                <a-select v-model="param.param_location" placeholder="位置" size="small">
                  <a-option value="query">query</a-option>
                  <a-option value="body">body</a-option>
                  <a-option value="path">path</a-option>
                  <a-option value="header">header</a-option>
                  <a-option value="form">form</a-option>
                  <a-option value="file">file</a-option>
                </a-select>
              </a-col>
              <a-col :span="4">
                <a-input v-model="param.field_name" placeholder="字段名" size="small" />
              </a-col>
              <a-col :span="3">
                <a-select v-model="param.field_type" placeholder="类型" size="small">
                  <a-option value="string">string</a-option>
                  <a-option value="integer">integer</a-option>
                  <a-option value="number">number</a-option>
                  <a-option value="boolean">boolean</a-option>
                  <a-option value="array">array</a-option>
                  <a-option value="object">object</a-option>
                </a-select>
              </a-col>
              <a-col :span="5">
                <a-input v-model="param.field_desc" placeholder="描述" size="small" />
              </a-col>
              <a-col :span="3">
                <a-input v-model="param.default_value" placeholder="默认值" size="small" />
              </a-col>
              <a-col :span="2">
                <a-checkbox
                  :model-value="param.is_required === 1"
                  @change="
                    (v: boolean | (string | boolean | number)[]) =>
                      (param.is_required = v === true ? 1 : 0)
                  "
                >
                  必填
                </a-checkbox>
              </a-col>
              <a-col :span="2">
                <a-button type="text" status="danger" size="mini" @click="removeParameter(idx)">
                  <template #icon><icon-delete /></template>
                </a-button>
              </a-col>
            </a-row>
          </div>
        </a-form>
      </a-spin>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconDown, IconEdit, IconPlus, IconDelete } from '@arco-design/web-vue/es/icon'
import type { MicroserviceTool, Microservice, ToolParameterMapping } from '@/types'
import { updateToolEnabled, updateTool, getToolDetail } from '@/api/microservice'

interface Props {
  tools: MicroserviceTool[]
  microservices?: Microservice[]
  loading?: boolean
  microserviceId?: number
}

const props = withDefaults(defineProps<Props>(), {
  tools: () => [],
  microservices: () => [],
  loading: false,
  microserviceId: undefined
})

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const collapsedBL = ref<Set<string>>(new Set())
const collapsedMS = ref<Set<number | null>>(new Set())

const editModalVisible = ref(false)
const editLoading = ref(false)
const detailLoading = ref(false)
const currentEditTool = ref<MicroserviceTool | null>(null)
const editForm = reactive({
  tool_name: '',
  tool_description: '',
  http_url: '',
  http_method: 'POST',
  http_headers: '',
  timeout: 30000,
  retry_times: 0,
  parameters: [] as ToolParameterMapping[]
})

const toggleBusinessLine = (businessLine: string) => {
  if (collapsedBL.value.has(businessLine)) {
    collapsedBL.value.delete(businessLine)
  } else {
    collapsedBL.value.add(businessLine)
  }
}

const toggleMicroservice = (microserviceId: number | null) => {
  if (collapsedMS.value.has(microserviceId)) {
    collapsedMS.value.delete(microserviceId)
  } else {
    collapsedMS.value.add(microserviceId)
  }
}

const openEditModal = async (tool: MicroserviceTool) => {
  currentEditTool.value = tool
  editForm.tool_name = tool.tool_name
  editForm.tool_description = tool.tool_description || ''
  editForm.http_url = ''
  editForm.http_method = 'POST'
  editForm.http_headers = ''
  editForm.timeout = 30000
  editForm.retry_times = 0
  editForm.parameters = []
  editModalVisible.value = true

  // 加载工具详情
  detailLoading.value = true
  try {
    const detail = await getToolDetail(tool.tool_id)
    if (detail.http_config) {
      editForm.http_url = detail.http_config.http_url || ''
      editForm.http_method = detail.http_config.http_method || 'POST'
      editForm.http_headers = detail.http_config.http_headers || ''
      editForm.timeout = detail.http_config.timeout || 30000
      editForm.retry_times = detail.http_config.retry_times || 0
    }
    editForm.parameters = (detail.parameters || []).map(p => ({ ...p }))
  } catch (error: any) {
    Message.error('加载工具详情失败: ' + (error.message || ''))
  } finally {
    detailLoading.value = false
  }
}

const closeEditModal = () => {
  editModalVisible.value = false
  currentEditTool.value = null
  editForm.tool_name = ''
  editForm.tool_description = ''
  editForm.http_url = ''
  editForm.http_method = 'POST'
  editForm.http_headers = ''
  editForm.timeout = 30000
  editForm.retry_times = 0
  editForm.parameters = []
}

const handleEditSubmit = async () => {
  if (!editForm.tool_name.trim()) {
    Message.warning('请输入工具名称')
    return
  }

  editLoading.value = true
  try {
    await updateTool(currentEditTool.value!.tool_id, {
      tool_name: editForm.tool_name.trim(),
      tool_description: editForm.tool_description.trim() || undefined,
      http_config: {
        http_url: editForm.http_url,
        http_method: editForm.http_method,
        http_headers: editForm.http_headers || undefined,
        timeout: editForm.timeout,
        retry_times: editForm.retry_times
      },
      parameters: editForm.parameters.map((p, idx) => ({
        ...p,
        sort_order: idx
      }))
    })
    Message.success('更新成功')
    closeEditModal()
    emit('refresh')
  } catch (error: any) {
    Message.error(error.message || '更新失败')
  } finally {
    editLoading.value = false
  }
}

const addParameter = () => {
  editForm.parameters.push({
    param_location: 'query',
    field_name: '',
    field_type: 'string',
    field_desc: '',
    is_required: 0,
    default_value: null,
    enum_values: null,
    example_value: null,
    sort_order: editForm.parameters.length
  })
}

const removeParameter = (idx: number) => {
  editForm.parameters.splice(idx, 1)
}

interface MicroserviceGroup {
  microserviceId: number | null
  microserviceName: string | null
  tools: MicroserviceTool[]
}

interface BusinessLineGroup {
  businessLine: string
  totalCount: number
  microserviceGroups: MicroserviceGroup[]
}

const groupedTools = computed<BusinessLineGroup[]>(() => {
  const filtered = props.microserviceId
    ? props.tools.filter(t => t.microservice_id === props.microserviceId)
    : props.tools

  const msMap = new Map<number, Microservice>()
  props.microservices.forEach(ms => {
    msMap.set(ms.id, ms)
  })

  const blMap = new Map<string, Map<number | null, MicroserviceTool[]>>()

  filtered.forEach(tool => {
    const ms = tool.microservice_id ? msMap.get(tool.microservice_id) : null
    // 优先使用工具自带的 business_line（后端始终返回非空值）
    const bl = tool.business_line || ms?.business_line || '未分类'
    const msId = tool.microservice_id || null

    if (!blMap.has(bl)) {
      blMap.set(bl, new Map())
    }
    const msGroupMap = blMap.get(bl)!
    if (!msGroupMap.has(msId)) {
      msGroupMap.set(msId, [])
    }
    msGroupMap.get(msId)!.push(tool)
  })

  const result: BusinessLineGroup[] = []
  blMap.forEach((msGroupMap, bl) => {
    const microserviceGroups: MicroserviceGroup[] = []
    let totalCount = 0
    msGroupMap.forEach((tools, msId) => {
      const ms = msId ? msMap.get(msId) : null
      microserviceGroups.push({
        microserviceId: msId,
        microserviceName: ms?.name || tools[0]?.microservice_name || null,
        tools
      })
      totalCount += tools.length
    })
    microserviceGroups.sort((a, b) =>
      (a.microserviceName || '').localeCompare(b.microserviceName || '')
    )
    result.push({
      businessLine: bl,
      totalCount,
      microserviceGroups
    })
  })

  return result.sort((a, b) => a.businessLine.localeCompare(b.businessLine))
})

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

const getCallStatusTooltip = (record: MicroserviceTool) => {
  const statusText =
    {
      sunny: '晴朗',
      cloudy: '阴云',
      rainy: '下雨',
      unknown: '未知'
    }[record.call_status] || '未知'
  const parts = [`状态: ${statusText}`]
  if (record.last_call_code) parts.push(`返回码: ${record.last_call_code}`)
  if (record.last_call_time) parts.push(`最后调用: ${record.last_call_time}`)
  parts.push(`调用: ${record.call_count || 0}`)
  parts.push(`错误: ${record.error_count || 0}`)
  return parts.join('\n')
}

const handleEnabledChange = async (tool: MicroserviceTool) => {
  try {
    await updateToolEnabled(tool.tool_id, { enabled: tool.enabled })
    Message.success(tool.enabled === 1 ? '已启用' : '已禁用')
  } catch (error: any) {
    Message.error(error.message || '操作失败')
    tool.enabled = tool.enabled === 1 ? 0 : 1
  }
}
</script>

<style scoped>
.grouped-tool-list {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

.loading-state,
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.tool-groups {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.business-line-group {
  background: #fafafa;
  border-radius: 6px;
  overflow: hidden;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.group-header:hover {
  background: #f0f0f0;
}

.collapse-icon {
  font-size: 12px;
  color: #86909c;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.collapse-icon.collapsed {
  transform: rotate(-90deg);
}

.business-line-name {
  font-size: 14px;
  font-weight: 500;
  color: #1d2129;
}

.group-content {
  padding: 0 12px 12px 28px;
}

.microservice-group {
  margin-top: 8px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e5e6eb;
}

.ms-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid #f0f0f0;
}

.ms-header:hover {
  background: #fafafa;
}

.microservice-name {
  font-size: 13px;
  font-weight: 500;
  color: #4e5969;
}

.tool-items {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tool-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 12px;
  background: #fafafa;
  border-radius: 4px;
  transition: background 0.2s;
}

.tool-item:hover {
  background: #f5f5f5;
}

.tool-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.tool-name {
  font-size: 13px;
  font-weight: 500;
  color: #1d2129;
}

.tool-desc {
  font-size: 12px;
  color: #86909c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tool-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.call-status {
  font-size: 14px;
}

.stats-num {
  font-size: 12px;
  color: #86909c;
  font-family: 'SF Mono', 'Consolas', monospace;
  min-width: 40px;
  text-align: right;
}

.tool-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.param-row {
  margin-bottom: 8px;
  padding: 8px;
  background: #fafafa;
  border-radius: 4px;
  border: 1px solid #e5e6eb;
}

.param-row:hover {
  border-color: rgb(var(--primary-6));
}

.empty-params {
  text-align: center;
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
  margin-bottom: 8px;
}
</style>
