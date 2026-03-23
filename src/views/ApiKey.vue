<template>
  <div class="apikey-page">
    <!-- 标签页切换 -->
    <a-tabs v-model:active-key="activeTab" class="main-tabs">
      <!-- 网关API Key -->
      <a-tab-pane key="gateway">
        <template #title>
          <icon-safe />
          网关API Key
        </template>
        <a-card :bordered="false">
          <template #extra>
            <a-button type="primary" @click="showCreateModal('gateway')">
              <template #icon><icon-plus /></template>
              创建网关Key
            </a-button>
          </template>
          <a-table
            :columns="gatewayColumns"
            :data="gatewayKeys"
            :loading="loading"
            :pagination="false"
            row-key="id"
          >
            <template #status="{ record }">
              <a-tag :color="record.status === 1 ? 'green' : 'red'">
                {{ record.status === 1 ? '启用' : '禁用' }}
              </a-tag>
            </template>
            <template #api_key="{ record }">
              <a-tooltip :content="record.api_key">
                <span class="masked-key">{{ maskKey(record.api_key) }}</span>
              </a-tooltip>
            </template>
            <template #actions="{ record }">
              <a-button type="text" size="small" @click="copyKey(record.api_key)">复制</a-button>
              <a-button
                type="text"
                size="small"
                status="danger"
                @click="deleteKey('gateway', record.id)"
              >
                删除
              </a-button>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>

      <!-- LLM API Key -->
      <a-tab-pane key="user">
        <template #title>
          <icon-user />
          LLM API Key
        </template>
        <a-card :bordered="false">
          <template #extra>
            <a-button type="primary" @click="showCreateModal('user')">
              <template #icon><icon-plus /></template>
              创建LLM Key
            </a-button>
          </template>
          <a-table
            :columns="userColumns"
            :data="userKeys"
            :loading="loading"
            :pagination="false"
            row-key="id"
          >
            <template #status="{ record }">
              <a-tag :color="record.status === 1 ? 'green' : 'red'">
                {{ record.status === 1 ? '启用' : '禁用' }}
              </a-tag>
            </template>
            <template #api_key="{ record }">
              <a-tooltip :content="record.api_key">
                <span class="masked-key">{{ maskKey(record.api_key) }}</span>
              </a-tooltip>
            </template>
            <template #actions="{ record }">
              <a-button type="text" size="small" @click="copyKey(record.api_key)">复制</a-button>
              <a-button
                type="text"
                size="small"
                status="danger"
                @click="deleteKey('user', record.id)"
              >
                删除
              </a-button>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>
    </a-tabs>

    <!-- 创建弹窗 -->
    <a-modal
      v-model:visible="createModalVisible"
      :title="createType === 'user' ? '创建LLM API Key' : '创建网关API Key'"
      :ok-loading="creating"
      @ok="handleCreate"
    >
      <a-form :model="createForm" layout="vertical">
        <a-form-item label="网关ID" required>
          <a-input v-model="createForm.gateway_id" placeholder="gateway_001" />
        </a-form-item>
        <a-form-item v-if="createType === 'gateway'" label="Key类型">
          <a-select v-model="createForm.key_type" placeholder="选择类型">
            <a-option value="primary">主Key</a-option>
            <a-option value="secondary">副Key</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="额度限制（每小时）">
          <a-input-number v-model="createForm.rate_limit" :min="0" :step="100" />
        </a-form-item>
        <a-form-item label="过期时间">
          <a-date-picker
            v-model="createForm.expire_time"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconUser, IconSafe, IconPlus } from '@arco-design/web-vue/es/icon'

const activeTab = ref('gateway')
const loading = ref(false)
const creating = ref(false)
const createModalVisible = ref(false)
const createType = ref<'user' | 'gateway'>('user')

const userColumns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '名称', dataIndex: 'gateway_id', width: 150 },
  { title: 'LLM API Key', slotName: 'api_key', ellipsis: true },
  { title: '额度/小时', dataIndex: 'rate_limit', width: 100 },
  { title: '过期时间', dataIndex: 'expire_time', width: 180 },
  { title: '状态', slotName: 'status', width: 80 },
  { title: '操作', slotName: 'actions', width: 150 }
]

const gatewayColumns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '网关ID', dataIndex: 'gateway_id', width: 150 },
  { title: '网关API Key', slotName: 'api_key', ellipsis: true },
  { title: '额度/小时', dataIndex: 'rate_limit', width: 100 },
  { title: '过期时间', dataIndex: 'expire_time', width: 180 },
  { title: '状态', slotName: 'status', width: 80 },
  { title: '操作', slotName: 'actions', width: 150 }
]

const userKeys = ref<any[]>([])
const gatewayKeys = ref<any[]>([])

const createForm = ref({
  gateway_id: 'gateway_001',
  key_type: 'primary',
  rate_limit: 1000,
  expire_time: null as any
})

const showCreateModal = (type: 'user' | 'gateway') => {
  createType.value = type
  createForm.value = {
    gateway_id: 'gateway_001',
    key_type: 'primary',
    rate_limit: 1000,
    expire_time: null
  }
  createModalVisible.value = true
}

const handleCreate = async () => {
  creating.value = true
  try {
    // TODO: 调用API创建
    Message.success('API Key创建成功')
    createModalVisible.value = false
    loadData()
  } catch (error: any) {
    Message.error(error.message || '创建失败')
  }
  creating.value = false
}

const copyKey = (key: string) => {
  navigator.clipboard.writeText(key)
  Message.success('已复制到剪贴板')
}

const maskKey = (key: string): string => {
  if (key.length <= 8) {
    return '*'.repeat(key.length)
  }
  return key.slice(0, 4) + '*'.repeat(key.length - 8) + key.slice(-4)
}

const deleteKey = async (type: string, id: number) => {
  // TODO: 调用API删除
  Message.success('删除成功')
  loadData()
}

const loadData = async () => {
  loading.value = true
  // TODO: 调用API获取数据
  // 模拟数据
  userKeys.value = [
    {
      id: 1,
      gateway_id: 'MiniMax M2.7',
      api_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      rate_limit: 1000,
      expire_time: '2025-12-31 23:59:59',
      status: 1
    }
  ]
  gatewayKeys.value = [
    {
      id: 1,
      gateway_id: 'gateway_001',
      api_key: 'sk-gateway-xxxx-xxxx',
      rate_limit: 5000,
      expire_time: '2025-12-31 23:59:59',
      status: 1
    }
  ]
  loading.value = false
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.apikey-page {
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
</style>
