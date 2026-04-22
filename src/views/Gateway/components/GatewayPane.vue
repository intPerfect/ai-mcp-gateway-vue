<template>
  <a-card :bordered="false">
    <a-table :data="gateways" :columns="columns" :pagination="false" row-key="id">
      <template #gatewayId="{ record }">
        <span v-html="highlight(record.gateway_id)" />
      </template>
      <template #gatewayName="{ record }">
        <span v-html="highlight(record.gateway_name)" />
      </template>
      <template #gatewayDesc="{ record }">
        <span v-html="highlight(record.gateway_desc || '')" />
      </template>
      <template #microservices="{ record }">
        <a-space wrap>
          <a-tag
            v-for="ms in microservicesMap[record.gateway_id] || []"
            :key="ms.id"
            color="arcoblue"
          >
            {{ ms.name }}
          </a-tag>
          <span v-if="!microservicesMap[record.gateway_id]?.length" class="unbound">暂无</span>
        </a-space>
      </template>
      <template #status="{ record }">
        <a-tag :color="record.status === 1 ? 'green' : 'red'">
          {{ record.status === 1 ? '启用' : '禁用' }}
        </a-tag>
      </template>
      <template #actions="{ record }">
        <a-space :size="4">
          <a-button type="text" size="small" @click="openBindModal(record)">绑定微服务</a-button>
          <a-button type="text" size="small" @click="openFormModal(record)">
            <template #icon><icon-edit /></template>
          </a-button>
          <a-popconfirm content="确定要删除该网关吗？" position="left" @ok="handleDelete(record.id)">
            <a-button type="text" size="small" status="danger">
              <template #icon><icon-delete /></template>
            </a-button>
          </a-popconfirm>
        </a-space>
      </template>
    </a-table>

    <!-- 网关编辑弹窗 -->
    <a-modal
      v-model:visible="formVisible"
      :title="form.id ? '编辑网关' : '新建网关'"
      :ok-loading="saving"
      @ok="handleSave"
    >
      <a-form :model="form" layout="vertical">
        <a-form-item label="网关ID" :required="!form.id">
          <a-input v-model="form.gateway_id" :disabled="!!form.id" placeholder="gateway_001" />
        </a-form-item>
        <a-form-item label="网关名称" required>
          <a-input v-model="form.gateway_name" placeholder="商品服务网关" />
        </a-form-item>
        <a-form-item label="描述">
          <a-input v-model="form.gateway_desc" placeholder="网关描述" />
        </a-form-item>
        <a-form-item label="版本">
          <a-input v-model="form.version" placeholder="1.0.0" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 微服务绑定弹窗 -->
    <a-modal
      v-model:visible="bindVisible"
      title="绑定微服务"
      :ok-loading="saving"
      @ok="handleBindSave"
    >
      <a-form layout="vertical">
        <a-form-item label="网关">
          <a-input :model-value="bindGateway?.gateway_name" disabled />
        </a-form-item>
        <a-form-item label="选择微服务">
          <MicroserviceSelect
            v-model="bindMicroserviceIds"
            :microservices="allMicroservices"
            placeholder="搜索并选择微服务"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconEdit, IconDelete } from '@arco-design/web-vue/es/icon'
import MicroserviceSelect from '@/components/MicroserviceSelect.vue'
import {
  createGateway,
  updateGateway,
  deleteGateway as apiDeleteGateway,
  getGatewayMicroservices,
  setGatewayMicroservices
} from '@/api/gateway'
import type { Gateway, Microservice } from '@/types'
import { highlightText } from '../highlight'

const props = defineProps<{
  gateways: Gateway[]
  microservicesMap: Record<string, Microservice[]>
  allMicroservices: Microservice[]
  loading: boolean
  searchKeyword: string
}>()

const highlight = (text: string) => highlightText(text, props.searchKeyword)

const emit = defineEmits<{
  refresh: []
}>()

const saving = ref(false)

const columns = [
  { title: '网关ID', dataIndex: 'gateway_id', slotName: 'gatewayId', width: 110 },
  { title: '网关名称', dataIndex: 'gateway_name', slotName: 'gatewayName', width: 120 },
  { title: '已绑定微服务', slotName: 'microservices', width: 180 },
  { title: '描述', dataIndex: 'gateway_desc', slotName: 'gatewayDesc', width: 200, ellipsis: true },
  { title: '状态', slotName: 'status', width: 70, align: 'center' },
  { title: '操作', slotName: 'actions', width: 150, align: 'center' }
]

// 表单弹窗
const formVisible = ref(false)
const form = reactive({
  id: null as number | null,
  gateway_id: '',
  gateway_name: '',
  gateway_desc: '',
  version: '1.0.0'
})

const openFormModal = (record?: Gateway) => {
  if (record) {
    form.id = record.id
    form.gateway_id = record.gateway_id
    form.gateway_name = record.gateway_name
    form.gateway_desc = record.gateway_desc || ''
    form.version = record.version || '1.0.0'
  } else {
    form.id = null
    form.gateway_id = ''
    form.gateway_name = ''
    form.gateway_desc = ''
    form.version = '1.0.0'
  }
  formVisible.value = true
}

const showCreateModal = () => openFormModal()

const handleSave = async () => {
  saving.value = true
  try {
    if (form.id) {
      await updateGateway(form.id, form)
    } else {
      await createGateway(form)
    }
    Message.success('保存成功')
    formVisible.value = false
    emit('refresh')
  } catch {}
  saving.value = false
}

const handleDelete = async (id: number) => {
  try {
    await apiDeleteGateway(id)
    Message.success('删除成功')
    emit('refresh')
  } catch {}
}

// 绑定弹窗
const bindVisible = ref(false)
const bindGateway = ref<Gateway | null>(null)
const bindMicroserviceIds = ref<number[]>([])

const openBindModal = async (record: Gateway) => {
  bindGateway.value = record
  try {
    const bound = await getGatewayMicroservices(record.gateway_id)
    bindMicroserviceIds.value = bound.map(ms => ms.id)
  } catch {
    bindMicroserviceIds.value = []
  }
  bindVisible.value = true
}

const handleBindSave = async () => {
  if (!bindGateway.value) return
  saving.value = true
  try {
    await setGatewayMicroservices(bindGateway.value.gateway_id, bindMicroserviceIds.value)
    Message.success('微服务绑定成功')
    bindVisible.value = false
    emit('refresh')
  } catch {}
  saving.value = false
}

defineExpose({ showCreateModal })
</script>

<style scoped>
.unbound {
  color: #86909c;
  font-size: 12px;
}

:deep(.hl) {
  background: #fff3a8;
  color: inherit;
  padding: 0 1px;
  border-radius: 2px;
}
</style>
