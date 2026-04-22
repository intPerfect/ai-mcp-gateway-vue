<template>
  <a-modal
    v-model:visible="visible"
    title="编辑工具"
    :width="860"
    :ok-loading="loading"
    @ok="handleSubmit"
    @cancel="handleClose"
  >
    <a-spin :loading="detailLoading" style="width: 100%">
      <a-form :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="工具名称" required>
              <a-input v-model="form.tool_name" placeholder="请输入工具名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="工具描述">
              <a-input v-model="form.tool_description" placeholder="请输入工具描述" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-divider orientation="left" style="margin: 8px 0 12px">HTTP 配置</a-divider>
        <a-row :gutter="16">
          <a-col :span="4">
            <a-form-item label="方法">
              <a-select v-model="form.http_method">
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
              <a-input v-model="form.http_url" placeholder="http://example.com/api/{param}" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="超时时间(ms)">
              <a-input-number
                v-model="form.timeout"
                :min="1000"
                :max="300000"
                :step="1000"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="重试次数">
              <a-input-number v-model="form.retry_times" :min="0" :max="10" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="请求头 (JSON)">
          <a-textarea
            v-model="form.http_headers"
            placeholder='{"Content-Type": "application/json"}'
            :auto-size="{ minRows: 2, maxRows: 4 }"
          />
        </a-form-item>

        <a-divider orientation="left" style="margin: 8px 0 12px">
          参数映射
          <a-button type="text" size="mini" style="margin-left: 8px" @click="addParameter">
            <template #icon><icon-plus /></template>
            添加
          </a-button>
        </a-divider>
        <ParameterMappingForm :parameters="form.parameters" @remove="removeParameter" />
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import type { MicroserviceTool, ToolParameterMapping } from '@/types'
import { updateTool, getToolDetail } from '@/api/microservice'
import ParameterMappingForm from './ParameterMappingForm.vue'

const props = defineProps<{
  tool: MicroserviceTool | null
}>()

const visible = defineModel<boolean>('visible', { default: false })
const emit = defineEmits<{ saved: [] }>()

const loading = ref(false)
const detailLoading = ref(false)

const defaultForm = {
  tool_name: '',
  tool_description: '',
  http_url: '',
  http_method: 'POST',
  http_headers: '',
  timeout: 30000,
  retry_times: 0,
  parameters: [] as ToolParameterMapping[]
}

const form = reactive({ ...defaultForm })

const resetForm = () => {
  Object.assign(form, { ...defaultForm, parameters: [] })
}

watch(visible, async val => {
  if (val && props.tool) {
    form.tool_name = props.tool.tool_name
    form.tool_description = props.tool.tool_description || ''
    resetForm()
    form.tool_name = props.tool.tool_name
    form.tool_description = props.tool.tool_description || ''

    detailLoading.value = true
    try {
      const detail = await getToolDetail(props.tool.id)
      if (detail.http_config) {
        form.http_url = detail.http_config.http_url || ''
        form.http_method = detail.http_config.http_method || 'POST'
        form.http_headers = detail.http_config.http_headers || ''
        form.timeout = detail.http_config.timeout || 30000
        form.retry_times = detail.http_config.retry_times || 0
      }
      form.parameters = (detail.parameters || []).map(p => ({ ...p }))
    } catch (error: any) {
      Message.error('加载工具详情失败: ' + (error.message || ''))
    } finally {
      detailLoading.value = false
    }
  }
})

const addParameter = () => {
  form.parameters.push({
    param_location: 'query',
    field_name: '',
    field_type: 'string',
    field_desc: '',
    is_required: 0,
    default_value: null,
    enum_values: null,
    example_value: null,
    sort_order: form.parameters.length
  })
}

const removeParameter = (idx: number) => {
  form.parameters.splice(idx, 1)
}

const handleSubmit = async () => {
  if (!form.tool_name.trim()) {
    Message.warning('请输入工具名称')
    return
  }
  loading.value = true
  try {
    await updateTool(props.tool!.id, {
      tool_name: form.tool_name.trim(),
      tool_description: form.tool_description.trim() || undefined,
      http_config: {
        http_url: form.http_url,
        http_method: form.http_method,
        http_headers: form.http_headers || undefined,
        timeout: form.timeout,
        retry_times: form.retry_times
      },
      parameters: form.parameters.map((p, idx) => ({ ...p, sort_order: idx }))
    })
    Message.success('更新成功')
    visible.value = false
    emit('saved')
  } catch (error: any) {
    Message.error(error.message || '更新失败')
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  visible.value = false
  resetForm()
}
</script>
