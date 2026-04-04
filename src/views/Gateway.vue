<template>
  <div class="gateway-page">
    <!-- 标签页切换 -->
    <a-tabs v-model:active-key="activeTab" class="main-tabs">
      <template #extra>
        <a-button v-if="activeTab === 'gateways'" type="primary" @click="showGatewayModal()">
          <template #icon><icon-plus /></template>
          新建网关
        </a-button>
        <a-button
          v-else-if="activeTab === 'gatewayKeys'"
          type="primary"
          @click="showGatewayKeyModal()"
        >
          <template #icon><icon-plus /></template>
          新建Key
        </a-button>
        <a-button
          v-else-if="activeTab === 'llmConfigs'"
          type="primary"
          @click="showLlmConfigModal()"
        >
          <template #icon><icon-plus /></template>
          新建LLM配置
        </a-button>
      </template>
      <!-- 网关配置 -->
      <a-tab-pane key="gateways">
        <template #title>
          <icon-desktop />
          网关配置
        </template>
        <a-card :bordered="false">
          <a-table :data="gateways" :columns="gatewayColumns" :pagination="false" row-key="id">
            <template #microservices="{ record }">
              <a-space wrap>
                <a-tag
                  v-for="ms in gatewayMicroservicesMap[record.gateway_id] || []"
                  :key="ms.id"
                  color="arcoblue"
                >
                  {{ ms.name }}
                </a-tag>
                <span v-if="!gatewayMicroservicesMap[record.gateway_id]?.length" class="unbound">
                  暂无
                </span>
              </a-space>
            </template>
            <template #status="{ record }">
              <a-tag :color="record.status === 1 ? 'green' : 'red'">
                {{ record.status === 1 ? '启用' : '禁用' }}
              </a-tag>
            </template>
            <template #actions="{ record }">
              <a-space :size="4">
                <a-button type="text" size="small" @click="showBindMicroserviceModal(record)">
                  绑定微服务
                </a-button>
                <a-button type="text" size="small" @click="showGatewayModal(record)">
                  <template #icon><icon-edit /></template>
                </a-button>
                <a-button
                  type="text"
                  size="small"
                  status="danger"
                  @click="deleteGateway(record.id)"
                >
                  <template #icon><icon-delete /></template>
                </a-button>
              </a-space>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>

      <!-- 网关Key -->
      <a-tab-pane key="gatewayKeys">
        <template #title>
          <icon-safe />
          网关Key
        </template>
        <a-card :bordered="false">
          <a-table
            :columns="gatewayKeyColumns"
            :data="gatewayKeys"
            :loading="loading"
            :pagination="false"
            row-key="id"
          >
            <template #key_preview="{ record }">
              <a-tooltip :content="record.key_preview">
                <span class="masked-key">{{ record.key_preview }}</span>
              </a-tooltip>
            </template>
            <template #usage="{ record }">
              <div v-if="keyUsageMap[record.key_id]" class="usage-cell">
                <span class="usage-text">
                  <span
                    :class="{
                      'usage-exceeded':
                        keyUsageMap[record.key_id].current_count >= record.rate_limit
                    }"
                  >
                    {{ keyUsageMap[record.key_id].current_count }}
                  </span>
                  <span class="usage-sep">/</span>
                  <span>{{ record.rate_limit }}</span>
                </span>
                <a-progress
                  :percent="keyUsageMap[record.key_id].current_count / record.rate_limit"
                  :status="
                    keyUsageMap[record.key_id].current_count >= record.rate_limit
                      ? 'danger'
                      : 'normal'
                  "
                  size="small"
                  :show-text="false"
                  :stroke-width="6"
                  class="usage-progress"
                />
              </div>
              <span v-else class="usage-empty">0/{{ record.rate_limit }}</span>
            </template>
            <template #status="{ record }">
              <a-tag :color="record.status === 1 ? 'green' : 'red'">
                {{ record.status === 1 ? '启用' : '禁用' }}
              </a-tag>
            </template>
            <template #actions="{ record }">
              <a-button
                type="text"
                size="small"
                status="danger"
                @click="deleteGatewayKey(record.id)"
              >
                删除
              </a-button>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>

      <!-- LLM配置 (v10.0 统一) -->
      <a-tab-pane key="llmConfigs">
        <template #title>
          <icon-robot />
          LLM配置
        </template>
        <a-card :bordered="false">
          <a-table
            :columns="llmConfigColumns"
            :data="llmConfigs"
            :loading="loading"
            :pagination="false"
            row-key="id"
          >
            <template #api_type="{ record }">
              <a-tag :color="record.api_type === 'openai' ? 'green' : 'purple'">
                {{ record.api_type }}
              </a-tag>
            </template>
            <template #status="{ record }">
              <a-tag :color="record.status === 1 ? 'green' : 'red'">
                {{ record.status === 1 ? '启用' : '禁用' }}
              </a-tag>
            </template>
            <template #actions="{ record }">
              <a-button type="text" size="small" @click="showLlmConfigModal(record)">编辑</a-button>
              <a-button
                type="text"
                size="small"
                status="danger"
                @click="deleteLlmConfig(record.id)"
              >
                删除
              </a-button>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>
    </a-tabs>

    <!-- 网关弹窗 -->
    <a-modal
      v-model:visible="gatewayModalVisible"
      :title="gatewayForm.id ? '编辑网关' : '新建网关'"
      :ok-loading="saving"
      @ok="saveGateway"
    >
      <a-form :model="gatewayForm" layout="vertical">
        <a-form-item label="网关ID" :required="!gatewayForm.id">
          <a-input
            v-model="gatewayForm.gateway_id"
            :disabled="!!gatewayForm.id"
            placeholder="gateway_001"
          />
        </a-form-item>
        <a-form-item label="网关名称" required>
          <a-input v-model="gatewayForm.gateway_name" placeholder="商品服务网关" />
        </a-form-item>
        <a-form-item label="描述">
          <a-input v-model="gatewayForm.gateway_desc" placeholder="网关描述" />
        </a-form-item>
        <a-form-item label="版本">
          <a-input v-model="gatewayForm.version" placeholder="1.0.0" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 网关Key弹窗 -->
    <a-modal
      v-model:visible="gatewayKeyModalVisible"
      title="新建网关Key"
      :ok-loading="saving"
      @ok="saveGatewayKey"
    >
      <a-form :model="gatewayKeyForm" layout="vertical">
        <a-form-item label="关联网关" required>
          <a-select v-model="gatewayKeyForm.gateway_id" placeholder="选择网关">
            <a-option v-for="g in gateways" :key="g.gateway_id" :value="g.gateway_id">
              {{ g.gateway_name }}
            </a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="调用限额(次/5小时)">
          <a-input-number
            v-model="gatewayKeyForm.rate_limit"
            :min="0"
            :step="100"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="有效期(天)">
          <a-input-number
            v-model="gatewayKeyForm.expire_days"
            :min="1"
            :max="3650"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="备注">
          <a-input v-model="gatewayKeyForm.remark" placeholder="备注信息" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Key创建成功弹窗 -->
    <a-modal
      v-model:visible="keyResultModalVisible"
      title="Key创建成功"
      :footer="false"
      :closable="false"
      :mask-closable="false"
    >
      <a-alert type="warning" style="margin-bottom: 16px">
        请立即保存以下Key，关闭后将无法再次查看完整内容！
      </a-alert>
      <div class="key-display">
        <a-input :model-value="createdKey" readonly class="key-input" />
        <a-button type="primary" @click="copyCreatedKey">复制</a-button>
      </div>
      <div style="margin-top: 16px; text-align: right">
        <a-button type="primary" @click="keyResultModalVisible = false">我已保存，关闭</a-button>
      </div>
    </a-modal>

    <!-- LLM配置弹窗 (v10.0) -->
    <a-modal
      v-model:visible="llmConfigModalVisible"
      :title="llmConfigForm.id ? '编辑LLM配置' : '新建LLM配置'"
      :ok-loading="saving"
      @ok="saveLlmConfig"
    >
      <a-form :model="llmConfigForm" layout="vertical">
        <a-form-item label="配置名称" required>
          <a-input v-model="llmConfigForm.config_name" placeholder="我的GPT-4配置" />
        </a-form-item>
        <a-form-item label="API类型" required>
          <a-select v-model="llmConfigForm.api_type" placeholder="选择API类型">
            <a-option value="openai">OpenAI兼容</a-option>
            <a-option value="anthropic">Anthropic</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="API地址" required>
          <a-input v-model="llmConfigForm.base_url" placeholder="https://api.openai.com/v1" />
        </a-form-item>
        <a-form-item label="模型名称" required>
          <a-input v-model="llmConfigForm.model_name" placeholder="gpt-4o" />
        </a-form-item>
        <a-form-item label="API Key" :required="!llmConfigForm.id">
          <a-input-password
            v-model="llmConfigForm.api_key"
            :placeholder="llmConfigForm.id ? '留空保持不变' : '输入API Key'"
          />
        </a-form-item>
        <a-form-item label="描述">
          <a-input v-model="llmConfigForm.description" placeholder="配置描述" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 微服务绑定弹窗 -->
    <a-modal
      v-model:visible="bindMicroserviceModalVisible"
      title="绑定微服务"
      :ok-loading="saving"
      @ok="saveBindMicroservice"
    >
      <a-form layout="vertical">
        <a-form-item label="网关">
          <a-input :model-value="bindGateway?.gateway_name" disabled />
        </a-form-item>
        <a-form-item label="选择微服务">
          <a-checkbox-group v-model="bindMicroserviceIds" direction="vertical">
            <a-checkbox v-for="ms in allMicroservices" :key="ms.id" :value="ms.id">
              {{ ms.name }} ({{ ms.business_line || '未分类' }})
            </a-checkbox>
          </a-checkbox-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  IconDesktop,
  IconSafe,
  IconRobot,
  IconPlus,
  IconEdit,
  IconDelete
} from '@arco-design/web-vue/es/icon'
import {
  getGateways,
  createGateway as apiCreateGateway,
  updateGateway as apiUpdateGateway,
  deleteGateway as apiDeleteGateway,
  getGatewayKeys,
  createGatewayKey as apiCreateGatewayKey,
  deleteGatewayKey as apiDeleteGatewayKey,
  getLlmConfigs,
  createLlmConfig as apiCreateLlmConfig,
  updateLlmConfig as apiUpdateLlmConfig,
  deleteLlmConfig as apiDeleteLlmConfig,
  getGatewayMicroservices,
  setGatewayMicroservices
} from '@/api/gateway'
import { getMicroservices } from '@/api/microservice'
import { getKeyUsageList } from '@/api/usage'
import type { Gateway, GatewayKey, LlmConfig, Microservice } from '@/types'
const activeTab = ref('gateways')
const loading = ref(false)
const saving = ref(false)

// 数据列表
const gateways = ref<Gateway[]>([])
const gatewayKeys = ref<GatewayKey[]>([])
const llmConfigs = ref<LlmConfig[]>([])
const allMicroservices = ref<Microservice[]>([])
const gatewayMicroservicesMap = ref<Record<string, Microservice[]>>({})
const keyUsageMap = ref<Record<string, { current_count: number; remaining: number }>>({})

// 表格列定义
const gatewayColumns = [
  { title: '网关ID', dataIndex: 'gateway_id', width: 110 },
  { title: '网关名称', dataIndex: 'gateway_name', width: 120 },
  { title: '已绑定微服务', slotName: 'microservices', width: 180 },
  { title: '描述', dataIndex: 'gateway_desc', width: 200, ellipsis: true },
  { title: '状态', slotName: 'status', width: 70, align: 'center' },
  { title: '操作', slotName: 'actions', width: 150, align: 'center' }
]

const gatewayKeyColumns = [
  { title: '网关ID', dataIndex: 'gateway_id', width: 100 },
  { title: 'Key预览', slotName: 'key_preview', width: 180 },
  { title: '配额(次/5h)', dataIndex: 'rate_limit', width: 100, align: 'right' },
  { title: '使用情况', slotName: 'usage', width: 180 },
  { title: '过期时间', dataIndex: 'expire_time', width: 160 },
  { title: '状态', slotName: 'status', width: 70, align: 'center' },
  { title: '操作', slotName: 'actions', width: 70, align: 'center' }
]

const llmConfigColumns = [
  { title: '配置名称', dataIndex: 'config_name', width: 120 },
  { title: 'API类型', slotName: 'api_type', width: 90, align: 'center' },
  { title: 'API地址', dataIndex: 'base_url', width: 200, ellipsis: true },
  { title: '模型名称', dataIndex: 'model_name', width: 130 },
  { title: '描述', dataIndex: 'description', width: 150, ellipsis: true },
  { title: '状态', slotName: 'status', width: 70, align: 'center' },
  { title: '操作', slotName: 'actions', width: 100, align: 'center' }
]

// 已移除 llmKeyColumns - v10.0不再需要单独的LLM Key表

// 弹窗状态
const gatewayModalVisible = ref(false)
const gatewayKeyModalVisible = ref(false)
const llmConfigModalVisible = ref(false) // v10.0: 改为 llmConfigModalVisible
const keyResultModalVisible = ref(false)
const bindMicroserviceModalVisible = ref(false)
const createdKey = ref('')
const bindGateway = ref<Gateway | null>(null)
const bindMicroserviceIds = ref<number[]>([])

// 表单数据
const gatewayForm = reactive({
  id: null as number | null,
  gateway_id: '',
  gateway_name: '',
  gateway_desc: '',
  version: '1.0.0'
})

const gatewayKeyForm = reactive({
  gateway_id: '',
  rate_limit: 600,
  expire_days: 365,
  remark: ''
})

// LLM配置表单 - v10.0
const llmConfigForm = reactive({
  id: null as number | null,
  config_name: '',
  api_type: 'openai',
  base_url: '',
  model_name: '',
  api_key: '',
  description: ''
})

// 已移除 llmKeyForm - v10.0不再需要单独的LLM Key表单

// 加载数据
const loadGateways = async () => {
  try {
    gateways.value = await getGateways()
    const msMap: Record<string, Microservice[]> = {}
    await Promise.all(
      gateways.value.map(async gw => {
        try {
          const bound = await getGatewayMicroservices(gw.gateway_id)
          msMap[gw.gateway_id] = bound
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

    const usageList = await getKeyUsageList()
    const map: Record<string, { current_count: number; remaining: number }> = {}
    for (const u of usageList) {
      map[u.key_id] = {
        current_count: u.current_count,
        remaining: u.remaining
      }
    }
    keyUsageMap.value = map
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

// 已移除 loadLlmKeys - v10.0不再需要单独的LLM Key

const loadMicroservices = async () => {
  try {
    allMicroservices.value = await getMicroservices()
  } catch (e) {
    console.error('加载微服务列表失败', e)
  }
}

const loadAll = async () => {
  loading.value = true
  await Promise.all([loadGateways(), loadGatewayKeys(), loadLlmConfigs(), loadMicroservices()])
  loading.value = false
}

// 网关操作
const showGatewayModal = (record?: Gateway) => {
  if (record) {
    gatewayForm.id = record.id
    gatewayForm.gateway_id = record.gateway_id
    gatewayForm.gateway_name = record.gateway_name
    gatewayForm.gateway_desc = record.gateway_desc || ''
    gatewayForm.version = record.version || '1.0.0'
  } else {
    gatewayForm.id = null
    gatewayForm.gateway_id = ''
    gatewayForm.gateway_name = ''
    gatewayForm.gateway_desc = ''
    gatewayForm.version = '1.0.0'
  }
  gatewayModalVisible.value = true
}

const saveGateway = async () => {
  saving.value = true
  try {
    if (gatewayForm.id) {
      await apiUpdateGateway(gatewayForm.id, gatewayForm)
    } else {
      await apiCreateGateway(gatewayForm)
    }
    Message.success('保存成功')
    gatewayModalVisible.value = false
    loadGateways()
  } catch (e: any) {
    Message.error(e.message || '保存失败')
  }
  saving.value = false
}

const deleteGateway = async (id: number) => {
  try {
    await apiDeleteGateway(id)
    Message.success('删除成功')
    loadGateways()
  } catch (e: any) {
    Message.error(e.message || '删除失败')
  }
}

// 网关Key操作
const showGatewayKeyModal = () => {
  gatewayKeyForm.gateway_id = gateways.value[0]?.gateway_id || ''
  gatewayKeyForm.rate_limit = 600
  gatewayKeyForm.expire_days = 365
  gatewayKeyForm.remark = ''
  gatewayKeyModalVisible.value = true
}

const saveGatewayKey = async () => {
  saving.value = true
  try {
    const result = await apiCreateGatewayKey(gatewayKeyForm)
    createdKey.value = result.api_key
    keyResultModalVisible.value = true
    gatewayKeyModalVisible.value = false
    loadGatewayKeys()
  } catch (e: any) {
    Message.error(e.message || '创建失败')
  }
  saving.value = false
}

const deleteGatewayKey = async (id: number) => {
  try {
    await apiDeleteGatewayKey(id)
    Message.success('删除成功')
    loadGatewayKeys()
  } catch (e: any) {
    Message.error(e.message || '删除失败')
  }
}

// LLM配置操作 - v10.0
const showLlmConfigModal = (record?: LlmConfig) => {
  if (record) {
    llmConfigForm.id = record.id
    llmConfigForm.config_name = record.config_name
    llmConfigForm.api_type = record.api_type
    llmConfigForm.base_url = record.base_url
    llmConfigForm.model_name = record.model_name
    llmConfigForm.api_key = '' // 编辑时不显示原有Key
    llmConfigForm.description = record.description || ''
  } else {
    llmConfigForm.id = null
    llmConfigForm.config_name = ''
    llmConfigForm.api_type = 'openai'
    llmConfigForm.base_url = ''
    llmConfigForm.model_name = ''
    llmConfigForm.api_key = ''
    llmConfigForm.description = ''
  }
  llmConfigModalVisible.value = true
}

const saveLlmConfig = async () => {
  saving.value = true
  try {
    if (llmConfigForm.id) {
      const updateData: Record<string, any> = { ...llmConfigForm }
      if (!updateData['api_key']) delete updateData['api_key'] // 不更新空的Key
      await apiUpdateLlmConfig(llmConfigForm.id!, updateData)
    } else {
      await apiCreateLlmConfig(llmConfigForm)
    }
    Message.success('保存成功')
    llmConfigModalVisible.value = false
    loadLlmConfigs()
  } catch (e: any) {
    Message.error(e.message || '保存失败')
  }
  saving.value = false
}

const deleteLlmConfig = async (id: number) => {
  try {
    await apiDeleteLlmConfig(id)
    Message.success('删除成功')
    loadLlmConfigs()
  } catch (e: any) {
    Message.error(e.message || '删除失败')
  }
}

// 已移除 LLM Key操作 - v10.0不再需要单独的LLM Key

// 复制Key
const copyCreatedKey = () => {
  navigator.clipboard.writeText(createdKey.value)
  Message.success('已复制到剪贴板')
}

// 微服务绑定操作
const showBindMicroserviceModal = async (record: Gateway) => {
  bindGateway.value = record
  try {
    // 获取当前网关绑定的微服务
    const boundMicroservices = await getGatewayMicroservices(record.gateway_id)
    bindMicroserviceIds.value = boundMicroservices.map(ms => ms.id)
  } catch (e) {
    console.error('获取绑定微服务失败', e)
    bindMicroserviceIds.value = []
  }
  bindMicroserviceModalVisible.value = true
}

const saveBindMicroservice = async () => {
  if (!bindGateway.value) return
  saving.value = true
  try {
    await setGatewayMicroservices(bindGateway.value.gateway_id, bindMicroserviceIds.value)
    Message.success('微服务绑定成功')
    bindMicroserviceModalVisible.value = false
    loadGateways()
  } catch (e: any) {
    Message.error(e.message || '绑定失败')
  }
  saving.value = false
}

onMounted(() => {
  loadAll()
})
</script>

<style scoped>
.gateway-page {
  height: calc(100vh - 88px);
}

.main-tabs {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  height: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.main-tabs :deep(.arco-card) {
  border: none;
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

.masked-key {
  font-family: 'Consolas', 'Monaco', monospace;
  cursor: pointer;
  color: #86909c;
}

.masked-key:hover {
  color: #165dff;
}

.key-display {
  display: flex;
  gap: 8px;
  align-items: center;
}

.key-input {
  flex: 1;
  font-family: 'Consolas', 'Monaco', monospace;
}

.key-input :deep(.arco-input) {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}

.unbound {
  color: #86909c;
  font-size: 12px;
}

.usage-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.usage-text {
  font-size: 13px;
  font-family: 'Consolas', 'Monaco', monospace;
  white-space: nowrap;
  min-width: 60px;
}

.usage-sep {
  color: #86909c;
  margin: 0 2px;
}

.usage-exceeded {
  color: #f53f3f;
  font-weight: 500;
}

.usage-progress {
  width: 80px;
  flex-shrink: 0;
}

.usage-empty {
  font-size: 13px;
  font-family: 'Consolas', 'Monaco', monospace;
  color: #86909c;
}
</style>
