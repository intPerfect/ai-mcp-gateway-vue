<template>
  <a-modal
    v-model:visible="visible"
    :title="`网关权限配置 - ${role?.role_name || ''}`"
    :width="860"
    :footer="false"
    unmount-on-close
  >
    <GatewayPermList
      :permissions="gatewayPermissions"
      :readonly="false"
      :loading="loading"
      :exclude="['can_manage_users']"
      :group-exclude="[]"
      @change="onPermChange"
      @group-change="onGroupChange"
    />

    <div class="perm-footer">
      <a-space>
        <a-button @click="visible = false">取消</a-button>
        <a-button type="primary" :loading="saving" @click="handleSave">保存</a-button>
      </a-space>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import type { RoleInfo, GatewayPermission } from '@/types/user'
import { get, put } from '@/api/request'
import GatewayPermList from './GatewayPermList.vue'

type PermKey = 'can_view' | 'can_manage_gateway' | 'can_delete_gateway' | 'can_manage_keys' | 'can_manage_microservices' | 'can_manage_tools' | 'can_manage_users' | 'can_chat'

const props = defineProps<{ role: RoleInfo | null }>()
const visible = defineModel<boolean>('visible', { default: false })
const emit = defineEmits<{ saved: [] }>()

const loading = ref(false)
const saving = ref(false)
const gatewayPermissions = ref<GatewayPermission[]>([])

function onPermChange(item: GatewayPermission, perm: PermKey, val: boolean) {
  item[perm] = val
  if (perm === 'can_chat' && val) item.can_view = true
  if (perm === 'can_view' && !val) item.can_chat = false
}

function onGroupChange(group: { items: GatewayPermission[] }, perm: PermKey, val: boolean) {
  for (const item of group.items) onPermChange(item, perm, val)
}

async function loadPermissions() {
  if (!props.role) return
  loading.value = true
  try {
    const data = await get<GatewayPermission[]>(`/roles/${props.role.id}/gateway-permissions`)
    gatewayPermissions.value = data.map(perm => ({
      gateway_id: perm.gateway_id,
      gateway_name: perm.gateway_name,
      business_line_names: perm.business_line_names || [],
      can_view: Boolean(perm.can_view),
      can_manage_gateway: Boolean(perm.can_manage_gateway),
      can_delete_gateway: Boolean(perm.can_delete_gateway),
      can_manage_keys: Boolean(perm.can_manage_keys),
      can_manage_microservices: Boolean(perm.can_manage_microservices),
      can_manage_tools: Boolean(perm.can_manage_tools),
      can_manage_users: Boolean(perm.can_manage_users),
      can_chat: Boolean(perm.can_chat),
    }))
  } catch (e) {
    console.error('Failed to load gateway permissions:', e)
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (!props.role) return
  saving.value = true
  try {
    await put(
      `/roles/${props.role.id}/gateway-permissions`,
      gatewayPermissions.value.map(p => ({
        gateway_id: p.gateway_id,
        can_view: p.can_view,
        can_manage_gateway: p.can_manage_gateway,
        can_delete_gateway: p.can_delete_gateway,
        can_manage_keys: p.can_manage_keys,
        can_manage_microservices: p.can_manage_microservices,
        can_manage_tools: p.can_manage_tools,
        can_manage_users: p.can_manage_users,
        can_chat: p.can_chat,
      }))
    )
    Message.success('权限保存成功')
    visible.value = false
    emit('saved')
  } catch (e) {
    console.error('Failed to save permissions:', e)
  } finally {
    saving.value = false
  }
}

watch(visible, val => { if (val) loadPermissions() })
</script>

<style scoped>
.perm-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-2);
}
</style>
