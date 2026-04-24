<template>
  <div class="perm-row">
    <!-- 业务线管理 -->
    <label v-if="showManageUsers" class="perm-item">
      <a-checkbox
        :model-value="permissions.can_manage_users"
        :disabled="readonly"
        @change="(v: any) => !readonly && emit('change', 'can_manage_users', !!v)"
      /><span>业务线管理</span>
    </label>

    <!-- 网关 -->
    <span class="perm-group">
      <span class="perm-group-label">网关</span>
      <label class="perm-item">
        <a-checkbox :model-value="permissions.can_view" :disabled="readonly" @change="(v: any) => !readonly && emit('change', 'can_view', !!v)" /><span>查看</span>
      </label>
      <label class="perm-item">
        <a-checkbox :model-value="permissions.can_chat" :disabled="readonly" @change="(v: any) => !readonly && emit('change', 'can_chat', !!v)" /><span>对话</span>
      </label>
      <label v-if="showGatewayManage" class="perm-item">
        <a-checkbox
          :model-value="permissions.can_manage_gateway && permissions.can_manage_keys"
          :disabled="readonly"
          @change="(v: any) => !readonly && toggleGatewayManage(!!v)"
        /><span>管理</span>
      </label>
    </span>

    <!-- 微服务 -->
    <span class="perm-group">
      <span class="perm-group-label">微服务</span>
      <label class="perm-item">
        <a-checkbox :model-value="permissions.can_manage_microservices" :disabled="readonly" @change="(v: any) => !readonly && emit('change', 'can_manage_microservices', !!v)" /><span>管理</span>
      </label>
      <label class="perm-item">
        <a-checkbox :model-value="permissions.can_manage_tools" :disabled="readonly" @change="(v: any) => !readonly && emit('change', 'can_manage_tools', !!v)" /><span>工具</span>
      </label>
    </span>
  </div>
</template>

<script setup lang="ts">

type PermKey = 'can_view' | 'can_manage_gateway' | 'can_delete_gateway' | 'can_manage_keys' | 'can_manage_microservices' | 'can_manage_tools' | 'can_manage_users' | 'can_chat'

const props = withDefaults(defineProps<{
  permissions: Record<PermKey, boolean>
  exclude?: PermKey[]
  readonly?: boolean
}>(), {
  exclude: () => [],
  readonly: false,
})

const emit = defineEmits<{
  change: [perm: PermKey, value: boolean]
}>()

const showGatewayManage = !props.exclude.includes('can_manage_gateway')
const showManageUsers = !props.exclude.includes('can_manage_users')

function toggleGatewayManage(val: boolean) {
  emit('change', 'can_manage_gateway', val)
  emit('change', 'can_manage_keys', val)
}
</script>

<style scoped>
.perm-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  font-size: 12px;
  color: var(--color-text-2);
}

.perm-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border: 1px solid var(--color-border-2);
  border-radius: 4px;
}

.perm-group-label {
  font-size: 11px;
  color: var(--color-text-3);
  margin-right: 2px;
  font-weight: 500;
}

.perm-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  white-space: nowrap;
  line-height: 1;
}

.perm-item:hover {
  background: var(--color-fill-2);
}
</style>
