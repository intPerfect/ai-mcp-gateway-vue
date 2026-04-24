<template>
  <div class="usage-page">
    <a-card title="使用统计" :bordered="false">
      <template #extra>
        <a-space>
          <a-select
            v-model="selectedGateway"
            placeholder="选择网关"
            allow-clear
            style="width: 200px"
          >
            <a-option v-for="g in gateways" :key="g.gateway_id" :value="g.gateway_id">
              {{ g.gateway_name }}
            </a-option>
          </a-select>
          <a-button @click="loadData">
            <template #icon><icon-refresh /></template>
            刷新
          </a-button>
        </a-space>
      </template>

      <a-row :gutter="16" style="margin-bottom: 24px">
        <a-col :span="6">
          <a-statistic title="总 Key 数" :value="stats.total_keys" />
        </a-col>
        <a-col :span="6">
          <a-statistic title="活跃 Key 数" :value="stats.active_keys" />
        </a-col>
        <a-col :span="6">
          <a-statistic title="总调用次数" :value="stats.total_calls" />
        </a-col>
        <a-col :span="6">
          <a-statistic title="时间窗口" :value="windowHours" :suffix="'小时'" />
        </a-col>
      </a-row>

      <a-divider />

      <h3>Key 使用情况</h3>
      <a-table :data="keyUsageList" :loading="loading" :pagination="false" row-key="key_id">
        <template #columns>
          <a-table-column title="网关" data-index="gateway_id" :width="120" />
          <a-table-column title="Key" data-index="key_preview" :width="180" />
          <a-table-column title="限额" data-index="rate_limit" :width="100" />
          <a-table-column title="已使用" :width="120">
            <template #cell="{ record }">
              <a-progress
                :percent="(record.current_count / record.rate_limit) * 100"
                :status="record.current_count >= record.rate_limit ? 'danger' : 'normal'"
                size="small"
              />
              <span>{{ record.current_count }} / {{ record.rate_limit }}</span>
            </template>
          </a-table-column>
          <a-table-column title="剩余" data-index="remaining" :width="80">
            <template #cell="{ record }">
              <a-tag :color="record.remaining > 0 ? 'green' : 'red'">
                {{ record.remaining }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="剩余时间" :width="120">
            <template #cell="{ record }">
              {{ formatTTL(record.ttl_seconds) }}
            </template>
          </a-table-column>
          <a-table-column title="操作" :width="100">
            <template #cell="{ record }">
              <a-popconfirm
                content="确定要重置该 Key 的使用计数吗？"
                @ok="resetUsage(record.gateway_id, record.key_id)"
              >
                <a-button type="text" size="small" status="warning">重置</a-button>
              </a-popconfirm>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>

    <a-card title="调用日志" :bordered="false" style="margin-top: 16px">
      <a-table
        :data="logs.items"
        :loading="logsLoading"
        :pagination="{
          current: logs.page,
          pageSize: logs.page_size,
          total: logs.total,
          showTotal: true
        }"
        row-key="id"
        @page-change="handlePageChange"
      >
        <template #columns>
          <a-table-column title="时间" data-index="call_time" :width="180" />
          <a-table-column title="网关" data-index="gateway_id" :width="120" />
          <a-table-column title="Key" data-index="key_id" :width="120" />
          <a-table-column title="类型" :width="80">
            <template #cell="{ record }">
              <a-tag :color="record.call_type === 'llm' ? 'blue' : 'green'">
                {{ record.call_type === 'llm' ? 'LLM' : '工具' }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="详情" data-index="call_detail" :ellipsis="true" />
          <a-table-column title="状态" :width="80">
            <template #cell="{ record }">
              <a-tag :color="record.success ? 'green' : 'red'">
                {{ record.success ? '成功' : '失败' }}
              </a-tag>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconRefresh } from '@arco-design/web-vue/es/icon'
import { getGateways } from '@/api/gateway'
import {
  getUsageStats,
  getKeyUsageList,
  getUsageLogs,
  resetUsageCount,
  type UsageStats,
  type KeyUsage,
  type UsageLogsResponse
} from '@/api/usage'

const loading = ref(false)
const logsLoading = ref(false)
const gateways = ref<any[]>([])
const selectedGateway = ref<string | undefined>(undefined)

const stats = reactive<UsageStats>({
  total_keys: 0,
  total_calls: 0,
  active_keys: 0,
  top_usage: []
})

const keyUsageList = ref<KeyUsage[]>([])

const logs = reactive<UsageLogsResponse & { page: number; page_size: number }>({
  total: 0,
  page: 1,
  page_size: 20,
  items: []
})

const windowHours = 5

const loadGateways = async () => {
  try {
    gateways.value = await getGateways()
  } catch (e) {
    console.error('加载网关失败', e)
  }
}

const loadStats = async () => {
  try {
    const result = await getUsageStats()
    Object.assign(stats, result)
  } catch (e) {
    console.error('加载统计失败', e)
  }
}

const loadKeyUsage = async () => {
  loading.value = true
  try {
    keyUsageList.value = await getKeyUsageList(selectedGateway.value)
  } catch (e) {
    console.error('加载Key使用情况失败', e)
  } finally {
    loading.value = false
  }
}

const loadLogs = async (page: number = 1) => {
  logsLoading.value = true
  try {
    const result = await getUsageLogs({
      gateway_id: selectedGateway.value,
      page,
      page_size: logs.page_size
    })
    logs.total = result.total
    logs.page = result.page
    logs.items = result.items
  } catch (e) {
    console.error('加载日志失败', e)
  } finally {
    logsLoading.value = false
  }
}

const loadData = async () => {
  await Promise.all([loadStats(), loadKeyUsage(), loadLogs(1)])
}

const handlePageChange = (page: number) => {
  loadLogs(page)
}

const resetUsage = async (gatewayId: string, keyId: string) => {
  try {
    await resetUsageCount(gatewayId, keyId)
    Message.success('重置成功')
    loadData()
  } catch {
    // interceptor handles error tip
  }
}

const formatTTL = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '-'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}小时${minutes}分钟`
}

watch(selectedGateway, () => {
  loadData()
})

onMounted(() => {
  loadGateways()
  loadData()
})
</script>

<style scoped>
.usage-page {
  padding: 16px;
}
</style>
