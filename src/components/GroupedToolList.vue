<template>
  <div class="gtl" ref="scrollRef">
    <div v-if="loading" class="gtl-center"><a-spin /></div>
    <div v-else-if="groupedTools.length === 0" class="gtl-center"><a-empty description="暂无工具" /></div>
    <template v-else>
      <template v-for="group in groupedTools" :key="group.businessLine">
        <div class="gtl-bl" @click="toggleBusinessLine(group.businessLine)">
          <icon-down class="gtl-arrow" :class="{ collapsed: collapsedBL.has(group.businessLine) }" />
          <span>{{ group.businessLine || '未分类' }}</span>
          <span class="gtl-count">{{ group.totalCount }}</span>
        </div>
        <template v-if="!collapsedBL.has(group.businessLine)">
          <template v-for="ms in group.microserviceGroups" :key="ms.microserviceId ?? 'default'">
            <div class="gtl-ms" @click="toggleMicroservice(ms.microserviceId)">
              <icon-down class="gtl-arrow" :class="{ collapsed: collapsedMS.has(ms.microserviceId) }" />
              <span>{{ ms.microserviceName || '未绑定' }}</span>
              <span class="gtl-count">{{ ms.tools.length }}</span>
            </div>
            <div v-if="!collapsedMS.has(ms.microserviceId)" class="gtl-tools">
              <div v-for="tool in ms.tools" :key="tool.id" class="gtl-tool">
                <div class="gtl-tool-main" @click="openEditModal(tool)">
                  <div class="gtl-tool-info">
                    <span class="gtl-tool-name">{{ tool.tool_name }}</span>
                    <span class="gtl-tool-desc">{{ tool.tool_description || '暂无描述' }}</span>
                  </div>
                  <span class="gtl-status" :class="tool.call_status">{{ getCallStatusIcon(tool.call_status) }}</span>
                </div>
                <a-button type="text" size="mini" @click="openEditModal(tool)">
                  <template #icon><icon-edit /></template>
                </a-button>
                <a-popconfirm v-if="canDelete" content="确定要删除该工具吗？" @ok="handleDelete(tool)">
                  <a-button type="text" status="danger" size="mini">
                    <template #icon><icon-delete /></template>
                  </a-button>
                </a-popconfirm>
                <a-switch
                  v-model="tool.enabled"
                  :checked-value="1"
                  :unchecked-value="0"
                  size="small"
                  @change="handleEnabledChange(tool)"
                />
              </div>
            </div>
          </template>
        </template>
      </template>
    </template>

    <ToolEditModal v-model:visible="editModalVisible" :tool="currentEditTool" @saved="emit('refresh')" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconDown, IconEdit, IconDelete } from '@arco-design/web-vue/es/icon'
import type { MicroserviceTool, Microservice } from '@/types'
import { updateToolEnabled, deleteTool } from '@/api/microservice'
import { useUserStore } from '@/stores/user'
import ToolEditModal from './tools/ToolEditModal.vue'

const userStore = useUserStore()
const canDelete = computed(() => userStore.hasPermission('tool:delete'))

interface Props {
  tools: MicroserviceTool[]
  microservices?: Microservice[]
  loading?: boolean
  microserviceId?: number
}

const props = withDefaults(defineProps<Props>(), {
  tools: () => [],
  microservices: () => [],
  loading: false,
  microserviceId: undefined
})

const emit = defineEmits<{ refresh: [] }>()

const scrollRef = ref<HTMLElement | null>(null)
const collapsedBL = ref<Set<string>>(new Set())
const collapsedMS = ref<Set<number | null>>(new Set())
const editModalVisible = ref(false)
const currentEditTool = ref<MicroserviceTool | null>(null)

const toggleBusinessLine = (bl: string) => {
  collapsedBL.value.has(bl) ? collapsedBL.value.delete(bl) : collapsedBL.value.add(bl)
}
const toggleMicroservice = (id: number | null) => {
  if (id === null) return
  collapsedMS.value.has(id) ? collapsedMS.value.delete(id) : collapsedMS.value.add(id)
}
const openEditModal = (tool: MicroserviceTool) => {
  currentEditTool.value = tool
  editModalVisible.value = true
}

interface MicroserviceGroup {
  microserviceId: number | null
  microserviceName: string | null
  tools: MicroserviceTool[]
}
interface BusinessLineGroup {
  businessLine: string
  totalCount: number
  microserviceGroups: MicroserviceGroup[]
}

const groupedTools = computed<BusinessLineGroup[]>(() => {
  const filtered = props.microserviceId
    ? props.tools.filter(t => t.microservice_id === props.microserviceId)
    : props.tools

  const msMap = new Map<number, Microservice>()
  props.microservices.forEach(ms => msMap.set(ms.id, ms))

  const blMap = new Map<string, Map<number | null, MicroserviceTool[]>>()
  filtered.forEach(tool => {
    const ms = tool.microservice_id ? msMap.get(tool.microservice_id) : null
    const bl = ms?.business_line || '未分类'
    const msId = tool.microservice_id || null
    if (!blMap.has(bl)) blMap.set(bl, new Map())
    const mm = blMap.get(bl)!
    if (!mm.has(msId)) mm.set(msId, [])
    mm.get(msId)!.push(tool)
  })

  const result: BusinessLineGroup[] = []
  blMap.forEach((msGroupMap, bl) => {
    const groups: MicroserviceGroup[] = []
    let total = 0
    msGroupMap.forEach((tools, msId) => {
      const ms = msId ? msMap.get(msId) : null
      groups.push({
        microserviceId: msId,
        microserviceName: ms?.name || null,
        tools
      })
      total += tools.length
    })
    groups.sort((a, b) => (a.microserviceName || '').localeCompare(b.microserviceName || ''))
    result.push({ businessLine: bl, totalCount: total, microserviceGroups: groups })
  })
  return result.sort((a, b) => a.businessLine.localeCompare(b.businessLine))
})

const getCallStatusIcon = (status: string) => {
  return { sunny: '☀️', cloudy: '☁️', rainy: '🌧️' }[status] || '🌤️'
}

const handleEnabledChange = async (tool: MicroserviceTool) => {
  try {
    await updateToolEnabled(tool.id, { enabled: tool.enabled })
    Message.success(tool.enabled === 1 ? '已启用' : '已禁用')
  } catch (error: any) {
    Message.error(error.message || '操作失败')
    tool.enabled = tool.enabled === 1 ? 0 : 1
  }
}

const handleDelete = async (tool: MicroserviceTool) => {
  try {
    await deleteTool(tool.id)
    Message.success('删除成功')
    emit('refresh')
  } catch (error: any) {
    Message.error(error.message || '删除失败')
  }
}
</script>

<style scoped>
.gtl {
  height: 100%;
  overflow-y: auto;
}

.gtl-center {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

/* Business line header - sticky top */
.gtl-bl {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #1d2129;
  cursor: pointer;
  user-select: none;
  position: sticky;
  top: 0;
  z-index: 20;
  background: #fff;
  border-bottom: 1px solid #f2f3f5;
}
.gtl-bl:first-child {
  padding-top: 12px;
}
.gtl-bl:hover {
  background: #fafbfc;
}

/* Microservice header - sticky under BL */
.gtl-ms {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px 8px 32px;
  font-size: 13px;
  font-weight: 500;
  color: #4e5969;
  cursor: pointer;
  user-select: none;
  position: sticky;
  top: 39px;
  z-index: 19;
  background: #fff;
  border-bottom: 1px solid #f2f3f5;
}
.gtl-ms:hover {
  background: #fafbfc;
}

.gtl-arrow {
  font-size: 12px;
  color: #c9cdd4;
  transition: transform 0.15s ease;
}
.gtl-arrow.collapsed {
  transform: rotate(-90deg);
}

.gtl-count {
  font-size: 11px;
  color: #fff;
  font-weight: 500;
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  background: #165dff;
  border-radius: 9px;
  padding: 0 5px;
}

/* Tool list */
.gtl-tools {
  padding: 4px 8px 4px 32px;
}

.gtl-tool {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background 0.15s;
}
.gtl-tool:hover {
  background: #f7f8fa;
}

.gtl-tool-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  min-width: 0;
}

.gtl-tool-info {
  flex: 1;
  min-width: 0;
}

.gtl-tool-name {
  font-size: 13px;
  font-weight: 500;
  color: #1d2129;
}

.gtl-tool-desc {
  display: block;
  font-size: 12px;
  color: #86909c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 1px;
}

.gtl-status {
  font-size: 13px;
  flex-shrink: 0;
}
</style>
