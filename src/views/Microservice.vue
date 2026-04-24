<template>
  <div class="microservice-page">
    <a-card :bordered="false">
      <div class="filter-section">
        <div class="filter-row">
          <div class="filter-left">
            <a-select
              v-model="filterBusinessLine"
              placeholder="选择业务线"
              allow-clear
              style="width: 160px"
            >
              <a-option value="">全部业务线</a-option>
              <a-option v-for="bl in businessLineOptions" :key="bl" :value="bl">
                {{ bl }}
              </a-option>
            </a-select>
            <a-input
              v-model="filterKeyword"
              placeholder="搜索微服务名称"
              allow-clear
              style="width: 200px"
            />
            <a-tag color="arcoblue">共 {{ filteredMicroservices.length }} 个微服务</a-tag>
          </div>
          <div class="filter-right">
            <a-button type="primary" @click="loadMicroservices">
              <template #icon><icon-refresh /></template>
              刷新
            </a-button>
            <a-button type="primary" status="success" @click="showCreateModal">
              <template #icon><icon-plus /></template>
              新增微服务
            </a-button>
          </div>
        </div>
      </div>
      <a-table
        :columns="columns"
        :data="filteredMicroservices"
        :loading="loading"
        :pagination="{ pageSize: 20 }"
        row-key="id"
      >
        <template #name="{ record }">
          <a-link @click="goToTools(record)" v-html="highlight(record.name)" />
        </template>
        <template #gateway="{ record }">
          <a-space :size="4" wrap>
            <a-link
              v-for="gw in record.gateways"
              :key="gw.gateway_id"
              @click="goToGateway(gw.gateway_id)"
              v-html="highlight(gw.gateway_name)"
            />
            <span v-if="!record.gateways || record.gateways.length === 0" class="text-gray">-</span>
          </a-space>
        </template>
        <template #httpBaseUrl="{ record }">
          <a-space :size="4" align="center">
            <span class="http-url" v-html="highlight(record.http_base_url)"></span>
            <a-button type="text" size="mini" @click="handleHealthCheck(record)">
              <template #icon><icon-check-circle /></template>
            </a-button>
          </a-space>
        </template>
        <template #businessLine="{ record }">
          <span v-html="highlight(record.business_line || '-')"></span>
        </template>
        <template #description="{ record }">
          <span v-html="highlight(record.description || '-')"></span>
        </template>
        <template #operations="{ record }">
          <a-space :size="4">
            <a-button type="text" size="small" @click="showEditModal(record)">
              <template #icon><icon-edit /></template>
            </a-button>
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
          <a-select v-model="formData.business_line_id" placeholder="请选择业务线" allow-clear>
            <a-option v-for="bl in businessLines" :key="bl.id" :value="bl.id">
              {{ bl.line_name }}
            </a-option>
          </a-select>
        </a-form-item>
        <a-form-item v-if="!isEdit" label="关联网关" required>
          <a-select v-model="formData.gateway_id" placeholder="请选择网关">
            <a-option v-for="gw in gateways" :key="gw.gateway_id" :value="gw.gateway_id">
              {{ gw.gateway_name }}
            </a-option>
          </a-select>
        </a-form-item>
        <a-form-item v-if="isEdit" label="状态">
          <a-switch v-model="formData.status" :checked-value="1" :unchecked-value="0" />
        </a-form-item>
      </a-form>
    </a-modal>

  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import type { TableColumn } from '@arco-design/web-vue'
import {
  IconPlus,
  IconCheckCircle,
  IconEdit,
  IconDelete,
  IconRefresh
} from '@arco-design/web-vue/es/icon'
import {
  getMicroservices,
  createMicroservice,
  updateMicroservice,
  deleteMicroservice,
  checkMicroserviceHealth
} from '@/api/microservice'
import { getBusinessLines } from '@/api/businessLine'
import { getGateways } from '@/api/gateway'
import type { BusinessLine } from '@/api/businessLine'
import type { Gateway } from '@/types'
import type {
  Microservice,
  MicroserviceCreate,
  MicroserviceUpdate
} from '@/types'
import { highlightText } from '@/utils/highlight'

const highlight = (text: string) => highlightText(text, filterKeyword.value)

const router = useRouter()

const columns: TableColumn[] = [
  {
    title: '服务名称',
    dataIndex: 'name',
    slotName: 'name',
    width: 140,
    ellipsis: true,
    tooltip: true
  },
  {
    title: '网关',
    dataIndex: 'gateways',
    slotName: 'gateway',
    width: 160,
    ellipsis: true,
    tooltip: true,
  },
  {
    title: 'HTTP地址',
    dataIndex: 'http_base_url',
    slotName: 'httpBaseUrl',
    width: 280,
    ellipsis: true,
    tooltip: true
  },
  { title: '业务线', dataIndex: 'business_line', slotName: 'businessLine', width: 100 },
  { title: '描述', dataIndex: 'description', slotName: 'description', ellipsis: true, tooltip: true },
  { title: '操作', slotName: 'operations', width: 80, align: 'center' }
]

const loading = ref(false)
const submitting = ref(false)
const microserviceList = ref<Microservice[]>([])
const businessLines = ref<BusinessLine[]>([])
const gateways = ref<Gateway[]>([])
const filterBusinessLine = ref<string>('')
const filterKeyword = ref<string>('')

const businessLineOptions = computed(() => {
  const bls = new Set(microserviceList.value.map(ms => ms.business_line).filter(Boolean))
  return Array.from(bls).sort()
})

const filteredMicroservices = computed(() => {
  let result = microserviceList.value
  if (filterBusinessLine.value) {
    result = result.filter(ms => ms.business_line === filterBusinessLine.value)
  }
  if (filterKeyword.value) {
    const keyword = filterKeyword.value.toLowerCase()
    result = result.filter(ms =>
      ms.name.toLowerCase().includes(keyword) ||
      (ms.http_base_url || '').toLowerCase().includes(keyword) ||
      (ms.description || '').toLowerCase().includes(keyword) ||
      (ms.business_line || '').toLowerCase().includes(keyword)
    )
  }
  return result
})
const formModalVisible = ref(false)
const isEdit = ref(false)

const formData = reactive<MicroserviceCreate & { id?: number; status?: number }>({
  name: '',
  http_base_url: '',
  description: '',
  business_line_id: undefined,
  gateway_id: '',
  status: 1
})

const loadMicroservices = async () => {
  loading.value = true
  try {
    const [microservices, bls, gwList] = await Promise.all([getMicroservices(), getBusinessLines(), getGateways()])
    microserviceList.value = microservices
    businessLines.value = bls
    gateways.value = gwList
  } catch {
    // interceptor handles error tip
  } finally {
    loading.value = false
  }
}

const showCreateModal = () => {
  isEdit.value = false
  Object.assign(formData, {
    name: '',
    http_base_url: '',
    description: '',
    business_line_id: undefined,
    gateway_id: gateways.value[0]?.gateway_id || '',
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
    business_line_id: record.business_line_id,
    status: record.status
  })
  formModalVisible.value = true
}

const handleSubmit = async () => {
  if (!formData.name || !formData.http_base_url) {
    Message.warning('请填写必填项')
    return
  }
  if (!isEdit.value && !formData.gateway_id) {
    Message.warning('请选择关联网关')
    return
  }

  submitting.value = true
  try {
    if (isEdit.value && formData.id) {
      const updateData: MicroserviceUpdate = {
        name: formData.name,
        http_base_url: formData.http_base_url,
        description: formData.description,
        business_line_id: formData.business_line_id,
        status: formData.status
      }
      await updateMicroservice(formData.id, updateData)
      Message.success('更新成功')
    } else {
      const createData: MicroserviceCreate = {
        name: formData.name,
        http_base_url: formData.http_base_url,
        description: formData.description,
        business_line_id: formData.business_line_id,
        gateway_id: formData.gateway_id
      }
      await createMicroservice(createData)
      Message.success('创建成功')
    }
    formModalVisible.value = false
    loadMicroservices()
  } catch {
    // interceptor handles error tip
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id: number) => {
  try {
    await deleteMicroservice(id)
    Message.success('删除成功')
    loadMicroservices()
  } catch {
    // interceptor handles error tip
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
  } catch {
    // interceptor handles error tip
  }
}

const goToTools = (record: Microservice) => {
  router.push({
    name: 'Tools',
    query: {
      businessLine: record.business_line || '',
      microservice: record.name
    }
  })
}

const goToGateway = (gatewayId: string) => {
  router.push({ name: 'Gateway', query: { highlight: gatewayId } })
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
  overflow-x: hidden;
}

.microservice-page :deep(.arco-card) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.microservice-page :deep(.arco-card-header) {
  display: none;
}

.microservice-page :deep(.arco-card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.microservice-page :deep(.arco-table-wrapper) {
  overflow: hidden;
}

.microservice-page :deep(.arco-table-td) {
  vertical-align: middle !important;
}

.microservice-page :deep(.arco-table-td .arco-space-item) {
  margin-bottom: 0 !important;
}

.filter-section {
  flex-shrink: 0;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f7f8fa;
  border-radius: 8px;
}

.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.text-gray {
  color: var(--color-text-3);
}

.http-url {
  color: var(--color-text-2);
  font-size: 13px;
}

:deep(.hl) {
  background: #fff3a8;
  color: inherit;
  padding: 0 1px;
  border-radius: 2px;
}
</style>
