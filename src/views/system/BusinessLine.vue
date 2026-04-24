<template>
  <div class="page-container">
    <div class="page-header">
      <h2>业务线管理</h2>
      <a-button type="primary" @click="openCreateDialog">
        <template #icon><icon-plus /></template>
        新增业务线
      </a-button>
    </div>

    <a-card class="table-card">
      <a-table
        :data="businessLines"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
        :bordered="{ wrapper: true, cell: true }"
      >
        <template #columns>
          <a-table-column title="业务线编码" data-index="line_code" />
          <a-table-column title="业务线名称" data-index="line_name" />
          <a-table-column title="描述" data-index="description">
            <template #cell="{ record }">{{ record.description || '-' }}</template>
          </a-table-column>
          <a-table-column title="状态" data-index="status" :width="100">
            <template #cell="{ record }">
              <a-tag :color="record.status === 1 ? 'green' : 'red'">
                {{ record.status === 1 ? '正常' : '禁用' }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="创建时间" data-index="create_time" :width="180">
            <template #cell="{ record }">{{ formatTime(record.create_time) }}</template>
          </a-table-column>
          <a-table-column title="操作" :width="150">
            <template #cell="{ record }">
              <a-space>
                <a-button type="text" size="small" @click="editBusinessLine(record)">
                  <template #icon><icon-edit /></template>
                  编辑
                </a-button>
                <a-button
                  type="text"
                  size="small"
                  status="danger"
                  @click="deleteBusinessLine(record)"
                >
                  <template #icon><icon-delete /></template>
                  删除
                </a-button>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>

    <!-- 创建/编辑对话框 -->
    <a-modal
      v-model:visible="showCreateDialog"
      :title="editingBusinessLine ? '编辑业务线' : '新增业务线'"
      :width="480"
      @ok="submitBusinessLine"
      @cancel="closeDialog"
    >
      <a-form :model="form" layout="vertical">
        <a-form-item
          field="line_code"
          label="业务线编码"
          :rules="[{ required: true, message: '请输入业务线编码' }]"
        >
          <a-input
            v-model="form.line_code"
            :disabled="!!editingBusinessLine"
            placeholder="如: OA"
          />
        </a-form-item>
        <a-form-item
          field="line_name"
          label="业务线名称"
          :rules="[{ required: true, message: '请输入业务线名称' }]"
        >
          <a-input v-model="form.line_name" placeholder="如: OA办公" />
        </a-form-item>
        <a-form-item field="description" label="描述">
          <a-input v-model="form.description" placeholder="请输入描述" />
        </a-form-item>
        <a-form-item v-if="editingBusinessLine" field="status" label="状态">
          <a-select v-model="form.status">
            <a-option :value="1">正常</a-option>
            <a-option :value="0">禁用</a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { IconPlus, IconEdit, IconDelete } from '@arco-design/web-vue/es/icon'
import type { BusinessLine } from '@/api/businessLine'
import {
  getBusinessLines,
  createBusinessLine,
  updateBusinessLine,
  deleteBusinessLine as deleteBusinessLineApi
} from '@/api/businessLine'

const businessLines = ref<BusinessLine[]>([])
const loading = ref(false)
const showCreateDialog = ref(false)
const editingBusinessLine = ref<BusinessLine | null>(null)

const form = reactive({
  line_code: '',
  line_name: '',
  description: '',
  status: 1
})

function formatTime(timeStr: string | null): string {
  if (!timeStr) return '-'
  return timeStr.replace('T', ' ').substring(0, 19)
}

async function loadBusinessLines() {
  loading.value = true
  try {
    businessLines.value = await getBusinessLines()
  } catch {
    // interceptor handles error tip
  } finally {
    loading.value = false
  }
}

function openCreateDialog() {
  editingBusinessLine.value = null
  Object.assign(form, { line_code: '', line_name: '', description: '', status: 1 })
  showCreateDialog.value = true
}

function editBusinessLine(bl: BusinessLine) {
  editingBusinessLine.value = bl
  Object.assign(form, {
    line_code: bl.line_code,
    line_name: bl.line_name,
    description: bl.description || '',
    status: bl.status
  })
  showCreateDialog.value = true
}

function deleteBusinessLine(bl: BusinessLine) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除业务线 ${bl.line_name} 吗？`,
    okText: '删除',
    cancelText: '取消',
    onOk: async () => {
      try {
        await deleteBusinessLineApi(bl.id)
        Message.success('删除成功')
        loadBusinessLines()
      } catch {
        // interceptor handles error tip
      }
    }
  })
}

async function submitBusinessLine() {
  if (!form.line_code || !form.line_name) {
    Message.warning('请填写必填项')
    return
  }

  try {
    if (editingBusinessLine.value) {
      await updateBusinessLine(editingBusinessLine.value.id, {
        line_name: form.line_name,
        description: form.description || undefined,
        status: form.status
      })
      Message.success('更新成功')
    } else {
      await createBusinessLine({
        line_code: form.line_code,
        line_name: form.line_name,
        description: form.description || undefined
      })
      Message.success('创建成功')
    }
    closeDialog()
    loadBusinessLines()
  } catch {
    // interceptor handles error tip
  }
}

function closeDialog() {
  showCreateDialog.value = false
  editingBusinessLine.value = null
  Object.assign(form, { line_code: '', line_name: '', description: '', status: 1 })
}

onMounted(loadBusinessLines)
</script>

<style scoped>
.page-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.table-card {
  flex: 1;
  overflow: hidden;
}
</style>
