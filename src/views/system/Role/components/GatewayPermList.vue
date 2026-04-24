<template>
  <div>
    <div v-if="loading" class="perm-loading">
      <a-spin />
    </div>
    <template v-else>
      <div class="perm-toolbar">
        <a-input-search
          v-model="search"
          :placeholder="searchPlaceholder"
          size="small"
          allow-clear
          style="width: 220px"
        />
        <div class="perm-toolbar-right">
          <template v-if="!readonly">
            <a-space :size="8">
              <a-button size="small" @click="selectAll">全选</a-button>
              <a-button size="small" @click="deselectAll">清空</a-button>
            </a-space>
          </template>
          <span v-else class="perm-toolbar-hint">只读视图</span>
        </div>
      </div>

      <div class="perm-groups">
        <div v-for="group in filteredGroups" :key="group.name" class="perm-group">
          <div class="perm-group-header" @click="toggleGroup(group.name)">
            <icon-down v-if="expandedGroups.has(group.name)" class="perm-arrow" />
            <icon-right v-else class="perm-arrow" />
            <span class="perm-group-name" v-html="hl(group.name)" />
            <span class="perm-group-count">{{ group.items.length }}</span>
            <div class="perm-group-actions" @click.stop>
              <PermCheckboxes
                :permissions="groupAgg(group)"
                :readonly="readonly"
                :exclude="groupExclude"
                @change="(p: PermKey, v: boolean) => !readonly && emit('groupChange', group, p, v)"
              />
            </div>
          </div>
          <div v-show="expandedGroups.has(group.name)" class="perm-group-body">
            <div v-for="item in group.items" :key="item.gateway_id" class="perm-row">
              <span class="perm-row-name" v-html="hl(item.gateway_name)" />
              <span class="perm-row-id" v-html="hl(item.gateway_id)" />
              <PermCheckboxes
                :permissions="itemPerm(item)"
                :readonly="readonly"
                :exclude="exclude"
                @change="(p: PermKey, v: boolean) => !readonly && emit('change', item, p, v)"
              />
            </div>
          </div>
        </div>
        <div v-if="filteredGroups.length === 0" class="perm-empty">无匹配结果</div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { IconDown, IconRight } from '@arco-design/web-vue/es/icon'
import type { GatewayPermission } from '@/types/user'
import { highlightText } from '@/utils/highlight'
import PermCheckboxes from './PermCheckboxes.vue'

const PERM_KEYS = ['can_view', 'can_manage_gateway', 'can_delete_gateway', 'can_manage_keys', 'can_manage_microservices', 'can_manage_tools', 'can_manage_users', 'can_chat'] as const
type PermKey = typeof PERM_KEYS[number]

interface PermGroup {
  name: string
  items: GatewayPermission[]
}

const props = withDefaults(defineProps<{
  permissions: GatewayPermission[]
  readonly?: boolean
  loading?: boolean
  exclude?: string[]
  groupExclude?: string[]
  searchPlaceholder?: string
}>(), {
  readonly: false,
  loading: false,
  exclude: () => ['can_manage_users'],
  groupExclude: () => ['can_manage_users'],
  searchPlaceholder: '搜索网关名称或ID',
})

const emit = defineEmits<{
  change: [item: GatewayPermission, perm: PermKey, value: boolean]
  groupChange: [group: PermGroup, perm: PermKey, value: boolean]
}>()

const search = ref('')
const expandedGroups = ref(new Set<string>())

function hl(text: string) {
  return highlightText(text, search.value)
}

function itemPerm(item: GatewayPermission) {
  return Object.fromEntries(PERM_KEYS.map(k => [k, item[k]])) as Record<PermKey, boolean>
}

function groupAgg(group: PermGroup) {
  return Object.fromEntries(
    PERM_KEYS.map(k => [k, group.items.every(c => c[k])])
  ) as Record<PermKey, boolean>
}

const filteredGroups = computed(() => {
  const kw = search.value.trim().toLowerCase()
  const map = new Map<string, GatewayPermission[]>()
  for (const perm of props.permissions) {
    if (kw) {
      const match =
        (perm.gateway_name || '').toLowerCase().includes(kw) ||
        (perm.gateway_id || '').toLowerCase().includes(kw) ||
        (perm.business_line_names || []).some(n => n.toLowerCase().includes(kw))
      if (!match) continue
    }
    const blName = perm.business_line_names?.[0] || '未分组'
    if (!map.has(blName)) map.set(blName, [])
    map.get(blName)!.push(perm)
  }
  const groups = Array.from(map.entries()).map(([name, items]) => ({ name, items }))
  expandedGroups.value = new Set(groups.map(g => g.name))
  return groups
})

function toggleGroup(name: string) {
  const s = new Set(expandedGroups.value)
  s.has(name) ? s.delete(name) : s.add(name)
  expandedGroups.value = s
}

function selectAll() {
  for (const item of props.permissions)
    for (const k of PERM_KEYS) emit('change', item, k, true)
}

function deselectAll() {
  for (const item of props.permissions)
    for (const k of PERM_KEYS) emit('change', item, k, false)
}
</script>

<style scoped>
.perm-loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.perm-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.perm-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.perm-toolbar-hint {
  font-size: 12px;
  color: var(--color-text-3);
}

.perm-groups {
  max-height: 420px;
  overflow-y: auto;
  border: 1px solid var(--color-border-2);
  border-radius: 4px;
}

.perm-group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--color-fill-1);
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid var(--color-border-2);
}

.perm-group-header:hover {
  background: var(--color-fill-2);
}

.perm-arrow {
  font-size: 12px;
  color: var(--color-text-3);
}

.perm-group-name {
  font-weight: 500;
  font-size: 13px;
}

.perm-group-count {
  font-size: 12px;
  color: var(--color-text-3);
  background: var(--color-fill-3);
  border-radius: 8px;
  padding: 0 6px;
  line-height: 18px;
}

.perm-group-actions {
  margin-left: auto;
  min-width: 0;
}

.perm-row {
  display: flex;
  align-items: center;
  padding: 6px 12px 6px 30px;
  border-bottom: 1px solid var(--color-border-1);
}

.perm-row:last-child {
  border-bottom: none;
}

.perm-row-name {
  font-size: 13px;
  min-width: 100px;
}

.perm-row-id {
  font-size: 12px;
  color: var(--color-text-3);
  margin-right: auto;
}

.perm-empty {
  text-align: center;
  padding: 32px 0;
  color: var(--color-text-3);
  font-size: 13px;
}

:deep(.hl) {
  background: #ffe44d;
  color: inherit;
  padding: 0 1px;
  border-radius: 2px;
}
</style>
