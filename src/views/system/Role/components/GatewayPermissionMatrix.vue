<template>
  <a-modal
    v-model:visible="visible"
    :title="`网关权限配置 - ${role?.role_name || ''}`"
    :width="800"
    :ok-loading="saving"
    ok-text="保存"
    cancel-text="取消"
    @ok="handleSave"
    @cancel="visible = false"
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
              :indeterminate="record.children.some((c: any) => c.can_create) && !record.children.every((c: any) => c.can_create)"
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
              :indeterminate="record.children.some((c: any) => c.can_read) && !record.children.every((c: any) => c.can_read)"
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
              :indeterminate="record.children.some((c: any) => c.can_update) && !record.children.every((c: any) => c.can_update)"
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
              :indeterminate="record.children.some((c: any) => c.can_delete) && !record.children.every((c: any) => c.can_delete)"
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
              :indeterminate="record.children.some((c: any) => c.can_chat) && !record.children.every((c: any) => c.can_chat)"
              @change="(val: any) => onGroupPermCheckChange(record, 'can_chat', val)"
            />
            <a-checkbox v-else v-model="record.can_chat" />
          </template>
        </a-table-column>
      </template>
    </a-table>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import type { RoleInfo, GatewayPermission } from '@/types/user'
import { get, put } from '@/api/request'

const props = defineProps<{
  role: RoleInfo | null
}>()

const visible = defineModel<boolean>('visible', { default: false })
const emit = defineEmits<{ saved: [] }>()

const saving = ref(false)
const gatewayPermissions = ref<GatewayPermission[]>([])

const gatewayTableData = computed(() => {
  const result: any[] = []
  const groupMap = new Map<string, any>()

  for (const perm of gatewayPermissions.value) {
    const blNames: string[] = perm.business_line_names || []
    const blName = blNames[0] || '未分组'
    if (!groupMap.has(blName)) {
      groupMap.set(blName, {
        key: `bl_${blName}`,
        name: blName,
        isGroup: true,
        children: [],
      })
    }
    groupMap.get(blName).children.push(perm)
  }

  for (const group of groupMap.values()) {
    result.push(group)
  }
  return result
})

function onGroupPermCheckChange(group: any, perm: string, checked: boolean) {
  for (const child of group.children) {
    child[perm] = checked
  }
}

async function loadPermissions() {
  if (!props.role) return
  try {
    const data = await get<GatewayPermission[]>(
      `/roles/${props.role.id}/gateway-permissions`
    )
    gatewayPermissions.value = data.map(perm => ({
      gateway_id: perm.gateway_id,
      gateway_name: perm.gateway_name,
      business_line_names: perm.business_line_names || [],
      can_create: Boolean(perm.can_create),
      can_read: Boolean(perm.can_read),
      can_update: Boolean(perm.can_update),
      can_delete: Boolean(perm.can_delete),
      can_chat: Boolean(perm.can_chat),
      key: `gw_${perm.gateway_id}`,
      name: `${perm.gateway_name} (${perm.gateway_id})`
    })) as GatewayPermission[]
  } catch (e) {
    console.error('Failed to load gateway permissions:', e)
  }
}

async function handleSave() {
  if (!props.role) return
  saving.value = true
  try {
    const permsToSave = gatewayPermissions.value.map(perm => ({
      gateway_id: perm.gateway_id,
      can_create: perm.can_create,
      can_read: perm.can_read,
      can_update: perm.can_update,
      can_delete: perm.can_delete,
      can_chat: perm.can_chat,
    }))
    await put(`/roles/${props.role.id}/gateway-permissions`, permsToSave)
    Message.success('权限保存成功')
    visible.value = false
    emit('saved')
  } catch (e) {
    console.error('Failed to save permissions:', e)
  } finally {
    saving.value = false
  }
}

watch(visible, async val => {
  if (val) await loadPermissions()
})
</script>

<style scoped>
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
