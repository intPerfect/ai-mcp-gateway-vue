<template>
  <a-select
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :multiple="multiple"
    :allow-clear="allowClear"
    :allow-search="true"
    :filter-option="filterOption"
    :popup-max-height="320"
    :fallback-option="false"
    @change="handleChange"
    @clear="handleClear"
    @search="handleSearch"
  >
    <a-optgroup
      v-for="group in filteredGroups"
      :key="group.businessLine"
      :label="group.businessLine || '无业务线'"
    >
      <a-option
        v-for="ms in group.microservices"
        :key="ms.id"
        :value="ms.id"
        :label="`${ms.business_line || '无业务线'}/${ms.name}`"
      >
        <div class="option-content">
          <span class="ms-name">{{ ms.name }}</span>
          <template v-if="showHealthStatus">
            <a-tag v-if="ms.health_status === 'healthy'" color="green" size="small">健康</a-tag>
            <a-tag v-else-if="ms.health_status === 'unhealthy'" color="red" size="small">
              异常
            </a-tag>
            <a-tag v-else color="gray" size="small">未知</a-tag>
          </template>
        </div>
      </a-option>
    </a-optgroup>
  </a-select>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Microservice } from '@/types'

interface MicroserviceGroup {
  businessLine: string
  microservices: Microservice[]
}

const props = withDefaults(
  defineProps<{
    modelValue: number[]
    microservices: Microservice[]
    disabled?: boolean
    placeholder?: string
    multiple?: boolean
    allowClear?: boolean
    showHealthStatus?: boolean
    loading?: boolean
  }>(),
  {
    disabled: false,
    placeholder: '选择微服务',
    multiple: true,
    allowClear: true,
    showHealthStatus: false,
    loading: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [number[]]
}>()

const searchKeyword = ref('')

const groupedMicroservices = computed<MicroserviceGroup[]>(() => {
  const groups: Record<string, Microservice[]> = {}

  for (const ms of props.microservices) {
    const bl = ms.business_line || ''
    if (!groups[bl]) {
      groups[bl] = []
    }
    groups[bl].push(ms)
  }

  return Object.entries(groups)
    .map(([businessLine, microservices]) => ({
      businessLine,
      microservices
    }))
    .sort((a, b) => {
      if (!a.businessLine) return 1
      if (!b.businessLine) return -1
      return a.businessLine.localeCompare(b.businessLine, 'zh-CN')
    })
})

const filteredGroups = computed<MicroserviceGroup[]>(() => {
  if (!searchKeyword.value.trim()) {
    return groupedMicroservices.value
  }

  const keyword = searchKeyword.value.toLowerCase().trim()

  return groupedMicroservices.value
    .map(group => {
      const filteredMs = group.microservices.filter(
        ms =>
          ms.name.toLowerCase().includes(keyword) ||
          (ms.business_line && ms.business_line.toLowerCase().includes(keyword))
      )

      if (filteredMs.length === 0) {
        return null
      }

      return {
        businessLine: group.businessLine,
        microservices: filteredMs
      }
    })
    .filter((group): group is MicroserviceGroup => group !== null)
})

const filterOption = (inputValue: string, option: { value: number; label?: string }) => {
  const keyword = inputValue.toLowerCase().trim()
  if (!keyword) return true

  const ms = props.microservices.find(m => m.id === option.value)
  if (!ms) return false

  return (
    ms.name.toLowerCase().includes(keyword) ||
    (ms.business_line && ms.business_line.toLowerCase().includes(keyword))
  )
}

const handleSearch = (value: string) => {
  searchKeyword.value = value
}

const handleChange = (value: number | number[] | undefined) => {
  if (value === undefined) {
    emit('update:modelValue', [])
  } else if (Array.isArray(value)) {
    emit('update:modelValue', value)
  } else {
    emit('update:modelValue', [value])
  }
}

const handleClear = () => {
  emit('update:modelValue', [])
}
</script>

<style scoped>
.option-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ms-name {
  flex: 1;
}
</style>
