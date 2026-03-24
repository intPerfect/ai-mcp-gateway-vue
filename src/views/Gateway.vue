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
        <a-button v-else-if="activeTab === 'llms'" type="primary" @click="showLlmModal()">
          <template #icon><icon-plus /></template>
          新建LLM
        </a-button>
        <a-button v-else-if="activeTab === 'llmKeys'" type="primary" @click="showLlmKeyModal()">
          <template #icon><icon-plus /></template>
          新建Key
        </a-button>
      </template>
      <!-- 网关配置 -->
      <a-tab-pane key="gateways">
        <template #title>
          <icon-desktop />
          网关配置
        </template>
        <a-card :bordered="false">
          <a-table
            :columns="gatewayColumns"
            :data="gateways"
            :loading="loading"
            :pagination="false"
            row-key="id"
          >
            <template #auth="{ record }">
              <a-tag :color="record.auth === 1 ? 'green' : 'gray'">
                {{ record.auth === 1 ? '已启用' : '未启用' }}
              </a-tag>
            </template>
            <template #status="{ record }">
              <a-tag :color="record.status === 1 ? 'green' : 'red'">
                {{ record.status === 1 ? '启用' : '禁用' }}
              </a-tag>
            </template>
            <template #actions="{ record }">
              <a-button type="text" size="small" @click="showGatewayModal(record)">编辑</a-button>
              <a-button type="text" size="small" status="danger" @click="deleteGateway(record.id)">
                删除
              </a-button>
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

      <!-- LLM配置 -->
      <a-tab-pane key="llms">
        <template #title>
          <icon-robot />
          LLM配置
        </template>
        <a-card :bordered="false">
          <a-table
            :columns="llmColumns"
            :data="llms"
            :loading="loading"
            :pagination="false"
            row-key="id"
          >
            <template #status="{ record }">
              <a-tag :color="record.status === 1 ? 'green' : 'red'">
                {{ record.status === 1 ? '启用' : '禁用' }}
              </a-tag>
            </template>
            <template #actions="{ record }">
              <a-button type="text" size="small" @click="showLlmModal(record)">编辑</a-button>
              <a-button type="text" size="small" status="danger" @click="deleteLlm(record.id)">
                删除
              </a-button>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>

      <!-- LLM Key -->
      <a-tab-pane key="llmKeys">
        <template #title>
          <icon-lock />
          LLM Key
        </template>
        <a-card :bordered="false">
          <a-table
            :columns="llmKeyColumns"
            :data="llmKeys"
            :loading="loading"
            :pagination="false"
            row-key="id"
          >
            <template #key_preview="{ record }">
              <a-tooltip :content="record.key_preview">
                <span class="masked-key">{{ record.key_preview }}</span>
              </a-tooltip>
            </template>
            <template #status="{ record }">
              <a-tag :color="record.status === 1 ? 'green' : 'red'">
                {{ record.status === 1 ? '启用' : '禁用' }}
              </a-tag>
            </template>
            <template #actions="{ record }">
              <a-button type="text" size="small" status="danger" @click="deleteLlmKey(record.id)">
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
        <a-form-item label="启用认证">
          <a-switch v-model="gatewayForm.auth" :checked-value="1" :unchecked-value="0" />
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
        <a-form-item label="额度限制(次/小时)">
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

    <!-- LLM弹窗 -->
    <a-modal
      v-model:visible="llmModalVisible"
      :title="llmForm.id ? '编辑LLM' : '新建LLM'"
      :ok-loading="saving"
      @ok="saveLlm"
    >
      <a-form :model="llmForm" layout="vertical">
        <a-form-item label="LLM ID" :required="!llmForm.id">
          <a-input v-model="llmForm.llm_id" :disabled="!!llmForm.id" placeholder="qwen" />
        </a-form-item>
        <a-form-item label="LLM名称" required>
          <a-input v-model="llmForm.llm_name" placeholder="通义千问" />
        </a-form-item>
        <a-form-item label="类型" required>
          <a-select v-model="llmForm.llm_type" placeholder="选择类型">
            <a-option value="qwen">通义千问</a-option>
            <a-option value="deepseek">DeepSeek</a-option>
            <a-option value="minimax">MiniMax</a-option>
            <a-option value="openai">OpenAI</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="API地址" required>
          <a-input v-model="llmForm.base_url" placeholder="https://api.example.com/v1" />
        </a-form-item>
        <a-form-item label="默认模型">
          <a-input v-model="llmForm.default_model" placeholder="gpt-4o" />
        </a-form-item>
        <a-form-item label="描述">
          <a-input v-model="llmForm.description" placeholder="模型描述" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- LLM Key弹窗 -->
    <a-modal
      v-model:visible="llmKeyModalVisible"
      title="新建LLM Key"
      :ok-loading="saving"
      @ok="saveLlmKey"
    >
      <a-form :model="llmKeyForm" layout="vertical">
        <a-form-item label="关联LLM" required>
          <a-select v-model="llmKeyForm.llm_id" placeholder="选择LLM">
            <a-option v-for="l in llms" :key="l.llm_id" :value="l.llm_id">
              {{ l.llm_name }}
            </a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="额度限制(次/小时)">
          <a-input-number
            v-model="llmKeyForm.rate_limit"
            :min="0"
            :step="100"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="有效期(天)">
          <a-input-number
            v-model="llmKeyForm.expire_days"
            :min="1"
            :max="3650"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="备注">
          <a-input v-model="llmKeyForm.remark" placeholder="备注信息" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconDesktop, IconSafe, IconRobot, IconLock, IconPlus } from '@arco-design/web-vue/es/icon'
import {
  getGateways,
  createGateway as apiCreateGateway,
  updateGateway as apiUpdateGateway,
  deleteGateway as apiDeleteGateway,
  getGatewayKeys,
  createGatewayKey as apiCreateGatewayKey,
  deleteGatewayKey as apiDeleteGatewayKey,
  getLlms,
  createLlm as apiCreateLlm,
  updateLlm as apiUpdateLlm,
  deleteLlm as apiDeleteLlm,
  getLlmKeys,
  createLlmKey as apiCreateLlmKey,
  deleteLlmKey as apiDeleteLlmKey
} from '@/api/gateway'
const activeTab = ref('gateways')
const loading = ref(false)
const saving = ref(false)

// 数据列表
/* eslint-disable @typescript-eslint/no-explicit-any */
const gateways = ref<any[]>([])
const gatewayKeys = ref<any[]>([])
const llms = ref<any[]>([])
const llmKeys = ref<any[]>([])

// 表格列定义
const gatewayColumns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '网关ID', dataIndex: 'gateway_id', width: 120 },
  { title: '网关名称', dataIndex: 'gateway_name', width: 150 },
  { title: '描述', dataIndex: 'gateway_desc', ellipsis: true },
  { title: '版本', dataIndex: 'version', width: 80 },
  { title: '认证', slotName: 'auth', width: 80 },
  { title: '状态', slotName: 'status', width: 80 },
  { title: '操作', slotName: 'actions', width: 120 }
]

const gatewayKeyColumns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '网关', dataIndex: 'gateway_id', width: 120 },
  { title: 'Key预览', slotName: 'key_preview', ellipsis: true },
  { title: '额度/小时', dataIndex: 'rate_limit', width: 100 },
  { title: '过期时间', dataIndex: 'expire_time', width: 180 },
  { title: '状态', slotName: 'status', width: 80 },
  { title: '操作', slotName: 'actions', width: 80 }
]

const llmColumns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: 'LLM名称', dataIndex: 'llm_name', width: 120 },
  { title: '类型', dataIndex: 'llm_type', width: 100 },
  { title: 'API地址', dataIndex: 'base_url', ellipsis: true },
  { title: '默认模型', dataIndex: 'default_model', width: 120 },
  { title: '状态', slotName: 'status', width: 80 },
  { title: '操作', slotName: 'actions', width: 120 }
]

const llmKeyColumns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: 'LLM', dataIndex: 'llm_id', width: 100 },
  { title: 'Key预览', slotName: 'key_preview', ellipsis: true },
  { title: '额度/小时', dataIndex: 'rate_limit', width: 100 },
  { title: '过期时间', dataIndex: 'expire_time', width: 180 },
  { title: '状态', slotName: 'status', width: 80 },
  { title: '操作', slotName: 'actions', width: 80 }
]

// 弹窗状态
const gatewayModalVisible = ref(false)
const gatewayKeyModalVisible = ref(false)
const llmModalVisible = ref(false)
const llmKeyModalVisible = ref(false)
const keyResultModalVisible = ref(false)
const createdKey = ref('')

// 表单数据
const gatewayForm = reactive({
  id: null as number | null,
  gateway_id: '',
  gateway_name: '',
  gateway_desc: '',
  version: '1.0.0',
  auth: 0
})

const gatewayKeyForm = reactive({
  gateway_id: '',
  rate_limit: 1000,
  expire_days: 365,
  remark: ''
})

const llmForm = reactive({
  id: null as number | null,
  llm_id: '',
  llm_name: '',
  llm_type: '',
  base_url: '',
  default_model: '',
  description: ''
})

const llmKeyForm = reactive({
  llm_id: '',
  rate_limit: 1000,
  expire_days: 365,
  remark: ''
})

// 加载数据
const loadGateways = async () => {
  try {
    gateways.value = await getGateways()
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

const loadLlms = async () => {
  try {
    llms.value = await getLlms()
  } catch (e) {
    console.error('加载LLM失败', e)
  }
}

const loadLlmKeys = async () => {
  try {
    llmKeys.value = await getLlmKeys()
  } catch (e) {
    console.error('加载LLM Key失败', e)
  }
}

const loadAll = async () => {
  loading.value = true
  await Promise.all([loadGateways(), loadGatewayKeys(), loadLlms(), loadLlmKeys()])
  loading.value = false
}

// 网关操作
const showGatewayModal = (record?: any) => {
  if (record) {
    gatewayForm.id = record.id
    gatewayForm.gateway_id = record.gateway_id
    gatewayForm.gateway_name = record.gateway_name
    gatewayForm.gateway_desc = record.gateway_desc || ''
    gatewayForm.version = record.version || '1.0.0'
    gatewayForm.auth = record.auth || 0
  } else {
    gatewayForm.id = null
    gatewayForm.gateway_id = ''
    gatewayForm.gateway_name = ''
    gatewayForm.gateway_desc = ''
    gatewayForm.version = '1.0.0'
    gatewayForm.auth = 0
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
  gatewayKeyForm.rate_limit = 1000
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

// LLM操作
const showLlmModal = (record?: any) => {
  if (record) {
    llmForm.id = record.id
    llmForm.llm_id = record.llm_id
    llmForm.llm_name = record.llm_name
    llmForm.llm_type = record.llm_type
    llmForm.base_url = record.base_url
    llmForm.default_model = record.default_model || ''
    llmForm.description = record.description || ''
  } else {
    llmForm.id = null
    llmForm.llm_id = ''
    llmForm.llm_name = ''
    llmForm.llm_type = ''
    llmForm.base_url = ''
    llmForm.default_model = ''
    llmForm.description = ''
  }
  llmModalVisible.value = true
}

const saveLlm = async () => {
  saving.value = true
  try {
    if (llmForm.id) {
      await apiUpdateLlm(llmForm.id, llmForm)
    } else {
      await apiCreateLlm(llmForm)
    }
    Message.success('保存成功')
    llmModalVisible.value = false
    loadLlms()
  } catch (e: any) {
    Message.error(e.message || '保存失败')
  }
  saving.value = false
}

const deleteLlm = async (id: number) => {
  try {
    await apiDeleteLlm(id)
    Message.success('删除成功')
    loadLlms()
  } catch (e: any) {
    Message.error(e.message || '删除失败')
  }
}

// LLM Key操作
const showLlmKeyModal = () => {
  llmKeyForm.llm_id = llms.value[0]?.llm_id || ''
  llmKeyForm.rate_limit = 1000
  llmKeyForm.expire_days = 365
  llmKeyForm.remark = ''
  llmKeyModalVisible.value = true
}

const saveLlmKey = async () => {
  saving.value = true
  try {
    const result = await apiCreateLlmKey(llmKeyForm)
    createdKey.value = result.llm_key
    keyResultModalVisible.value = true
    llmKeyModalVisible.value = false
    loadLlmKeys()
  } catch (e: any) {
    Message.error(e.message || '创建失败')
  }
  saving.value = false
}

const deleteLlmKey = async (id: number) => {
  try {
    await apiDeleteLlmKey(id)
    Message.success('删除成功')
    loadLlmKeys()
  } catch (e: any) {
    Message.error(e.message || '删除失败')
  }
}

// 复制Key
const copyCreatedKey = () => {
  navigator.clipboard.writeText(createdKey.value)
  Message.success('已复制到剪贴板')
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
</style>
