<template>
  <div>
    <div v-if="parameters.length === 0" class="empty-params">暂无参数，点击上方"添加"按钮新增</div>
    <div v-for="(param, idx) in parameters" :key="idx" class="param-card">
      <div class="param-card-header">
        <div class="param-main-row">
          <a-select v-model="param.param_location" placeholder="位置" size="small" style="width: 90px">
            <a-option value="query">query</a-option>
            <a-option value="body">body</a-option>
            <a-option value="path">path</a-option>
            <a-option value="header">header</a-option>
            <a-option value="form">form</a-option>
            <a-option value="file">file</a-option>
          </a-select>
          <a-input v-model="param.field_name" placeholder="字段名" size="small" style="flex: 1" />
          <a-select v-model="param.field_type" placeholder="类型" size="small" style="width: 100px">
            <a-option value="string">string</a-option>
            <a-option value="integer">integer</a-option>
            <a-option value="number">number</a-option>
            <a-option value="boolean">boolean</a-option>
            <a-option value="array">array</a-option>
            <a-option value="object">object</a-option>
          </a-select>
          <a-checkbox
            :model-value="param.is_required === 1"
            @change="(v: boolean | (string | boolean | number)[]) => (param.is_required = v === true ? 1 : 0)"
          >
            必填
          </a-checkbox>
        </div>
      </div>
      <div class="param-card-body">
        <div class="param-sub-row">
          <a-input v-model="param.field_desc" placeholder="描述" size="small" style="flex: 2" />
          <a-input v-model="param.default_value" placeholder="默认值" size="small" style="flex: 1" />
          <a-input v-model="param.enum_values" placeholder="枚举值 (逗号分隔)" size="small" style="flex: 1" />
          <a-input v-model="param.example_value" placeholder="示例值" size="small" style="flex: 1" />
        </div>
      </div>
      <a-button class="param-remove" type="text" status="danger" size="mini" @click="$emit('remove', idx)">
        <template #icon><icon-delete /></template>
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconDelete } from '@arco-design/web-vue/es/icon'
import type { ToolParameterMapping } from '@/types'

defineProps<{
  parameters: ToolParameterMapping[]
}>()

defineEmits<{
  remove: [index: number]
}>()
</script>

<style scoped>
.empty-params {
  text-align: center;
  padding: 16px;
  color: #86909c;
  font-size: 13px;
  background: #fafafa;
  border-radius: 4px;
}
.param-card {
  position: relative;
  margin-bottom: 8px;
  background: #fafafa;
  border-radius: 4px;
  border: 1px solid #e5e6eb;
  transition: border-color 0.15s;
}
.param-card:hover {
  border-color: rgb(var(--primary-6));
}
.param-card-header {
  padding: 8px 36px 4px 10px;
}
.param-card-body {
  padding: 4px 10px 8px;
}
.param-main-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.param-sub-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.param-remove {
  position: absolute;
  top: 6px;
  right: 4px;
}
</style>
