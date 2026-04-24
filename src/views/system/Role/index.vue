<template>
  <div class="page-container">
    <div class="page-header">
      <h2>角色管理</h2>
      <a-button v-permission="'role:create'" type="primary" @click="openCreateDialog">
        <template #icon><icon-plus /></template>
        新增角色
      </a-button>
    </div>

    <a-card class="table-card">
      <a-table
        :data="roles"
        :pagination="{ pageSize: 10 }"
        :bordered="{ wrapper: true, cell: true }"
      >
        <template #columns>
          <a-table-column title="角色编码" data-index="role_code" />
          <a-table-column title="角色名称" data-index="role_name" />
          <a-table-column title="描述" data-index="description">
            <template #cell="{ record }">{{ record.description || '-' }}</template>
          </a-table-column>
          <a-table-column title="业务线" data-index="business_line_name" :width="100">
            <template #cell="{ record }">
              <a-tag v-if="record.role_code === 'SUPER_ADMIN'" color="arcoblue">系统</a-tag>
              <a-tag v-else-if="record.business_line_name" color="green">
                {{ record.business_line_name }}
              </a-tag>
              <span v-else class="text-gray">全局</span>
            </template>
          </a-table-column>
          <a-table-column title="状态" data-index="status" :width="100">
            <template #cell="{ record }">
              <a-tag :color="record.status === 1 ? 'green' : 'red'">
                {{ record.status === 1 ? '正常' : '禁用' }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="操作" :width="200">
            <template #cell="{ record }">
              <a-space>
                <a-button
                  v-permission="'role:update'"
                  type="text"
                  size="small"
                  @click="editRole(record)"
                >
                  <template #icon><icon-edit /></template>
                  编辑
                </a-button>
                <a-button
                  v-permission="'role:update'"
                  type="text"
                  size="small"
                  @click="openPermissionDialog(record)"
                >
                  <template #icon><icon-settings /></template>
                  权限
                </a-button>
                <a-button
                  v-permission="'role:delete'"
                  type="text"
                  size="small"
                  status="danger"
                  :disabled="record.is_system === 1"
                  @click="deleteRole(record)"
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
      :title="editingRole ? '编辑角色' : '新增角色'"
      :width="480"
      @ok="submitRole"
      @cancel="closeDialog"
    >
      <a-form :model="form" layout="vertical">
        <a-form-item
          field="role_code"
          label="角色编码"
          :rules="[{ required: true, message: '请输入角色编码' }]"
        >
          <a-input
            v-model="form.role_code"
            :disabled="!!editingRole"
            placeholder="如: GATEWAY_ADMIN"
          />
        </a-form-item>
        <a-form-item
          field="role_name"
          label="角色名称"
          :rules="[{ required: true, message: '请输入角色名称' }]"
        >
          <a-input v-model="form.role_name" placeholder="请输入角色名称" />
        </a-form-item>
        <a-form-item field="description" label="描述">
          <a-input v-model="form.description" placeholder="请输入描述" />
        </a-form-item>
        <a-form-item field="status" label="状态">
          <a-select v-model="form.status">
            <a-option :value="1">正常</a-option>
            <a-option :value="0">禁用</a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 权限配置 -->
    <GatewayPermissionMatrix
      v-model:visible="showPermissionDialog"
      :role="permissionRole"
      @saved="loadRoles"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { IconPlus, IconEdit, IconDelete, IconSettings } from '@arco-design/web-vue/es/icon'
import type { RoleInfo } from '@/types/user'
import { get, del, post, put } from '@/api/request'
import GatewayPermissionMatrix from './components/GatewayPermissionMatrix.vue'

const roles = ref<RoleInfo[]>([])
const showCreateDialog = ref(false)
const editingRole = ref<RoleInfo | null>(null)
const showPermissionDialog = ref(false)
const permissionRole = ref<RoleInfo | null>(null)

const form = reactive({
  role_code: '',
  role_name: '',
  description: '',
  status: 1
})

async function loadRoles() {
  try {
    roles.value = await get<RoleInfo[]>('/roles')
  } catch (e) {
    console.error('Failed to load roles:', e)
  }
}

function openCreateDialog() {
  editingRole.value = null
  Object.assign(form, { role_code: '', role_name: '', description: '', status: 1 })
  showCreateDialog.value = true
}

function editRole(role: RoleInfo) {
  editingRole.value = role
  Object.assign(form, {
    role_code: role.role_code,
    role_name: role.role_name,
    description: role.description || '',
    status: role.status
  })
  showCreateDialog.value = true
}

async function deleteRole(role: RoleInfo) {
  if (role.is_system === 1) {
    Message.warning('系统内置角色不可删除')
    return
  }
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除角色 ${role.role_name} 吗？`,
    okText: '删除',
    cancelText: '取消',
    onOk: async () => {
      try {
        await del(`/roles/${role.id}`)
        Message.success('删除成功')
        loadRoles()
      } catch (e) {
        console.error('Failed to delete role:', e)
      }
    }
  })
}

async function submitRole() {
  try {
    if (editingRole.value) {
      await put(`/roles/${editingRole.value.id}`, form)
    } else {
      await post('/roles', form)
    }
    Message.success('操作成功')
    closeDialog()
    loadRoles()
  } catch (e) {
    console.error('Failed to submit role:', e)
  }
}

function closeDialog() {
  showCreateDialog.value = false
  editingRole.value = null
  Object.assign(form, { role_code: '', role_name: '', description: '', status: 1 })
}

function openPermissionDialog(role: RoleInfo) {
  permissionRole.value = role
  showPermissionDialog.value = true
}

onMounted(loadRoles)
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
