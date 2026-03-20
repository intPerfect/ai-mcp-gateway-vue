<template>
  <div class="home">
    <!-- 欢迎卡片 -->
    <a-row :gutter="16" class="welcome-row">
      <a-col :span="24">
        <a-card class="welcome-card">
          <div class="welcome-content">
            <div class="welcome-text">
              <h2>欢迎使用 AI MCP Gateway</h2>
              <p>基于 Model Context Protocol 的智能网关管理系统</p>
            </div>
            <a-button type="primary" size="large" @click="$router.push('/chat')">
              开始对话
              <template #icon><icon-message /></template>
            </a-button>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 统计卡片 -->
    <a-row :gutter="16" class="stats-row">
      <a-col :xs="12" :sm="6">
        <a-card class="stat-card">
          <a-statistic
            title="注册工具"
            :value="stats.tools"
            :value-style="{ color: '#165dff' }"
          >
            <template #suffix>
              <span class="stat-suffix">个</span>
            </template>
            <template #icon>
              <icon-apps class="stat-icon" />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="6">
        <a-card class="stat-card">
          <a-statistic
            title="活跃会话"
            :value="stats.sessions"
            :value-style="{ color: '#00b42a' }"
          >
            <template #suffix>
              <span class="stat-suffix">个</span>
            </template>
            <template #icon>
              <icon-message class="stat-icon" />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="6">
        <a-card class="stat-card">
          <a-statistic
            title="API Key"
            :value="stats.apikeys"
            :value-style="{ color: '#722ed1' }"
          >
            <template #suffix>
              <span class="stat-suffix">个</span>
            </template>
            <template #icon>
              <icon-safe class="stat-icon" />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="6">
        <a-card class="stat-card">
          <a-statistic
            title="请求次数"
            :value="stats.requests"
            :value-style="{ color: '#ff7d00' }"
          >
            <template #icon>
              <icon-branch class="stat-icon" />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
    </a-row>

    <!-- 功能入口 -->
    <a-row :gutter="16" class="features-row">
      <a-col :xs="24" :sm="8">
        <a-card class="feature-card" hoverable @click="$router.push('/tools')">
          <div class="feature-icon" style="background: linear-gradient(135deg, #165dff, #722ed1)">
            <icon-apps />
          </div>
          <h3>工具管理</h3>
          <p>管理MCP工具，健康检查，OpenAPI导入</p>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="8">
        <a-card class="feature-card" hoverable @click="$router.push('/apikey')">
          <div class="feature-icon" style="background: linear-gradient(135deg, #00b42a, #00d068)">
            <icon-safe />
          </div>
          <h3>API Key</h3>
          <p>管理用户和网关API Key</p>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="8">
        <a-card class="feature-card" hoverable @click="$router.push('/chat')">
          <div class="feature-icon" style="background: linear-gradient(135deg, #ff7d00, #ffc547)">
            <icon-message />
          </div>
          <h3>对话测试</h3>
          <p>WebSocket实时对话，工具调用测试</p>
        </a-card>
      </a-col>
    </a-row>

    <!-- 最新工具列表 -->
    <a-row :gutter="16" class="tools-row">
      <a-col :span="24">
        <a-card>
          <template #title>
            <span>最新工具</span>
            <a-button type="text" size="small" @click="$router.push('/tools')">
              查看全部 <icon-right />
            </a-button>
          </template>
          <div v-if="loading" class="loading">
            <a-spin />
          </div>
          <div v-else-if="recentTools.length === 0" class="empty">
            暂无工具，请先导入
          </div>
          <a-table
            v-else
            :columns="columns"
            :data="recentTools"
            :pagination="false"
            :bordered="false"
            size="small"
          >
            <template #status="{ record }">
              <a-tag :color="record.status === 'healthy' ? 'green' : 'red'">
                {{ record.status === 'healthy' ? '正常' : '异常' }}
              </a-tag>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { IconApps, IconMessage, IconSafe, IconBranch, IconRight } from '@arco-design/web-vue/es/icon'

const loading = ref(false)
const stats = ref({
  tools: 0,
  sessions: 3,
  apikeys: 2,
  requests: 128
})

const columns = [
  { title: '名称', dataIndex: 'name' },
  { title: '描述', dataIndex: 'description', ellipsis: true },
  { title: '状态', slotName: 'status' }
]

const recentTools = ref<Array<{ name: string; description: string; status: string }>>([])

const loadData = async () => {
  loading.value = true
  try {
    const response = await fetch('/api/tools')
    const result = await response.json()
    if (result.code === '0000') {
      recentTools.value = (result.data.tools || []).slice(0, 5).map((t: any) => ({
        name: t.name,
        description: t.description,
        status: t.status || 'unknown'
      }))
      stats.value.tools = result.data.total || 0
    }
  } catch (error) {
    console.error('Failed to load data:', error)
  }
  loading.value = false
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.home {
  padding: 0;
}

.welcome-card {
  background: linear-gradient(135deg, #165dff 0%, #722ed1 100%);
  border: none;
}

.welcome-card :deep(.arco-card-body) {
  padding: 32px;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-text h2 {
  color: #fff;
  margin: 0 0 8px 0;
  font-size: 24px;
}

.welcome-text p {
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  font-size: 14px;
}

.stats-row {
  margin-top: 16px;
}

.stat-card {
  text-align: center;
}

.stat-card :deep(.arco-statistic-content) {
  justify-content: center;
}

.stat-icon {
  font-size: 32px;
}

.stat-suffix {
  font-size: 14px;
  color: #86909c;
  margin-left: 4px;
}

.features-row {
  margin-top: 16px;
}

.feature-card {
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 28px;
  color: #fff;
}

.feature-card h3 {
  margin: 0 0 8px;
  font-size: 16px;
  color: #1d2129;
}

.feature-card p {
  margin: 0;
  font-size: 12px;
  color: #86909c;
}

.tools-row {
  margin-top: 16px;
}

.loading,
.empty {
  text-align: center;
  padding: 32px;
  color: #86909c;
}
</style>
