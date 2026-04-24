<template>
  <a-card :bordered="false">
    <a-table
      :columns="columns"
      :data="gatewayKeys"
      :loading="loading"
      :pagination="false"
      row-key="id"
    >
      <template #gatewayId="{ record }">
        <span v-html="highlight(record.gateway_id)" />
      </template>
      <template #gatewayName="{ record }">
        <span v-html="highlight(record.gateway_name || '-')" />
      </template>
      <template #key_preview="{ record }">
        <span class="masked-key">{{ record.key_preview }}</span>
        <a-button
          type="text"
          size="mini"
          class="copy-btn"
          @click="copyToClipboard(record.api_key)"
        >
          <template #icon><icon-copy /></template>
        </a-button>
      </template>
      <template #usage="{ record }">
        <div v-if="keyUsageMap[record.key_id]" class="usage-cell">
          <span class="usage-text">
            <span
              :class="{
                'usage-exceeded': keyUsageMap[record.key_id].current_count >= record.rate_limit
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
              keyUsageMap[record.key_id].current_count >= record.rate_limit ? 'danger' : 'normal'
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
        <a-space :size="4">
          <a-button type="text" size="small" @click="openEditModal(record)">
            <template #icon><icon-edit /></template>
          </a-button>
          <a-popconfirm content="确定要删除该Key吗？" position="left" @ok="handleDelete(record.id)">
            <a-button type="text" size="small" status="danger">
              <template #icon><icon-delete /></template>
            </a-button>
          </a-popconfirm>
        </a-space>
      </template>
    </a-table>

    <!-- 新建Key弹窗 -->
    <a-modal
      v-model:visible="formVisible"
      title="新建网关Key"
      :ok-loading="saving"
      @ok="handleSave"
    >
      <a-form :model="form" layout="vertical">
        <a-form-item label="关联网关" required>
          <a-select v-model="form.gateway_id" placeholder="选择网关">
            <a-option v-for="g in gateways" :key="g.gateway_id" :value="g.gateway_id">
              {{ g.gateway_name }}
            </a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="调用限额(次/5小时)" required>
          <a-input-number
            v-model="form.rate_limit"
            :min="0"
            :step="100"
            :disabled="!userStore.isSuperAdmin"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="过期时间">
          <a-date-picker
            v-model="form.expire_time"
            style="width: 100%"
            placeholder="不填则永久有效"
          />
        </a-form-item>
        <a-form-item label="备注">
          <a-input v-model="form.remark" placeholder="备注信息" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 编辑Key弹窗 -->
    <a-modal
      v-model:visible="editVisible"
      title="编辑网关Key"
      :ok-loading="saving"
      @ok="handleEditSave"
    >
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="网关Key">
          <a-input :model-value="editForm.key_preview" disabled />
        </a-form-item>
        <a-form-item label="调用限额(次/5小时)" required>
          <a-input-number
            v-model="editForm.rate_limit"
            :min="0"
            :step="100"
            :disabled="!userStore.isSuperAdmin"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="备注">
          <a-input v-model="editForm.remark" placeholder="备注信息" />
        </a-form-item>
        <a-form-item label="过期时间">
          <a-date-picker
            v-model="editForm.expire_time"
            style="width: 100%"
            placeholder="不填则永久有效"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-switch v-model="editForm.status" :checked-value="1" :unchecked-value="0" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Key创建成功弹窗 -->
    <a-modal
      v-model:visible="resultVisible"
      title="Key创建成功"
      :footer="false"
      :mask-closable="false"
    >
      <div class="key-display">
        <a-input :model-value="createdKey" readonly class="key-input" />
        <a-button type="primary" @click="copyKey">复制</a-button>
      </div>
    </a-modal>
  </a-card>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconCopy, IconEdit, IconDelete } from '@arco-design/web-vue/es/icon'
import {
  createGatewayKey,
  deleteGatewayKey as apiDeleteGatewayKey,
  updateGatewayKey as apiUpdateGatewayKey
} from '@/api/gateway'
import { getKeyUsageList } from '@/api/usage'
import { useUserStore } from '@/stores'
import type { Gateway, GatewayKey } from '@/types'

const userStore = useUserStore()
import { highlightText } from '@/utils/highlight'

const props = defineProps<{
  gatewayKeys: GatewayKey[]
  gateways: Gateway[]
  loading: boolean
  searchKeyword: string
}>()

const highlight = (text: string) => highlightText(text, props.searchKeyword)

const emit = defineEmits<{
  refresh: []
}>()

const saving = ref(false)
const keyUsageMap = ref<Record<string, { current_count: number; remaining: number }>>({})

const columns = [
  { title: '网关ID', dataIndex: 'gateway_id', slotName: 'gatewayId', width: 100 },
  { title: '网关名称', slotName: 'gatewayName', width: 110 },
  { title: '网关Key', slotName: 'key_preview', width: 200 },
  { title: '配额(次/5h)', dataIndex: 'rate_limit', width: 90, align: 'right' },
  { title: '使用情况', slotName: 'usage', width: 150 },
  { title: '过期时间', dataIndex: 'expire_time', width: 150 },
  { title: '状态', slotName: 'status', width: 60, align: 'center' },
  { title: '操作', slotName: 'actions', width: 90, align: 'center' }
]

// 加载使用情况
const loadUsage = async () => {
  try {
    const usageList = await getKeyUsageList()
    const map: Record<string, { current_count: number; remaining: number }> = {}
    for (const u of usageList) {
      map[u.key_id] = { current_count: u.current_count, remaining: u.remaining }
    }
    keyUsageMap.value = map
  } catch {}
}

watch(
  () => props.gatewayKeys,
  () => loadUsage(),
  { immediate: true }
)

// 表单弹窗
const formVisible = ref(false)
const form = reactive({
  gateway_id: '',
  rate_limit: 600,
  expire_time: '',
  remark: ''
})

const showCreateModal = () => {
  form.gateway_id = props.gateways[0]?.gateway_id || ''
  form.rate_limit = 600
  form.expire_time = ''
  form.remark = ''
  formVisible.value = true
}

const createdKey = ref('')
const resultVisible = ref(false)

const handleSave = async () => {
  saving.value = true
  try {
    const payload: Record<string, unknown> = {
      gateway_id: form.gateway_id,
      rate_limit: form.rate_limit,
      remark: form.remark,
    }
    if (form.expire_time) {
      payload['expire_time'] = form.expire_time
    }
    const result = await createGatewayKey(payload as any)
    createdKey.value = result.api_key
    resultVisible.value = true
    formVisible.value = false
    emit('refresh')
  } catch {}
  saving.value = false
}

const handleDelete = async (id: number) => {
  try {
    await apiDeleteGatewayKey(id)
    Message.success('删除成功')
    emit('refresh')
  } catch {}
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
  Message.success('已复制到剪贴板')
}

const copyKey = () => copyToClipboard(createdKey.value)

const copyKeyPreview = (text: string) => copyToClipboard(text)

// 编辑弹窗
const editVisible = ref(false)
const editForm = reactive({
  id: 0,
  key_preview: '',
  rate_limit: 600,
  remark: '',
  status: 1,
  expire_time: '',
})

const openEditModal = (record: GatewayKey) => {
  editForm.id = record.id
  editForm.key_preview = record.key_preview
  editForm.rate_limit = record.rate_limit
  editForm.remark = record.remark || ''
  editForm.status = record.status
  editForm.expire_time = record.expire_time || ''
  editVisible.value = true
}

const handleEditSave = async () => {
  saving.value = true
  try {
    const payload: Record<string, unknown> = {
      rate_limit: editForm.rate_limit,
      remark: editForm.remark,
      status: editForm.status,
      expire_time: editForm.expire_time || null,
    }
    await apiUpdateGatewayKey(editForm.id, payload)
    Message.success('更新成功')
    editVisible.value = false
    emit('refresh')
  } catch {}
  saving.value = false
}

defineExpose({ showCreateModal })
</script>

<style scoped>
.masked-key {
  font-family: 'Consolas', 'Monaco', monospace;
  cursor: pointer;
  color: #86909c;
}
.masked-key:hover {
  color: #165dff;
}
.copy-btn {
  margin-left: 4px;
  color: #86909c;
}
.copy-btn:hover {
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

:deep(.hl) {
  background: #fff3a8;
  color: inherit;
  padding: 0 1px;
  border-radius: 2px;
}
</style>
