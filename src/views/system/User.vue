<template>
  <div class="page-container">
    <div class="page-header">
      <h2>用户管理</h2>
      <a-button v-permission="'user:create'" type="primary" @click="openCreateDialog">
        <template #icon><icon-plus /></template>
        新增用户
      </a-button>
    </div>

    <a-card class="table-card">
      <a-table
        :data="users"
        :pagination="{ pageSize: 10 }"
        :bordered="{ wrapper: true, cell: true }"
      >
        <template #columns>
          <a-table-column title="用户名" data-index="username" />
          <a-table-column title="姓名" data-index="real_name">
            <template #cell="{ record }">{{ record.real_name || '-' }}</template>
          </a-table-column>
          <a-table-column title="邮箱" data-index="email">
            <template #cell="{ record }">{{ record.email || '-' }}</template>
          </a-table-column>
          <a-table-column title="角色" data-index="roles">
            <template #cell="{ record }">
              <a-space>
                <a-tag v-for="role in record.roles" :key="role" color="arcoblue">{{ role }}</a-tag>
                <span v-if="!record.roles || record.roles.length === 0" class="text-gray">-</span>
              </a-space>
            </template>
          </a-table-column>
          <a-table-column title="业务线管理员" data-index="managed_business_lines" :width="140">
            <template #cell="{ record }">
              <a-space>
                <a-tag
                  v-for="bl in record.managed_business_lines"
                  :key="bl.id"
                  size="small"
                  color="green"
                >
                  {{ bl.line_name }}
                </a-tag>
                <span
                  v-if="
                    !record.managed_business_lines || record.managed_business_lines.length === 0
                  "
                  class="text-gray"
                >
                  -
                </span>
              </a-space>
            </template>
          </a-table-column>
          <a-table-column title="状态" data-index="status" :width="100">
            <template #cell="{ record }">
              <a-tag :color="record.status === 1 ? 'green' : 'red'">
                {{ record.status === 1 ? '正常' : '禁用' }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="操作" :width="150">
            <template #cell="{ record }">
              <a-space>
                <a-button
                  v-permission="'user:update'"
                  type="text"
                  size="small"
                  @click="editUser(record)"
                >
                  <template #icon><icon-edit /></template>
                  编辑
                </a-button>
                <a-button
                  v-permission="'user:delete'"
                  type="text"
                  size="small"
                  status="danger"
                  @click="deleteUser(record)"
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
      :title="editingUser ? '编辑用户' : '新增用户'"
      :width="520"
      @ok="submitUser"
      @cancel="closeDialog"
    >
      <a-form :model="form" layout="vertical">
        <a-form-item
          field="username"
          label="用户名"
          :rules="[{ required: true, message: '请输入用户名' }]"
        >
          <a-input v-model="form.username" :disabled="!!editingUser" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item
          v-if="!editingUser"
          field="password"
          label="密码"
          :rules="[{ required: true, message: '请输入密码' }]"
        >
          <a-input-password v-model="form.password" placeholder="请输入密码" />
        </a-form-item>
        <a-form-item field="real_name" label="姓名">
          <a-input v-model="form.real_name" placeholder="请输入姓名" />
        </a-form-item>
        <a-form-item field="email" label="邮箱">
          <a-input v-model="form.email" placeholder="请输入邮箱" />
        </a-form-item>
        <a-form-item field="role_ids" label="角色">
          <a-select
            v-model="form.role_ids"
            multiple
            placeholder="请选择角色"
            :loading="loadingRoles"
          >
            <a-option
              v-for="role in assignableRoles"
              :key="role.id"
              :value="role.id"
              :label="
                role.business_line_name
                  ? `${role.role_name} (${role.business_line_name})`
                  : role.role_name
              "
            >
              <div class="role-option">
                <span>{{ role.role_name }}</span>
                <a-tag v-if="role.business_line_name" size="small" color="gray">
                  {{ role.business_line_name }}
                </a-tag>
              </div>
            </a-option>
          </a-select>
          <template #extra>
            <span class="form-tip">可分配角色取决于您的业务线管理权限</span>
          </template>
        </a-form-item>
        <a-form-item field="status" label="状态">
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
import type { UserInfo, RoleInfo } from '@/types/user'
import { get, del, post as postReq, put } from '@/api/request'

const users = ref<UserInfo[]>([])
const showCreateDialog = ref(false)
const editingUser = ref<UserInfo | null>(null)
const assignableRoles = ref<RoleInfo[]>([])
const loadingRoles = ref(false)

const form = reactive({
  username: '',
  password: '',
  real_name: '',
  email: '',
  role_ids: [] as number[],
  status: 1
})

async function loadUsers() {
  try {
    users.value = await get<UserInfo[]>('/users')
  } catch (e) {
    console.error('Failed to load users:', e)
  }
}

async function loadAssignableRoles() {
  loadingRoles.value = true
  try {
    assignableRoles.value = await get<RoleInfo[]>('/roles/assignable')
  } catch (e) {
    console.error('Failed to load assignable roles:', e)
  } finally {
    loadingRoles.value = false
  }
}

function openCreateDialog() {
  editingUser.value = null
  Object.assign(form, {
    username: '',
    password: '',
    real_name: '',
    email: '',
    role_ids: [],
    status: 1
  })
  loadAssignableRoles()
  showCreateDialog.value = true
}

function editUser(user: UserInfo) {
  editingUser.value = user
  Object.assign(form, {
    username: user.username,
    password: '',
    real_name: user.real_name || '',
    email: user.email || '',
    role_ids: user.role_ids || [],
    status: user.status
  })
  loadAssignableRoles()
  showCreateDialog.value = true
}

async function deleteUser(user: UserInfo) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除用户 ${user.username} 吗？`,
    okText: '删除',
    cancelText: '取消',
    onOk: async () => {
      try {
        await del(`/users/${user.id}`)
        Message.success('删除成功')
        loadUsers()
      } catch (e) {
        console.error('Failed to delete user:', e)
      }
    }
  })
}

async function submitUser() {
  try {
    const body: any = {
      real_name: form.real_name,
      email: form.email,
      status: form.status,
      role_ids: form.role_ids
    }

    if (!editingUser.value) {
      body.username = form.username
      body.password = form.password
      await postReq('/users', body)
    } else {
      await put(`/users/${editingUser.value.id}`, body)
    }

    Message.success('操作成功')
    closeDialog()
    loadUsers()
  } catch (e) {
    console.error('Failed to submit user:', e)
  }
}

function closeDialog() {
  showCreateDialog.value = false
  editingUser.value = null
  Object.assign(form, {
    username: '',
    password: '',
    real_name: '',
    email: '',
    role_ids: [],
    status: 1
  })
}

onMounted(loadUsers)
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

.text-gray {
  color: var(--color-text-3);
}

.role-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.form-tip {
  font-size: 12px;
  color: var(--color-text-3);
}
</style>
