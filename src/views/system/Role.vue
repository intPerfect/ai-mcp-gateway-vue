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
          <a-table-column title="类型" data-index="is_system" :width="100">
            <template #cell="{ record }">
              <a-tag :color="record.is_system ? 'orange' : 'green'">
                {{ record.is_system ? '系统' : '自定义' }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="业务线" data-index="business_line_name" :width="100">
            <template #cell="{ record }">
              <a-tag v-if="record.business_line_name" color="green">
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

    <!-- 权限配置对话框 -->
    <a-modal
      v-model:visible="showPermissionDialog"
      :title="`网关权限配置 - ${permissionRole?.role_name || ''}`"
      :width="800"
      :ok-loading="savingGatewayPermissions"
      ok-text="保存"
      cancel-text="取消"
      @ok="saveGatewayPermissions"
      @cancel="showPermissionDialog = false"
    >
      <a-table
        :data="gatewayTableData"
        :pagination="false"
        :bordered="{ wrapper: true, cell: true }"
        :expandable="{ defaultExpandAllRows: true, width: 0 }"
        size="small"
        row-key="key"
        :scroll="{ y: 400 }"
        class="gateway-table"
      >
        <template #columns>
          <a-table-column title="网关" data-index="name" :width="200" />
          <a-table-column title="创建" :width="80" align="center">
            <template #cell="{ record }">
              <a-checkbox
                v-if="record.isGroup"
                :model-value="record.children.every((c: any) => c.can_create)"
                :indeterminate="
                  record.children.some((c: any) => c.can_create) &&
                  !record.children.every((c: any) => c.can_create)
                "
                @change="(val: any) => onGroupPermCheckChange(record, 'can_create', val)"
              />
              <a-checkbox v-else v-model="record.can_create" />
            </template>
          </a-table-column>
          <a-table-column title="查看" :width="80" align="center">
            <template #cell="{ record }">
              <a-checkbox
                v-if="record.isGroup"
                :model-value="record.children.every((c: any) => c.can_read)"
                :indeterminate="
                  record.children.some((c: any) => c.can_read) &&
                  !record.children.every((c: any) => c.can_read)
                "
                @change="(val: any) => onGroupPermCheckChange(record, 'can_read', val)"
              />
              <a-checkbox v-else v-model="record.can_read" />
            </template>
          </a-table-column>
          <a-table-column title="编辑" :width="80" align="center">
            <template #cell="{ record }">
              <a-checkbox
                v-if="record.isGroup"
                :model-value="record.children.every((c: any) => c.can_update)"
                :indeterminate="
                  record.children.some((c: any) => c.can_update) &&
                  !record.children.every((c: any) => c.can_update)
                "
                @change="(val: any) => onGroupPermCheckChange(record, 'can_update', val)"
              />
              <a-checkbox v-else v-model="record.can_update" />
            </template>
          </a-table-column>
          <a-table-column title="删除" :width="80" align="center">
            <template #cell="{ record }">
              <a-checkbox
                v-if="record.isGroup"
                :model-value="record.children.every((c: any) => c.can_delete)"
                :indeterminate="
                  record.children.some((c: any) => c.can_delete) &&
                  !record.children.every((c: any) => c.can_delete)
                "
                @change="(val: any) => onGroupPermCheckChange(record, 'can_delete', val)"
              />
              <a-checkbox v-else v-model="record.can_delete" />
            </template>
          </a-table-column>
          <a-table-column title="对话" :width="80" align="center">
            <template #cell="{ record }">
              <a-checkbox
                v-if="record.isGroup"
                :model-value="record.children.every((c: any) => c.can_chat)"
                :indeterminate="
                  record.children.some((c: any) => c.can_chat) &&
                  !record.children.every((c: any) => c.can_chat)
                "
                @change="(val: any) => onGroupPermCheckChange(record, 'can_chat', val)"
              />
              <a-checkbox v-else v-model="record.can_chat" />
            </template>
          </a-table-column>
          <a-table-column title="管理员" :width="80" align="center">
            <template #cell="{ record }">
              <a-checkbox
                v-if="record.isGroup && record.business_line_id > 0"
                :model-value="blAdminIds.includes(record.business_line_id)"
                @change="(val: any) => toggleBlAdmin(record.business_line_id, val)"
              />
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { IconPlus, IconEdit, IconDelete, IconSettings } from '@arco-design/web-vue/es/icon'
import type { RoleInfo, GatewayPermission } from '@/types/user'
import { get, del, post, put } from '@/api/request'

const roles = ref<RoleInfo[]>([])
const showCreateDialog = ref(false)
const editingRole = ref<RoleInfo | null>(null)

const form = reactive({
  role_code: '',
  role_name: '',
  description: '',
  status: 1
})

// 权限配置相关
const showPermissionDialog = ref(false)
const permissionRole = ref<RoleInfo | null>(null)
const gatewayPermissions = ref<GatewayPermission[]>([])
const savingGatewayPermissions = ref(false)
const blAdminIds = ref<number[]>([])
const originalBlAdminIds = ref<number[]>([])

// 业务线分组数据（仅用于展示）
const gatewayTableData = computed(() => {
  const result: any[] = []
  const blMap = new Map<number, any>()

  // 按业务线分组
  for (const perm of gatewayPermissions.value) {
    const blId = perm.business_line_id || 0
    if (!blMap.has(blId)) {
      blMap.set(blId, {
        key: `bl_${blId}`,
        name: perm.business_line_name || '未分组',
        isGroup: true,
        children: [],
        business_line_id: blId
      })
    }
    blMap.get(blId).children.push(perm)
  }

  // 构建树形结构
  for (const group of blMap.values()) {
    result.push(group)
  }

  return result
})

// 业务线行批量勾选某一列权限
function onGroupPermCheckChange(group: any, perm: string, checked: boolean) {
  for (const child of group.children) {
    child[perm] = checked
  }
}

function toggleBlAdmin(blId: number, checked: boolean) {
  if (checked) {
    if (!blAdminIds.value.includes(blId)) {
      blAdminIds.value.push(blId)
    }
  } else {
    blAdminIds.value = blAdminIds.value.filter(id => id !== blId)
  }
}

async function loadGatewayPermissions() {
  if (!permissionRole.value) return

  try {
    const data = await get<GatewayPermission[]>(
      `/roles/${permissionRole.value.id}/gateway-permissions`
    )
    // 确保权限数据是数组且每个字段都有默认值
    gatewayPermissions.value = data.map(perm => ({
      gateway_id: perm.gateway_id,
      gateway_name: perm.gateway_name,
      business_line_id: perm.business_line_id ?? null,
      business_line_name: perm.business_line_name ?? null,
      // 确保布尔值字段正确转换
      can_create: Boolean(perm.can_create),
      can_read: Boolean(perm.can_read),
      can_update: Boolean(perm.can_update),
      can_delete: Boolean(perm.can_delete),
      can_chat: Boolean(perm.can_chat),
      // 添加 key 和 name (用于表格显示)
      key: `gw_${perm.gateway_id}`,
      name: `${perm.gateway_name} (${perm.gateway_id})`
    })) as GatewayPermission[]

    // 加载业务线管理员状态
    const adminIds = await get<number[]>(`/roles/${permissionRole.value.id}/bl-admin`)
    blAdminIds.value = adminIds || []
    originalBlAdminIds.value = [...blAdminIds.value]
  } catch (e) {
    console.error('Failed to load gateway permissions:', e)
  }
}

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

// 权限配置相关方法
async function openPermissionDialog(role: RoleInfo) {
  permissionRole.value = role
  await loadGatewayPermissions()
  showPermissionDialog.value = true
}

async function saveGatewayPermissions() {
  if (!permissionRole.value) return

  savingGatewayPermissions.value = true
  try {
    // 保存网关权限
    await put(`/roles/${permissionRole.value.id}/gateway-permissions`, gatewayPermissions.value)

    // 保存业务线管理员权限
    await put(`/roles/${permissionRole.value.id}/bl-admin`, blAdminIds.value)

    Message.success('权限保存成功')
    showPermissionDialog.value = false
    loadRoles()
  } catch (e) {
    console.error('Failed to save permissions:', e)
  } finally {
    savingGatewayPermissions.value = false
  }
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

/* 隐藏展开图标列 */
.gateway-table :deep(.arco-table-expand-col) {
  width: 0 !important;
  min-width: 0 !important;
  max-width: 0 !important;
  padding: 0 !important;
}

.gateway-table :deep(.arco-table-expand-icon) {
  display: none !important;
}
</style>
