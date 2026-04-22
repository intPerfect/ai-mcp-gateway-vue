<template>
  <a-card :bordered="false">
    <a-table
      :columns="columns"
      :data="llmConfigs"
      :loading="loading"
      :pagination="false"
      row-key="id"
    >
      <template #configName="{ record }">
        <span v-html="highlight(record.config_name)" />
      </template>
      <template #baseUrl="{ record }">
        <span v-html="highlight(record.base_url)" />
      </template>
      <template #modelName="{ record }">
        <span v-html="highlight(record.model_name)" />
      </template>
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
        <a-button type="text" size="small" @click="openFormModal(record)">编辑</a-button>
        <a-popconfirm content="确定要删除该LLM配置吗？" position="left" @ok="handleDelete(record.id)">
          <a-button type="text" size="small" status="danger">删除</a-button>
        </a-popconfirm>
      </template>
    </a-table>

    <!-- LLM配置弹窗 -->
    <a-modal
      v-model:visible="formVisible"
      :title="form.id ? '编辑LLM配置' : '新建LLM配置'"
      :ok-loading="saving"
      @ok="handleSave"
    >
      <a-form :model="form" layout="vertical">
        <a-form-item label="配置名称" required>
          <a-input v-model="form.config_name" placeholder="我的GPT-4配置" />
        </a-form-item>
        <a-form-item label="API类型" required>
          <a-select v-model="form.api_type" placeholder="选择API类型">
            <a-option value="openai">OpenAI兼容</a-option>
            <a-option value="anthropic">Anthropic</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="API地址" required>
          <a-input v-model="form.base_url" placeholder="https://api.openai.com/v1" />
        </a-form-item>
        <a-form-item label="模型名称" required>
          <a-input v-model="form.model_name" placeholder="gpt-4o" />
        </a-form-item>
        <a-form-item label="API Key" :required="!form.id">
          <a-input-password
            v-model="form.api_key"
            :placeholder="form.id ? '留空保持不变' : '输入API Key'"
          />
        </a-form-item>
        <a-form-item label="描述">
          <a-input v-model="form.description" placeholder="配置描述" />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  createLlmConfig,
  updateLlmConfig,
  deleteLlmConfig as apiDeleteLlmConfig
} from '@/api/gateway'
import type { LlmConfig } from '@/types'
import { highlightText } from '../highlight'

const props = defineProps<{
  llmConfigs: LlmConfig[]
  loading: boolean
  searchKeyword: string
}>()

const highlight = (text: string) => highlightText(text, props.searchKeyword)

const emit = defineEmits<{
  refresh: []
}>()

const saving = ref(false)

const columns = [
  { title: '配置名称', dataIndex: 'config_name', slotName: 'configName', width: 120 },
  { title: 'API类型', slotName: 'api_type', width: 90, align: 'center' },
  { title: 'API地址', dataIndex: 'base_url', slotName: 'baseUrl', width: 200, ellipsis: true },
  { title: '模型名称', dataIndex: 'model_name', slotName: 'modelName', width: 130 },
  { title: '描述', dataIndex: 'description', width: 150, ellipsis: true },
  { title: '状态', slotName: 'status', width: 70, align: 'center' },
  { title: '操作', slotName: 'actions', width: 100, align: 'center' }
]

const formVisible = ref(false)
const form = reactive({
  id: null as number | null,
  config_name: '',
  api_type: 'openai',
  base_url: '',
  model_name: '',
  api_key: '',
  description: ''
})

const openFormModal = (record?: LlmConfig) => {
  if (record) {
    form.id = record.id
    form.config_name = record.config_name
    form.api_type = record.api_type
    form.base_url = record.base_url
    form.model_name = record.model_name
    form.api_key = ''
    form.description = record.description || ''
  } else {
    form.id = null
    form.config_name = ''
    form.api_type = 'openai'
    form.base_url = ''
    form.model_name = ''
    form.api_key = ''
    form.description = ''
  }
  formVisible.value = true
}

const showCreateModal = () => openFormModal()

const handleSave = async () => {
  saving.value = true
  try {
    if (form.id) {
      const updateData: Record<string, unknown> = { ...form }
      if (!updateData['api_key']) delete updateData['api_key']
      await updateLlmConfig(form.id!, updateData)
    } else {
      await createLlmConfig(form)
    }
    Message.success('保存成功')
    formVisible.value = false
    emit('refresh')
  } catch {}
  saving.value = false
}

const handleDelete = async (id: number) => {
  try {
    await apiDeleteLlmConfig(id)
    Message.success('删除成功')
    emit('refresh')
  } catch {}
}

defineExpose({ showCreateModal })
</script>

<style scoped>
:deep(.hl) {
  background: #fff3a8;
  color: inherit;
  padding: 0 1px;
  border-radius: 2px;
}
</style>
